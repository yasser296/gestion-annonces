// backend/models/Attribute.js
const mongoose = require('mongoose');

const attributeSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    trim: true
  },
  categorie_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Categorie',
    required: true
  },
  type: {
    type: String,
    enum: ['string', 'number', 'boolean', 'select'],
    default: 'string'
  },
  options: [{
    type: String,
    trim: true
  }], // Pour les champs de type 'select' (dropdown)
  required: {
    type: Boolean,
    default: false
  },
  ordre: {
    type: Number,
    default: 0
  },
  placeholder: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
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
attributeSchema.index({ categorie_id: 1, ordre: 1 });
attributeSchema.index({ nom: 1, categorie_id: 1 });

// Validation: options requis pour le type 'select'
attributeSchema.pre('save', function(next) {
  if (this.type === 'select' && (!this.options || this.options.length === 0)) {
    return next(new Error('Les options sont requises pour les attributs de type select'));
  }
  next();
});

module.exports = mongoose.model('Attribute', attributeSchema);