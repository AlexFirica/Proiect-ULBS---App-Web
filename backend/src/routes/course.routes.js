// backend/src/routes/course.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { getCourses, getLesson, runCode, checkTask } = require('../controllers/course.controller');

router.get('/', protect, getCourses);
router.post('/run', protect, runCode);                       // fixa, inainte de rutele cu parametri
router.get('/lessons/:id', protect, getLesson);
router.post('/lessons/:lessonId/tasks/:taskKey/check', protect, checkTask);

module.exports = router;