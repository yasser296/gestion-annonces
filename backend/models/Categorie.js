// backend/models/Categorie.js
const mongoose = require('mongoose');

const categorieSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  icone: {
    type: String,
    default: '📁'
  },
  ordre: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Méthode virtuelle pour récupérer les sous-catégories
categorieSchema.virtual('sousCategories', {
  ref: 'SousCategorie',
  localField: '_id',
  foreignField: 'categorie_id'
});

// Activer les virtuals dans toJSON
categorieSchema.set('toJSON', { virtuals: true });
categorieSchema.set('toObject', { virtuals: true });

// Index pour améliorer les performances
categorieSchema.index({ nom: 1 });
categorieSchema.index({ ordre: 1 });

module.exports = mongoose.model('Categorie', categorieSchema);