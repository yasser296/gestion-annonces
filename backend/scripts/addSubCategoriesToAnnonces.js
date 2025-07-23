// backend/scripts/addSubCategoriesToAnnonces.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

// Importer les modèles
const Annonce = require('../models/Annonce');
const Categorie = require('../models/Categorie');

// Mapping intelligent pour déterminer la sous-catégorie basé sur le contenu
const subCategoryMapping = {
  "Voitures": {
    keywords: {
      "Citadines": ["208", "clio", "polo", "golf", "c3", "yaris", "fiesta", "citadine"],
      "Berlines": ["passat", "accord", "camry", "série 3", "classe c", "berline"],
      "4x4 & SUV": ["4x4", "suv", "duster", "tiguan", "qashqai", "tucson", "sportage"],
      "Utilitaires": ["kangoo", "partner", "berlingo", "master", "sprinter", "utilitaire"],
      "Motos": ["moto", "scooter", "yamaha", "honda", "kawasaki", "vespa"],
      "Pièces détachées": ["pièce", "moteur", "pneu", "jante", "phare", "pare-choc"]
    }
  },
  "Immobilier": {
    keywords: {
      "Appartements": ["appartement", "appart", "f2", "f3", "f4", "studio", "duplex"],
      "Villas": ["villa", "maison", "riad", "pavillon"],
      "Bureaux": ["bureau", "espace professionnel", "local professionnel"],
      "Terrains": ["terrain", "lot", "parcelle"],
      "Locaux commerciaux": ["local commercial", "magasin", "boutique", "commerce"],
      "Location vacances": ["location vacances", "saisonnier", "airbnb", "court séjour"]
    }
  },
  "Électronique": {
    keywords: {
      "Téléphones": ["téléphone", "iphone", "samsung", "smartphone", "mobile", "huawei", "xiaomi"],
      "Ordinateurs": ["ordinateur", "pc", "laptop", "macbook", "dell", "hp", "lenovo", "asus"],
      "Tablettes": ["tablette", "ipad", "tab", "galaxy tab"],
      "TV & Home cinéma": ["tv", "télévision", "home cinéma", "écran", "samsung tv", "lg tv"],
      "Consoles & Jeux": ["playstation", "ps4", "ps5", "xbox", "nintendo", "switch", "console"],
      "Appareils photo": ["appareil photo", "canon", "nikon", "sony alpha", "caméra"],
      "Accessoires": ["casque", "écouteurs", "chargeur", "câble", "souris", "clavier"]
    }
  },
  "Meubles": {
    keywords: {
      "Salon": ["canapé", "salon", "fauteuil", "table basse", "meuble tv"],
      "Chambre": ["lit", "armoire", "commode", "table de chevet", "matelas"],
      "Cuisine": ["cuisine", "table à manger", "chaise", "buffet", "vaisselier"],
      "Bureau": ["bureau", "chaise bureau", "étagère", "bibliothèque"],
      "Jardin": ["jardin", "extérieur", "parasol", "barbecue", "salon jardin"],
      "Décoration": ["décoration", "tableau", "miroir", "tapis", "rideau", "luminaire"]
    }
  },
  "Vêtements": {
    keywords: {
      "Femmes": ["femme", "robe", "jupe", "chemisier", "dame", "féminin"],
      "Hommes": ["homme", "chemise homme", "costume", "pantalon homme", "masculin"],
      "Enfants": ["enfant", "bébé", "fille", "garçon", "kid", "junior"],
      "Chaussures": ["chaussure", "basket", "sneakers", "bottine", "sandale", "talon"],
      "Accessoires": ["sac", "ceinture", "écharpe", "chapeau", "gants", "lunettes"],
      "Montres & Bijoux": ["montre", "bijou", "bracelet", "collier", "bague", "boucle"]
    }
  },
  "Services": {
    keywords: {
      "Cours & Formations": ["cours", "formation", "professeur", "leçon", "apprentissage"],
      "Événements": ["événement", "mariage", "anniversaire", "fête", "cérémonie"],
      "Réparations": ["réparation", "dépannage", "maintenance", "entretien"],
      "Santé & Beauté": ["coiffure", "massage", "esthétique", "spa", "soin"],
      "Transport": ["transport", "déménagement", "livraison", "taxi"],
      "Autres services": ["service", "aide", "assistance", "conseil"]
    }
  },
  "Sports & Loisirs": {
    keywords: {
      "Vélos": ["vélo", "vtt", "bicyclette", "cyclisme"],
      "Fitness": ["fitness", "musculation", "gym", "tapis", "haltère", "banc"],
      "Sports collectifs": ["football", "basket", "volley", "tennis", "ballon"],
      "Sports nautiques": ["natation", "surf", "plongée", "kayak", "bateau"],
      "Camping": ["camping", "tente", "randonnée", "sac de couchage"],
      "Instruments de musique": ["guitare", "piano", "violon", "batterie", "synthé"]
    }
  },
  "Emploi": {
    keywords: {
      "CDI": ["cdi", "contrat indéterminé", "permanent", "temps plein"],
      "CDD": ["cdd", "contrat déterminé", "temporaire"],
      "Stage": ["stage", "stagiaire", "étudiant"],
      "Freelance": ["freelance", "indépendant", "consultant", "auto-entrepreneur"],
      "Temps partiel": ["temps partiel", "mi-temps", "partiel"],
      "Alternance": ["alternance", "apprentissage", "contrat pro"]
    }
  }
};

