// backend/routes/autocomplete.js - Nouveau fichier pour l'autocomplétion
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Annonce = require('../models/Annonce');
const User = require('../models/User');
const Categorie = require('../models/Categorie');
const SousCategorie = require('../models/SousCategorie');


// Route pour suggestions de villes populaires avec filtrage par catégorie
router.get('/cities/popular', async (req, res) => {
  try {
    const { limit = 10, category = null } = req.query;

    const matchFilter = { 
      is_active: true, 
      ville: { $exists: true, $ne: '' } 
    };

    // Ajouter le filtre de catégorie si fourni
    if (category) {
      try {
        matchFilter.categorie_id = new mongoose.Types.ObjectId(category);
      } catch (error) {
        console.log('Invalid category ID for popular cities');
      }
    }

    const popularCities = await Annonce.aggregate([
      { $match: matchFilter },
      { 
        $group: { 
          _id: '$ville', 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          _id: 0,
          ville: '$_id',
          count: 1
        }
      }
    ]);

    res.json(popularCities);
  } catch (error) {
    console.error('Erreur popular cities:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour suggestions de recherches populaires avec filtrage par catégorie
router.get('/searches/trending', async (req, res) => {
  try {
    const { limit = 10, category = null } = req.query;

    const matchFilter = { 
      is_active: true,
      titre: { $exists: true, $ne: '' }
    };

    // Ajouter le filtre de catégorie si fourni
    if (category) {
      try {
        matchFilter.categorie_id = new mongoose.Types.ObjectId(category);
      } catch (error) {
        console.log('Invalid category ID for trending searches');
      }
    }

    // Récupérer les titres les plus fréquents comme "trending"
    const trendingSearches = await Annonce.aggregate([
      { $match: matchFilter },
      // Extraire les mots significatifs des titres (> 3 caractères)
      {
        $project: {
          words: {
            $filter: {
              input: { $split: [{ $toLower: "$titre" }, " "] },
              as: "word",
              cond: { $gt: [{ $strLenCP: "$$word" }, 3] }
            }
          }
        }
      },
      { $unwind: "$words" },
      {
        $group: {
          _id: "$words",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          _id: 0,
          term: "$_id",
          count: 1
        }
      }
    ]);

    res.json(trendingSearches);
  } catch (error) {
    console.error('Erreur trending searches:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route principale d'autocomplétion
router.get('/suggestions', async (req, res) => {
  try {
    const { 
      query = '', 
      type = 'all', 
      category = null, 
      limit = 8 
    } = req.query;

    console.log('🔍 AUTOCOMPLETE DEBUG:');
    console.log('- query:', query);
    console.log('- type:', type);
    console.log('- category (string):', category);

    // Validation stricte de la query
    const trimmedQuery = query.trim();
    if (!trimmedQuery || trimmedQuery.length < 1) {
      return res.json([]);
    }

    let categoryObjectId = null;
    if (category) {
      try {
        categoryObjectId = new mongoose.Types.ObjectId(category);
        console.log('- category (ObjectId):', categoryObjectId);
      } catch (error) {
        console.log('❌ Invalid category ObjectId:', category);
        return res.json([]); // ID invalide, retourner vide
      }
    }

    if (!query || query.length < 1) {
      return res.json([]);
    }

    const searchRegex = new RegExp(query, 'i');
    const results = [];

    // Helper pour éviter les doublons
    const addUnique = (items, type, icon = '🔍') => {
      items.forEach(item => {
        // Validation stricte : ignorer les valeurs vides ou null
        if (item && item.trim && item.trim().length > 0) {
          const trimmedItem = item.trim();
          if (!results.find(r => r.text.toLowerCase() === trimmedItem.toLowerCase())) {
            results.push({
              text: trimmedItem,
              type: type,
              icon: icon
            });
          }
        }
      });
    };

    // 1. Suggestions basées sur les titres d'annonces
    if (type === 'all' || type === 'titles') {
      const titleFilter = { 
        titre: { $regex: query, $options: 'i' }, 
        is_active: true 
      };
      
      if (categoryObjectId) {
        titleFilter.categorie_id = categoryObjectId; // ← CHANGEMENT ICI
      }

      console.log('📝 TITLES FILTER (corrected):', JSON.stringify(titleFilter));

      // 🔍 AJOUT : Test avec ObjectId pour vérifier
      const testCountWithObjectId = await Annonce.countDocuments({ 
        categorie_id: categoryObjectId, 
        is_active: true 
      });
      console.log('📊 Total annonces actives dans cette catégorie (ObjectId):', testCountWithObjectId);
      const titlesAgg = await Annonce.aggregate([
        { $match: titleFilter },
        { 
          $group: { 
            _id: '$titre', 
            count: { $sum: 1 } 
          } 
        },
        { $sort: { count: -1 } },
        { $limit: parseInt(limit) }
      ]);

      console.log('📝 Titles aggregation results (should work now):', titlesAgg.length, 'items');
      console.log('📝 First few titles:', titlesAgg.slice(0, 3));

      const titles = titlesAgg.map(t => t._id);
      addUnique(titles, 'title', '📝');
    }

    // 2. Suggestions de villes
    if (type === 'all' || type === 'cities') {
      const cityFilter = { 
        ville: { $regex: query, $options: 'i' }, 
        is_active: true 
      };
      
      if (categoryObjectId) {
        cityFilter.categorie_id = categoryObjectId; // ← CHANGEMENT ICI
      }

      const citiesAgg = await Annonce.aggregate([
        { $match: cityFilter },
        { 
          $group: { 
            _id: '$ville', 
            count: { $sum: 1 } 
          } 
        },
        { $sort: { count: -1 } },
        { $limit: parseInt(limit) }
      ]);

      const cities = citiesAgg.map(c => c._id).filter(c => c);
      addUnique(cities, 'city', '📍');
    }

    // 3. Suggestions de marques
    if (type === 'all' || type === 'brands') {
      const brandFilter = { 
        marque: { $regex: query, $options: 'i' }, 
        is_active: true 
      };
      
      if (categoryObjectId) {
        brandFilter.categorie_id = categoryObjectId; // ← CHANGEMENT ICI
      }

      const brandsAgg = await Annonce.aggregate([
        { $match: brandFilter },
        { 
          $group: { 
            _id: '$marque', 
            count: { $sum: 1 } 
          } 
        },
        { $sort: { count: -1 } },
        { $limit: parseInt(limit) }
      ]);

      const brands = brandsAgg.map(b => b._id).filter(b => b);
      addUnique(brands, 'brand', '🏷️');
    }

    // 4. Suggestions de noms d'utilisateurs (vendeurs)
    if (type === 'all' || type === 'users') {
      const users = await User.find(
        { nom: new RegExp(query, 'i') },
        { nom: 1 }
      ).limit(parseInt(limit));

      const userNames = users.map(u => u.nom);
      addUnique(userNames, 'user', '👤');
    }

    // 5. Suggestions de catégories
    if (type === 'all' || type === 'categories') {
      const categories = await Categorie.find(
        { nom: new RegExp(query, 'i') },
        { nom: 1, icone: 1 }
      ).limit(parseInt(limit));

      categories.forEach(cat => {
        if (!results.find(r => r.text.toLowerCase() === cat.nom.toLowerCase())) {
          results.push({
            text: cat.nom,
            type: 'category',
            icon: cat.icone || '📁',
            id: cat._id
          });
        }
      });
    }

    // 6. Suggestions de sous-catégories
    if (type === 'all' || type === 'subcategories') {
      const subCategoryFilter = { nom: searchRegex };
      if (category) {
        subCategoryFilter.categorie_id = category;
      }

      const subCategories = await SousCategorie.find(
        subCategoryFilter,
        { nom: 1, icone: 1, categorie_id: 1 }
      ).limit(parseInt(limit));

      subCategories.forEach(subCat => {
        if (!results.find(r => r.text.toLowerCase() === subCat.nom.toLowerCase())) {
          results.push({
            text: subCat.nom,
            type: 'subcategory',
            icon: subCat.icone || '📂',
            id: subCat._id,
            categoryId: subCat.categorie_id
          });
        }
      });
    }

    // Trier par pertinence (commence par la query en premier)
    results.sort((a, b) => {
      const aStarts = a.text.toLowerCase().startsWith(query.toLowerCase());
      const bStarts = b.text.toLowerCase().startsWith(query.toLowerCase());
      
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      // Ensuite par longueur (plus court = plus pertinent)
      return a.text.length - b.text.length;
    });

    // Limiter le nombre total de résultats
    const validResults = results.filter(result => 
      result.text && 
      result.text.trim().length > 0 &&
      result.type
    );

    res.json(validResults.slice(0, parseInt(limit)));

  } catch (error) {
    console.error('Erreur autocomplete:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour suggestions de villes populaires
router.get('/cities/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const popularCities = await Annonce.aggregate([
      { $match: { is_active: true, ville: { $exists: true, $ne: '' } } },
      { 
        $group: { 
          _id: '$ville', 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          _id: 0,
          ville: '$_id',
          count: 1
        }
      }
    ]);

    res.json(popularCities);
  } catch (error) {
    console.error('Erreur popular cities:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Route pour suggestions de recherches populaires
router.get('/searches/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    // Analyser les mots-clés les plus fréquents dans les titres
    const trendingSearches = await Annonce.aggregate([
      { $match: { is_active: true } },
      {
        $project: {
          words: {
            $split: [
              { $toLower: '$titre' },
              ' '
            ]
          }
        }
      },
      { $unwind: '$words' },
      {
        $match: {
          words: { 
            $not: /^(le|la|les|de|du|des|un|une|et|ou|pour|avec|sans|sur|dans|par)$/,
            $regex: /^[a-zA-ZàâäéèêëïîôöùûüÿñçÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÑÇ]+$/
          },
          $expr: { $gte: [{ $strLenCP: '$words' }, 3] }
        }
      },
      {
        $group: {
          _id: '$words',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          _id: 0,
          term: '$_id',
          count: 1
        }
      }
    ]);

    res.json(trendingSearches);
  } catch (error) {
    console.error('Erreur trending searches:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;