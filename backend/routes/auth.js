// backend/routes/auth.js - Routes mises à jour avec role_id

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Role = require('../models/Role');

const router = express.Router();

// Inscription
router.post('/register', async (req, res) => {
  const { nom, email, telephone, mot_de_passe } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email déjà utilisé' });
    }

    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
    const newUser = new User({ 
      nom, 
      email, 
      telephone, 
      mot_de_passe: hashedPassword,
      role_id: 2 // Par défaut: user
    });

    await newUser.save();

    res.status(201).json({
      message: 'Inscription réussie',
      user: {
        id: newUser._id,
        nom: newUser.nom,
        email: newUser.email,
        role_id: newUser.role_id
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  const { email, mot_de_passe } = req.body;

  try {
    // Récupérer l'utilisateur avec le rôle
    const user = await User.findOne({ email }).populate({
      path: 'role',
      localField: 'role_id',
      foreignField: 'id'
    });
    
    if (!user) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    const validPassword = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!validPassword) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // Récupérer le rôle si pas déjà populé
    let roleTitre = null;
    if (user.role) {
      roleTitre = user.role.titre;
    } else {
      const role = await Role.findOne({ id: user.role_id });
      roleTitre = role ? role.titre : null;
    }

    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role_id: user.role_id 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        nom: user.nom,
        email: user.email,
        role_id: user.role_id,
        role: roleTitre // Pour la compatibilité frontend
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;