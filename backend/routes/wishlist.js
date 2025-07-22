const express = require('express');
const authenticateToken = require('../middleware/auth');
const Wishlist = require('../models/Wishlist');
const Annonce = require('../models/Annonce');

const router = express.Router();

// Nouvelle route pour nettoyer les favoris invalides
router.post('/clean', authenticateToken, async (req, res) => {
  try {
    // Récupérer tous les favoris de l'utilisateur
    const wishlistItems = await Wishlist.find({ user_id: req.user.id });
    
    let cleanedCount = 0;
    
    // Vérifier chaque entrée
    for (const item of wishlistItems) {
      const annonceExists = await Annonce.findById(item.annonce_id);
      
      if (!annonceExists) {
        // L'annonce n'existe plus, supprimer de la wishlist
        await Wishlist.findByIdAndDelete(item._id);
        cleanedCount++;
      }
    }
    
    // Récupérer le nouveau compte
    const newCount = await Wishlist.countDocuments({ user_id: req.user.id });
    
    res.json({ 
      message: `${cleanedCount} entrée(s) invalide(s) supprimée(s)`,
      cleanedCount,
      newCount 
    });
  } catch (error) {
    console.error('Erreur lors du nettoyage de la wishlist:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir la wishlist de l'utilisateur
router.get('/', authenticateToken, async (req, res) => {
  try {
    const wishlistItems = await Wishlist.find({ user_id: req.user.id })
      .populate({
        path: 'annonce_id',
        populate: [
          { path: 'categorie_id' },
          { path: 'user_id', select: 'nom email' }
        ]
      })
      .sort({ date_ajout: -1 });

    // Filtrer les annonces supprimées et nettoyer automatiquement
    const validItems = [];
    const itemsToDelete = [];
    
    for (const item of wishlistItems) {
      if (item.annonce_id === null) {
        // L'annonce a été supprimée
        itemsToDelete.push(item._id);
      } else {
        validItems.push(item);
      }
    }
    
    // Supprimer les entrées invalides
    if (itemsToDelete.length > 0) {
      await Wishlist.deleteMany({ _id: { $in: itemsToDelete } });
    }
    
    res.json(validItems);
  } catch (error) {
    console.error('Erreur lors du chargement de la wishlist:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Vérifier si une annonce est dans la wishlist
router.get('/check/:annonceId', authenticateToken, async (req, res) => {
  try {
    const wishlistItem = await Wishlist.findOne({
      user_id: req.user.id,
      annonce_id: req.params.annonceId
    });
    
    res.json({ isInWishlist: !!wishlistItem });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Ajouter une annonce à la wishlist
router.post('/add/:annonceId', authenticateToken, async (req, res) => {
  try {
    const { annonceId } = req.params;
    
    // Vérifier que l'annonce existe
    const annonce = await Annonce.findById(annonceId);
    if (!annonce) {
      return res.status(404).json({ message: 'Annonce non trouvée' });
    }
    
    // Vérifier que l'utilisateur n'ajoute pas sa propre annonce
    if (annonce.user_id.toString() === req.user.id) {
      return res.status(400).json({ message: 'Vous ne pouvez pas ajouter votre propre annonce aux favoris' });
    }
    
    // Créer l'entrée wishlist
    const wishlistItem = new Wishlist({
      user_id: req.user.id,
      annonce_id: annonceId
    });
    
    await wishlistItem.save();
    res.status(201).json({ message: 'Annonce ajoutée aux favoris', wishlistItem });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Cette annonce est déjà dans vos favoris' });
    }
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Retirer une annonce de la wishlist
router.delete('/remove/:annonceId', authenticateToken, async (req, res) => {
  try {
    const result = await Wishlist.findOneAndDelete({
      user_id: req.user.id,
      annonce_id: req.params.annonceId
    });
    
    if (!result) {
      return res.status(404).json({ message: 'Annonce non trouvée dans les favoris' });
    }
    
    res.json({ message: 'Annonce retirée des favoris' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir le nombre d'items dans la wishlist
router.get('/count', authenticateToken, async (req, res) => {
  try {
    // Compter seulement les favoris dont l'annonce existe encore
    const wishlistItems = await Wishlist.find({ user_id: req.user.id });
    
    let validCount = 0;
    const itemsToDelete = [];
    
    for (const item of wishlistItems) {
      const annonceExists = await Annonce.findById(item.annonce_id);
      
      if (annonceExists) {
        validCount++;
      } else {
        itemsToDelete.push(item._id);
      }
    }
    
    // Nettoyer automatiquement les entrées invalides
    if (itemsToDelete.length > 0) {
      await Wishlist.deleteMany({ _id: { $in: itemsToDelete } });
    }
    
    res.json({ count: validCount });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;