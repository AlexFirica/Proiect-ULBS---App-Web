const express = require('express');
const router = express.Router();
const axios = require('axios');
const Test = require('../models/Test.models');
const TestSubmission = require('../models/testSubmission.model');
const User = require('../models/user.model');
const { protect } = require('../middleware/auth.middleware');

const PISTON_API_URL = process.env.PISTON_API_URL ? `${process.env.PISTON_API_URL}/execute` : 'http://localhost:2000/api/v2/execute';

// GET /api/tests/classroom/:classroomId - Preluare teste clasă + rezolvări ale elevului
router.get('/classroom/:classroomId', protect, async (req, res) => {
  try {
    const { classroomId } = req.params;
    const tests = await Test.find({ classroomId }).sort({ createdAt: -1 });
    
    let submissions = [];
    const userId = req.user._id || req.user.id;
    if (req.user.role !== 'teacher' && req.user.role !== 'profesor') {
      submissions = await TestSubmission.find({ studentId: userId, testId: { $in: tests.map(t => t._id) } });
    }

    res.json({ tests, submissions });
  } catch (err) {
    res.status(500).json({ message: "Eroare la preluarea testelor.", error: err.message });
  }
});

// POST /api/tests/create - Creează test nou (doar profesori)
router.post('/create', protect, async (req, res) => {
  try {
    const { classroomId, title, description, difficulty, xp, testCases } = req.body;
    const userId = req.user._id || req.user.id;

    const newTest = new Test({
      classroomId, title, description, difficulty, xp: xp || 15, testCases, createdBy: userId
    });
    await newTest.save();
    res.status(201).json({ success: true, test: newTest });
  } catch (err) {
    res.status(500).json({ message: "Eroare la crearea testului.", error: err.message });
  }
});

// POST /api/tests/submit-test - Evaluare cod elev prin Piston & Salvare Notă/XP în DB
router.post('/submit-test', protect, async (req, res) => {
    try {
        const { problemId, code, language } = req.body; 
        const studentId = req.user._id || req.user.id;

        const testDoc = await Test.findById(problemId);
        if (!testDoc) return res.status(404).json({ message: "Testul nu exista." });

        const testCases = testDoc.testCases;
        let passedTests = 0;
        let totalTests = testCases.length;
        let executionDetails = [];

        for (let i = 0; i < totalTests; i++) {
            const currentTest = testCases[i];
            const pistonResponse = await axios.post(PISTON_API_URL, {
                language: language || 'c++',
                version: '10.2.0',
                files: [{ content: code }],
                stdin: currentTest.input || ''
            });

            const result = pistonResponse.data;
            if (result.compile && result.compile.code !== 0) {
                return res.json({
                    status: 'Compilation Error',
                    message: result.compile.stderr || result.compile.output,
                    grade: 1
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

        let grade = 1 + (passedTests / (totalTests || 1)) * 9;
        grade = Math.round(grade * 100) / 100;
        const xpEarned = passedTests === totalTests ? testDoc.xp : 0;

        // Salvare rezolvare în MongoDB
        const submission = await TestSubmission.create({
            testId: problemId,
            studentId,
            grade,
            passedTests,
            totalTests,
            xpEarned,
            details: executionDetails
        });

        if (xpEarned > 0) {
            await User.findByIdAndUpdate(studentId, { $inc: { xp: xpEarned } });
        }

        res.json({
            status: passedTests === totalTests ? 'Accepted' : 'Wrong Answer',
            passed: `${passedTests}/${totalTests}`,
            grade,
            xpEarned,
            details: executionDetails
        });

    } catch (error) {
        res.status(500).json({ error: "Eroare la procesarea testului: " + error.message });
    }
});

module.exports = router;