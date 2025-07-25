const express = require('express');
const authenticateToken = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const Annonce = require('../models/Annonce');
const User = require('../models/User');
const Wishlist = require('../models/Wishlist');
const SousCategorie = require('../models/SousCategorie');



const router = express.Router();

// Multer pour upload d'images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

const filterAnnoncesByAttributes = async (baseFilters, attributeFilters) => {
  if (Object.keys(attributeFilters).length === 0) {
    // Pas de filtres d'attributs, utiliser la requête normale
    return await Annonce.find(baseFilters)
      .populate('categorie_id')
      .populate('sous_categorie_id')
      .populate('user_id')
      .sort({ date_publication: -1 });
  }

  // Pipeline d'agrégation pour filtrer par attributs
  const pipeline = [
    // Étape 1: Filtrer les annonces selon les critères de base
    { $match: baseFilters },

    // Étape 2: Joindre avec les valeurs d'attributs
    {
      $lookup: {
        from: 'annonceattributevalues',
        localField: '_id',
        foreignField: 'annonce_id',
        as: 'attributeValues'
      }
    },

    // Étape 3: Ajouter un champ pour faciliter le filtrage
    {
      $addFields: {
        attributeMap: {
          $arrayToObject: {
            $map: {
              input: '$attributeValues',
              as: 'attr',
              in: {
                k: { $toString: '$$attr.attribute_id' },
                v: '$$attr.value'
              }
            }
          }
        }
      }
    }
  ];

  // Étape 4: Ajouter les conditions de filtrage par attributs
  const attributeConditions = [];
  
  for (const [attributeId, filterValue] of Object.entries(attributeFilters)) {
    const attributeFieldPath = `attributeMap.${attributeId}`;
    
    // Récupérer le type d'attribut pour appliquer le bon filtre
    const Attribute = require('../models/Attribute');
    const attribute = await Attribute.findById(attributeId);
    
    if (!attribute) continue;
    
    let condition;
    
    switch (attribute.type) {
      case 'string':
      case 'select':
        condition = {
          [attributeFieldPath]: {
            $regex: filterValue,
            $options: 'i'
          }
        };
        break;
        
      case 'number':
        const numValue = parseFloat(filterValue);
        if (!isNaN(numValue)) {
          condition = {
            [attributeFieldPath]: numValue
          };
        }
        break;
        
      case 'boolean':
        condition = {
          [attributeFieldPath]: filterValue === 'true'
        };
        break;
        
      case 'date':
        condition = {
          [attributeFieldPath]: {
            $gte: new Date(filterValue),
            $lt: new Date(new Date(filterValue).getTime() + 24 * 60 * 60 * 1000)
          }
        };
        break;
        
      default:
        condition = {
          [attributeFieldPath]: {
            $regex: filterValue,
            $options: 'i'
          }
        };
    }
    
    if (condition) {
      attributeConditions.push(condition);
    }
  }
  
  if (attributeConditions.length > 0) {
    pipeline.push({
      $match: {
        $and: attributeConditions
      }
    });
  }

  // Étape 5: Nettoyer et populer
  pipeline.push(
    // Supprimer les champs temporaires
    {
      $unset: ['attributeValues', 'attributeMap']
    },
    
    // Lookups pour populer
    {
      $lookup: {
        from: 'categories',
        localField: 'categorie_id',
        foreignField: '_id',
        as: 'categorie_id'
      }
    },
    {
      $lookup: {
        from: 'souscategories',
        localField: 'sous_categorie_id',
        foreignField: '_id',
        as: 'sous_categorie_id'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user_id',
        foreignField: '_id',
        as: 'user_id'
      }
    },
    
    // Dé-nester les résultats
    {
      $addFields: {
        categorie_id: { $arrayElemAt: ['$categorie_id', 0] },
        sous_categorie_id: { $arrayElemAt: ['$sous_categorie_id', 0] },
        user_id: { $arrayElemAt: ['$user_id', 0] }
      }
    },
    
    // Trier
    { $sort: { date_publication: -1 } }
  );

  return await Annonce.aggregate(pipeline);
};

