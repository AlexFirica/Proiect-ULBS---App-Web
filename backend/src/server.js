// server.js (backend)
require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Importare rute
const authRoutes = require('./routes/auth.routes');
const homeworkRoutes = require('./routes/homework.routes');
const classroomRoutes = require('./routes/classroom.routes');
const courseRoutes = require('./routes/course.routes');
const gamificationRoutes = require('./routes/gamification.routes');
const teacherRoutes = require('./routes/teacher.routes'); // 👈 Adăugat

const app = express();
const PORT = process.env.PORT || 3000;

// Modelul Mongoose pentru Teste - Salvat în colecția separată 'tests'
const TestSchema = new mongoose.Schema({
  classroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ['usor', 'mediu', 'avansat'], default: 'usor' },
  xp: { type: Number, default: 15 },
  sourceMaterial: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'tests' });

const Test = mongoose.models.Test || mongoose.model('Test', TestSchema);

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
app.get('/dashboard.html', (req, res) => res.redirect('/login.html'));
app.get('/dashboard-teacher.html', (req, res) => res.sendFile(path.join(publicPath, 'dashboard-teacher.html')));
app.get('/dashboard-student.html', (req, res) => res.sendFile(path.join(publicPath, 'dashboard-student.html')));
app.get('/classrooms-teacher.html', (req, res) => res.sendFile(path.join(publicPath, 'classrooms-teacher.html')));
app.get('/classrooms-student.html', (req, res) => res.sendFile(path.join(publicPath, 'classrooms-student.html')));
app.get('/avatar.html', (req, res) => res.sendFile(path.join(publicPath, 'avatar.html')));
app.get('/settings.html', (req, res) => res.sendFile(path.join(publicPath, 'settings.html')));
app.get('/cursuri.html', (req, res) => res.sendFile(path.join(publicPath, 'cursuri.html')));
app.get('/coming-soon.html', (req, res) => res.sendFile(path.join(publicPath, 'coming-soon.html')));

// Rute API existente
app.use('/api/auth', authRoutes);
app.use('/api/classrooms', classroomRoutes);
app.use('/api/homeworks', homeworkRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/teacher', teacherRoutes); // 👈 Adăugat

// Rute API pentru Teste (Salvare și Preluare din colecția separată 'tests' din MongoDB)
app.post('/api/tests', async (req, res) => {
  try {
    const { classroomId, title, description, difficulty, xp, sourceMaterial } = req.body;

    const newTest = new Test({
      classroomId,
      title,
      description,
      difficulty,
      xp,
      sourceMaterial
    });

    const savedTest = await newTest.save();
    res.status(201).json({ success: true, test: savedTest });
  } catch (error) {
    console.error("Eroare la salvarea testului:", error);
    res.status(500).json({ success: false, message: "Eroare de server la salvarea testului." });
  }
});

app.get('/api/tests/:classroomId', async (req, res) => {
  try {
    const tests = await Test.find({ classroomId: req.params.classroomId });
    res.json(tests);
  } catch (error) {
    console.error("Eroare la preluarea testelor:", error);
    res.status(500).json({ success: false, message: "Eroare la preluarea testelor." });
  }
});

app.get('/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// Fallback 404 — TREBUIE să fie ultima rută definită, după toate celelalte
app.use((req, res) => {
  res.status(404).sendFile(path.join(publicPath, '404.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Serverul Codero rulează activ pe portul ${PORT}`);
});