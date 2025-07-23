// backend/models/SousCategorie.js
const mongoose = require('mongoose');

const sousCategorieSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  icone: {
    type: String,
    default: '📁'
  },
  categorie_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categorie',
    required: true
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

// Index pour améliorer les performances
sousCategorieSchema.index({ nom: 1 });
sousCategorieSchema.index({ categorie_id: 1 });
sousCategorieSchema.index({ ordre: 1 });

module.exports = mongoose.model('SousCategorie', sousCategorieSchema);