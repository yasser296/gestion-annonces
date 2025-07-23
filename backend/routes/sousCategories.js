const express = require('express');
const SousCategorie = require('../models/SousCategorie');

const router = express.Router();

// Obtenir toutes les sous-catégories
router.get('/', async (req, res) => {
  try {
    const sousCategories = await SousCategorie.find({ isActive: true })
      .populate('categorie_id')
      .sort({ ordre: 1, nom: 1 });
    res.json(sousCategories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir les sous-catégories d'une catégorie
router.get('/by-category/:categorieId', async (req, res) => {
  try {
    const sousCategories = await SousCategorie.find({ 
      categorie_id: req.params.categorieId,
      isActive: true 
    }).sort({ ordre: 1, nom: 1 });
    res.json(sousCategories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir une sous-catégorie par ID
router.get('/:id', async (req, res) => {
  try {
    const sousCategorie = await SousCategorie.findById(req.params.id)
      .populate('categorie_id');
    if (!sousCategorie) {
      return res.status(404).json({ message: 'Sous-catégorie non trouvée' });
    }
    res.json(sousCategorie);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;