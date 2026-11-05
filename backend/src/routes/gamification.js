const express = require('express');
const router = express.Router();
const User = require('../models/user.model'); // Verifică calea exactă către modelul User
// Route de test: Verifică dacă modulul funcționează
router.get('/ping', (req, res) => {
  res.json({ message: 'Gamification module is active!' });
});// 1. Preluare avatar utilizator
router.get('/avatar/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: 'Utilizator negăsit' });

    res.json({ avatar_config: user.avatar_config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Salvare/Actualizare configurare avatar
router.post('/avatar', async (req, res) => {
  try {
    const { userId, avatarConfig } = req.body; 
    // avatarConfig este un obiect: { style: 'adventurer', seed: 'Alex', backgroundColor: 'b6e3f4' }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar_config: avatarConfig },
      { new: true }
    );

    res.json({ success: true, avatar_config: updatedUser.avatar_config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Route 1: Preluare Clasament (Leaderboard)
router.get('/leaderboard', async (req, res) => {
  // Aici vom adăuga interogarea din baza de date pentru top utilizatori după EXP
  res.json({ leaderboard: [] });
});

// Route 2: Actualizare Avatar
router.post('/avatar', async (req, res) => {
  const { avatarConfig } = req.body;
  // Aici vom salva configurația avatarului în baza de date
  res.json({ success: true, avatarConfig });
});

module.exports = router;