// backend/src/controllers/course.controller.js
const axios = require('axios');
const supabaseImport = require('../config/supabase');
const supabase = supabaseImport.supabase || supabaseImport;
 
const MAX_CODE_LENGTH = 20000;
 
// id-ul utilizatorului din Supabase (acelasi pe care il folosesti la classrooms)
const getUserId = (req) => req.user.supabaseId || req.user.id || req.user.userId;
 
// Ruleaza cod C++ in Piston (Docker). Intoarce { compileError } sau { stdout, stderr, exitCode }
async function runCpp(code, stdin = '') {
  const pistonRes = await axios.post(`${process.env.PISTON_API_URL}/execute`, {
    language: 'c++',
    version: '10.2.0',
    files: [{ content: code }],
    stdin,
    run_timeout: 3000
  });
  const { compile, run } = pistonRes.data;
  if (compile && compile.code !== 0) {
    return { compileError: compile.stderr || compile.output || 'Eroare de compilare.' };
  }
  return { stdout: run.stdout || '', stderr: run.stderr || '', exitCode: run.code };
}
 
// GET /api/courses  ->  cursuri + capitole + lectii (fara continut) + progres
const getCourses = async (req, res) => {
  try {
    const userId = getUserId(req);
    const [co, ch, le, pr] = await Promise.all([
      supabase.from('courses').select('id,title,description,slug').order('id'),
      supabase.from('chapters').select('id,course_id,title,position').order('position'),
      supabase.from('lessons').select('id,chapter_id,title,position,estimated_minutes')
        .eq('is_published', true).order('position'),
      supabase.from('lesson_progress').select('lesson_id,status').eq('user_id', userId)
    ]);
    const err = co.error || ch.error || le.error;
    if (err) return res.status(500).json({ message: 'Eroare la citirea cursurilor.', error: err.message });
 
    const done = new Set((pr.data || []).filter(p => p.status === 'completed').map(p => p.lesson_id));
    const lessons = le.data.map(l => ({ ...l, completed: done.has(l.id) }));
    return res.json({ courses: co.data, chapters: ch.data, lessons });
  } catch (e) {
    return res.status(500).json({ message: 'Eroare pe server.', error: e.message });
  }
};
 
// GET /api/courses/lessons/:id  ->  continutul unei lectii (fara raspunsuri)
const getLesson = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .select('id,title,content,chapter_id')
      .eq('id', req.params.id)
      .eq('is_published', true)
      .single();
    if (error || !data) return res.status(404).json({ message: 'Lectia nu exista.' });
    return res.json(data);
  } catch (e) {
    return res.status(500).json({ message: 'Eroare pe server.', error: e.message });
  }
};
 
// POST /api/courses/run  { code, stdin? }  ->  ruleaza liber, fara notare
const runCode = async (req, res) => {
  try {
    const { code, stdin } = req.body;
    if (typeof code !== 'string' || !code.trim()) return res.status(400).json({ message: 'Cod lipsa.' });
    if (code.length > MAX_CODE_LENGTH) return res.status(400).json({ message: 'Cod prea lung.' });
 
    const r = await runCpp(code, typeof stdin === 'string' ? stdin : '');
    if (r.compileError) return res.json({ ok: false, compileError: r.compileError });
    return res.json({ ok: true, stdout: r.stdout, stderr: r.stderr, exitCode: r.exitCode });
  } catch (e) {
    return res.status(502).json({ message: 'Compilatorul nu raspunde. Piston ruleaza?', error: e.message });
  }
};
 
// POST /api/courses/lessons/:lessonId/tasks/:taskKey/check  { code }
const checkTask = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(400).json({ message: 'Lipseste ID-ul utilizatorului. Autentifica-te din nou.' });
 
    const lessonId = Number(req.params.lessonId);
    const { taskKey } = req.params;
    const { code } = req.body;
    if (typeof code !== 'string' || !code.trim()) return res.status(400).json({ message: 'Cod lipsa.' });
    if (code.length > MAX_CODE_LENGTH) return res.status(400).json({ message: 'Cod prea lung.' });
 
    // lectia trebuie sa fie publicata
    const lesson = await supabase.from('lessons').select('id').eq('id', lessonId).eq('is_published', true).single();
    if (lesson.error || !lesson.data) return res.status(404).json({ message: 'Lectia nu exista.' });
 
    // testele raman pe server; elevul nu le vede niciodata
    const task = await supabase.from('lesson_tasks').select('test_cases')
      .eq('lesson_id', lessonId).eq('task_key', taskKey).single();
    if (task.error || !task.data) return res.status(404).json({ message: 'Exercitiul nu are teste configurate.' });
 
    let passedCount = 0;
    const tests = task.data.test_cases;
    for (let i = 0; i < tests.length; i++) {
      const r = await runCpp(code, tests[i].input || '');
      if (r.compileError) return res.json({ passed: false, compileError: r.compileError });
      if (r.exitCode !== 0) {
        return res.json({ passed: false, message: `Programul s-a oprit cu eroare la testul ${i + 1}.`, stderr: r.stderr });
      }
      if (r.stdout.trim() === String(tests[i].expected_output).trim()) {
        passedCount++;
      } else {
        return res.json({
          passed: false,
          message: `Testul ${i + 1} din ${tests.length} a esuat.`,
          yourOutput: r.stdout.trim().slice(0, 500)
        });
      }
    }
 
    // toate testele trec -> salvam progresul
    const prev = await supabase.from('lesson_progress').select('last_code,attempts')
      .eq('user_id', userId).eq('lesson_id', lessonId).maybeSingle();
    const lastCode = { ...(prev.data?.last_code || {}), [taskKey]: { code, passed: true } };
 
    const allTasks = await supabase.from('lesson_tasks').select('task_key').eq('lesson_id', lessonId);
    const allPassed = (allTasks.data || []).every(t => lastCode[t.task_key]?.passed);
 
    const up = await supabase.from('lesson_progress').upsert({
      user_id: userId,
      lesson_id: lessonId,
      last_code: lastCode,
      attempts: (prev.data?.attempts || 0) + 1,
      status: allPassed ? 'completed' : 'in_progress',
      completed_at: allPassed ? new Date().toISOString() : null
    }, { onConflict: 'user_id,lesson_id' });
 
    if (up.error) {
      return res.json({ passed: true, saved: false, message: 'Corect, dar progresul nu s-a salvat.', error: up.error.message });
    }
    return res.json({ passed: true, saved: true, lessonCompleted: allPassed, testsPassed: passedCount });
  } catch (e) {
    return res.status(502).json({ message: 'Compilatorul nu raspunde. Piston ruleaza?', error: e.message });
  }
};
 
module.exports = { getCourses, getLesson, runCode, checkTask };
 