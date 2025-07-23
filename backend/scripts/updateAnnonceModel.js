// backend/scripts/updateAnnonceModel.js
// Ce script ajoute le champ sous_categorie_id au modèle Annonce

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Mise à jour du schéma Annonce
const annonceSchema = new mongoose.Schema({
  titre: String,
  description: String,
  prix: Number,
  categorie_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Categorie' },
  sous_categorie_id: String, // Nouveau champ pour la sous-catégorie
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ville: String,
  marque: String,
  etat: String,
  nombre_vues: { type: Number, default: 0 },
  date_publication: { type: Date, default: Date.now },
  images: [String],
  is_active: { type: Boolean, default: true }
});

const Annonce = mongoose.model('Annonce', annonceSchema);

async function updateExistingAnnonces() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/annonces-db');
    console.log('Connecté à MongoDB');

    // Mettre à jour toutes les annonces existantes pour ajouter le champ
    const result = await Annonce.updateMany(
      { sous_categorie_id: { $exists: false } },
      { $set: { sous_categorie_id: null } }
    );

    console.log(`✅ ${result.modifiedCount} annonces mises à jour avec le champ sous_categorie_id`);

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Connexion fermée');
  }
}

// Exécuter le script
updateExistingAnnonces();