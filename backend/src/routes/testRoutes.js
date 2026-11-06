const express = require('express');
const router = express.Router();
const axios = require('axios');

const PISTON_API_URL = 'http://localhost:2000/api/v2/execute';

// Ruta prin care elevul trimite rezolvarea unui test/problemă
router.post('/submit-test', async (req, res) => {
    try {
        const { studentId, problemId, code, language, testCases } = req.body; 
        // testCases este un array trimis de baza de date cu exemplele profesorului: 
        // [{ input: "5\n1 2 3 4 5", expectedOutput: "15" }, ...]

        let passedTests = 0;
        let totalTests = testCases.length;
        let executionDetails = [];

        // Rulăm codul elevului pentru fiecare test în parte
        for (let i = 0; i < totalTests; i++) {
            const currentTest = testCases[i];

            const pistonResponse = await axios.post(PISTON_API_URL, {
                language: language || 'gcc', // Folosește 'gcc' pentru C++
                version: '*',
                files: [{ content: code }],
                stdin: currentTest.input // Trimitem input-ul specific testului către program
            });

            const result = pistonResponse.data;

            // Verificăm erorile de compilare
            if (result.compile && result.compile.stderr) {
                return res.json({
                    status: 'Compilation Error',
                    message: result.compile.stderr,
                    grade: 1 // Notă minimă din oficiu
                });
            }

            const studentOutput = result.run.stdout ? result.run.stdout.trim() : '';
            const expected = currentTest.expectedOutput.trim();

            if (studentOutput === expected) {
                passedTests++;
                executionDetails.push({ test: i + 1, status: 'Passed' });
            } else {
                executionDetails.push({ test: i + 1, status: 'Failed' });
            }
        }

        // Calcularea notei ca la școală (de la 1 la 10)
        // Formula: 1 (din oficiu) + (teste trecute / total teste) * 9
        let grade = 1 + (passedTests / totalTests) * 9;
        grade = Math.round(grade * 100) / 100; // Rotunjire la 2 zecimale

        // Aici poți salva nota și rezultatul în MongoDB (folosind submission.model.js)
        // Exemplu: await Submission.create({ studentId, problemId, grade, details: executionDetails });

        res.json({
            status: passedTests === totalTests ? 'Accepted' : 'Wrong Answer',
            passed: `${passedTests}/${totalTests} teste trecute`,
            grade: grade, // Aceasta este nota oficială care va apărea în catalogul profesorului
            details: executionDetails
        });

    } catch (error) {
        console.error("Eroare la evaluare:", error.message);
        res.status(500).json({ error: "Eroare internă la procesarea testului." });
    }
});

module.exports = router;