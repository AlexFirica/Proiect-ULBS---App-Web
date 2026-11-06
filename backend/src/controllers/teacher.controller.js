// backend/src/controllers/teacher.controller.js
const Homework = require('../models/homework.model');
const Classroom = require('../models/classroom.model'); // Calea potrivită cu numele fișierului classroom.models.js
const User = require('../models/user.model');
const Submission = require('../models/submission.model');
const supabaseImport = require('../config/supabase');
const supabase = supabaseImport.supabase || supabaseImport;
const { encryptAES, signDataECC } = require('../Utils/cryptoUtils');

// Încărcare securizată a șabloanelor (previne crash-ul dacă fișierul JSON nu există)
let templatesCatalog = { capitole: [] };
try {
  templatesCatalog = require('../data/courseHomeworkTemplates.json');
} catch (e) {
  // Fișierul JSON nu există încă; se folosește un catalog gol ca fallback
}

// GET /api/teacher/homework/:homeworkId/grades
// Returnează catalogul cu notele și statusul elevilor la o temă
exports.getHomeworkGrades = async (req, res) => {
  try {
    const { homeworkId } = req.params;

    const homework = await Homework.findById(homeworkId);
    if (!homework) {
      return res.status(404).json({ message: 'Tema nu există.' });
    }

    // Preluăm toți elevii înscriși în clasa respectivă
    const classroom = await Classroom.findById(homework.classroomId).populate('students', 'name email avatarUrl');
    if (!classroom) {
      return res.status(404).json({ message: 'Clasa nu a fost găsită.' });
    }

    // Preluăm toate trimiterile efectuate pentru această temă
    const submissions = await Submission.find({ homeworkId });
    const submissionMap = new Map(
      submissions.map((s) => [(s.studentId || s.userId).toString(), s])
    );

    // Construim raportul pentru fiecare elev din clasă
    const report = classroom.students.map((student) => {
      const sub = submissionMap.get(student._id.toString());
      return {
        studentId: student._id,
        name: student.name || 'Elev Fără Nume',
        email: student.email,
        submitted: !!sub,
        status: sub ? sub.status : 'NETRIMIS',
        grade: sub ? sub.grade : '-',
        passedTests: sub ? sub.passedTests : 0,
        totalTests: sub ? sub.totalTests : (homework.testCases || []).length,
        submittedAt: sub ? sub.updatedAt : null,
        code: sub ? (sub.sourceCode || sub.code || '') : ''
      };
    });

    res.json({
      homeworkTitle: homework.title,
      totalStudents: classroom.students.length,
      report
    });
  } catch (error) {
    res.status(500).json({ message: 'Eroare la generarea catalogului de note.', error: error.message });
  }
};

