// scripts/populateCoherentAnnonces.js
const mongoose = require('mongoose');
const Annonce = require('../models/Annonce');
const User = require('../models/User');
const Categorie = require('../models/Categorie');
const SousCategorie = require('../models/SousCategorie');

// Connexion à la base
mongoose.connect('mongodb://127.0.0.1:27017/annoncesDB');

(async () => {
  try {
    // 1. Supprimer toutes les annonces existantes
    await Annonce.deleteMany({});
    console.log('Toutes les annonces existantes ont été supprimées.');

    // 2. Charger toutes les catégories et sous-catégories
    const categories = await Categorie.find({});
    const sousCategories = await SousCategorie.find({ isActive: true });

    // 3. Charger les utilisateurs vendeurs/admins uniquement
    const users = await User.find({ role_id: { $in: [1, 3] } }); // 1=admin, 3=vendeur

    if (users.length === 0 || sousCategories.length === 0) {
      throw new Error('Pas d\'utilisateurs vendeurs/admins ou de sous-catégories trouvés.');
    }

    // 4. Création d'annonces cohérentes
    const annonces = [];

    // Exemple d'organisation : map chaque sous-catégorie à un type d'annonce logique
    const exemplesParSousCat = {
      'Téléphones': [
        { titre: 'iPhone 13 Pro Max', marque: 'Apple', prix: 10000, description: 'État impeccable, boîte d\'origine.' },
        { titre: 'Samsung Galaxy S22 Ultra', marque: 'Samsung', prix: 8000, description: 'Quasi neuf, acheté en 2023.' },
      ],
      'Ordinateurs portables': [
        { titre: 'Dell XPS 13', marque: 'Dell', prix: 9000, description: 'Léger, performant, parfait pour le travail.' },
        { titre: 'MacBook Air M2', marque: 'Apple', prix: 12000, description: 'Dernier modèle, excellent état.' },
      ],
      'Services de traduction': [
        { titre: 'Traduction français-anglais rapide', marque: '', prix: 200, description: 'Traduction professionnelle, rapide et fiable.' }
      ],
      'Femmes': [
        { titre: 'Sac à main cuir', marque: 'Guess', prix: 400, description: 'Accessoire chic pour toutes occasions.' }
      ],
      // Ajoute d'autres sous-catégories/logiques ici...
    };

    // Boucle sur chaque sous-catégorie et génère des annonces
    for (const sousCat of sousCategories) {
      const exemples = exemplesParSousCat[sousCat.nom] || [
        { titre: `Produit ${sousCat.nom}`, marque: '', prix: 500, description: `Exemple d'annonce pour la sous-catégorie ${sousCat.nom}` }
      ];
      // Pour chaque exemple, créer une annonce pour un vendeur au hasard
      for (const ex of exemples) {
        const vendeur = users[Math.floor(Math.random() * users.length)];
        annonces.push({
          titre: ex.titre,
          description: ex.description,
          prix: ex.prix,
          ville: 'Casablanca',
          marque: ex.marque,
          etat: 'neuf',
          categorie_id: sousCat.categorie_id,
          sous_categorie_id: sousCat._id,
          user_id: vendeur._id,
          images: [],
          is_active: true,
        });
      }
    }

    await Annonce.insertMany(annonces);
    console.log(`${annonces.length} annonces cohérentes ajoutées.`);

  } catch (error) {
    console.error('Erreur lors du peuplement:', error);
  } finally {
    mongoose.disconnect();
  }
})();
