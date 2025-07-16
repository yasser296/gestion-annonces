const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nom: String,
  email: { type: String, unique: true },
  telephone: String,
  mot_de_passe: String,
  date_inscription: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
