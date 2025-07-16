const mongoose = require('mongoose');

const annonceSchema = new mongoose.Schema({
  titre: String,
  description: String,
  prix: Number,
  categorie_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Categorie' },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ville: String,
  marque: String,
  etat: String,
  nombre_vues: { type: Number, default: 0 },
  date_publication: { type: Date, default: Date.now },
  images: [String],
  is_active: { type: Boolean, default: true }
});

module.exports = mongoose.model('Annonce', annonceSchema);
