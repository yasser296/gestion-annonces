// backend/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  telephone: {
    type: String,
    required: true
  },
  mot_de_passe: {
    type: String,
    required: true
  },
  role_id: {
    type: Number,
    default: 2, // Par défaut : user (id = 2)
    ref: 'Role'
  },
  date_inscription: {
    type: Date,
    default: Date.now
  },
  bloque_demande_vendeur: {
    type: Boolean,
    default: false,
  }
});

// Méthode virtuelle pour récupérer facilement le titre du rôle
userSchema.virtual('role', {
  ref: 'Role',
  localField: 'role_id',
  foreignField: 'id',
  justOne: true
});

// Activer les virtuals dans toJSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);