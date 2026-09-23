// server.js (backend)
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth.routes');
const homeworkRoutes = require('./routes/homework.routes');
const classroomRoutes = require('./routes/classroom.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Conectare MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/codeedu';
mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Conectat la MongoDB cu succes'))
  .catch(err => console.error('❌ Eroare conectare MongoDB:', err.message));

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

const publicPath = path.join(__dirname, '../../frontend/public');
app.use(express.static(publicPath));

// Rute pagini HTML
app.get('/', (req, res) => res.sendFile(path.join(publicPath, 'login.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(publicPath, 'login.html')));

// Rută veche, păstrată doar ca redirect de siguranță
app.get('/dashboard.html', (req, res) => res.redirect('/login.html'));

app.get('/dashboard-teacher.html', (req, res) => res.sendFile(path.join(publicPath, 'dashboard-teacher.html')));
app.get('/dashboard-student.html', (req, res) => res.sendFile(path.join(publicPath, 'dashboard-student.html')));
app.get('/classrooms-teacher.html', (req, res) => res.sendFile(path.join(publicPath, 'classrooms-teacher.html')));
app.get('/classrooms-student.html', (req, res) => res.sendFile(path.join(publicPath, 'classrooms-student.html')));
app.get('/settings.html', (req, res) => res.sendFile(path.join(publicPath, 'settings.html')));
app.get('/coming-soon.html', (req, res) => res.sendFile(path.join(publicPath, 'coming-soon.html')));

// Rute API
app.use('/api/auth', authRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/homeworks', homeworkRoutes);

app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// Fallback 404 — TREBUIE să fie ultima rută definită, după toate celelalte
app.use((req, res) => {
  res.status(404).sendFile(path.join(publicPath, '404.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Serverul Codero rulează activ pe portul ${PORT}`);
});