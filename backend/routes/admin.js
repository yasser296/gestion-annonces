const express = require('express');
const authenticateToken = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');
const Annonce = require('../models/Annonce');
const Categorie = require('../models/Categorie');
const SousCategorie = require('../models/SousCategorie'); // NOUVEAU
const Role = require('../models/Role');
const Wishlist = require('../models/Wishlist');

const router = express.Router();

// Middleware pour toutes les routes admin
router.use(authenticateToken);
router.use(adminAuth);

// === GESTION DES UTILISATEURS ===

// Obtenir tous les utilisateurs
router.get('/users', async (req, res) => {
  try {
    const users = await User.find()
      .select('-mot_de_passe')
      .sort({ date_inscription: -1 });
    
    // Ajouter le nombre d'annonces pour chaque utilisateur
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const annonceCount = await Annonce.countDocuments({ user_id: user._id });
        return {
          ...user.toObject(),
          nombre_annonces: annonceCount
        };
      })
    );

    res.json(usersWithStats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Modifier un utilisateur
router.put('/users/:id', async (req, res) => {
  const { nom, email, telephone } = req.body;

  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { nom, email, telephone },
      { new: true }
    ).select('-mot_de_passe');

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({ message: 'Utilisateur mis à jour', user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Changer le rôle d'un utilisateur
router.patch('/users/:id/role', async (req, res) => {
  const { role_id } = req.body;
  const validRoleIds = [1, 2, 3]; // admin, user, vendeur

  try {
    if (!validRoleIds.includes(role_id)) {
      return res.status(400).json({ message: 'ID de rôle invalide' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Empêcher de retirer le dernier admin
    if (user.role_id === 1 && role_id !== 1) {
      const adminCount = await User.countDocuments({ role_id: 1 });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'Impossible de retirer le dernier administrateur' });
      }
    }

    const oldRoleId = user.role_id;
    user.role_id = role_id;
    await user.save();

    // Gérer les demandes vendeur lors du changement de rôle
    const DemandeVendeur = require('../models/DemandeVendeur');
    
    // Si on passe de user (2) à vendeur (3) directement
    if (oldRoleId === 2 && role_id === 3) {
      // Supprimer toutes les demandes en attente de cet utilisateur
      await DemandeVendeur.deleteMany({ 
        user_id: req.params.id, 
        statut: 'en_attente' 
      });
      
      // Créer une demande acceptée automatiquement pour garder une trace
      await DemandeVendeur.create({
        user_id: req.params.id,
        statut: 'acceptee',
        message_demande: 'Promotion directe par administrateur',
        message_admin: `Rôle vendeur attribué directement par l'administrateur`,
        date_traitement: new Date(),
        traite_par: req.user.id
      });
    }
    
    // Si on retire le rôle vendeur (3 -> 2)
    else if (oldRoleId === 3 && role_id === 2) {
      // Supprimer toutes les demandes en attente
      await DemandeVendeur.deleteMany({ 
        user_id: req.params.id, 
        statut: 'en_attente' 
      });
    }

    // Récupérer le rôle pour la réponse
    const role = await Role.findOne({ id: role_id });

    res.json({ 
      message: 'Rôle mis à jour avec succès', 
      user: {
        ...user.toObject(),
        role: role ? role.titre : null
      },
      roleChanged: oldRoleId !== role_id 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer un utilisateur et ses annonces
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    // Empêcher la suppression d'un admin
    if (user.role === 'admin') {
      return res.status(403).json({ message: 'Impossible de supprimer un administrateur' });
    }

    // Récupérer toutes les annonces de l'utilisateur
    const userAnnonces = await Annonce.find({ user_id: req.params.id });
    const annonceIds = userAnnonces.map(a => a._id);

    // Supprimer toutes les entrées wishlist pour ces annonces
    await Wishlist.deleteMany({ annonce_id: { $in: annonceIds } });

    // Supprimer toutes les wishlists de l'utilisateur
    await Wishlist.deleteMany({ user_id: req.params.id });

    // Supprimer toutes les annonces de l'utilisateur
    await Annonce.deleteMany({ user_id: req.params.id });

    // Supprimer l'utilisateur
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: 'Utilisateur et ses annonces supprimés' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// === GESTION DES ANNONCES ===

// Obtenir toutes les annonces (admin) - MISE À JOUR
router.get('/annonces', async (req, res) => {
  try {
    const annonces = await Annonce.find()
      .populate('user_id', 'nom email')
      .populate('categorie_id')
      .populate('sous_categorie_id') // NOUVEAU
      .sort({ date_publication: -1 });

    res.json(annonces);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Modifier une annonce (admin)
router.put('/annonces/:id', async (req, res) => {
  try {
    const annonce = await Annonce.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!annonce) {
      return res.status(404).json({ message: 'Annonce non trouvée' });
    }

    res.json({ message: 'Annonce mise à jour', annonce });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer une annonce (admin)
router.delete('/annonces/:id', async (req, res) => {
  try {
    await Wishlist.deleteMany({ annonce_id: req.params.id });
    const annonce = await Annonce.findByIdAndDelete(req.params.id);

    if (!annonce) {
      return res.status(404).json({ message: 'Annonce non trouvée' });
    }

    res.json({ message: 'Annonce supprimée' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Activer/Désactiver une annonce (admin)
router.patch('/annonces/:id/toggle-status', async (req, res) => {
  try {
    const annonce = await Annonce.findById(req.params.id);
    if (!annonce) {
      return res.status(404).json({ message: 'Annonce non trouvée' });
    }

    annonce.is_active = !annonce.is_active;
    await annonce.save();

    res.json({ message: 'Statut mis à jour', is_active: annonce.is_active });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// === GESTION DES CATÉGORIES - NOUVEAU ===

// Obtenir toutes les catégories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Categorie.find()
      .populate('sousCategories')
      .sort({ ordre: 1, nom: 1 });
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Créer une catégorie
router.post('/categories', async (req, res) => {
  try {
    const categorie = new Categorie(req.body);
    await categorie.save();
    res.status(201).json({ message: 'Catégorie créée', categorie });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Modifier une catégorie
router.put('/categories/:id', async (req, res) => {
  try {
    const categorie = await Categorie.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!categorie) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }
    res.json({ message: 'Catégorie mise à jour', categorie });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer une catégorie
router.delete('/categories/:id', async (req, res) => {
  try {
    // Vérifier s'il y a des annonces dans cette catégorie
    const annonceCount = await Annonce.countDocuments({ categorie_id: req.params.id });
    if (annonceCount > 0) {
      return res.status(400).json({ 
        message: `Impossible de supprimer cette catégorie car elle contient ${annonceCount} annonce(s)` 
      });
    }

    // Supprimer toutes les sous-catégories de cette catégorie
    await SousCategorie.deleteMany({ categorie_id: req.params.id });

    // Supprimer la catégorie
    const categorie = await Categorie.findByIdAndDelete(req.params.id);
    if (!categorie) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }

    res.json({ message: 'Catégorie et ses sous-catégories supprimées' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// === GESTION DES SOUS-CATÉGORIES - NOUVEAU ===

// Obtenir toutes les sous-catégories
router.get('/sous-categories', async (req, res) => {
  try {
    const sousCategories = await SousCategorie.find()
      .populate('categorie_id')
      .sort({ categorie_id: 1, ordre: 1, nom: 1 });
    res.json(sousCategories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Créer une sous-catégorie
router.post('/sous-categories', async (req, res) => {
  try {
    const sousCategorie = new SousCategorie(req.body);
    await sousCategorie.save();
    await sousCategorie.populate('categorie_id');
    res.status(201).json({ message: 'Sous-catégorie créée', sousCategorie });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Modifier une sous-catégorie
router.put('/sous-categories/:id', async (req, res) => {
  try {
    const sousCategorie = await SousCategorie.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('categorie_id');
    
    if (!sousCategorie) {
      return res.status(404).json({ message: 'Sous-catégorie non trouvée' });
    }
    
    res.json({ message: 'Sous-catégorie mise à jour', sousCategorie });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer une sous-catégorie
router.delete('/sous-categories/:id', async (req, res) => {
  try {
    // Vérifier s'il y a des annonces dans cette sous-catégorie
    const annonceCount = await Annonce.countDocuments({ sous_categorie_id: req.params.id });
    if (annonceCount > 0) {
      return res.status(400).json({ 
        message: `Impossible de supprimer cette sous-catégorie car elle contient ${annonceCount} annonce(s)` 
      });
    }

    const sousCategorie = await SousCategorie.findByIdAndDelete(req.params.id);
    if (!sousCategorie) {
      return res.status(404).json({ message: 'Sous-catégorie non trouvée' });
    }

    res.json({ message: 'Sous-catégorie supprimée' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// === STATISTIQUES ===

// Obtenir les statistiques du dashboard
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role_id: { $in: [1, 2, 3] } });
    const totalAnnonces = await Annonce.countDocuments();
    const activeAnnonces = await Annonce.countDocuments({ is_active: true });
    const totalCategories = await Categorie.countDocuments({ isActive: true }); // NOUVEAU
    const totalSousCategories = await SousCategorie.countDocuments({ isActive: true }); // NOUVEAU
    const totalViews = await Annonce.aggregate([
      { $group: { _id: null, total: { $sum: '$nombre_vues' } } }
    ]);

    res.json({
      totalUsers,
      totalAnnonces,
      activeAnnonces,
      totalCategories, // NOUVEAU
      totalSousCategories, // NOUVEAU
      totalViews: totalViews[0]?.total || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;