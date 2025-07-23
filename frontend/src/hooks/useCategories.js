import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Hook pour gérer les catégories et sous-catégories
const useCategories = () => {
  const [categories, setCategories] = useState([]);
  const [sousCategories, setSousCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Charger toutes les catégories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/categories');
      setCategories(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des catégories');
      console.error('Erreur categories:', err);
    }
  }, []);

  // Charger toutes les sous-catégories
  const fetchSousCategories = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/sous-categories');
      setSousCategories(response.data);
    } catch (err) {
      setError('Erreur lors du chargement des sous-catégories');
      console.error('Erreur sous-categories:', err);
    }
  }, []);

  // Charger les sous-catégories d'une catégorie spécifique
  const fetchSousCategoriesByCategory = useCallback(async (categorieId) => {
    if (!categorieId) {
      setSousCategories([]);
      return [];
    }

    try {
      const response = await axios.get(`http://localhost:5000/api/sous-categories/by-category/${categorieId}`);
      setSousCategories(response.data);
      return response.data;
    } catch (err) {
      setError('Erreur lors du chargement des sous-catégories');
      console.error('Erreur sous-categories by category:', err);
      setSousCategories([]);
      return [];
    }
  }, []);

  // Charger les données initiales
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchCategories(),
        fetchSousCategories()
      ]);
      setLoading(false);
    };

    loadData();
  }, [fetchCategories, fetchSousCategories]);

  // Fonctions utilitaires
  const getCategoryById = useCallback((id) => {
    return categories.find(cat => cat._id === id);
  }, [categories]);

  const getSubCategoryById = useCallback((id) => {
    return sousCategories.find(sc => sc._id === id);
  }, [sousCategories]);

  const getSubCategoriesByCategory = useCallback((categorieId) => {
    return sousCategories.filter(sc => 
      sc.categorie_id && (
        sc.categorie_id._id === categorieId || 
        sc.categorie_id === categorieId
      )
    );
  }, [sousCategories]);

  // Fonction pour obtenir le chemin complet (catégorie > sous-catégorie)
  const getCategoryPath = useCallback((categorieId, sousCategorieId) => {
    const categorie = getCategoryById(categorieId);
    const sousCategorie = getSubCategoryById(sousCategorieId);
    
    const path = [];
    if (categorie) path.push(categorie);
    if (sousCategorie) path.push(sousCategorie);
    
    return path;
  }, [getCategoryById, getSubCategoryById]);

  // Fonction pour formater le nom complet
  const getFullCategoryName = useCallback((categorieId, sousCategorieId) => {
    const path = getCategoryPath(categorieId, sousCategorieId);
    return path.map(item => `${item.icone} ${item.nom}`).join(' > ');
  }, [getCategoryPath]);

  // Fonctions de recherche
  const searchCategories = useCallback((query) => {
    if (!query) return categories;
    const searchTerm = query.toLowerCase();
    return categories.filter(cat => 
      cat.nom.toLowerCase().includes(searchTerm)
    );
  }, [categories]);

  const searchSousCategories = useCallback((query, categorieId = null) => {
    let filtered = sousCategories;
    
    // Filtrer par catégorie si spécifiée
    if (categorieId) {
      filtered = getSubCategoriesByCategory(categorieId);
    }

    // Filtrer par query si spécifiée
    if (query) {
      const searchTerm = query.toLowerCase();
      filtered = filtered.filter(sc => 
        sc.nom.toLowerCase().includes(searchTerm)
      );
    }

    return filtered;
  }, [sousCategories, getSubCategoriesByCategory]);

  return {
    // État
    categories,
    sousCategories,
    loading,
    error,

    // Fonctions de chargement
    fetchCategories,
    fetchSousCategories,
    fetchSousCategoriesByCategory,

    // Fonctions utilitaires
    getCategoryById,
    getSubCategoryById,
    getSubCategoriesByCategory,
    getCategoryPath,
    getFullCategoryName,

    // Fonctions de recherche
    searchCategories,
    searchSousCategories,

    // Statistiques
    stats: {
      totalCategories: categories.length,
      totalSousCategories: sousCategories.length,
      activeCategories: categories.filter(c => c.isActive !== false).length,
      activeSousCategories: sousCategories.filter(sc => sc.isActive !== false).length
    }
  };
};

export default useCategories;