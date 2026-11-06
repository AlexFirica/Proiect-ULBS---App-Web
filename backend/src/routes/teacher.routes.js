// backend/src/routes/teacher.routes.js
const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacher.controller');
const { protect, requireRole } = require('../middleware/auth.middleware');

// Toate rutele din acest fișier sunt doar pentru profesori autentificați
router.use(protect, requireRole('teacher', 'profesor'));

// GET /api/teacher/exercises
// Catalogul de exerciții C++ (liceu) din Supabase, filtrabil după capitol / clasă / dificultate
router.get('/exercises', teacherController.listExercises);

// POST /api/teacher/homework/from-exercise
// Atribuie un exercițiu din catalog unei clase, ca temă rezolvată prin compilator
router.post('/homework/from-exercise', teacherController.assignExercise);

// GET /api/teacher/homework/:homeworkId/grades
// Obține catalogul cu notele elevilor pentru o temă specifică
router.get('/homework/:homeworkId/grades', teacherController.getHomeworkGrades);

// POST /api/teacher/generate-ai-homework
// Generează titlu, cerință și teste automate folosite de AI
router.post('/generate-ai-homework', teacherController.generateAiHomework);

// GET /api/teacher/course-templates
// Preia lista de capitole și șabloane de teme predefinite
router.get('/course-templates', teacherController.getCourseTemplates);

// POST /api/teacher/homework/from-template
// Creează o temă din șabloanele predefinite pentru o clasă
router.post('/homework/from-template', teacherController.createFromTemplate);

module.exports = router;