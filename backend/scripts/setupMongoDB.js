// setupMongoDB.js
const mongoose = require('mongoose');

const mongoUri = 'mongodb://127.0.0.1:27017/annoncesDB';

// Définir les schémas de base
const userSchema = new mongoose.Schema({
  nom: String,
  email: { type: String, unique: true },
  telephone: String,
  mot_de_passe: String,
  date_inscription: { type: Date, default: Date.now }
});

const categorieSchema = new mongoose.Schema({
  nom: String,
  icone: String
});

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

// Connexion
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    console.log('✅ Connexion MongoDB réussie !');

    // Créer les modèles pour forcer la création des collections
    const User = mongoose.model('User', userSchema);
    const Categorie = mongoose.model('Categorie', categorieSchema);
    const Annonce = mongoose.model('Annonce', annonceSchema);

    // Créer des collections vides (MongoDB les créera si on insère un doc)
    await User.createCollection();
    await Categorie.createCollection();
    await Annonce.createCollection();

    console.log('✅ Base de données et collections créées (users, categories, annonces) !');
    mongoose.connection.close();
  })
  .catch((err) => {
    console.error('❌ Erreur connexion MongoDB:', err);
    process.exit(1);
  });
