// backend/src/utils/judge.util.js
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execPromise = util.promisify(exec);

/**
 * Evaluează codul C++ împotriva seturilor de teste furnizate
 */
async function evaluateCpp(code, testCases) {
  const tempId = Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const tempDir = path.join(__dirname, '../../temp');
  
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const cppPath = path.join(tempDir, `sol_${tempId}.cpp`);
  const exePath = path.join(tempDir, `sol_${tempId}.exe`);

  try {
    // 1. Scrie codul sursă în fișierul temporar
    fs.writeFileSync(cppPath, code);

    // 2. Compilare cu g++
    try {
      await execPromise(`g++ "${cppPath}" -o "${exePath}"`);
    } catch (compileErr) {
      return { 
        status: 'COMPILATION_ERROR', 
        message: 'Eroare de compilare:\n' + compileErr.stderr 
      };
    }

    // 3. Rularea fiecărui test-case
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const inputStr = (tc.input || '').trim();
      const expectedOutput = (tc.output || '').trim();

      // Rulează executabilul furnizând input-ul prin echo
      const runCmd = process.platform === 'win32'
        ? `echo ${inputStr} | "${exePath}"`
        : `echo "${inputStr}" | "${exePath}"`;

      try {
        const { stdout } = await execPromise(runCmd, { timeout: 2000 }); // Limită de 2 secunde per test
        const actualOutput = (stdout || '').trim();

        if (actualOutput !== expectedOutput) {
          return {
            status: 'WRONG_ANSWER',
            message: `Testul ${i + 1} eșuat.\nAșteptat: "${expectedOutput}"\nObținut: "${actualOutput}"`
          };
        }
      } catch (runErr) {
        if (runErr.killed) {
          return { status: 'TIME_LIMIT_EXCEEDED', message: `Testul ${i + 1}: Timp de executare depășit ( > 2s ).` };
        }
        return { status: 'RUNTIME_ERROR', message: `Eroare la rulare la testul ${i + 1}.` };
      }
    }

    return { status: 'ACCEPTED', message: 'Toate testele au trecut cu succes!' };

  } finally {
    // Curățare fișiere temporare
    if (fs.existsSync(cppPath)) fs.unlinkSync(cppPath);
    if (fs.existsSync(exePath)) fs.unlinkSync(exePath);
  }
}

module.exports = { evaluateCpp };