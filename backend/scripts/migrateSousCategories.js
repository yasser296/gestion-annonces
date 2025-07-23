const mongoose = require('mongoose');
const connectDB = require('../db/config'); // adapte le chemin si besoin
const Categorie = require('../models/Categorie');
const SousCategorie = require('../models/SousCategorie');

const data = [
  {
    categorie: "Emploi",
    sousCategories: [
      { nom: "CDI", icone: "📋" },
      { nom: "CDD", icone: "📄" },
      { nom: "Stage", icone: "🎓" },
      { nom: "Freelance", icone: "💼" },
      { nom: "Temps partiel", icone: "⏰" },
      { nom: "Alternance", icone: "🔄" }
    ]
  },
  {
    categorie: "Immobilier",
    sousCategories: [
      { nom: "Appartements", icone: "🏢" },
      { nom: "Villas", icone: "🏡" },
      { nom: "Bureaux", icone: "🏢" },
      { nom: "Terrains", icone: "🏞️" },
      { nom: "Locaux commerciaux", icone: "🏪" },
      { nom: "Location vacances", icone: "🏖️" }
    ]
  },
  {    categorie: "Électronique",
    sousCategories: [
      { nom: "Téléphones", icone: "📱" },
      { nom: "Ordinateurs", icone: "💻" },
      { nom: "Tablettes", icone: "📱" },
      { nom: "TV & Home cinéma", icone: "📺" },
      { nom: "Consoles & Jeux", icone: "🎮" },
      { nom: "Appareils photo", icone: "📷" },
      { nom: "Accessoires", icone: "🎧" }
    ]
  },
  {
    categorie: "Meubles",
    sousCategories: [
      { nom: "Salon", icone: "🛋️" },
      { nom: "Chambre", icone: "🛏️" },
      { nom: "Cuisine", icone: "🍽️" },
      { nom: "Bureau", icone: "🪑" },
      { nom: "Jardin", icone: "🪴" },
      { nom: "Décoration", icone: "🖼️" }
    ]
  },
  {
    categorie: "Vêtements",
    sousCategories: [
      { nom: "Homme", icone: "👔" },
      { nom: "Femme", icone: "👗" },
      { nom: "Enfant", icone: "👶" },
      { nom: "Accessoires", icone: "🧢" },
      { nom: "Chaussures", icone: "👟" },
      { nom: "Bags", icone: "👜" }
    ]
  },
  {
    categorie: "Sports & Loisirs",
    sousCategories: [
      { nom: "Football", icone: "⚽" },
      { nom: "Basketball", icone: "🏀" },
      { nom: "Tennis", icone: "🎾" },
      { nom: "Natation", icone: "🏊" },
      { nom: "Cyclisme", icone: "🚴" },
      { nom: "Fitness", icone: "🏋️" }
    ]
  },
  {
    categorie: "Automobile",
    sousCategories: [
      { nom: "Voitures", icone: "🚗" },
      { nom: "Motos", icone: "🏍️" },
      { nom: "Vélos", icone: "🚲" },
      { nom: "Accessoires", icone: "🛠️" }
    ]
  },
  {
    categorie: "Services",
    sousCategories: [
      { nom: "Nettoyage", icone: "🧹" },
      { nom: "Jardinage", icone: "🌱" },
      { nom: "Plomberie", icone: "🚰" },
      { nom: "Électricité", icone: "💡" },
      { nom: "Déménagement", icone: "📦" },
      { nom: "Cours particuliers", icone: "📚" }
    ]
  }
];

async function run() {
  await connectDB();

  // Nettoyage
  await SousCategorie.deleteMany({});
  console.log("✅ Toutes les sous-catégories supprimées");

  for (const { categorie, sousCategories } of data) {
    const cat = await Categorie.findOne({ nom: categorie });
    if (!cat) {
      console.log(`❌ Catégorie "${categorie}" non trouvée`);
      continue;
    }

    for (const s of sousCategories) {
      await SousCategorie.create({
        ...s,
        categorie_id: cat._id
      });
      console.log(`➕ Sous-catégorie "${s.nom}" ajoutée à "${categorie}"`);
    }
  }

  mongoose.connection.close();
}

run();
