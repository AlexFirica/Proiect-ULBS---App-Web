const { Worker } = require('bullmq');
const axios = require('axios');
const { supabase } = require('../config/supabase');
const { redisConnection } = require('../queue/compiler.queue');

const worker = new Worker('compilerQueue', async (job) => {
  const { submission_id, code, language, expected_output, homework_id, student_name, teacher_id } = job.data;

  try {
    // 1. Schimbăm statusul trimiterii în 'running'
    await supabase
      .from('homework_submissions')
      .update({ status: 'running' })
      .eq('id', submission_id);

    // 2. Apelăm API-ul Piston (Docker sandbox) pentru execuția codului
    const pistonResponse = await axios.post(`${process.env.PISTON_API_URL}/api/v2/execute`, {
      language: language,
      version: '*', // Rulează pe ultima versiune stabilă a limbajului
      files: [{ content: code }],
      run_timeout: 5000 // Limitare la 5 secunde
    });

    const runResult = pistonResponse.data.run;
    const stdout = runResult.stdout || '';
    const stderr = runResult.stderr || '';
    const exitCode = runResult.code;

    let status = 'failed';
    let score = 0;

    // 3. Verificăm rezultatul (Gradare automată)
    if (exitCode !== 0) {
      status = 'error';
    } else if (stdout.trim() === expected_output.trim()) {
      status = 'passed';
      score = 100;
    }

    // 4. Actualizăm trimiterea în Supabase
    await supabase
      .from('homework_submissions')
      .update({
        status,
        output: stdout || stderr,
        score,
        graded_at: new Date().toISOString()
      })
      .eq('id', submission_id);

    // 5. Trimitem notificare profesorului că tema a fost trimisă și evaluată
    await supabase.from('notifications').insert({
      user_id: teacher_id,
      type: 'homework_submitted',
      title: 'Temă predată',
      body: `Elevul ${student_name} a predat tema. Status: ${status} (${score}/100 pct).`,
      reference_id: homework_id
    });

    console.log(`Job ${job.id} finalizat cu succes. Status evaluare: ${status}`);
  } catch (err) {
    console.error(`Eroare la procesarea jobului ${job.id}:`, err.message);

    // În caz de eroare critică de rețea/sistem, punem statusul 'error' în DB
    await supabase
      .from('homework_submissions')
      .update({ status: 'error', output: 'Eroare internă de sistem la compilare.' })
      .eq('id', submission_id);
  }
}, { connection: redisConnection });

module.exports = worker;