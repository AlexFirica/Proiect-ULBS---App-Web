const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret_temporar_dev_codeedu';

const authenticateJWT = (req, res, next) => {
  let token = null;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ message: 'Acces neautorizat. Tokenul lipsește.' });
  }

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

    // Verifică echivalența dintre roluri în limba română și engleză
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
  protect: authenticateJWT, // Alias pentru a fi compatibil cu importul { protect }
  requireRole 
};