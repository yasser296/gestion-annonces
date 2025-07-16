const express = require('express');
const Categorie = require('../models/Categorie');

const router = express.Router();

// Obtenir toutes les catégories
router.get('/', async (req, res) => {
  try {
    const categories = await Categorie.find().sort({ nom: 1 });
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;