// Obtenir annonces avec filtres
router.get('/', async (req, res) => {
  const filters = { is_active: req.query.show_inactive === 'true' ? { $in: [true, false] } : true };
  
  // Filtres de base existants
  if (req.query.categorie) filters.categorie_id = req.query.categorie;
  if (req.query.sous_categorie) filters.sous_categorie_id = req.query.sous_categorie;
  if (req.query.ville) filters.ville = new RegExp(req.query.ville, 'i');
  if (req.query.min_prix) filters.prix = { ...filters.prix, $gte: req.query.min_prix };
  if (req.query.max_prix) filters.prix = { ...filters.prix, $lte: req.query.max_prix };
  if (req.query.etat) filters.etat = req.query.etat;
  if (req.query.marque) filters.marque = new RegExp(req.query.marque, 'i');
  
  if (req.query.recherche) {
    filters.$or = [
      { titre: new RegExp(req.query.recherche, 'i') },
      { description: new RegExp(req.query.recherche, 'i') }
    ];
  }

  // Extraire les filtres d'attributs
  const attributeFilters = {};
  Object.keys(req.query).forEach(key => {
    if (key.startsWith('attr_')) {
      const attributeId = key.replace('attr_', '');
      attributeFilters[attributeId] = req.query[key];
    }
  });

  try {
    let annonces;
    
    if (Object.keys(attributeFilters).length > 0) {
      // Utiliser la fonction de filtrage par attributs
      annonces = await filterAnnoncesByAttributes(filters, attributeFilters);
    } else {
      // Requête normale sans filtres d'attributs
      annonces = await Annonce.find(filters)
        .populate('categorie_id')
        .populate('sous_categorie_id')
        .populate('user_id')
        .sort({ date_publication: -1 });
    }

    // Appliquer le tri si spécifié
    if (req.query.tri && req.query.tri !== 'date_desc') {
      switch (req.query.tri) {
        case 'date_asc':
          annonces.sort((a, b) => new Date(a.date_publication) - new Date(b.date_publication));
          break;
        case 'prix_asc':
          annonces.sort((a, b) => (a.prix || 0) - (b.prix || 0));
          break;
        case 'prix_desc':
          annonces.sort((a, b) => (b.prix || 0) - (a.prix || 0));
          break;
        case 'titre_asc':
          annonces.sort((a, b) => (a.titre || '').localeCompare(b.titre || ''));
          break;
        case 'titre_desc':
          annonces.sort((a, b) => (b.titre || '').localeCompare(a.titre || ''));
          break;
      }
    }

    res.json(annonces);
  } catch (error) {
    console.error('Erreur lors du filtrage des annonces:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Nouvelle route pour obtenir des suggestions de valeurs d'attributs
router.get('/attribute-values/:categoryId/:attributeId', async (req, res) => {
  try {
    const { categoryId, attributeId } = req.params;
    
    // Vérifier que l'attribut appartient à la catégorie
    const Attribute = require('../models/Attribute');
    const attribute = await Attribute.findOne({
      _id: attributeId,
      categorie_id: categoryId,
      isActive: true
    });
    
    if (!attribute) {
      return res.status(404).json({ message: 'Attribut non trouvé' });
    }
    
    // Pour les attributs de type select, retourner les options
    if (attribute.type === 'select' && attribute.options) {
      return res.json(attribute.options);
    }
    
    // Pour les autres types, récupérer les valeurs uniques existantes
    const AnnonceAttributeValue = require('../models/AnnonceAttributeValue');
    
    const pipeline = [
      // Joindre avec les annonces pour filtrer par catégorie
      {
        $lookup: {
          from: 'annonces',
          localField: 'annonce_id',
          foreignField: '_id',
          as: 'annonce'
        }
      },
      {
        $unwind: '$annonce'
      },
      {
        $match: {
          'attribute_id': new mongoose.Types.ObjectId(attributeId),
          'annonce.categorie_id': new mongoose.Types.ObjectId(categoryId),
          'annonce.is_active': true
        }
      },
      // Grouper par valeur unique
      {
        $group: {
          _id: '$value',
          count: { $sum: 1 }
        }
      },
      // Trier par fréquence
      {
        $sort: { count: -1 }
      },
      // Limiter à 50 suggestions max
      {
        $limit: 50
      },
      // Reformater la sortie
      {
        $project: {
          _id: 0,
          value: '$_id',
          count: 1
        }
      }
    ];
    
    const suggestions = await AnnonceAttributeValue.aggregate(pipeline);
    const values = suggestions.map(s => s.value).filter(v => v !== null && v !== '');
    
    res.json(values);
  } catch (error) {
    console.error('Erreur lors de la récupération des suggestions:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir annonce par ID - FONCTION MISE À JOUR
router.get('/:id', async (req, res) => {
  try {
    const annonce = await Annonce.findById(req.params.id)
      .populate('categorie_id')
      .populate('sous_categorie_id')
      .populate('user_id');

    if (!annonce) return res.status(404).json({ message: 'Annonce non trouvée' });

    res.json(annonce);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Incrémenter les vues d'une annonce
router.patch('/:id/vues', authenticateToken, async (req, res) => {
  try {
    const annonce = await Annonce.findById(req.params.id);

    if (!annonce) {
      return res.status(404).json({ message: 'Annonce non trouvée' });
    }

    // Si utilisateur connecté ET c'est le propriétaire
    if (req.user && (
        String(annonce.user_id) === String(req.user.id) ||
        req.user.role === 'admin' || req.user.role_id === 1 // selon ta structure
      )) {
      return res.json({
        message: "Vous êtes le propriétaire, la vue n'est pas comptabilisée",
        nombre_vues: annonce.nombre_vues,
      });
    }

    // Sinon, incrémente
    annonce.nombre_vues = (annonce.nombre_vues || 0) + 1;
    await annonce.save();

    res.json({
      message: 'Nombre de vues incrémenté',
      nombre_vues: annonce.nombre_vues,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


// Créer une nouvelle annonce (authentification requise)
router.post('/', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    const images = req.files ? req.files.map(f => `/uploads/${f.filename}`) : [];
    
    // Créer l'objet annonce avec les nouveaux champs
    const annonceData = {
      ...req.body,
      user_id: req.user.id,
      images
    };

    // Si sous_categorie_id est vide, le supprimer
    if (!annonceData.sous_categorie_id || annonceData.sous_categorie_id === '') {
      delete annonceData.sous_categorie_id;
    }

    const annonce = new Annonce(annonceData);
    await annonce.save();
    
    res.status(201).json({ message: 'Annonce créée', annonce });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir les annonces d'un utilisateur
router.get('/user/mes-annonces', authenticateToken, async (req, res) => {
  try {
    const annonces = await Annonce.find({ user_id: req.user.id })
      .populate('categorie_id')
      .populate('sous_categorie_id')
      .sort({ date_publication: -1 });

    res.json(annonces);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// annonces.js

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // Récupérer l'utilisateur connecté
    const user = await User.findById(req.user.id);

    // Récupérer l'annonce à supprimer
    const annonce = await Annonce.findById(req.params.id);

    if (!annonce) {
      return res.status(404).json({ message: 'Annonce inexistante' });
    }

    // Autoriser la suppression si :
    // - L'utilisateur est l'auteur de l'annonce
    // - OU l'utilisateur est admin (role_id === 1)
    if (
      annonce.user_id.toString() === user._id.toString() ||
      user.role_id === 1
    ) {
      await Wishlist.deleteMany({ annonce_id: req.params.id });
      await annonce.deleteOne();
      return res.json({ message: 'Annonce supprimée avec succès' });
    } else {
      return res.status(403).json({ message: 'Accès refusé' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


router.put('/:id', authenticateToken, upload.array('images', 5), async (req, res) => {
  const { titre, description, prix, ville, marque, etat, categorie_id, sous_categorie_id, existingImages } = req.body;

  try {
    const user = await User.findById(req.user.id);
    const annonce = await Annonce.findById(req.params.id);

    if (!annonce) {
      return res.status(404).json({ message: 'Annonce non trouvée' });
    }

    // Autoriser la modification si propriétaire ou admin
    if (
      annonce.user_id.toString() === user._id.toString() ||
      user.role_id === 1
    ) {
      let finalImages = [];

      if (existingImages) {
        finalImages = JSON.parse(existingImages);
      }

      if (req.files && req.files.length > 0) {
        const newImages = req.files.map(file => `/uploads/${file.filename}`);
        finalImages = finalImages.concat(newImages);
      }

      // Mettre à jour les champs
      annonce.titre = titre;
      annonce.description = description;
      annonce.prix = prix;
      annonce.ville = ville;
      annonce.marque = marque;
      annonce.etat = etat;
      annonce.categorie_id = categorie_id;
      annonce.images = finalImages;
      
      // Gérer sous_categorie_id (peut être vide)
      if (sous_categorie_id && sous_categorie_id !== '') {
        annonce.sous_categorie_id = sous_categorie_id;
      } else {
        annonce.sous_categorie_id = undefined; // Supprimer le champ s'il est vide
      }

      await annonce.save();

      return res.json({ message: 'Annonce mise à jour avec succès', annonce });
    } else {
      return res.status(403).json({ message: 'Accès refusé' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});


router.get('/user/:userId', async (req, res) => {
  try {
    const annonces = await Annonce.find({ user_id: req.params.userId, is_active: true })
      .populate('categorie_id')
      .populate('sous_categorie_id')
      .sort({ date_publication: -1 });

    res.json(annonces);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Activer/Désactiver une annonce
router.patch('/:id/toggle-status', authenticateToken, async (req, res) => {
  try {
    const annonce = await Annonce.findOne({ _id: req.params.id, user_id: req.user.id });
    if (!annonce) return res.status(403).json({ message: '' });

    annonce.is_active = !annonce.is_active;
    await annonce.save();
    res.json({ message: 'Statut mis à jour', is_active: annonce.is_active });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});



module.exports = router;