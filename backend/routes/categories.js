const express = require('express');
const Categorie = require('../models/Categorie');
const SousCategorie = require('../models/SousCategorie');

const router = express.Router();

// Obtenir toutes les catégories
router.get('/', async (req, res) => {
  try {
    const categories = await Categorie.find({ isActive: true }).sort({ ordre: 1, nom: 1 });
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir toutes les catégories avec leurs sous-catégories
router.get('/with-subcategories', async (req, res) => {
  try {
    const categories = await Categorie.find({ isActive: true })
      .populate({
        path: 'sousCategories',
        match: { isActive: true },
        options: { sort: { ordre: 1, nom: 1 } }
      })
      .sort({ ordre: 1, nom: 1 });
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir une catégorie par ID avec ses sous-catégories
router.get('/:id', async (req, res) => {
  try {
    const categorie = await Categorie.findById(req.params.id)
      .populate({
        path: 'sousCategories',
        match: { isActive: true },
        options: { sort: { ordre: 1, nom: 1 } }
      });
    
    if (!categorie) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }
    
    res.json(categorie);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;