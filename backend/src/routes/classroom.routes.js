// backend/src/routes/classroom.routes.js
const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth.middleware');
const { getClassrooms, createClassroom, joinClassroom } = require('../controllers/classroom.controller');

// 1. Vizualizare clase (Accesibilă oricărui utilizator logat)


router.get('/', protect, getClassrooms);


// 2. Creare clasă (Accesibilă profesorilor)

router.post('/', protect, requireRole('teacher', 'profesor'), createClassroom);

// 3. Înscriere într-o clasă (Accesibilă elevilor/studenților)
router.post('/join', protect, requireRole('student', 'cursant'), joinClassroom);

module.exports = router;