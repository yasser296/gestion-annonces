const express = require('express');
const authenticateToken = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');
const Annonce = require('../models/Annonce');
const Role = require('../models/Role');

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
  const { role_id } = req.body; // Maintenant on reçoit role_id au lieu de role
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

// Obtenir toutes les annonces (admin)
router.get('/annonces', async (req, res) => {
  try {
    const annonces = await Annonce.find()
      .populate('user_id', 'nom email')
      .populate('categorie_id')
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

// === STATISTIQUES ===

// Obtenir les statistiques du dashboard
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalAnnonces = await Annonce.countDocuments();
    const activeAnnonces = await Annonce.countDocuments({ is_active: true });
    const totalViews = await Annonce.aggregate([
      { $group: { _id: null, total: { $sum: '$nombre_vues' } } }
    ]);

    res.json({
      totalUsers,
      totalAnnonces,
      activeAnnonces,
      totalViews: totalViews[0]?.total || 0
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;