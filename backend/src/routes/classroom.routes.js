// backend/src/routes/classroom.routes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, requireRole } = require('../middleware/auth.middleware');
const { uploadMaterial, getMaterials } = require('../controllers/material.controller');
const {
  createClassroom,
  getClassrooms,
  joinClassroom,
  getClassroomStudents,
  deleteClassroom
} = require('../controllers/classroom.controller');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// 1. Vizualizare clase (Accesibilă oricărui utilizator logat)
router.get('/', protect, getClassrooms);

// 2. Creare clasă (Accesibilă profesorilor)
router.post('/', protect, requireRole('teacher', 'profesor'), createClassroom);

// 3. Înscriere într-o clasă (Accesibilă elevilor/studenților)
router.post('/join', protect, requireRole('student', 'cursant'), joinClassroom);

// 4. Elevii înscriși într-o clasă
router.get('/:classroomId/students', protect, getClassroomStudents);

// 5. Materiale (Cursuri)
router.get('/:classroomId/materials', protect, getMaterials);
router.post('/:classroomId/materials', protect, requireRole('teacher', 'profesor'), upload.single('file'), uploadMaterial);

// 6. Ștergere classroom (doar profesorul care l-a creat)
router.delete('/:id', protect, requireRole('teacher', 'profesor'), deleteClassroom);

module.exports = router;