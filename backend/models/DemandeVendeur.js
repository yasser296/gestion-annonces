const mongoose = require('mongoose');

const demandeVendeurSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  statut: {
    type: String,
    enum: ['en_attente', 'acceptee', 'refusee'],
    default: 'en_attente'
  },
  message_demande: {
    type: String,
    required: true
  },
  message_admin: {
    type: String
  },
  date_demande: {
    type: Date,
    default: Date.now
  },
  date_traitement: {
    type: Date
  },
  traite_par: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Index pour éviter les demandes multiples en attente
demandeVendeurSchema.index({ user_id: 1, statut: 1 });

module.exports = mongoose.model('DemandeVendeur', demandeVendeurSchema);