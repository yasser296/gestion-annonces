const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db/config');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// Obtenir le profil d'un utilisateur
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT id, nom, email, telephone, date_inscription FROM users WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Mettre à jour le profil (authentification requise)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { nom, email, telephone } = req.body;
    
    // Vérifier que l'utilisateur modifie son propre profil
    if (req.user.id !== parseInt(id)) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    
    // Vérifier si le nouvel email existe déjà
    if (email !== req.user.email) {
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, id]
      );
      
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ message: 'Cet email est déjà utilisé' });
      }
    }
    
    const result = await pool.query(
      'UPDATE users SET nom = $1, email = $2, telephone = $3 WHERE id = $4 RETURNING id, nom, email, telephone',
      [nom, email, telephone, id]
    );
    
    res.json({
      message: 'Profil mis à jour avec succès',
      user: result.rows[0]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;