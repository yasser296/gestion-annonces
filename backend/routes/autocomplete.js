// backend/routes/autocomplete.js - Nouveau fichier pour l'autocomplétion
const express = require('express');
const router = express.Router();
const Annonce = require('../models/Annonce');
const User = require('../models/User');
const Categorie = require('../models/Categorie');
const SousCategorie = require('../models/SousCategorie');

// Route principale d'autocomplétion
router.get('/suggestions', async (req, res) => {
  try {
    const { 
      query = '', 
      type = 'all', 
      category = null, 
      limit = 8 
    } = req.query;

    if (!query || query.length < 2) {
      return res.json([]);
    }

    const searchRegex = new RegExp(query, 'i');
    const results = [];

    // Helper pour éviter les doublons
    const addUnique = (items, type, icon = '🔍') => {
      items.forEach(item => {
        if (item && !results.find(r => r.text.toLowerCase() === item.toLowerCase())) {
          results.push({
            text: item,
            type: type,
            icon: icon
          });
        }
      });
    };

    // 1. Suggestions basées sur les titres d'annonces
    if (type === 'all' || type === 'titles') {
      const titleFilter = { 
        titre: searchRegex, 
        is_active: true 
      };
      
      if (category) {
        titleFilter.categorie_id = category;
      }

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

      const titles = titlesAgg.map(t => t._id);
      addUnique(titles, 'title', '📝');
    }

    // 2. Suggestions de villes
    if (type === 'all' || type === 'cities') {
      const cityFilter = { 
        ville: searchRegex, 
        is_active: true 
      };
      
      if (category) {
        cityFilter.categorie_id = category;
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
        marque: searchRegex, 
        is_active: true 
      };
      
      if (category) {
        brandFilter.categorie_id = category;
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
        { nom: searchRegex },
        { nom: 1 }
      ).limit(parseInt(limit));

      const userNames = users.map(u => u.nom);
      addUnique(userNames, 'user', '👤');
    }

    // 5. Suggestions de catégories
    if (type === 'all' || type === 'categories') {
      const categories = await Categorie.find(
        { nom: searchRegex },
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
    res.json(results.slice(0, parseInt(limit)));

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