// backend/src/routes/homework.routes.js
const express = require('express');
const router = express.Router();
const homeworkController = require('../controllers/homework.controller');

const { protect, requireRole } = require('../middleware/auth.middleware');

// 1. RUTA FIXĂ TREBUIE SĂ FIE PRIMA!
router.post('/test-run', homeworkController.testRunCode);

// 2. Rutele cu parametri (vin DUPĂ cele fixe)
router.post('/:id/submit', homeworkController.submitCodeTask);
router.get('/:id', homeworkController.getHomeworkById);
router.get('/', homeworkController.getAllHomeworks);
router.post('/', homeworkController.createHomework);
router.put('/:id', homeworkController.updateHomework);
router.delete('/:id', homeworkController.deleteHomework);

router.post('/', protect, requireRole('teacher', 'profesor'), homeworkController.createHomework);

module.exports = router;