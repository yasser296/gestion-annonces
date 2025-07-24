// backend/models/Attribute.js - Version mise à jour
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
    required: true,
    enum: ['string', 'number', 'boolean', 'select', 'date'], // AJOUT du type 'date'
    default: 'string'
  },
  options: [{
    type: String,
    trim: true
  }], // Pour les attributs de type 'select'
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
  // NOUVEAU: Validation spécifique pour les dates
  dateFormat: {
    type: String,
    enum: ['date', 'datetime-local', 'month', 'year'],
    default: 'date' // Format par défaut pour les dates
  },
  // NOUVEAU: Contraintes de dates
  minDate: {
    type: Date
  },
  maxDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Index pour améliorer les performances
attributeSchema.index({ categorie_id: 1, ordre: 1 });
attributeSchema.index({ categorie_id: 1, nom: 1 }, { unique: true });
attributeSchema.index({ isActive: 1 });

// Méthode pour valider une valeur selon le type d'attribut
attributeSchema.methods.validateValue = function(value) {
  if (!this.required && (value === null || value === undefined || value === '')) {
    return { isValid: true };
  }

  switch (this.type) {
    case 'string':
      if (typeof value !== 'string') {
        return { isValid: false, error: 'Doit être un texte' };
      }
      break;

    case 'number':
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return { isValid: false, error: 'Doit être un nombre' };
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
        return { isValid: false, error: 'Doit être vrai ou faux' };
      }
      break;

    case 'select':
      if (!this.options.includes(value)) {
        return { isValid: false, error: 'Option invalide' };
      }
      break;

    case 'date':
      const dateValue = new Date(value);
      if (isNaN(dateValue.getTime())) {
        return { isValid: false, error: 'Date invalide' };
      }
      
      // Vérifier les contraintes de date
      if (this.minDate && dateValue < this.minDate) {
        return { isValid: false, error: `Date antérieure au ${this.minDate.toLocaleDateString()}` };
      }
      
      if (this.maxDate && dateValue > this.maxDate) {
        return { isValid: false, error: `Date postérieure au ${this.maxDate.toLocaleDateString()}` };
      }
      break;

    default:
      return { isValid: false, error: 'Type d\'attribut non supporté' };
  }

  return { isValid: true };
};

// Méthode pour formater une valeur pour l'affichage
attributeSchema.methods.formatValue = function(value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }

  switch (this.type) {
    case 'boolean':
      return value ? 'Oui' : 'Non';
    
    case 'number':
      return typeof value === 'number' ? value.toLocaleString() : value;
    
    case 'date':
      try {
        const date = new Date(value);
        return date.toLocaleDateString('fr-FR');
      } catch (error) {
        return value;
      }
    
    default:
      return value;
  }
};

module.exports = mongoose.model('Attribute', attributeSchema);