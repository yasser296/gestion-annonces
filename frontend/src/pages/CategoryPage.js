// CategoryPage.js - Intégration de l'autocomplétion dans les filtres
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import SearchResultsGrid from '../components/SearchResultsGrid';
import PriceRangeSlider from '../components/PriceRangeSlider';
import AutocompleteInput from '../components/AutocompleteInput';
import useAutocomplete from '../hooks/useAutocomplete';
import { useAuth } from '../contexts/AuthContext';
import CitySelect from '../components/CitySelect';

const CategoryPage = () => {
  const { categoryId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [availableCities, setAvailableCities] = useState([]);

  // États de contrôle
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPriceStatsLoaded, setIsPriceStatsLoaded] = useState(false);
  const isFirstRender = useRef(true);
  const priceInitialized = useRef(false);
  const previousCategoryId = useRef(categoryId);
  const previousSousCategorie = useRef('');

  // États principaux
  const [annonces, setAnnonces] = useState([]);
  const [category, setCategory] = useState(null);
  const [sousCategories, setSousCategories] = useState([]);
  const [categoryAttributes, setCategoryAttributes] = useState([]);
  const [priceStats, setPriceStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  const [filters, setFilters] = useState({
    sous_categorie: searchParams.get('sous_categorie') || '',
    ville: searchParams.get('ville') || '',
    recherche: searchParams.get('recherche') || '',
    etat: searchParams.get('etat') || '',
    marque: searchParams.get('marque') || '',
    tri: searchParams.get('tri') || 'date_desc'
  });

  const [attributeFilters, setAttributeFilters] = useState({});
  const [priceRange, setPriceRange] = useState(() => {
    const minPrice = searchParams.get('min_prix');
    const maxPrice = searchParams.get('max_prix');
    return [
      minPrice ? parseInt(minPrice) : 0,
      maxPrice ? parseInt(maxPrice) : 10000
    ];
  });
  const [isFilteringByPrice, setIsFilteringByPrice] = useState(false);

  // Hooks d'autocomplétion pour les champs de recherche et ville
  const searchAutocomplete = useAutocomplete(filters.recherche, (searchData) => {
    // Valider que la recherche n'est pas vide
    const query = searchData.query?.trim();
    if (query) {
      setFilters(prev => ({ ...prev, recherche: query }));
    }
  });

  // const cityAutocomplete = useAutocomplete(filters.ville, (searchData) => {
  //   setFilters(prev => ({ ...prev, ville: searchData.query }));
  // });

  const brandAutocomplete = useAutocomplete(filters.marque, (searchData) => {
    // Valider que la marque n'est pas vide
    const brand = searchData.query?.trim();
    if (brand) {
      setFilters(prev => ({ ...prev, marque: brand }));
    }
  });

  const fetchAvailableCities = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/annonces/cities/all?category=${categoryId}`
      );
      setAvailableCities(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des villes:', error);
    }
  }, [categoryId]);

  useEffect(() => {
    // Vérifier si la sous-catégorie a réellement changé (et qu'on n'est pas au premier rendu)
    if (!isFirstRender.current && 
        previousSousCategorie.current !== filters.sous_categorie && 
        filters.sous_categorie) {
      
      console.log('Changement de sous-catégorie détecté, réinitialisation des filtres de recherche');
      console.log('Ancienne sous-catégorie:', previousSousCategorie.current);
      console.log('Nouvelle sous-catégorie:', filters.sous_categorie);
      
      // Réinitialiser uniquement les filtres qui peuvent causer des conflits
      setFilters(prev => ({
        ...prev,
        recherche: '',
        marque: '',
        etat: ''
        // On garde: sous_categorie, ville, tri
      }));
      
      // Réinitialiser les champs d'autocomplétion
      searchAutocomplete.resetSearch();
      brandAutocomplete.resetSearch();
      
      // Réinitialiser les attributs spécifiques
      setAttributeFilters({});
      
      // Les filtres de prix seront rechargés automatiquement par l'autre useEffect
    }
    
    // Mettre à jour la référence pour le prochain changement
    previousSousCategorie.current = filters.sous_categorie;
  }, [filters.sous_categorie, searchAutocomplete, brandAutocomplete]);

  // Synchroniser les hooks avec les filtres
  useEffect(() => {
    searchAutocomplete.setSearchValue(filters.recherche);
    brandAutocomplete.setSearchValue(filters.marque);
  }, [filters.recherche, filters.ville, filters.marque]);

  useEffect(() => {
    if (previousCategoryId.current && previousCategoryId.current !== categoryId) {
      // La catégorie a changé, réinitialiser les filtres
      handleResetFilters();
    }
    previousCategoryId.current = categoryId;
  }, [categoryId]);


  useEffect(() => {
    // Vérifier si la sous-catégorie a réellement changé (et qu'on n'est pas au premier rendu)
    if (!isFirstRender.current && 
        previousSousCategorie.current !== filters.sous_categorie && 
        filters.sous_categorie) {
      
      console.log('Changement de sous-catégorie détecté, réinitialisation des filtres de recherche');
      console.log('Ancienne sous-catégorie:', previousSousCategorie.current);
      console.log('Nouvelle sous-catégorie:', filters.sous_categorie);
      
      // Réinitialiser uniquement les filtres qui peuvent causer des conflits
      setFilters(prev => ({
        ...prev,
        recherche: '',
        marque: '',
        etat: ''
        // On garde: sous_categorie, ville, tri
      }));
      
      // Réinitialiser les champs d'autocomplétion
      searchAutocomplete.resetSearch();
      brandAutocomplete.resetSearch();
      
      // Réinitialiser les attributs spécifiques
      setAttributeFilters({});
      
      // Les filtres de prix seront rechargés automatiquement par l'autre useEffect
    }
    
    // Mettre à jour la référence pour le prochain changement
    previousSousCategorie.current = filters.sous_categorie;
  }, [filters.sous_categorie, searchAutocomplete, brandAutocomplete]);

  // Validation robuste des valeurs de prix
  const validatePriceRange = useCallback((range, stats) => {
    if (!Array.isArray(range) || range.length !== 2) {
      return stats ? [stats.suggestedMin, stats.suggestedMax] : [0, 10000];
    }
    
    const [min, max] = range;
    const minVal = Number(min) || 0;
    const maxVal = Number(max) || 10000;
    
    if (stats) {
      const clampedMin = Math.max(stats.suggestedMin, Math.min(stats.suggestedMax, minVal));
      const clampedMax = Math.max(stats.suggestedMin, Math.min(stats.suggestedMax, maxVal));
      
      if (clampedMin >= clampedMax) {
        return [stats.suggestedMin, stats.suggestedMax];
      }
      
      return [clampedMin, clampedMax];
    }
    
    return [Math.max(0, minVal), Math.max(minVal + 100, maxVal)];
  }, []);

  // Fonctions de fetch avec useCallback
  const fetchCategory = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/categories/${categoryId}`);
      setCategory(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement de la catégorie:', error);
    }
  }, [categoryId]);

  const fetchSousCategories = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/sous-categories/by-category/${categoryId}`);
      setSousCategories(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des sous-catégories:', error);
    }
  }, [categoryId]);

  const fetchCategoryAttributes = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/attributes/by-category/${categoryId}`);
      setCategoryAttributes(response.data);
      
      const initialAttributeFilters = {};
      response.data.forEach(attr => {
        const value = searchParams.get(`attr_${attr._id}`);
        if (value) {
          initialAttributeFilters[attr._id] = value;
        }
      });
      setAttributeFilters(initialAttributeFilters);
    } catch (error) {
      console.error('Erreur lors du chargement des attributs:', error);
    }
  }, [categoryId, searchParams]);

  const fetchPriceStats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filters.sous_categorie) {
        params.append('sous_categorie', filters.sous_categorie);
      }
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/annonces/price-stats/${categoryId}?${params}`
      );
      
      const stats = response.data;
      
      if (stats && typeof stats.suggestedMin === 'number' && typeof stats.suggestedMax === 'number') {
        setPriceStats(stats);
        setIsPriceStatsLoaded(true);
        
        if (!priceInitialized.current) {
          const minPrice = searchParams.get('min_prix');
          const maxPrice = searchParams.get('max_prix');
          
          let initialRange;
          if (minPrice || maxPrice) {
            initialRange = [
              minPrice ? parseInt(minPrice) : stats.suggestedMin,
              maxPrice ? parseInt(maxPrice) : stats.suggestedMax
            ];
          } else {
            initialRange = [stats.suggestedMin, stats.suggestedMax];
          }
          
          const validatedRange = validatePriceRange(initialRange, stats);
          setPriceRange(validatedRange);
          priceInitialized.current = true;
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des stats de prix:', error);
      setIsPriceStatsLoaded(true);
    }
  }, [categoryId, filters.sous_categorie, searchParams, validatePriceRange]);

  const fetchAnnonces = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      params.append('categorie', categoryId);
      params.append('show_inactive', 'false');
      
      // Ne pas ajouter les filtres vides ou avec seulement des espaces
      Object.keys(filters).forEach(key => {
        const value = filters[key];
        if (value && typeof value === 'string' && value.trim().length > 0 && key !== 'tri') {
          params.append(key, value.trim());
        }
      });
      
      if (priceStats && (priceRange[0] > priceStats.suggestedMin || priceRange[1] < priceStats.suggestedMax)) {
        params.append('min_prix', priceRange[0]);
        params.append('max_prix', priceRange[1]);
      }
      
      Object.keys(attributeFilters).forEach(attributeId => {
        if (attributeFilters[attributeId]) {
          params.append(`attr_${attributeId}`, attributeFilters[attributeId]);
        }
      });
      
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/annonces?${params}`);
      let fetchedAnnonces = response.data;
      
      // Appliquer le tri côté client
      switch (filters.tri) {
        case 'date_asc':
          fetchedAnnonces.sort((a, b) => new Date(a.date_publication) - new Date(b.date_publication));
          break;
        case 'prix_asc':
          fetchedAnnonces.sort((a, b) => a.prix - b.prix);
          break;
        case 'prix_desc':
          fetchedAnnonces.sort((a, b) => b.prix - a.prix);
          break;
        case 'titre_asc':
          fetchedAnnonces.sort((a, b) => a.titre.localeCompare(b.titre));
          break;
        case 'titre_desc':
          fetchedAnnonces.sort((a, b) => b.titre.localeCompare(a.titre));
          break;
        default:
          fetchedAnnonces.sort((a, b) => new Date(b.date_publication) - new Date(a.date_publication));
      }
      
      setAnnonces(fetchedAnnonces);
      console.log('=== DEBUG FILTRES ATTRIBUTS ===');
      console.log('attributeFilters:', attributeFilters);
      console.log('Params envoyés au backend:');
      params.forEach((value, key) => {
        console.log(`${key}: ${value}`);
      });
    } catch (error) {
      console.error('Erreur lors du chargement des annonces:', error);
    } finally {
      setLoading(false);
    }
  }, [categoryId, filters, priceRange, priceStats, attributeFilters]);

  const updateURL = useCallback(() => {
    if (!isInitialized) return;
    
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key] && filters[key] !== 'date_desc') {
        params.set(key, filters[key]);
      }
    });
    
    if (priceStats && (priceRange[0] > priceStats.suggestedMin || priceRange[1] < priceStats.suggestedMax)) {
      params.set('min_prix', priceRange[0]);
      params.set('max_prix', priceRange[1]);
    }
    
    Object.keys(attributeFilters).forEach(attributeId => {
      if (attributeFilters[attributeId]) {
        params.set(`attr_${attributeId}`, attributeFilters[attributeId]);
      }
    });
    
    setSearchParams(params);
  }, [filters, priceRange, priceStats, attributeFilters, setSearchParams, isInitialized]);

  // Gestionnaires d'événements
  const handleFilterChange = useCallback((e) => {
    setFilters(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  }, []);

  const handleAttributeFilterChange = useCallback((attributeId, value) => {
    console.log('Changement attribut:', { attributeId, value });
    setAttributeFilters(prev => {
    const newFilters = {
      ...prev,
      [attributeId]: value
    };
    console.log('Nouveaux filtres attributs:', newFilters);
    return newFilters;
  });
}, []);

  const handlePriceRangeChange = useCallback((newRange) => {
    setIsFilteringByPrice(true);
    setPriceRange(newRange);
  }, []);

  const handlePriceRangeChangeComplete = useCallback(() => {
    setIsFilteringByPrice(false);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters({
      sous_categorie: '',
      ville: '',
      recherche: '',
      etat: '',
      marque: '',
      tri: 'date_desc'
    });
    setAttributeFilters({});
    
    // Reset des autocompletes
    searchAutocomplete.resetSearch();
    brandAutocomplete.resetSearch();
    
    if (priceStats) {
      const resetRange = [priceStats.suggestedMin, priceStats.suggestedMax];
      setPriceRange(resetRange);
    }
  }, [priceStats, searchAutocomplete, brandAutocomplete]);

  // Effects
  useEffect(() => {
    if (categoryId) {
      const initializeData = async () => {
        await Promise.all([
          fetchCategory(),
          fetchSousCategories(),
          fetchCategoryAttributes(),
          fetchPriceStats(),
          fetchAvailableCities()
        ]);
        
        setTimeout(() => {
          setIsInitialized(true);
          isFirstRender.current = false;
        }, 100);
      };
      
      initializeData();
    }
  }, [categoryId, fetchCategory, fetchSousCategories, fetchCategoryAttributes, fetchPriceStats, fetchAvailableCities]);

  useEffect(() => {
    if (isPriceStatsLoaded) {
      fetchAnnonces();
    }
  }, [fetchAnnonces, isPriceStatsLoaded]);

  useEffect(() => {
    if (!isFirstRender.current ) {
      const timeoutId = setTimeout(() => {
        updateURL();
      }, isFilteringByPrice ? 300 : 0);

      return () => clearTimeout(timeoutId);
    }
  }, [updateURL, isFilteringByPrice]);

  useEffect(() => {
    if (filters.sous_categorie && isPriceStatsLoaded) {
      priceInitialized.current = false;
      fetchPriceStats();
    }
  }, [filters.sous_categorie, fetchPriceStats, isPriceStatsLoaded]);

  useEffect(() => {
    // Réinitialiser les filtres quand on change de catégorie
    if (!isFirstRender.current) {
      handleResetFilters();
      // Recharger les villes disponibles pour la nouvelle catégorie
      fetchAvailableCities();
    }
  }, [categoryId]);

  // Fonctions utilitaires
  const filteredAnnonces = annonces.filter(a => 
    !user || (a.user_id !== user.id && a.user_id?._id !== user.id)
  );

  const getSelectedSubCategoryName = () => {
    if (!filters.sous_categorie) return null;
    const subCategory = sousCategories.find(sc => sc._id === filters.sous_categorie);
    return subCategory?.nom;
  };

  const hasActiveFilters = () => {
    const hasBasicFilters = Object.values(filters).some(value => value !== '' && value !== 'date_desc');
    const hasAttributeFilters = Object.values(attributeFilters).some(value => value !== '');
    const hasPriceFilter = priceStats && (
      priceRange[0] > priceStats.suggestedMin || 
      priceRange[1] < priceStats.suggestedMax
    );
    
    return hasBasicFilters || hasAttributeFilters || hasPriceFilter;
  };

  const renderAttributeFilter = (attribute) => {
    const value = attributeFilters[attribute._id] || '';

    switch (attribute.type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleAttributeFilterChange(attribute._id, e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
          >
            <option value="">Sélectionner...</option>
            {attribute.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleAttributeFilterChange(attribute._id, e.target.value)}
            placeholder={`${attribute.nom}...`}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleAttributeFilterChange(attribute._id, e.target.value)}
            placeholder={`${attribute.nom}...`}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
          />
        );
    }
  };
  console.log("filteredAnnonces:", filteredAnnonces, "loading:", loading);
  console.log('annonces', annonces);
  console.log('filters', filters);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* En-tête de catégorie moderne */}
      <div className="bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 py-16">
          <div className="text-center text-white">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">{category?.icone || '📂'}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {category?.nom || 'Catégorie'}
            </h1>
            <p className="text-xl opacity-90 mb-6">
              {filteredAnnonces.length} annonce{filteredAnnonces.length !== 1 ? 's' : ''} disponible{filteredAnnonces.length !== 1 ? 's' : ''}
            </p>
            
            {/* Sous-catégories en chips modernes */}
            {sousCategories.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => setFilters({...filters, sous_categorie: ''})}
                  className={`px-6 py-3 rounded-full transition-all font-medium ${
                    !filters.sous_categorie
                      ? 'bg-white text-gray-900 shadow-lg'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  Toutes
                </button>
                {sousCategories.map((sousCategorie) => (
                  <button
                    key={sousCategorie._id}
                    onClick={() => setFilters({...filters, sous_categorie: sousCategorie._id})}
                    className={`px-6 py-3 rounded-full transition-all font-medium ${
                      filters.sous_categorie === sousCategorie._id
                        ? 'bg-white text-gray-900 shadow-lg'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {sousCategorie.icone} {sousCategorie.nom}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar des filtres moderne */}
          <div className="lg:w-1/4">

            {/* Bouton reset moderne */}
            {hasActiveFilters() && (
              <button
                onClick={handleResetFilters}
                className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-4 rounded-2xl hover:shadow-lg transition-all transform hover:scale-105 font-semibold flex items-center justify-center space-x-2 mb-8"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Réinitialiser les filtres</span>
              </button>
            )}
              
            {/* Bouton toggle pour mobile */}
            <div className="lg:hidden mb-6">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="w-full bg-white rounded-2xl p-4 shadow-lg flex items-center justify-between font-medium"
              >
                <span className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                  <span>Filtres</span>
                </span>
                <span>{showFilters ? 'Masquer' : 'Afficher'}</span>
              </button>
            </div>

            {/* Panneau des filtres avec autocomplétion */}
            <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              {/* Card de recherche avec autocomplétion */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Recherche
                </h3>
                <AutocompleteInput
                  value={searchAutocomplete.searchValue}
                  onChange={searchAutocomplete.handleInputChange}
                  onSelect={searchAutocomplete.handleSuggestionSelect}
                  placeholder="Mots-clés..."
                  type="titles"
                  category={categoryId}
                  showTrending={true}
                />
              </div>

              {/* Card de localisation avec select */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  Localisation
                </h3>
                <CitySelect
                  value={filters.ville}
                  onChange={(value) => setFilters(prev => ({ ...prev, ville: value }))}
                  categoryId={categoryId}
                  showCount={true}
                />
              </div>

              {/* Card de prix */}
              {priceStats && (
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Prix
                  </h3>
                  <div className="space-y-4">
                    <PriceRangeSlider
                      min={priceStats.suggestedMin}
                      max={priceStats.suggestedMax}
                      value={priceRange}
                      onChange={handlePriceRangeChange}
                      onChangeComplete={handlePriceRangeChangeComplete}
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{priceRange[0]} MAD</span>
                      <span>{priceRange[1]} MAD</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Card des critères généraux */}
              {/* <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Critères
                </h3>
                <div className="space-y-4"> */}
                  {/* État */}
                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">État</label>
                    <select
                      name="etat"
                      value={filters.etat}
                      onChange={handleFilterChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
                    >
                      <option value="">Tous états</option>
                      <option value="Neuf">Neuf</option>
                      <option value="Comme neuf">Comme neuf</option>
                      <option value="Bon état">Bon état</option>
                      <option value="État moyen">État moyen</option>
                    </select>
                  </div> */}

                  {/* Marque avec autocomplétion */}
                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Marque</label>
                    <AutocompleteInput
                      value={brandAutocomplete.searchValue}
                      onChange={brandAutocomplete.handleInputChange}
                      onSelect={brandAutocomplete.handleSuggestionSelect}
                      placeholder="Marque..."
                      type="brands"
                      category={categoryId}
                    />
                  </div>
                </div>
              </div> */}

              {/* Card des attributs spécifiques */}
              {categoryAttributes.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Critères spécifiques
                  </h3>
                  <div className="space-y-4">
                    {categoryAttributes.map((attribute) => (
                      <div key={attribute._id}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {attribute.nom}
                        </label>
                        {renderAttributeFilter(attribute)}
                        {attribute.description && (
                          <p className="text-xs text-gray-500 mt-1">
                            {attribute.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Card de tri */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
                  </svg>
                  Trier par
                </h3>
                <select
                  name="tri"
                  value={filters.tri}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
                >
                  <option value="date_desc">Plus récent</option>
                  <option value="date_asc">Plus ancien</option>
                  <option value="prix_asc">Prix croissant</option>
                  <option value="prix_desc">Prix décroissant</option>
                  <option value="titre_asc">Titre A-Z</option>
                  <option value="titre_desc">Titre Z-A</option>
                </select>
              </div>

              

              {/* Indicateur de filtres actifs */}
              {hasActiveFilters() && (
                <div className="bg-gradient-to-r from-orange-100 to-pink-100 rounded-2xl p-4 border-l-4 border-orange-500">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-orange-800 font-medium text-sm">
                      Filtres appliqués
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Contenu principal */}
          <div className="lg:w-3/4">
            {/* Titre avec compteur */}
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {getSelectedSubCategoryName() 
                      ? `${getSelectedSubCategoryName()} dans ${category?.nom}`
                      : `Toutes les annonces dans ${category?.nom}`
                    }
                  </h2>
                  <p className="text-gray-600">
                    {filteredAnnonces.length} annonce{filteredAnnonces.length !== 1 ? 's' : ''} trouvée{filteredAnnonces.length !== 1 ? 's' : ''}
                  </p>
                </div>
                
                {/* Stats rapides */}
                {priceStats && (
                  <div className="mt-4 md:mt-0 flex space-x-4 text-sm text-gray-600">
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">{priceStats.min} MAD</div>
                      <div>Prix min</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">{priceStats.max} MAD</div>
                      <div>Prix max</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-gray-900">{Math.round(priceStats.avg)} MAD</div>
                      <div>Prix moyen</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Grille des résultats */}
            <SearchResultsGrid 
              annonces={filteredAnnonces}
              loading={loading}
            />

            {/* Message si aucun résultat */}
            {(!loading && filteredAnnonces.length === 0) && (
              <div className="text-center py-16 bg-white rounded-2xl shadow-lg mt-8">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune annonce trouvée</h3>
                <p className="text-gray-500 mb-6">
                  Essayez de modifier vos critères de recherche
                </p>
                <button
                  onClick={handleResetFilters}
                  className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all transform hover:scale-105 font-semibold"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;