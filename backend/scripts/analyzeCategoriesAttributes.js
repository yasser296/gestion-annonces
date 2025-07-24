// backend/scripts/analyzeCategoriesAttributes.js
const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/annoncesDB', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connecté');
  } catch (err) {
    console.error('❌ Erreur connexion MongoDB:', err.message);
    process.exit(1);
  }
};

const Categorie = require('../models/Categorie');
const Attribute = require('../models/Attribute');
const Annonce = require('../models/Annonce');

const analyzeCategoriesAttributes = async () => {
  try {
    await connectDB();

    console.log('🔍 Analyse des catégories et attributs...\n');

    // Récupérer toutes les catégories
    const categories = await Categorie.find().sort({ nom: 1 });
    
    const categoriesWithoutAttributes = [];
    const categoriesWithAttributes = [];

    for (const category of categories) {
      const attributeCount = await Attribute.countDocuments({ 
        categorie_id: category._id, 
        isActive: true 
      });
      
      const annonceCount = await Annonce.countDocuments({ 
        categorie_id: category._id 
      });

      const categoryInfo = {
        _id: category._id,
        nom: category.nom,
        icone: category.icone,
        attributeCount,
        annonceCount
      };

      if (attributeCount === 0) {
        categoriesWithoutAttributes.push(categoryInfo);
      } else {
        categoriesWithAttributes.push(categoryInfo);
      }
    }

    // Affichage des résultats
    console.log('📊 RÉSUMÉ:');
    console.log(`   - ${categories.length} catégories au total`);
    console.log(`   - ${categoriesWithAttributes.length} catégories avec attributs`);
    console.log(`   - ${categoriesWithoutAttributes.length} catégories SANS attributs\n`);

    if (categoriesWithAttributes.length > 0) {
      console.log('✅ CATÉGORIES AVEC ATTRIBUTS:');
      categoriesWithAttributes.forEach(cat => {
        console.log(`   ${cat.icone} ${cat.nom} - ${cat.attributeCount} attributs, ${cat.annonceCount} annonces`);
      });
      console.log('');
    }

    if (categoriesWithoutAttributes.length > 0) {
      console.log('⚠️  CATÉGORIES SANS ATTRIBUTS:');
      categoriesWithoutAttributes.forEach(cat => {
        console.log(`   ${cat.icone} ${cat.nom} - ${cat.annonceCount} annonces`);
      });
      console.log('');
      
      console.log('🚀 RECOMMANDATIONS:');
      console.log('   1. Créez des attributs pour ces catégories via /admin/attributes');
      console.log('   2. Ou utilisez le script de création automatique d\'attributs');
      console.log('   3. Puis migrez vos annonces existantes\n');
    }

    // Statistiques détaillées
    const totalAnnonces = await Annonce.countDocuments();
    const annoncesWithoutCategories = await Annonce.countDocuments({ 
      $or: [
        { categorie_id: null },
        { categorie_id: { $exists: false } }
      ]
    });

    console.log('📈 STATISTIQUES DÉTAILLÉES:');
    console.log(`   - ${totalAnnonces} annonces au total`);
    console.log(`   - ${annoncesWithoutCategories} annonces sans catégorie`);
    
    const annoncesSansAttributs = categoriesWithoutAttributes.reduce((sum, cat) => sum + cat.annonceCount, 0);
    console.log(`   - ${annoncesSansAttributs} annonces dans des catégories sans attributs`);

    return {
      categoriesWithoutAttributes,
      categoriesWithAttributes,
      stats: {
        totalCategories: categories.length,
        categoriesNeedingAttributes: categoriesWithoutAttributes.length,
        totalAnnonces,
        annoncesSansAttributs
      }
    };

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
  } finally {
    mongoose.disconnect();
  }
};

// Exécuter l'analyse
analyzeCategoriesAttributes();