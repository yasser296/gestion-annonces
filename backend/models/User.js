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
  role: {
    type: String,
    enum: ['user', 'vendeur', 'admin'],
    default: 'user'
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

module.exports = mongoose.model('User', userSchema);