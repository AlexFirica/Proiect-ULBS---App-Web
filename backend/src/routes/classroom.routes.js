const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { joinClassroom } = require('../controllers/classroom.controller');

// Doar elevii autentificați se pot înscrie într-o clasă
router.post('/join', protect, requireRole('student'), joinClassroom);

module.exports = router;