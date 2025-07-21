// backend/middleware/adminAuth.js
const adminAuth = (req, res, next) => {
  // Vérifier que l'utilisateur a le rôle admin (id = 1)
  if (!req.user || req.user.role_id !== 1) {
    return res.status(403).json({ message: 'Accès réservé aux administrateurs' });
  }
  next();
};

module.exports = adminAuth;