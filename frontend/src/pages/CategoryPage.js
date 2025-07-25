// CategoryPage.js - VERSION CORRIGÉE pour éliminer le bug de panique

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import SearchResultsGrid from '../components/SearchResultsGrid';
import PriceRangeSlider from '../components/PriceRangeSlider';
import { useAuth } from '../contexts/AuthContext';

const CategoryPage = () => {
  const { categoryId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // CORRECTION 1: États de contrôle pour éviter les boucles
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPriceStatsLoaded, setIsPriceStatsLoaded] = useState(false);
  const isFirstRender = useRef(true);
  const priceInitialized = useRef(false);

  // États existants
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
  
  // CORRECTION 2: Initialisation sécurisée du prix range
  const [priceRange, setPriceRange] = useState(() => {
    const minPrice = searchParams.get('min_prix');
    const maxPrice = searchParams.get('max_prix');
    return [
      minPrice ? parseInt(minPrice) : 0,
      maxPrice ? parseInt(maxPrice) : 10000
    ];
  });
  
  const [isFilteringByPrice, setIsFilteringByPrice] = useState(false);

  // CORRECTION 3: Validation robuste des valeurs de prix
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
    } catch (error) {
      console.error('Erreur lors du chargement des attributs:', error);
    }
  }, [categoryId]);

  // CORRECTION 4: fetchPriceStats sécurisé
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
      
      // Valider les stats reçues
      if (stats && typeof stats.suggestedMin === 'number' && typeof stats.suggestedMax === 'number') {
        setPriceStats(stats);
        setIsPriceStatsLoaded(true);
        
        // CORRECTION 5: Initialisation du prix SEULEMENT la première fois
        if (!priceInitialized.current) {
          const minPrice = searchParams.get('min_prix');
          const maxPrice = searchParams.get('max_prix');
          
          let initialRange;
          if (minPrice || maxPrice) {
            // Utiliser les valeurs de l'URL si présentes
            initialRange = [
              minPrice ? parseInt(minPrice) : stats.suggestedMin,
              maxPrice ? parseInt(maxPrice) : stats.suggestedMax
            ];
          } else {
            // Sinon utiliser les valeurs par défaut des stats
            initialRange = [stats.suggestedMin, stats.suggestedMax];
          }
          
          const validatedRange = validatePriceRange(initialRange, stats);
          setPriceRange(validatedRange);
          priceInitialized.current = true;
        }
      } else {
        // Fallback si les stats sont invalides
        setPriceStats({
          minPrice: 0,
          maxPrice: 10000,
          suggestedMin: 0,
          suggestedMax: 10000,
          step: 100
        });
        setIsPriceStatsLoaded(true);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques de prix:', error);
      setPriceStats({
        minPrice: 0,
        maxPrice: 10000,
        suggestedMin: 0,
        suggestedMax: 10000,
        step: 100
      });
      setIsPriceStatsLoaded(true);
    }
  }, [categoryId, filters.sous_categorie, searchParams, validatePriceRange]);

  const fetchAnnonces = useCallback(async () => {
    if (!isPriceStatsLoaded) return; // Attendre que les stats soient chargées
    
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('categorie', categoryId);
      params.append('show_inactive', 'false');
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });

      if (priceStats && priceRange) {
        if (priceRange[0] > priceStats.suggestedMin) {
          params.append('min_prix', priceRange[0]);
        }
        if (priceRange[1] < priceStats.suggestedMax) {
          params.append('max_prix', priceRange[1]);
        }
      }

      Object.keys(attributeFilters).forEach(attributeId => {
        if (attributeFilters[attributeId]) {
          params.append(`attr_${attributeId}`, attributeFilters[attributeId]);
        }
      });
      
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/annonces?${params}`);
      setAnnonces(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des annonces:', error);
    } finally {
      setLoading(false);
    }
  }, [categoryId, filters, priceRange, priceStats, attributeFilters, isPriceStatsLoaded]);

  // CORRECTION 6: Gestion sécurisée des changements de prix
  const handlePriceRangeChange = useCallback((newRange) => {
    if (!isPriceStatsLoaded || !priceStats) return;
    
    const validatedRange = validatePriceRange(newRange, priceStats);
    setPriceRange(validatedRange);
    setIsFilteringByPrice(true);
  }, [validatePriceRange, priceStats, isPriceStatsLoaded]);

  const handlePriceRangeChangeComplete = useCallback((finalRange) => {
    setIsFilteringByPrice(false);
  }, []);

  const updateURL = useCallback(() => {
    if (!isInitialized) return; // Ne pas mettre à jour l'URL avant l'initialisation complète
    
    const params = new URLSearchParams();
    
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.set(key, filters[key]);
    });
    
    if (priceStats && priceRange) {
      if (priceRange[0] > priceStats.suggestedMin) {
        params.set('min_prix', priceRange[0]);
      }
      if (priceRange[1] < priceStats.suggestedMax) {
        params.set('max_prix', priceRange[1]);
      }
    }
    
    Object.keys(attributeFilters).forEach(attributeId => {
      if (attributeFilters[attributeId]) {
        params.set(`attr_${attributeId}`, attributeFilters[attributeId]);
      }
    });
    
    setSearchParams(params);
  }, [filters, priceRange, priceStats, attributeFilters, setSearchParams, isInitialized]);

  const handleFilterChange = useCallback((e) => {
    setFilters(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  }, []);

  const handleAttributeFilterChange = useCallback((attributeId, value) => {
    setAttributeFilters(prev => ({
      ...prev,
      [attributeId]: value
    }));
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
    
    if (priceStats) {
      const resetRange = [priceStats.suggestedMin, priceStats.suggestedMax];
      setPriceRange(resetRange);
    }
  }, [priceStats]);

  // CORRECTION 7: Effects sécurisés avec dépendances contrôlées
  useEffect(() => {
    if (categoryId) {
      const initializeData = async () => {
        await Promise.all([
          fetchCategory(),
          fetchSousCategories(),
          fetchCategoryAttributes(),
          fetchPriceStats()
        ]);
        
        // Marquer comme initialisé après un court délai
        setTimeout(() => {
          setIsInitialized(true);
          isFirstRender.current = false;
        }, 100);
      };
      
      initializeData();
    }
  }, [categoryId, fetchCategory, fetchSousCategories, fetchCategoryAttributes, fetchPriceStats]);

  // Effect séparé pour les annonces
  useEffect(() => {
    if (isPriceStatsLoaded) {
      fetchAnnonces();
    }
  }, [fetchAnnonces, isPriceStatsLoaded]);

  // Effect pour l'URL (avec débounce)
  useEffect(() => {
    if (!isFirstRender.current) {
      const timeoutId = setTimeout(() => {
        updateURL();
      }, isFilteringByPrice ? 300 : 0);

      return () => clearTimeout(timeoutId);
    }
  }, [updateURL, isFilteringByPrice]);

  // Effect pour refresh des stats quand sous-catégorie change
  useEffect(() => {
    if (filters.sous_categorie && isPriceStatsLoaded) {
      priceInitialized.current = false; // Reset pour permettre re-init
      fetchPriceStats();
    }
  }, [filters.sous_categorie, fetchPriceStats, isPriceStatsLoaded]);

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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            <option value="">Toutes les options</option>
            {attribute.options?.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'boolean':
        return (
          <select
            value={value}
            onChange={(e) => handleAttributeFilterChange(attribute._id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            <option value="">Indifférent</option>
            <option value="true">Oui</option>
            <option value="false">Non</option>
          </select>
        );

      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleAttributeFilterChange(attribute._id, e.target.value)}
            placeholder={attribute.placeholder || `Filtrer par ${attribute.nom.toLowerCase()}`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleAttributeFilterChange(attribute._id, e.target.value)}
            placeholder={attribute.placeholder || `Filtrer par ${attribute.nom.toLowerCase()}`}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        );
    }
  };

  if (loading && !category) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
      </div>
    );
  }

  if (!category && !loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Catégorie non trouvée</h1>
        <button
          onClick={() => navigate('/')}
          className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header de la catégorie */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => navigate('/')}
              className="text-white hover:text-orange-200 transition"
            >
              ← Retour à l'accueil
            </button>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-6xl">{category?.icone}</div>
            <div>
              <h1 className="text-4xl font-bold">{category?.nom}</h1>
              <p className="text-xl opacity-90">
                {filteredAnnonces.length} annonce{filteredAnnonces.length > 1 ? 's' : ''} disponible{filteredAnnonces.length > 1 ? 's' : ''}
                {priceStats && priceStats.totalAnnonces > 0 && (
                  <span className="ml-2 text-sm">
                    • Prix moyen: {new Intl.NumberFormat('fr-MA').format(priceStats.avgPrice)} MAD
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Barre de filtres à gauche */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900">Filtres</h2>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden text-orange-500 hover:text-orange-600"
                >
                  {showFilters ? 'Masquer' : 'Afficher'}
                </button>
              </div>

              <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                {/* Recherche */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rechercher
                  </label>
                  <input
                    type="text"
                    name="recherche"
                    placeholder="Mots-clés..."
                    value={filters.recherche}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>

                {/* Sous-catégories */}
                {sousCategories.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sous-catégorie
                    </label>
                    <select
                      name="sous_categorie"
                      value={filters.sous_categorie}
                      onChange={handleFilterChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                    >
                      <option value="">Toutes les sous-catégories</option>
                      {sousCategories.map((sousCategorie) => (
                        <option key={sousCategorie._id} value={sousCategorie._id}>
                          {sousCategorie.icone} {sousCategorie.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Ville */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ville
                  </label>
                  <input
                    type="text"
                    name="ville"
                    placeholder="Ville..."
                    value={filters.ville}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>

                {/* PRICE RANGE SLIDER - SEULEMENT SI LES STATS SONT CHARGÉES */}
                {priceStats && isPriceStatsLoaded && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      <span className="flex items-center justify-between">
                        <span>Prix ({priceStats.currency || 'MAD'})</span>
                        {isFilteringByPrice && (
                          <span className="text-xs text-orange-500 flex items-center">
                            <span className="inline-block w-2 h-2 bg-orange-500 rounded-full animate-pulse mr-1"></span>
                            Filtrage...
                          </span>
                        )}
                      </span>
                    </label>
                    
                    <PriceRangeSlider
                      min={priceStats.suggestedMin}
                      max={priceStats.suggestedMax}
                      value={priceRange}
                      onChange={handlePriceRangeChange}
                      onChangeComplete={handlePriceRangeChangeComplete}
                      step={priceStats.step}
                      currency="MAD"
                      priceRanges={priceStats.priceRanges}
                    />
                  </div>
                )}

                {/* État */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    État
                  </label>
                  <select
                    name="etat"
                    value={filters.etat}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                  >
                    <option value="">Tous états</option>
                    <option value="Neuf">Neuf</option>
                    <option value="Comme neuf">Comme neuf</option>
                    <option value="Bon état">Bon état</option>
                    <option value="État moyen">État moyen</option>
                  </select>
                </div>

                {/* Marque */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marque
                  </label>
                  <input
                    type="text"
                    name="marque"
                    placeholder="Marque..."
                    value={filters.marque}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>

                {/* Attributs spécifiques */}
                {categoryAttributes.length > 0 && (
                  <>
                    <hr className="border-gray-200" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                        <span className="mr-2">🔧</span>
                        Critères spécifiques
                      </h3>
                      <div className="space-y-4">
                        {categoryAttributes.map((attribute) => (
                          <div key={attribute._id}>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
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
                  </>
                )}

                {/* Tri */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Trier par
                  </label>
                  <select
                    name="tri"
                    value={filters.tri}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                  >
                    <option value="date_desc">Plus récent</option>
                    <option value="date_asc">Plus ancien</option>
                    <option value="prix_asc">Prix croissant</option>
                    <option value="prix_desc">Prix décroissant</option>
                    <option value="titre_asc">Titre A-Z</option>
                    <option value="titre_desc">Titre Z-A</option>
                  </select>
                </div>

                {/* Bouton reset */}
                <button
                  onClick={handleResetFilters}
                  className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            </div>
          </div>

          {/* Résultats à droite */}
          <div className="lg:col-span-3">
            {/* Filtres actifs */}
            {hasActiveFilters() && (
              <div className="mb-6 bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-700">Filtres actifs :</h3>
                  <button
                    onClick={handleResetFilters}
                    className="text-xs text-red-500 hover:text-red-600"
                  >
                    Tout supprimer
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(filters).map(([key, value]) => {
                    if (!value || value === 'date_desc') return null;
                    
                    let displayValue = value;
                    let displayKey = key;
                    
                    if (key === 'sous_categorie') {
                      displayValue = getSelectedSubCategoryName();
                      displayKey = 'Sous-catégorie';
                    } else {
                      displayKey = key.charAt(0).toUpperCase() + key.slice(1);
                    }
                    
                    return (
                      <span
                        key={key}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800"
                      >
                        <strong>{displayKey}:</strong>&nbsp;{displayValue}
                        <button
                          onClick={() => setFilters({...filters, [key]: key === 'tri' ? 'date_desc' : ''})}
                          className="ml-2 text-orange-600 hover:text-orange-800"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}

                  {priceStats && (priceRange[0] > priceStats.suggestedMin || priceRange[1] < priceStats.suggestedMax) && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
                      <strong>Prix:</strong>&nbsp;{new Intl.NumberFormat('fr-MA').format(priceRange[0])} - {new Intl.NumberFormat('fr-MA').format(priceRange[1])} MAD
                      <button
                        onClick={() => setPriceRange([priceStats.suggestedMin, priceStats.suggestedMax])}
                        className="ml-2 text-green-600 hover:text-green-800"
                      >
                        ×
                      </button>
                    </span>
                  )}

                  {Object.entries(attributeFilters).map(([attributeId, value]) => {
                    if (!value) return null;
                    
                    const attribute = categoryAttributes.find(attr => attr._id === attributeId);
                    if (!attribute) return null;
                    
                    return (
                      <span
                        key={attributeId}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                      >
                        <strong>{attribute.nom}:</strong>&nbsp;{value}
                        <button
                          onClick={() => handleAttributeFilterChange(attributeId, '')}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            <SearchResultsGrid 
              annonces={filteredAnnonces}
              title={
                filters.sous_categorie 
                  ? `${getSelectedSubCategoryName()} dans ${category?.nom}`
                  : `Toutes les annonces dans ${category?.nom}`
              }
              loading={loading}
            />

            {!loading && filteredAnnonces.length === 0 && (
              <div className="text-center py-16 bg-white rounded-lg shadow-md">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune annonce trouvée</h3>
                <p className="text-gray-500 mb-6">
                  Essayez de modifier vos critères de recherche
                </p>
                <button
                  onClick={handleResetFilters}
                  className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition"
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