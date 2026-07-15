const jwt = require('jsonwebtoken');

// Middleware pentru a verifica dacă utilizatorul este logat (are token JWT valid)
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Acces neautorizat. Tokenul lipsește.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Atașează datele decodate (user_id, role, email) la cerere
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token invalid sau expirat.' });
    }
};

// Middleware pentru autorizare în funcție de rol (teacher / student)
const requireRole = (role) => {
    return (req, res, next) => {
        if (!req.user || req.user.role !== role) {
            return res.status(403).json({ message: 'Acces interzis. Nu ai permisiunile necesare.' });
        }
        next();
    };
};

module.exports = { authenticateJWT, requireRole };