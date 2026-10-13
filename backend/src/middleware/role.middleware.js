// backend/src/middleware/role.middleware.js
const requireRole = (allowedRole) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== allowedRole) {
      return res.status(403).json({ message: 'Acces interzis. Drepturi insuficiente.' });
    }
    next();
  };
};

module.exports = { requireRole };