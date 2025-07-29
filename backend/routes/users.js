// backend/routes/users.js - Ajout de la route pour changer le mot de passe

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
  const isOwner = String(req.user.id) === String(req.params.id);
  const isAdmin = req.user.role === 'admin' || req.user.role_id === 1;

  if (!isOwner && !isAdmin) {
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

// ROUTE CORRIGÉE: Changer le mot de passe (authentification requise)
router.patch('/:id/password', authenticateToken, async (req, res) => {
  const { ancien_mot_de_passe, nouveau_mot_de_passe } = req.body;

  // Vérifier que l'utilisateur modifie son propre mot de passe OU que c'est un admin
  const isOwner = String(req.user.id) === String(req.params.id);
  const isAdmin = req.user.role === 'admin' || req.user.role_id === 1;
  
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: 'Accès refusé' });
  }

  try {
    // Validations
    if (!ancien_mot_de_passe || !nouveau_mot_de_passe) {
      return res.status(400).json({ 
        message: 'L\'ancien et le nouveau mot de passe sont requis' 
      });
    }

    if (nouveau_mot_de_passe.length < 6) {
      return res.status(400).json({ 
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères' 
      });
    }

    if (ancien_mot_de_passe === nouveau_mot_de_passe) {
      return res.status(400).json({ 
        message: 'Le nouveau mot de passe doit être différent de l\'ancien' 
      });
    }

    // Récupérer l'utilisateur avec son mot de passe
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Vérifier l'ancien mot de passe
    const validOldPassword = await bcrypt.compare(ancien_mot_de_passe, user.mot_de_passe);
    if (!validOldPassword) {
      return res.status(400).json({ 
        message: 'L\'ancien mot de passe est incorrect' 
      });
    }

    // Hasher le nouveau mot de passe
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(nouveau_mot_de_passe, saltRounds);

    // Mettre à jour le mot de passe
    await User.findByIdAndUpdate(
      req.params.id,
      { 
        mot_de_passe: hashedNewPassword,
        // Optionnel : mettre à jour la date de dernière modification du mot de passe
        date_maj_mot_de_passe: new Date()
      }
    );

    res.json({
      message: 'Mot de passe modifié avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la modification du mot de passe:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;