// POST /api/teacher/generate-ai-homework
// Generează o problemă C++ completă și detaliată cu seturi de testare folosind LLM (Gemini / OpenAI API)
exports.generateAiHomework = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ message: 'Te rugăm să introduci un prompt pentru AI.' });
    }

    // Prompt strict pentru o structură completă și explicită de examen/PBInfo
    const systemPrompt = `Ești un profesor expert de informatică C++. Generează o problemă C++ clară, completă și foarte detaliată pe baza cerinței: "${prompt}".

Câmpul "description" TREBUIE să fie explicit și structurat obligatoriu cu următoarele secțiuni:
1. CERINȚĂ: Explicarea detaliată a problemei de rezolvat.
2. DATE DE INTRARE: Ce se citește de la tastatură (cin), ordinea variabilelor și tipul lor.
3. DATE DE IEȘIRE: Ce trebuie afișat pe ecran (cout), exact în formatul solicitat.
4. RESTRICȚII ȘI PRECIZĂRI: Limite de date (ex: 1 <= n <= 1000) și observatii utile.
5. EXEMPLU: Un caz ilustrat cu date de intrare, date de ieșire și o scurtă explicație.

Răspunde EXCLUSIV cu un obiect JSON valid, fără formatare Markdown (fără \`\`\`json sau text suplimentar), cu următoarea structură exactă:
{
  "title": "Titlu sugestiv pentru problemă",
  "description": "Textul detaliat al problemei structurat strict pe secțiunile de mai sus",
  "rewardCoins": 50,
  "rewardXp": 25,
  "testCases": [
    { "input": "date intrare 1", "output": "rezultat 1" },
    { "input": "date intrare 2", "output": "rezultat 2" },
    { "input": "date intrare 3", "output": "rezultat 3" }
  ]
}`;

    let aiResponseText = null;

    if (process.env.GEMINI_API_KEY) {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: systemPrompt }] }] })
        }
      );
      const data = await response.json();
      aiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    } else if (process.env.OPENAI_API_KEY) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: systemPrompt }],
          response_format: { type: 'json_object' }
        })
      });
      const data = await response.json();
      aiResponseText = data.choices?.[0]?.message?.content;
    }

    // Fallback detaliat în caz că nu este configurată nicio cheie API în .env
    if (!aiResponseText) {
      return res.json({
        title: `Problemă C++: ${prompt.substring(0, 30)}`,
        description: `CERINȚĂ:\nScrieți un program C++ care rezolvă următoarea cerință: "${prompt}".\n\nDATE DE INTRARE:\nDe la tastatură se citesc valorile de intrare pe o singură linie, separate prin spațiu.\n\nDATE DE IEȘIRE:\nPe ecran se va afișa rezultatul obținut conform cerinței.\n\nRESTRICȚII ȘI PRECIZĂRI:\n- Valorile sunt numere întregi pe 32 biți.\n- Nu afișați mesaje suplimentare de ghidare de tipul "Introduceți numărul".\n\nEXEMPLU:\nInput: 10 20\nOutput: 30`,
        rewardCoins: 50,
        rewardXp: 20,
        testCases: [
          { input: '10 20', output: '30' },
          { input: '5 7', output: '12' },
          { input: '0 -4', output: '-4' }
        ]
      });
    }

    // Curățare tag-uri Markdown din răspunsul AI
    const cleanJson = aiResponseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const generatedHomework = JSON.parse(cleanJson);

    res.json(generatedHomework);
  } catch (error) {
    res.status(500).json({ message: 'Eroare la generarea temei cu AI.', error: error.message });
  }
};

// GET /api/teacher/course-templates
// Returnează lista de capitole și teme predefinite din curs
exports.getCourseTemplates = async (req, res) => {
  try {
    res.json(templatesCatalog);
  } catch (error) {
    res.status(500).json({ message: 'Eroare la încărcarea șabloanelor din curs.', error: error.message });
  }
};

// POST /api/teacher/homework/from-template
// Atribuie o temă generată automat din curs către o clasă
exports.createFromTemplate = async (req, res) => {
  try {
    const { classroomId, templateId, deadline } = req.body;

    if (!classroomId || !templateId) {
      return res.status(400).json({ message: 'Identificatorul clasei și al șablonului sunt obligatorii.' });
    }

    let foundTemplate = null;
    for (const cap of templatesCatalog.capitole || []) {
      const match = (cap.teme || []).find((t) => t.id === templateId);
      if (match) {
        foundTemplate = match;
        break;
      }
    }

    if (!foundTemplate) {
      return res.status(404).json({ message: 'Șablonul de temă specificat nu a fost găsit.' });
    }

    const newHomework = await Homework.create({
      title: foundTemplate.title,
      description: foundTemplate.description,
      classroomId,
      testCases: foundTemplate.testCases || [],
      rewardCoins: foundTemplate.rewardCoins || 50,
      rewardXp: foundTemplate.rewardXp || 10,
      deadline: deadline || null
    });

    res.status(201).json({
      message: 'Tema a fost generată și atribuită cu succes!',
      homework: newHomework
    });
  } catch (error) {
    res.status(500).json({ message: 'Eroare la crearea temei din șablon.', error: error.message });
  }
};


// ───────────────────────────────────────────────────────────────
// CATALOG DE EXERCIȚII (Supabase, tabela `exercises`)
// ───────────────────────────────────────────────────────────────

