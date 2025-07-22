// backend/models/Categorie.js
const mongoose = require('mongoose');

const sousCategorieSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  icone: String
});

const categorieSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  icone: {
    type: String,
    default: '📁'
  },
  sousCategories: [sousCategorieSchema],
  ordre: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
});

// Index pour améliorer les performances
categorieSchema.index({ nom: 1 });
categorieSchema.index({ ordre: 1 });

module.exports = mongoose.model('Categorie', categorieSchema);