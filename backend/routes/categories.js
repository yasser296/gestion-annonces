const express = require('express');
const pool = require('../db/config');

const router = express.Router();

// Obtenir toutes les catégories
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY nom');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;