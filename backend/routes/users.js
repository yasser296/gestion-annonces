const express = require('express');
const bcrypt = require('bcrypt');
const authenticateToken = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Obtenir le profil d'un utilisateur
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-mot_de_passe');
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour le profil (authentification requise)
router.put('/:id', authenticateToken, async (req, res) => {
  const { nom, email, telephone } = req.body;

  if (req.user.id !== req.params.id) {
    return res.status(403).json({ message: 'Accès refusé' });
  }

  try {
    const existingUser = await User.findOne({ email, _id: { $ne: req.params.id } });
    if (existingUser) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { nom, email, telephone },
      { new: true }
    ).select('-mot_de_passe');

    res.json({
      message: 'Profil mis à jour avec succès',
      user: updatedUser
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
