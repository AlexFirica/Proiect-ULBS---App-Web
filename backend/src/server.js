require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.routes');
const { authenticateJWT, requireRole } = require('./middleware/auth.middleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares globale fundamentale
app.use(express.json());
app.use(cookieParser());

// Rute principale API
app.use('/auth', authRoutes);

// Exemple practice de rute securizate bazate pe token JWT și rol (Cerute în documentația de proiect)
app.post('/classrooms', authenticateJWT, requireRole('teacher'), (req, res) => {
    res.json({ message: 'Clasă creată cu succes de către profesor!', teacher: req.user.email });
});

app.post('/homeworks/:id/submit', authenticateJWT, requireRole('student'), (req, res) => {
    res.json({ message: 'Soluția temei a fost trimisă în coada de execuție!', student: req.user.email });
});

// Verificare stare server
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date() });
});

app.listen(PORT, () => {
    console.log(`🚀 Serverul CodeEdu rulează activ pe portul ${PORT}`);
});