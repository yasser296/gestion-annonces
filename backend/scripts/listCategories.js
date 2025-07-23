// backend/scripts/listCategories.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Categorie = require('../models/Categorie');

dotenv.config();

async function listCategories() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/annonces-db');
    console.log('✅ Connecté à MongoDB\n');

    // Récupérer toutes les catégories
    const categories = await Categorie.find().sort({ ordre: 1, nom: 1 });

    console.log('📋 LISTE DES CATÉGORIES ET SOUS-CATÉGORIES\n');
    console.log('=' .repeat(60));
    
    categories.forEach(cat => {
      console.log(`\n${cat.icone} ${cat.nom}`);
      console.log(`   ID: ${cat._id}`);
      console.log(`   Ordre: ${cat.ordre || 0}`);
      console.log(`   Active: ${cat.isActive ? '✅' : '❌'}`);
      
      if (cat.sousCategories && cat.sousCategories.length > 0) {
        console.log(`   Sous-catégories (${cat.sousCategories.length}):`);
        cat.sousCategories.forEach(subCat => {
          console.log(`      ${subCat.icone || '•'} ${subCat.nom} (ID: ${subCat._id})`);
        });
      } else {
        console.log('   Sous-catégories: Aucune');
      }
    });
    
    console.log('\n' + '=' .repeat(60));
    console.log(`Total: ${categories.length} catégories`);
    
    // Générer un objet pour faciliter la copie dans populateDB
    console.log('\n📝 COPIER CET OBJET DANS VOTRE SCRIPT populateDB.js :');
    console.log('\nconst categoriesIds = {');
    categories.forEach(cat => {
      console.log(`  "${cat.nom}": "${cat._id}",`);
    });
    console.log('};');

  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✨ Terminé');
  }
}

// Exécuter le script
listCategories();