// Fonction pour déterminer la sous-catégorie basée sur le titre et la description
function determineSubCategory(annonce, categoryName, subCategories) {
  const text = `${annonce.titre} ${annonce.description} ${annonce.marque || ''}`.toLowerCase();
  
  const categoryKeywords = subCategoryMapping[categoryName];
  if (!categoryKeywords) return null;
  
  // Chercher la meilleure correspondance
  let bestMatch = null;
  let maxScore = 0;
  
  for (const [subCatName, keywords] of Object.entries(categoryKeywords.keywords)) {
    let score = 0;
    
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        score += keyword.length; // Plus le mot est long, plus il est spécifique
      }
    }
    
    if (score > maxScore) {
      maxScore = score;
      bestMatch = subCatName;
    }
  }
  
  // Trouver l'ID de la sous-catégorie
  if (bestMatch) {
    const subCategory = subCategories.find(sc => sc.nom === bestMatch);
    return subCategory ? subCategory._id : null;
  }
  
  return null;
}

async function addSubCategoriesToAnnonces() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/annonces-db');
    console.log('✅ Connecté à MongoDB');

    // Récupérer toutes les catégories avec leurs sous-catégories
    const categories = await Categorie.find();
    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat._id.toString()] = {
        nom: cat.nom,
        sousCategories: cat.sousCategories
      };
    });

    // Récupérer toutes les annonces sans sous-catégorie
    const annonces = await Annonce.find({ 
      $or: [
        { sous_categorie_id: null },
        { sous_categorie_id: { $exists: false } }
      ]
    }).populate('categorie_id');

    console.log(`📊 ${annonces.length} annonces à traiter`);

    let updatedCount = 0;
    const updates = [];

    for (const annonce of annonces) {
      if (!annonce.categorie_id) continue;
      
      const categoryInfo = categoryMap[annonce.categorie_id._id.toString()];
      if (!categoryInfo || !categoryInfo.sousCategories || categoryInfo.sousCategories.length === 0) continue;
      
      const subCategoryId = determineSubCategory(
        annonce, 
        categoryInfo.nom, 
        categoryInfo.sousCategories
      );
      
      if (subCategoryId) {
        const subCategory = categoryInfo.sousCategories.find(sc => sc._id === subCategoryId);
        updates.push({
          annonce: annonce.titre,
          category: categoryInfo.nom,
          subCategory: subCategory.nom,
          id: annonce._id
        });
        
        // Mettre à jour l'annonce
        await Annonce.findByIdAndUpdate(annonce._id, {
          sous_categorie_id: subCategoryId
        });
        
        updatedCount++;
      }
    }

    console.log(`\n✅ ${updatedCount} annonces mises à jour avec des sous-catégories`);
    
    if (updates.length > 0) {
      console.log('\n📋 Détail des mises à jour :');
      updates.forEach(update => {
        console.log(`   - "${update.annonce}" → ${update.category} / ${update.subCategory}`);
      });
    }

    // Afficher un résumé
    const summary = await Annonce.aggregate([
      {
        $match: { sous_categorie_id: { $ne: null } }
      },
      {
        $group: {
          _id: '$categorie_id',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n📊 Résumé par catégorie :');
    for (const item of summary) {
      const category = await Categorie.findById(item._id);
      if (category) {
        console.log(`   ${category.icone} ${category.nom}: ${item.count} annonces avec sous-catégories`);
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✨ Traitement terminé');
  }
}

// Exécuter le script
addSubCategoriesToAnnonces();