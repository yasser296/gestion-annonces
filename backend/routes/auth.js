const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/config');

const router = express.Router();

// Inscription
router.post('/register', async (req, res) => {
  try {
    const { nom, email, telephone, mot_de_passe } = req.body;
    
    // Vérifier si l'email existe déjà
    const userExists = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }
    
    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(mot_de_passe, 10);
    
    // Créer l'utilisateur
    const newUser = await pool.query(
      'INSERT INTO users (nom, email, telephone, mot_de_passe) VALUES ($1, $2, $3, $4) RETURNING id, nom, email',
      [nom, email, telephone, hashedPassword]
    );
    
    res.status(201).json({
      message: 'Inscription réussie',
      user: newUser.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;
    
    // Vérifier si l'utilisateur existe
    const user = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (user.rows.length === 0) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    
    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(mot_de_passe, user.rows[0].mot_de_passe);
    
    if (!validPassword) {
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }
    
    // Créer le token JWT
    const token = jwt.sign(
      { id: user.rows[0].id, email: user.rows[0].email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      token,
      user: {
        id: user.rows[0].id,
        nom: user.rows[0].nom,
        email: user.rows[0].email
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;