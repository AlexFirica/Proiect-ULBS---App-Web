// server.js
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

// Import rute
const authRoutes = require('./routes/auth.routes');
const homeworkRoutes = require('./routes/homework.routes');
const classroomRoutes = require('./routes/classroom.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// 1. CONECTARE MONGODB
// ==========================================
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/codero';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Conectat la MongoDB cu succes'))
  .catch(err => console.error('❌ Eroare conectare MongoDB:', err.message));

// ==========================================
// 2. MIDDLEWARES & FIȘIERE STATICE
// ==========================================
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Calea exactă bazată pe structura ta de fișiere:
// De la backend/src/ urcăm două niveluri (../../) în root-ul proiectului, apoi în frontend/public
const publicPath = path.join(__dirname, '../../frontend/public');
console.log("📁 Calea calculată pentru frontend este:", publicPath);

// Servire resurse statice (css, js, html) din folderul public
app.use(express.static(publicPath));

// ==========================================
// 3. RUTE PAGINI (HTML)
// ==========================================
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'login.html'));
});

app.get('/login.html', (req, res) => {
  res.sendFile(path.join(publicPath, 'login.html'));
});

app.get('/dashboard.html', (req, res) => {
  res.sendFile(path.join(publicPath, 'dashboard.html'));
});
// ==========================================
// 4. RUTE API
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/homeworks', homeworkRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// ==========================================
// 5. PORNIRE SERVER
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 Serverul Codero rulează activ pe portul ${PORT}`);
});