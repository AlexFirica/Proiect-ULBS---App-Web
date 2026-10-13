// backend/src/middleware/auth.middleware.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'secret_temporar_dev_codeedu';

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acces neautorizat. Tokenul lipseste sau este invalid.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token invalid sau expirat.' });
  }
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Neautentificat.' });
    }

    const userRole = req.user.role;
    const isAllowed = allowedRoles.some(role => {
      if ((role === 'student' || role === 'cursant') && (userRole === 'cursant' || userRole === 'student')) return true;
      if ((role === 'teacher' || role === 'profesor') && (userRole === 'profesor' || userRole === 'teacher')) return true;
      return role === userRole;
    });

    if (!isAllowed) {
      return res.status(403).json({ message: 'Acces interzis. Nu ai permisiunile necesare.' });
    }

    next();
  };
};

module.exports = { 
  authenticateJWT, 
  protect: authenticateJWT, 
  requireRole 
};