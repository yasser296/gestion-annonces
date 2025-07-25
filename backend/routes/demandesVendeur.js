const express = require('express');
const authenticateToken = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const DemandeVendeur = require('../models/DemandeVendeur');
const User = require('../models/User');

const router = express.Router();

// === ROUTES UTILISATEUR ===

// Vérifier si l'utilisateur peut créer une annonce
router.get('/can-create-annonce', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(401).json({ 
        canCreate: false, 
        reason: 'unauthorized',
        message: 'Utilisateur non connecté ou introuvable' 
      });
    }

    // Vérifier si l'utilisateur est bloqué
    if (user.bloque_demande_vendeur) {
      return res.json({ 
        canCreate: false, 
        reason: 'bloque',
        message: 'Vous êtes actuellement bloqué pour créer des annonces'
      });
    }
    
    // Si l'utilisateur est vendeur (3) ou admin (1), il peut créer des annonces
    if (user.role_id === 3 || user.role_id === 1) {
      return res.json({ canCreate: true });
    }

    // Pour les utilisateurs simples (2), vérifier les demandes
    const demandeEnCours = await DemandeVendeur.findOne({
      user_id: req.user.id,
      statut: 'en_attente'
    });

    if (demandeEnCours) {
      return res.json({ 
        canCreate: false, 
        reason: 'demande_en_cours',
        message: 'Votre demande pour devenir vendeur est en cours de traitement'
      });
    }

    return res.json({ 
      canCreate: false, 
      reason: 'not_vendeur',
      message: 'Vous devez devenir vendeur pour déposer des annonces'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Créer une demande pour devenir vendeur
router.post('/demande', authenticateToken, async (req, res) => {
  try {
    const { message_demande } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    
    // Vérifier si l'utilisateur est déjà vendeur (3) ou admin (1)
    if (user.role_id === 3 || user.role_id === 1) {
      return res.status(400).json({ message: 'Vous êtes déjà vendeur' });
    }

    // Vérifier si l'utilisateur est bloqué
    if (user.bloque_demande_vendeur) {
      return res.status(403).json({ 
        message: "Vous n'êtes pas autorisé à faire des demandes pour devenir vendeur" 
      });
    }

    // Vérifier s'il y a déjà une demande en attente
    const demandeExistante = await DemandeVendeur.findOne({
      user_id: userId,
      statut: 'en_attente'
    });

    if (demandeExistante) {
      return res.status(400).json({ 
        message: 'Vous avez déjà une demande en cours de traitement' 
      });
    }

    // Créer la nouvelle demande (sans supprimer les anciennes)
    const nouvelleDemande = new DemandeVendeur({
      user_id: userId,
      message_demande
    });

    await nouvelleDemande.save();

    res.status(201).json({
      message: 'Votre demande a été envoyée avec succès',
      demande: nouvelleDemande
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir le statut de la demande de l'utilisateur (modifié)
router.get('/ma-demande', authenticateToken, async (req, res) => {
  try {
    // Récupérer la dernière demande de l'utilisateur
    const demande = await DemandeVendeur.findOne({
      user_id: req.user.id
    }).sort({ date_demande: -1 });

    // Si l'utilisateur est déjà vendeur, ne pas afficher les anciennes demandes
    const user = await User.findById(req.user.id);
    if (user.role === 'vendeur' || user.role === 'admin') {
      return res.json(null);
    }

    res.json(demande);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Nouvelle route pour obtenir l'historique complet des demandes
router.get('/mon-historique', authenticateToken, async (req, res) => {
  try {
    const demandes = await DemandeVendeur.find({
      user_id: req.user.id
    }).sort({ date_demande: -1 });

    res.json(demandes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// === ROUTES ADMIN ===

// Obtenir toutes les demandes (admin)
router.get('/admin/toutes', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { statut } = req.query;
    const filter = {};
    
    if (statut) {
      filter.statut = statut;
    }

    const demandes = await DemandeVendeur.find(filter)
      .populate('user_id', 'nom email telephone')
      .populate('traite_par', 'nom')
      .sort({ date_demande: -1 });

    res.json(demandes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Traiter une demande (accepter/refuser)
router.put('/admin/:id/traiter', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { statut, message_admin } = req.body;

    if (!['acceptee', 'refusee'].includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    const demande = await DemandeVendeur.findById(id);
    if (!demande) {
      return res.status(404).json({ message: 'Demande non trouvée' });
    }

    if (demande.statut !== 'en_attente') {
      return res.status(400).json({ message: 'Cette demande a déjà été traitée' });
    }

    // Mettre à jour la demande
    demande.statut = statut;
    demande.message_admin = message_admin;
    demande.date_traitement = new Date();
    demande.traite_par = req.user.id;
    await demande.save();

    // Si acceptée, mettre à jour le rôle de l'utilisateur
    if (statut === 'acceptee') {
      await User.findByIdAndUpdate(demande.user_id, {
        role_id: 3 // Rôle vendeur
      });
    }

    res.json({
      message: `Demande ${statut === 'acceptee' ? 'acceptée' : 'refusée'} avec succès`,
      demande
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Bloquer/débloquer un utilisateur pour les demandes vendeur
router.patch('/admin/user/:userId/bloquer', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { bloquer } = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { bloque_demande_vendeur: bloquer },
      { new: true }
    ).select('-mot_de_passe');

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({
      message: `Utilisateur ${bloquer ? 'bloqué' : 'débloqué'} pour les demandes vendeur`,
      user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;