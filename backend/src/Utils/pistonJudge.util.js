// backend/src/Utils/pistonJudge.util.js
// Evaluează un program C++ pe mai multe teste, prin compilatorul din sandbox-ul Piston (Docker).
// Nu rulează niciodată codul elevului direct pe serverul aplicației.
const axios = require('axios');

const RUN_TIMEOUT_MS = 3000;     // limită de timp per test
const COMPILE_TIMEOUT_MS = 10000;

// Compară outputurile ignorând diferențele nesemnificative:
// \r\n vs \n, spații la sfârșit de linie, linii goale la sfârșit.
function normalizeOutput(s) {
  return String(s ?? '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n+$/, '');
}

async function executeOnce(sourceCode, stdin) {
  const { data } = await axios.post(
    `${process.env.PISTON_API_URL}/execute`,
    {
      language: 'c++',
      version: '10.2.0',
      files: [{ content: sourceCode }],
      stdin: stdin.endsWith('\n') ? stdin : stdin + '\n',
      run_timeout: RUN_TIMEOUT_MS,
      compile_timeout: COMPILE_TIMEOUT_MS
    },
    { timeout: 30000 }
  );
  return data;
}

/**
 * @param {string} sourceCode
 * @param {{input: string, output: string}[]} testCases
 * @returns {Promise<{compileError?: string, passed: number, total: number, results: object[]}>}
 *   results[i] = { index, ok, verdict: 'OK'|'WRONG_ANSWER'|'TIME_LIMIT'|'RUNTIME_ERROR', actual? }
 */
async function runTestCases(sourceCode, testCases) {
  const results = [];
  let passed = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    const data = await executeOnce(sourceCode, tc.input || '');
    const { compile, run } = data;

    // Eroare de compilare — aceeași pentru toate testele, deci ne oprim imediat.
    if (compile && compile.code !== 0) {
      return {
        compileError: compile.stderr || compile.output || 'Eroare de compilare necunoscută.',
        passed: 0,
        total: testCases.length,
        results: []
      };
    }

    const actual = normalizeOutput(run.stdout);
    // Piston oprește procesul cu SIGKILL (sau SIGTERM) când depășește run_timeout
    const killedByTimeout = run.signal === 'SIGKILL' || run.signal === 'SIGTERM';
    let verdict;
    if (killedByTimeout) {
      verdict = 'TIME_LIMIT';
    } else if (run.code !== 0) {
      verdict = 'RUNTIME_ERROR';
    } else if (actual === normalizeOutput(tc.output)) {
      verdict = 'OK';
    } else {
      verdict = 'WRONG_ANSWER';
    }

    if (verdict === 'OK') passed++;
    results.push({ index: i, ok: verdict === 'OK', verdict, actual });
  }

  return { passed, total: testCases.length, results };
}

// Nota 1–10 proporțională cu testele trecute (minim 1, ca în schema Submission).
function gradeFromTests(passed, total) {
  if (!total) return 1;
  return Math.max(1, Math.round(1 + (9 * passed) / total));
}

module.exports = { runTestCases, normalizeOutput, gradeFromTests };
