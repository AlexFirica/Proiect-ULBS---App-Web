require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

// Import rute și middleware-uri custom
const authRoutes = require('./routes/auth.routes');
const { authenticateJWT, requireRole } = require('./middleware/auth.middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// 1. CONECTARE BAZĂ DE DATE (MongoDB)
// ==========================================
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/codeedu';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Conectat la MongoDB cu succes'))
  .catch(err => console.error('❌ Eroare conectare MongoDB:', err.message));

// ==========================================
// 2. MIDDLEWARES GLOBALE & FIȘIERE STATICE
// ==========================================
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Căi către foldere
const publicPath = path.join(__dirname, '../../frontend/public');
const jsPagesPath = path.join(publicPath, 'js');

// Servire resurse statice (css, js, imagini)
app.use(express.static(publicPath));

// ==========================================
// 3. RUTE PAGINI (HTML)
// ==========================================
app.get('/', (req, res) => {
  res.sendFile(path.join(jsPagesPath, 'login.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(jsPagesPath, 'login.html'));
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(jsPagesPath, 'dashboard.html'));
});

// ==========================================
// 4. RUTE API
// ==========================================

// Autentificare
app.use('/api/auth', authRoutes);

// Preluare clase (GET)
app.get('/api/classrooms', authenticateJWT, requireRole('teacher'), (req, res) => {
  res.json([
    { _id: '1', name: 'Clasa a XII-a A', description: 'Informatică' }
  ]);
});

// Creare clasă (POST)
app.post('/api/classrooms', authenticateJWT, requireRole('teacher'), (req, res) => {
  res.json({ message: 'Clasă creată cu succes de către profesor!', teacher: req.user.email });
});

// Trimitere temă (POST)
app.post('/api/homeworks/:id/submit', authenticateJWT, requireRole('student'), (req, res) => {
  res.json({ message: 'Soluția temei a fost trimisă în coada de execuție!', student: req.user.email });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// ==========================================
// 5. PORNIRE SERVER
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 Serverul CodeEdu rulează activ pe portul ${PORT}`);
});