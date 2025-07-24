// backend/models/AnnonceAttributeValue.js
const mongoose = require('mongoose');

const annonceAttributeValueSchema = new mongoose.Schema({
  annonce_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Annonce',
    required: true
  },
  attribute_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attribute',
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed, // Peut être string, number, boolean
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index unique pour éviter les doublons
annonceAttributeValueSchema.index({ annonce_id: 1, attribute_id: 1 }, { unique: true });

// Index pour les requêtes
annonceAttributeValueSchema.index({ annonce_id: 1 });
annonceAttributeValueSchema.index({ attribute_id: 1 });

// Middleware pour mettre à jour updatedAt
annonceAttributeValueSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Middleware pour supprimer les valeurs quand une annonce est supprimée
annonceAttributeValueSchema.pre('deleteOne', { document: false, query: true }, async function() {
  // Cette fonction sera appelée depuis le modèle Annonce
});

module.exports = mongoose.model('AnnonceAttributeValue', annonceAttributeValueSchema);