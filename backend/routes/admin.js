// backend/routes/admin.js - Version complète avec création d'utilisateur
const express = require('express');
const bcrypt = require('bcryptjs'); // NOUVEAU: pour hasher les mots de passe
const authenticateToken = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const User = require('../models/User');
const Annonce = require('../models/Annonce');
const Categorie = require('../models/Categorie');
const SousCategorie = require('../models/SousCategorie');
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

// NOUVEAU: Créer un utilisateur (admin)
router.post('/users', async (req, res) => {
  const { nom, email, telephone, mot_de_passe, role_id } = req.body;

  try {
    // Vérifications de base
    if (!nom || !email || !mot_de_passe) {
      return res.status(400).json({ 
        message: 'Nom, email et mot de passe sont requis' 
      });
    }

    // Vérifier que l'email n'existe pas déjà
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'Un utilisateur avec cet email existe déjà' 
      });
    }

    // Valider le rôle
    const validRoleIds = [1, 2, 3]; // admin, user, vendeur
    const userRoleId = role_id || 2; // Par défaut: utilisateur normal
    
    if (!validRoleIds.includes(userRoleId)) {
      return res.status(400).json({ 
        message: 'ID de rôle invalide' 
      });
    }

    // Valider l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        message: 'Format d\'email invalide' 
      });
    }

    // Valider le mot de passe (minimum 6 caractères)
    if (mot_de_passe.length < 6) {
      return res.status(400).json({ 
        message: 'Le mot de passe doit contenir au moins 6 caractères' 
      });
    }

    // Hasher le mot de passe
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(mot_de_passe, saltRounds);

    // Créer l'utilisateur
    const newUser = new User({
      nom: nom.trim(),
      email: email.toLowerCase().trim(),
      telephone: telephone?.trim() || '',
      mot_de_passe: hashedPassword,
      role_id: userRoleId,
      date_inscription: new Date(),
      is_active: true
    });

    await newUser.save();

    // Retourner l'utilisateur créé sans le mot de passe
    const userResponse = {
      _id: newUser._id,
      nom: newUser.nom,
      email: newUser.email,
      telephone: newUser.telephone,
      role_id: newUser.role_id,
      date_inscription: newUser.date_inscription,
      is_active: newUser.is_active,
      nombre_annonces: 0 // Nouvel utilisateur = 0 annonces
    };

    res.status(201).json({ 
      message: 'Utilisateur créé avec succès', 
      user: userResponse 
    });

  } catch (error) {
    console.error('Erreur lors de la création de l\'utilisateur:', error);
    
    // Gestion des erreurs de validation MongoDB
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Un utilisateur avec cet email existe déjà' 
      });
    }
    
    res.status(500).json({ message: 'Erreur serveur lors de la création' });
  }
});

// NOUVEAU: Générer un mot de passe aléatoire (utilitaire pour l'admin)
router.get('/generate-password', (req, res) => {
  const generatePassword = (length = 10) => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  res.json({ 
    password: generatePassword(),
    message: 'Mot de passe généré automatiquement' 
  });
});

