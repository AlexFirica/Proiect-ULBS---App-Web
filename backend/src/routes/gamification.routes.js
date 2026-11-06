// backend/src/routes/gamification.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const gamificationController = require('../controllers/gamification.controller');

// Rută de test pentru verificare
router.get('/ping', (req, res) => {
  res.json({ message: 'Gamification module is active!' });
});

// 1. Preluare profil gamificare utilizator curent (XP, nivel, monede, streak, avatar)
router.get('/me', protect, gamificationController.getMe);

// 2. Salvare / Actualizare configurare avatar
router.post('/avatar', protect, gamificationController.saveAvatar);

// 3. Cumpărare item-uri cosmetice din magazin
router.post('/shop/buy', protect, gamificationController.buy);

// 4. Revendicare bonus zilnic (Daily Login)
router.post('/daily', protect, gamificationController.daily);

// 5. Simulare bătălie 1v1 (Demo)
router.post('/battle-demo', protect, gamificationController.battleDemo);

module.exports = router;