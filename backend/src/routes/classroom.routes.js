const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth.middleware');
const { getClassrooms, createClassroom, joinClassroom } = require('../controllers/classroom.controller');

// 1. Vizualizare clase (Acesibilă pentru toți utilizatorii autentificați)
router.get('/', protect, getClassrooms);

// 2. Creare clasă (Accesibilă profesorilor)
router.post('/', protect, requireRole('profesor', 'teacher'), createClassroom);

// 3. Înscriere într-o clasă (Accesibilă cursanților/elevilor)
router.post('/join', protect, requireRole('cursant', 'student'), joinClassroom);

module.exports = router;