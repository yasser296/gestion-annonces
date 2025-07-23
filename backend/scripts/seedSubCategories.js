// backend/scripts/seedSubCategories.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Categorie = require('../models/Categorie');

dotenv.config();

const subCategoriesData = {
  "Voitures": [
    { nom: "Citadines", icone: "🚗" },
    { nom: "Berlines", icone: "🚙" },
    { nom: "4x4 & SUV", icone: "🚙" },
    { nom: "Utilitaires", icone: "🚚" },
    { nom: "Motos", icone: "🏍️" },
    { nom: "Pièces détachées", icone: "🔧" }
  ],
  "Immobilier": [
    { nom: "Appartements", icone: "🏢" },
    { nom: "Villas", icone: "🏡" },
    { nom: "Bureaux", icone: "🏢" },
    { nom: "Terrains", icone: "🏞️" },
    { nom: "Locaux commerciaux", icone: "🏪" },
    { nom: "Location vacances", icone: "🏖️" }
  ],
  "Électronique": [
    { nom: "Téléphones", icone: "📱" },
    { nom: "Ordinateurs", icone: "💻" },
    { nom: "Tablettes", icone: "📱" },
    { nom: "TV & Home cinéma", icone: "📺" },
    { nom: "Consoles & Jeux", icone: "🎮" },
    { nom: "Appareils photo", icone: "📷" },
    { nom: "Accessoires", icone: "🎧" }
  ],
  "Meubles": [
    { nom: "Salon", icone: "🛋️" },
    { nom: "Chambre", icone: "🛏️" },
    { nom: "Cuisine", icone: "🍽️" },
    { nom: "Bureau", icone: "🪑" },
    { nom: "Jardin", icone: "🪴" },
    { nom: "Décoration", icone: "🖼️" }
  ],
  "Vêtements": [
    { nom: "Femmes", icone: "👗" },
    { nom: "Hommes", icone: "👔" },
    { nom: "Enfants", icone: "👶" },
    { nom: "Chaussures", icone: "👟" },
    { nom: "Accessoires", icone: "👜" },
    { nom: "Montres & Bijoux", icone: "⌚" }
  ],
  "Services": [
    { nom: "Cours & Formations", icone: "🎓" },
    { nom: "Événements", icone: "🎉" },
    { nom: "Réparations", icone: "🔧" },
    { nom: "Santé & Beauté", icone: "💆" },
    { nom: "Transport", icone: "🚛" },
    { nom: "Autres services", icone: "🤝" }
  ],
  "Sports & Loisirs": [
    { nom: "Vélos", icone: "🚴" },
    { nom: "Fitness", icone: "💪" },
    { nom: "Sports collectifs", icone: "⚽" },
    { nom: "Sports nautiques", icone: "🏊" },
    { nom: "Camping", icone: "⛺" },
    { nom: "Instruments de musique", icone: "🎸" }
  ],
  "Emploi": [
    { nom: "CDI", icone: "📋" },
    { nom: "CDD", icone: "📄" },
    { nom: "Stage", icone: "🎓" },
    { nom: "Freelance", icone: "💼" },
    { nom: "Temps partiel", icone: "⏰" },
    { nom: "Alternance", icone: "🔄" }
  ]
};

async function seedSubCategories() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/annonces-db');
    console.log('Connecté à MongoDB');

    // Pour chaque catégorie, ajouter ses sous-catégories
    for (const [categoryName, subCategories] of Object.entries(subCategoriesData)) {
      const category = await Categorie.findOne({ nom: categoryName });
      
      if (category) {
        // Ajouter les sous-catégories si elles n'existent pas déjà
        const existingSubCatNames = category.sousCategories.map(sc => sc.nom);
        const newSubCategories = subCategories.filter(sc => !existingSubCatNames.includes(sc.nom));
        
        if (newSubCategories.length > 0) {
          category.sousCategories.push(...newSubCategories);
          await category.save();
          console.log(`✅ Ajouté ${newSubCategories.length} sous-catégories à ${categoryName}`);
        } else {
          console.log(`ℹ️  ${categoryName} a déjà toutes ses sous-catégories`);
        }
      } else {
        console.log(`⚠️  Catégorie "${categoryName}" non trouvée`);
      }
    }

    console.log('\n✨ Sous-catégories ajoutées avec succès !');

    // Afficher le résumé
    const categories = await Categorie.find();
    console.log('\n📊 Résumé des catégories :');
    categories.forEach(cat => {
      console.log(`${cat.icone} ${cat.nom} : ${cat.sousCategories.length} sous-catégories`);
      cat.sousCategories.forEach(subCat => {
        console.log(`   ${subCat.icone} ${subCat.nom}`);
      });
    });

  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nConnexion fermée');
  }
}

// Exécuter le script
seedSubCategories();