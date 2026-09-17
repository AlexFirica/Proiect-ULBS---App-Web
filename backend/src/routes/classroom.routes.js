// backend/src/routes/classroom.routes.js
const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth.middleware');
const { getClassrooms, createClassroom, joinClassroom } = require('../controllers/classroom.controller');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });
const { uploadMaterial, getMaterials } = require('../controllers/materials.controller');

// 1. Vizualizare clase (Accesibilă oricărui utilizator logat)


router.get('/', protect, getClassrooms);


// 2. Creare clasă (Accesibilă profesorilor)

router.post('/', protect, requireRole('teacher', 'profesor'), createClassroom);

// 3. Înscriere într-o clasă (Accesibilă elevilor/studenților)
router.post('/join', protect, requireRole('student', 'cursant'), joinClassroom);

router.get('/:classroomId/materials', protect, getMaterials);
router.post('/:classroomId/materials', protect, requireRole('teacher', 'profesor'), upload.single('file'), uploadMaterial);

module.exports = router;