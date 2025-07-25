// HomePage.js - Version complète avec toutes les fonctionnalités préservées
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CategoryCarousel from '../components/CategoryCarousel';
import SearchResultsGrid from '../components/SearchResultsGrid';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const [annonces, setAnnonces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sousCategories, setSousCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    categorie: '',
    sous_categorie: '',
    ville: '',
    min_prix: '',
    max_prix: '',
    recherche: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [isFiltered, setIsFiltered] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchSousCategories();
    fetchAnnonces();
    setIsInitialLoad(false);
  }, []);

  useEffect(() => {
    // Vérifier si des filtres sont appliqués
    const hasActiveFilters = Object.values(filters).some(value => value !== '');
    setIsFiltered(hasActiveFilters);
    
    // Refetch les annonces quand les filtres changent (mais pas au premier chargement)
    if (!isInitialLoad) {
      fetchAnnonces();
    }
  }, [filters, isInitialLoad]);

  // Charger les sous-catégories quand une catégorie est sélectionnée
  useEffect(() => {
    if (filters.categorie) {
      fetchSousCategoriesByCategory(filters.categorie);
    } else {
      fetchSousCategories();
    }
    // Réinitialiser la sous-catégorie quand la catégorie change
    if (filters.sous_categorie && filters.categorie) {
      setFilters(prev => ({ ...prev, sous_categorie: '' }));
    }
  }, [filters.categorie]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  };

  const fetchSousCategories = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/sous-categories`);
      setSousCategories(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des sous-catégories:', error);
    }
  };

  const fetchSousCategoriesByCategory = async (categorieId) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/sous-categories/by-category/${categorieId}`);
      setSousCategories(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des sous-catégories:', error);
    }
  };

  const fetchAnnonces = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      
      params.append('show_inactive', 'false');
      
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/annonces?${params}`);
      setAnnonces(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des annonces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleCategoryFilter = (categoryId) => {
    // Rediriger vers CategoryPage au lieu de filtrer sur place
    navigate(`/category/${categoryId}`);
  };

  const handleSubCategoryFilter = (subCategoryId) => {
    // Trouver la catégorie parent de cette sous-catégorie
    const sousCategorie = sousCategories.find(sc => sc._id === subCategoryId);
    const categoryId = sousCategorie?.categorie_id?._id || sousCategorie?.categorie_id;
    
    if (categoryId) {
      // Rediriger vers CategoryPage avec la sous-catégorie pré-sélectionnée
      navigate(`/category/${categoryId}?sous_categorie=${subCategoryId}`);
    }
  };

  const handleSearch = () => {
    if (filters.categorie) {
      // Si une catégorie est sélectionnée, naviguer vers CategoryPage avec les filtres
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] && key !== 'categorie') {
          params.append(key, filters[key]);
        }
      });
      
      const queryString = params.toString();
      navigate(`/category/${filters.categorie}${queryString ? `?${queryString}` : ''}`);
    } else {
      // Si aucune catégorie n'est sélectionnée, garder le filtrage local
      fetchAnnonces();
    }
  };

  const handleResetFilters = () => {
    setFilters({
      categorie: '',
      sous_categorie: '',
      ville: '',
      min_prix: '',
      max_prix: '',
      recherche: ''
    });
  };

  // Grouper les annonces par catégorie
  const annoncesByCategory = categories.reduce((acc, category) => {
    const categoryAnnonces = annonces
      .filter(a => a.categorie_id?._id === category._id || a.categorie_id === category._id)
      .filter(a => !user || (a.user_id !== user.id && a.user_id?._id !== user.id));
    
    if (categoryAnnonces.length > 0) {
      acc[category._id] = {
        category,
        annonces: categoryAnnonces
      };
    }
    return acc;
  }, {});

  // Annonces récentes toutes catégories confondues
  const recentAnnonces = annonces
    .filter(a => !user || (a.user_id !== user.id && a.user_id?._id !== user.id))
    .sort((a, b) => new Date(b.date_publication) - new Date(a.date_publication))
    .slice(0, 20);

  if (loading && annonces.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des annonces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Hero Section avec dégradé moderne */}
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600">
        {/* Effet de superposition avec motifs */}
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
        
        {/* Formes décoratives */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-yellow-400/20 to-transparent rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <h1 className="text-white text-5xl md:text-6xl font-bold mb-6 tracking-tight">
            Trouvez ce que vous 
            <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent"> cherchez</span>
          </h1>
          <p className="text-white text-xl mb-12 opacity-90 max-w-2xl mx-auto">
            Des milliers d'annonces dans toutes les catégories au Maroc
          </p>
          
          {/* Barre de recherche moderne avec effet glassmorphism */}
          <div className="max-w-5xl mx-auto">
            <div className="glass-effect rounded-3xl p-3 shadow-2xl border border-white/20">
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="recherche"
                    placeholder="Que recherchez-vous ?"
                    value={filters.recherche}
                    onChange={handleFilterChange}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border-0 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-gray-700 bg-gray-50/50 focus:bg-white transition-all search-glow"
                  />
                </div>
                
                <div className="flex-1 relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <select
                    name="categorie"
                    value={filters.categorie}
                    onChange={handleFilterChange}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border-0 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-gray-700 bg-gray-50/50 focus:bg-white transition-all appearance-none"
                  >
                    <option value="">Toutes catégories</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400 group-focus-within:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    name="ville"
                    placeholder="Ville"
                    value={filters.ville}
                    onChange={handleFilterChange}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border-0 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-gray-700 bg-gray-50/50 focus:bg-white transition-all"
                  />
                </div>

                <button
                  onClick={handleSearch}
                  className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-8 py-4 rounded-2xl hover:shadow-xl transition-all transform hover:scale-105 font-semibold flex items-center justify-center space-x-2 min-w-[140px]"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Rechercher</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section des catégories avec cards modernes */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Explorez par catégorie</h2>
          <p className="text-gray-600 text-lg">Découvrez nos catégories les plus populaires</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6 mb-16">
          {/* Bouton Toutes catégories */}
          <button
            onClick={() => setFilters({...filters, categorie: ''})}
            className={`group relative overflow-hidden rounded-3xl p-6 text-center transition-all duration-300 transform hover:scale-105 hover:shadow-2xl category-card ${
              !filters.categorie 
                ? 'bg-gradient-to-br from-orange-400 to-pink-500 text-white shadow-xl scale-105' 
                : 'bg-white hover:shadow-xl shadow-lg'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all ${
                !filters.categorie 
                  ? 'bg-white/20' 
                  : 'bg-gradient-to-br from-orange-100 to-pink-100 group-hover:from-orange-200 group-hover:to-pink-200'
              }`}>
                <svg className={`w-8 h-8 transition-colors ${!filters.categorie ? 'text-white' : 'text-orange-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
                </svg>
              </div>
              <p className={`font-semibold transition-colors ${!filters.categorie ? 'text-white' : 'text-gray-800 group-hover:text-orange-600'}`}>
                Toutes
              </p>
            </div>
          </button>
          
          {/* Boutons de catégories */}
          {categories.map((category) => (
            <button
              key={category._id}
              onClick={() => handleCategoryFilter(category._id)}
              className="group relative overflow-hidden bg-white rounded-3xl p-6 text-center shadow-lg transition-all duration-300 transform hover:scale-105 hover:shadow-2xl category-card"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-orange-100 group-hover:to-pink-100 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all">
                  <span className="text-3xl">{category.icone}</span>
                </div>
                <p className="font-semibold text-gray-800 group-hover:text-orange-600 transition-colors">
                  {category.nom}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Filtres avancés avec style moderne */}
        <div className="text-center mb-8">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="glass-effect text-gray-700 px-8 py-3 rounded-full hover:shadow-lg transition-all border border-white/20 flex items-center space-x-2 mx-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            <span>{showFilters ? 'Masquer les filtres' : 'Plus de filtres'}</span>
          </button>
        </div>

        {showFilters && (
          <div className="glass-effect rounded-3xl p-8 shadow-xl border border-white/20 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Prix minimum</label>
                <input
                  type="number"
                  name="min_prix"
                  placeholder="0 MAD"
                  value={filters.min_prix}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">Prix maximum</label>
                <input
                  type="number"
                  name="max_prix"
                  placeholder="1000 MAD"
                  value={filters.max_prix}
                  onChange={handleFilterChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleResetFilters}
                  className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all transform hover:scale-105 font-semibold"
                >
                  Réinitialiser
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Contenu principal */}
        {isFiltered ? (
          <SearchResultsGrid 
            annonces={annonces.filter(a => !user || (a.user_id !== user.id && a.user_id?._id !== user.id))}
            title={
              filters.sous_categorie 
                ? `Résultats dans "${sousCategories.find(sc => sc._id === filters.sous_categorie)?.nom || 'Sous-catégorie'}"`
                : filters.categorie 
                  ? `Résultats dans "${categories.find(c => c._id === filters.categorie)?.nom || 'Catégorie'}"`
                  : "Résultats de recherche"
            }
            loading={loading}
          />
        ) : (
          <>
            {/* Annonces récentes avec design moderne */}
            {recentAnnonces.length > 0 && (
              <div className="mb-16">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center">
                      <span className="text-xl">🆕</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">Annonces récentes</h3>
                  </div>
                </div>
                <CategoryCarousel
                  title=""
                  annonces={recentAnnonces}
                  icon="🆕"
                />
              </div>
            )}

            {/* Annonces par catégorie */}
            {Object.values(annoncesByCategory).map(({ category, annonces }) => (
              <div key={category._id} className="mb-16">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center">
                      <span className="text-xl">{category.icone}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900">{category.nom} populaires</h3>
                  </div>
                  <button
                    onClick={() => navigate(`/category/${category._id}`)}
                    className="text-orange-600 hover:text-orange-700 font-semibold flex items-center space-x-1 transition-colors group"
                  >
                    <span>Voir tout</span>
                    <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
                <CategoryCarousel
                  title=""
                  annonces={annonces}
                  icon={category.icone}
                  categoryId={category._id}
                  onViewAll={() => navigate(`/category/${category._id}`)}
                />
              </div>
            ))}
          </>
        )}

        {/* Message si aucune annonce */}
        {annonces.length === 0 && !loading && (
          <div className="text-center py-20 glass-effect rounded-3xl shadow-xl border border-white/20">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune annonce trouvée</h3>
            <p className="text-gray-600 mb-6">Essayez de modifier vos critères de recherche</p>
            <button
              onClick={handleResetFilters}
              className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-8 py-3 rounded-xl hover:shadow-lg transition-all transform hover:scale-105 font-semibold"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;