// GET /api/teacher/exercises?chapter=&grade=&difficulty=&q=
// Listează exercițiile din catalog. NU trimite testele (conțin răspunsurile corecte).
exports.listExercises = async (req, res) => {
  try {
    const { chapter, grade, difficulty, q } = req.query;

    let query = supabase
      .from('exercises')
      .select('id, slug, title, description, chapter, grade, difficulty, xp_reward, test_cases')
      .eq('is_active', true)
      .order('grade', { ascending: true })
      .order('difficulty', { ascending: true })
      .order('title', { ascending: true });

    if (chapter) query = query.eq('chapter', chapter);
    if (grade) query = query.eq('grade', parseInt(grade, 10));
    if (difficulty) query = query.eq('difficulty', parseInt(difficulty, 10));
    if (q) query = query.ilike('title', `%${String(q).replace(/[%_]/g, '')}%`);

    const { data, error } = await query;
    if (error) {
      return res.status(500).json({ message: 'Eroare la citirea catalogului de exerciții.', error: error.message });
    }

    const exercises = (data || []).map(({ test_cases, ...ex }) => ({
      ...ex,
      testCount: Array.isArray(test_cases) ? test_cases.length : 0
    }));

    // Grupare pe capitole, în ordinea primei apariții, pentru dropdown-urile din interfață
    const chapters = [];
    for (const ex of exercises) {
      if (!chapters.includes(ex.chapter)) chapters.push(ex.chapter);
    }

    res.json({ chapters, exercises });
  } catch (error) {
    res.status(500).json({ message: 'Eroare la încărcarea exercițiilor.', error: error.message });
  }
};

// POST /api/teacher/homework/from-exercise
// body: { classroomId, exerciseId, dueDate, xpReward? }
// Profesorul alege un exercițiu din catalog și îl atribuie unei clase ca temă.
// Testele rămân pe server; elevul rezolvă tema în editorul C++ și e evaluat prin compilator.
exports.assignExercise = async (req, res) => {
  try {
    const { classroomId, exerciseId, dueDate, xpReward } = req.body;

    if (!classroomId || !exerciseId || !dueDate) {
      return res.status(400).json({ message: 'Clasa, exercițiul și termenul limită sunt obligatorii.' });
    }
    const due = new Date(dueDate);
    if (Number.isNaN(due.getTime())) {
      return res.status(400).json({ message: 'Termenul limită nu este o dată validă.' });
    }

    // 1. Clasa trebuie să aparțină profesorului curent
    const teacherId = req.user.supabaseId || req.user.id || req.user.userId;
    const { data: classroom, error: clsErr } = await supabase
      .from('classrooms')
      .select('id, teacher_id')
      .eq('id', classroomId)
      .single();
    if (clsErr || !classroom) {
      return res.status(404).json({ message: 'Clasa nu a fost găsită.' });
    }
    if (classroom.teacher_id !== teacherId) {
      return res.status(403).json({ message: 'Nu poți atribui teme în clasa altui profesor.' });
    }

    // 2. Exercițiul din catalog
    const { data: exercise, error: exErr } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', exerciseId)
      .eq('is_active', true)
      .single();
    if (exErr || !exercise) {
      return res.status(404).json({ message: 'Exercițiul nu a fost găsit în catalog.' });
    }

    // 3. Evităm dublurile (același exercițiu dat de două ori în aceeași clasă)
    const already = await Homework.findOne({ classroomId: String(classroomId), exerciseId: String(exercise.id) });
    if (already) {
      return res.status(409).json({ message: 'Acest exercițiu a fost deja atribuit acestei clase.' });
    }

    // 4. Cerința este criptată AES și semnată ECC, exact ca la temele create manual
    const encryptedDescription = encryptAES(exercise.description);
    const signature = signDataECC(`${exercise.title}-${encryptedDescription}-${due.toISOString()}`);

    const testCases = Array.isArray(exercise.test_cases) ? exercise.test_cases : [];
    const homework = await Homework.create({
      title: exercise.title,
      description: encryptedDescription,
      dueDate: due,
      subject: 'Informatică',
      classroomId: String(classroomId),
      signature,
      isCodingTask: true,
      testCases: testCases.map((t) => ({ input: String(t.input ?? ''), output: String(t.output ?? '') })),
      // câmpurile vechi rămân completate cu primul test, pentru compatibilitate
      testInput: testCases[0]?.input ?? '',
      expectedOutput: testCases[0]?.output ?? '',
      xpReward: Number.isFinite(parseInt(xpReward, 10)) ? parseInt(xpReward, 10) : exercise.xp_reward,
      exerciseId: String(exercise.id),
      chapter: exercise.chapter
    });

    // Nu trimitem testele înapoi în răspuns
    const out = homework.toObject();
    delete out.testCases;
    delete out.testInput;
    delete out.expectedOutput;

    res.status(201).json({ message: 'Tema a fost atribuită clasei!', homework: out });
  } catch (error) {
    console.error('Eroare la atribuirea exercițiului:', error);
    res.status(500).json({ message: 'Eroare la atribuirea exercițiului.', error: error.message });
  }
};