// Modifier un utilisateur
router.put('/users/:id', async (req, res) => {
  const { nom, email, telephone } = req.body;

  try {
    // Vérifier que l'email n'est pas déjà utilisé par un autre utilisateur
    if (email) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase().trim(),
        _id: { $ne: req.params.id }
      });
      
      if (existingUser) {
        return res.status(400).json({ 
          message: 'Un autre utilisateur utilise déjà cet email' 
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { 
        nom: nom?.trim(), 
        email: email?.toLowerCase().trim(), 
        telephone: telephone?.trim() 
      },
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

    // Obtenir le titre du rôle
    const roleMap = { 1: 'admin', 2: 'user', 3: 'vendeur' };
    
    res.json({ 
      message: 'Rôle mis à jour', 
      user: {
        ...user.toObject(),
        role: {
          id: role_id,
          titre: roleMap[role_id]
        }
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

    // Empêcher la suppression d'un admin si c'est le dernier
    if (user.role_id === 1) {
      const adminCount = await User.countDocuments({ role_id: 1 });
      if (adminCount <= 1) {
        return res.status(403).json({ message: 'Impossible de supprimer le dernier administrateur' });
      }
    }

    // Récupérer toutes les annonces de l'utilisateur
    const userAnnonces = await Annonce.find({ user_id: req.params.id });
    const annonceIds = userAnnonces.map(a => a._id);

    // Supprimer toutes les entrées wishlist pour ces annonces
    if (annonceIds.length > 0) {
      await Wishlist.deleteMany({ annonce_id: { $in: annonceIds } });
    }

    // Supprimer toutes les wishlists de l'utilisateur
    await Wishlist.deleteMany({ user_id: req.params.id });

    // Supprimer toutes les annonces de l'utilisateur
    await Annonce.deleteMany({ user_id: req.params.id });

    // Supprimer l'utilisateur
    await User.findByIdAndDelete(req.params.id);

    res.json({ 
      message: 'Utilisateur et ses données supprimés',
      deleted: {
        user: user.nom,
        annonces: userAnnonces.length
      }
    });
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
      .populate('sous_categorie_id')
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
    // Supprimer les entrées wishlist pour cette annonce
    await Wishlist.deleteMany({ annonce_id: req.params.id });
    
    // Supprimer l'annonce
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

// === GESTION DES CATÉGORIES ===

// Obtenir toutes les catégories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Categorie.find().sort({ ordre: 1, nom: 1 });
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

// === STATISTIQUES ===

// Ajouts à backend/routes/admin.js - Nouvelles routes pour le dashboard

// === NOUVELLES ROUTES POUR LE DASHBOARD ===

// Obtenir les statistiques avancées
router.get('/stats', async (req, res) => {
  try {
    const [
      totalUsers,
      totalAnnonces,
      totalCategories,
      totalViews,
      recentUsers,
      activeAnnonces,
      totalAttributes
    ] = await Promise.all([
      User.countDocuments(),
      Annonce.countDocuments(),
      Categorie.countDocuments(),
      Annonce.aggregate([
        { $group: { _id: null, total: { $sum: "$nombre_vues" } } }
      ]),
      User.countDocuments({
        date_inscription: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 derniers jours
        }
      }),
      Annonce.countDocuments({ is_active: true }),
      require('../models/Attribute').countDocuments({ isActive: true })
    ]);

    res.json({
      totalUsers,
      totalAnnonces,
      totalCategories,
      totalViews: totalViews[0]?.total || 0,
      recentUsers,
      activeAnnonces,
      totalAttributes
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir l'activité récente
router.get('/recent-activity', async (req, res) => {
  try {
    // Récupérer les utilisateurs récents (dernières 24h)
    const recentUsers = await User.find({
      date_inscription: {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    })
    .select('nom date_inscription')
    .sort({ date_inscription: -1 })
    .limit(5);

    // Récupérer les annonces récentes (dernières 24h)
    const recentAnnonces = await Annonce.find({
      date_publication: {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
      }
    })
    .populate('user_id', 'nom')
    .select('titre user_id date_publication')
    .sort({ date_publication: -1 })
    .limit(5);

    // Récupérer les annonces les plus vues (dernières 24h)
    const topViewedAnnonces = await Annonce.find({
      date_publication: {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
      },
      nombre_vues: { $gt: 0 }
    })
    .select('titre nombre_vues')
    .sort({ nombre_vues: -1 })
    .limit(3);

    // Combiner et formater les activités
    const activities = [];

    // Ajouter les nouveaux utilisateurs
    recentUsers.forEach(user => {
      activities.push({
        type: 'user_registered',
        description: 'Nouvel utilisateur inscrit',
        user: user.nom,
        time: formatTimeAgo(user.date_inscription),
        timestamp: user.date_inscription
      });
    });

    // Ajouter les nouvelles annonces
    recentAnnonces.forEach(annonce => {
      activities.push({
        type: 'annonce_created',
        description: 'Nouvelle annonce publiée',
        user: annonce.user_id?.nom || 'Utilisateur inconnu',
        time: formatTimeAgo(annonce.date_publication),
        timestamp: annonce.date_publication
      });
    });

    // Ajouter les annonces populaires
    topViewedAnnonces.forEach(annonce => {
      activities.push({
        type: 'annonce_viewed',
        description: `Annonce "${annonce.titre}" consultée ${annonce.nombre_vues} fois`,
        time: 'Aujourd\'hui',
        timestamp: new Date()
      });
    });

    // Trier par timestamp et prendre les 10 plus récents
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);

    res.json(sortedActivities);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir le top des catégories
router.get('/top-categories', async (req, res) => {
  try {
    const topCategories = await Annonce.aggregate([
      {
        $group: {
          _id: '$categorie_id',
          count: { $sum: 1 },
          totalViews: { $sum: '$nombre_vues' }
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      {
        $unwind: '$category'
      },
      {
        $project: {
          nom: '$category.nom',
          icone: '$category.icone',
          count: 1,
          totalViews: 1
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 6
      }
    ]);

    res.json(topCategories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir les statistiques de croissance des utilisateurs
router.get('/user-growth', async (req, res) => {
  try {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date;
    }).reverse();

    const growthData = await Promise.all(
      last30Days.map(async (date) => {
        const startOfDay = new Date(date.setHours(0, 0, 0, 0));
        const endOfDay = new Date(date.setHours(23, 59, 59, 999));
        
        const count = await User.countDocuments({
          date_inscription: {
            $gte: startOfDay,
            $lte: endOfDay
          }
        });

        return {
          date: startOfDay.toISOString().split('T')[0],
          count
        };
      })
    );

    res.json(growthData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir les statistiques par ville
router.get('/stats-by-city', async (req, res) => {
  try {
    const cityStats = await Annonce.aggregate([
      {
        $group: {
          _id: '$ville',
          count: { $sum: 1 },
          totalViews: { $sum: '$nombre_vues' }
        }
      },
      {
        $match: {
          _id: { $ne: null, $ne: '' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          ville: '$_id',
          count: 1,
          totalViews: 1,
          _id: 0
        }
      }
    ]);

    res.json(cityStats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir un rapport complet (pour export)
router.get('/full-report', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.date_publication = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const [
      userStats,
      annonceStats,
      categoryBreakdown,
      cityBreakdown
    ] = await Promise.all([
      User.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            admins: {
              $sum: { $cond: [{ $eq: ['$role_id', 1] }, 1, 0] }
            },
            vendeurs: {
              $sum: { $cond: [{ $eq: ['$role_id', 3] }, 1, 0] }
            },
            users: {
              $sum: { $cond: [{ $eq: ['$role_id', 2] }, 1, 0] }
            }
          }
        }
      ]),
      
      Annonce.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: {
              $sum: { $cond: ['$is_active', 1, 0] }
            },
            totalViews: { $sum: '$nombre_vues' },
            avgPrice: { $avg: '$prix' }
          }
        }
      ]),
      
      Annonce.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$categorie_id',
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'category'
          }
        },
        {
          $unwind: '$category'
        },
        {
          $project: {
            categoryName: '$category.nom',
            count: 1
          }
        }
      ]),
      
      Annonce.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$ville',
            count: { $sum: 1 }
          }
        },
        {
          $match: {
            _id: { $ne: null, $ne: '' }
          }
        },
        {
          $sort: { count: -1 }
        }
      ])
    ]);

    const report = {
      generatedAt: new Date().toISOString(),
      period: { startDate, endDate },
      summary: {
        users: userStats[0] || { total: 0, admins: 0, vendeurs: 0, users: 0 },
        annonces: annonceStats[0] || { total: 0, active: 0, totalViews: 0, avgPrice: 0 }
      },
      breakdown: {
        categories: categoryBreakdown,
        cities: cityBreakdown
      }
    };

    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Fonction utilitaire pour formater le temps
function formatTimeAgo(date) {
  const now = new Date();
  const diffInMs = now - new Date(date);
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMins < 1) return 'À l\'instant';
  if (diffInMins < 60) return `Il y a ${diffInMins} min`;
  if (diffInHours < 24) return `Il y a ${diffInHours}h`;
  if (diffInDays < 7) return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
  
  return new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short'
  });
}

module.exports = router;