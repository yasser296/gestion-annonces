// backend/routes/attributes.js
const express = require('express');
const authenticateToken = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');
const Attribute = require('../models/Attribute');
const AnnonceAttributeValue = require('../models/AnnonceAttributeValue');
const Categorie = require('../models/Categorie');

const router = express.Router();

// === ROUTES PUBLIQUES ===

// Obtenir tous les attributs d'une catégorie
router.get('/by-category/:categoryId', async (req, res) => {
  try {
    const attributes = await Attribute.find({
      categorie_id: req.params.categoryId,
      isActive: true
    }).sort({ ordre: 1, nom: 1 });
    
    res.json(attributes);
  } catch (error) {
    console.error('Erreur lors du chargement des attributs:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Obtenir les valeurs d'attributs d'une annonce
router.get('/values/:annonceId', async (req, res) => {
  try {
    const values = await AnnonceAttributeValue.find({
      annonce_id: req.params.annonceId
    }).populate('attribute_id');
    
    // Transformer en objet plus facile à utiliser
    const attributesWithValues = values.reduce((acc, item) => {
      if (item.attribute_id) {
        acc[item.attribute_id._id] = {
          attribute: item.attribute_id,
          value: item.value
        };
      }
      return acc;
    }, {});
    
    res.json(attributesWithValues);
  } catch (error) {
    console.error('Erreur lors du chargement des valeurs:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// === ROUTES PROTÉGÉES (UTILISATEURS) ===

// Sauvegarder les valeurs d'attributs pour une annonce
router.post('/values/:annonceId', authenticateToken, async (req, res) => {
  try {
    const { attributes } = req.body; // { attributeId: value, attributeId2: value2, ... }
    const annonceId = req.params.annonceId;
    
    // Vérifier que l'utilisateur est propriétaire de l'annonce ou admin
    const Annonce = require('../models/Annonce');
    const User = require('../models/User');
    
    const annonce = await Annonce.findById(annonceId);
    const user = await User.findById(req.user.id);
    
    if (!annonce) {
      return res.status(404).json({ message: 'Annonce non trouvée' });
    }
    
    if (annonce.user_id.toString() !== user._id.toString() && user.role_id !== 1) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    
    // Supprimer les anciennes valeurs
    await AnnonceAttributeValue.deleteMany({ annonce_id: annonceId });
    
    // Sauvegarder les nouvelles valeurs
    const valuesToSave = [];
    for (const [attributeId, value] of Object.entries(attributes)) {
      if (value !== null && value !== undefined && value !== '') {
        // Vérifier que l'attribut existe
        const attribute = await Attribute.findById(attributeId);
        if (attribute) {
          // Valider et convertir la valeur selon le type
          let processedValue = value;
          
          if (attribute.type === 'number') {
            processedValue = parseFloat(value);
            if (isNaN(processedValue)) {
              return res.status(400).json({ 
                message: `Valeur invalide pour l'attribut ${attribute.nom}: doit être un nombre` 
              });
            }
          } else if (attribute.type === 'boolean') {
            processedValue = value === true || value === 'true' || value === '1';
          } else if (attribute.type === 'select') {
            if (!attribute.options.includes(value)) {
              return res.status(400).json({ 
                message: `Valeur invalide pour l'attribut ${attribute.nom}: doit être une des options disponibles` 
              });
            }
          }
          
          // Vérifier les champs requis
          if (attribute.required && (processedValue === null || processedValue === undefined || processedValue === '')) {
            return res.status(400).json({ 
              message: `L'attribut ${attribute.nom} est requis` 
            });
          }
          
          valuesToSave.push({
            annonce_id: annonceId,
            attribute_id: attributeId,
            value: processedValue
          });
        }
      }
    }
    
    if (valuesToSave.length > 0) {
      await AnnonceAttributeValue.insertMany(valuesToSave);
    }
    
    res.json({ message: 'Attributs sauvegardés avec succès' });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde des attributs:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// === ROUTES ADMIN ===

// Obtenir tous les attributs (admin)
router.get('/admin/all', authenticateToken, adminAuth, async (req, res) => {
  try {
    const attributes = await Attribute.find()
      .populate('categorie_id', 'nom icone')
      .sort({ categorie_id: 1, ordre: 1, nom: 1 });
    
    res.json(attributes);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Créer un attribut (admin)
router.post('/admin', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { nom, categorie_id, type, options, required, ordre, placeholder, description } = req.body;
    
    // Vérifier que la catégorie existe
    const categorie = await Categorie.findById(categorie_id);
    if (!categorie) {
      return res.status(404).json({ message: 'Catégorie non trouvée' });
    }
    
    const attribute = new Attribute({
      nom,
      categorie_id,
      type,
      options: type === 'select' ? options : undefined,
      required: required || false,
      ordre: ordre || 0,
      placeholder,
      description
    });
    
    await attribute.save();
    await attribute.populate('categorie_id', 'nom icone');
    
    res.status(201).json({ message: 'Attribut créé avec succès', attribute });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Modifier un attribut (admin)
router.put('/admin/:id', authenticateToken, adminAuth, async (req, res) => {
  try {
    const { nom, type, options, required, ordre, placeholder, description, isActive } = req.body;
    
    const attribute = await Attribute.findByIdAndUpdate(
      req.params.id,
      {
        nom,
        type,
        options: type === 'select' ? options : undefined,
        required: required || false,
        ordre: ordre || 0,
        placeholder,
        description,
        isActive: isActive !== undefined ? isActive : true
      },
      { new: true }
    ).populate('categorie_id', 'nom icone');
    
    if (!attribute) {
      return res.status(404).json({ message: 'Attribut non trouvé' });
    }
    
    res.json({ message: 'Attribut mis à jour avec succès', attribute });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Supprimer un attribut (admin)
router.delete('/admin/:id', authenticateToken, adminAuth, async (req, res) => {
  try {
    // Supprimer toutes les valeurs associées
    await AnnonceAttributeValue.deleteMany({ attribute_id: req.params.id });
    
    // Supprimer l'attribut
    const attribute = await Attribute.findByIdAndDelete(req.params.id);
    
    if (!attribute) {
      return res.status(404).json({ message: 'Attribut non trouvé' });
    }
    
    res.json({ message: 'Attribut supprimé avec succès' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;