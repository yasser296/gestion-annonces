import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CategoryCarousel from '../components/CategoryCarousel';
import SearchResultsGrid from '../components/SearchResultsGrid';
import AutocompleteInput from '../components/AutocompleteInput';
import useAutocomplete from '../hooks/useAutocomplete';
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

  // Autocomplétion hooks
  const searchAutocomplete = useAutocomplete(filters.recherche, (searchData) => {
    if (searchData.type === 'category') {
      navigate(`/category/${searchData.suggestionData.id}`);
    } else if (searchData.type === 'subcategory') {
      navigate(`/category/${searchData.suggestionData.categoryId}?sous_categorie=${searchData.suggestionData.id}`);
    } else {
      handleSearch(searchData.query);
    }
  });

  const cityAutocomplete = useAutocomplete(filters.ville, (searchData) => {
    setFilters(prev => ({ ...prev, ville: searchData.query }));
  });

  useEffect(() => {
    fetchCategories();
    fetchSousCategories();
    fetchAnnonces();
    setIsInitialLoad(false);
  }, []);

  useEffect(() => {
    searchAutocomplete.setSearchValue(filters.recherche);
    cityAutocomplete.setSearchValue(filters.ville);
  }, [filters.recherche, filters.ville]);

  useEffect(() => {
    const hasActiveFilters = Object.values(filters).some(value => value !== '');
    setIsFiltered(hasActiveFilters);
    if (!isInitialLoad) {
      fetchAnnonces();
    }
  }, [filters, isInitialLoad]);

  useEffect(() => {
    if (filters.categorie) {
      fetchSousCategoriesByCategory(filters.categorie);
    } else {
      fetchSousCategories();
    }
    // Reset sous-catégorie si catégorie change
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

  // --- NAVIGATION CATEGORIE : boutons ET select --- //
  const handleCategoryFilter = (categoryId) => {
    navigate(`/category/${categoryId}`);
  };

  // Garde pour rediriger vers CategoryPage avec sous-catégorie
  const handleSubCategoryFilter = (subCategoryId) => {
    const sousCategorie = sousCategories.find(sc => sc._id === subCategoryId);
    const categoryId = sousCategorie?.categorie_id?._id || sousCategorie?.categorie_id;
    if (categoryId) {
      navigate(`/category/${categoryId}?sous_categorie=${subCategoryId}`);
    }
  };

  // --- LOGIQUE DU SELECT DE CATÉGORIE : on redirige vers CategoryPage --- //
  const handleSelectCategory = (e) => {
    const value = e.target.value;
    if (value) {
      navigate(`/category/${value}`);
    } else {
      setFilters({ ...filters, categorie: '' });
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = (searchQuery = null) => {
    const query = searchQuery || searchAutocomplete.searchValue;
    if (filters.categorie) {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key] && key !== 'categorie') {
          params.append(key, filters[key]);
        }
      });
      if (query) params.set('recherche', query);
      const queryString = params.toString();
      navigate(`/category/${filters.categorie}${queryString ? `?${queryString}` : ''}`);
    } else {
      setFilters(prev => ({ ...prev, recherche: query }));
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
    searchAutocomplete.resetSearch();
    cityAutocomplete.resetSearch();
  };

  // Groupement pour carousels
  const annoncesByCategory = categories.reduce((acc, category) => {
    const categoryAnnonces = annonces
      .filter(a => a.categorie_id?._id === category._id || a.categorie_id === category._id)
      .filter(a => !user || (a.user_id !== user.id && a.user_id?._id !== user.id));
    if (categoryAnnonces.length > 0) {
      acc[category._id] = { category, annonces: categoryAnnonces };
    }
    return acc;
  }, {});

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
      {/* HERO + Recherche */}
      <div className="relative bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-24">
          <div className="text-center text-white mb-12">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">Trouvez tout ce que vous cherchez</h1>
            <p className="text-xl md:text-2xl opacity-90 mb-8">Des milliers d'annonces à portée de clic</p>
          </div>
          {/* Barre de recherche avec autocomplétion */}
          <div className="max-w-5xl mx-auto">
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Autocomplete Recherche principale */}
                <div className="flex-2">
                  <AutocompleteInput
                    value={searchAutocomplete.searchValue}
                    onChange={searchAutocomplete.handleInputChange}
                    onSelect={searchAutocomplete.handleSuggestionSelect}
                    placeholder="Que recherchez-vous ?"
                    type="all"
                    category={filters.categorie}
                    showTrending={true}
                    icon={
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    }
                    className="text-lg py-4 bg-white/90 backdrop-blur-sm border-white/30 focus:bg-white focus:ring-orange-500/50"
                  />
                </div>
                {/* Select Catégorie - navigation directe */}
                <div className="flex-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <select
                      name="categorie"
                      value={filters.categorie}
                      onChange={handleSelectCategory}
                      className="w-full pl-12 pr-4 py-4 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-orange-500/50 text-gray-700 bg-white/90 backdrop-blur-sm focus:bg-white transition-all appearance-none"
                    >
                      <option value="">Toutes catégories</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.icone} {category.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {/* Autocomplete Ville */}
                <div className="flex-1">
                  <AutocompleteInput
                    value={cityAutocomplete.searchValue}
                    onChange={cityAutocomplete.handleInputChange}
                    onSelect={cityAutocomplete.handleSuggestionSelect}
                    placeholder="Ville"
                    type="cities"
                    showTrending={true}
                    icon={
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    }
                    className="py-4 bg-white/90 backdrop-blur-sm border-white/30 focus:bg-white focus:ring-orange-500/50"
                  />
                </div>
                {/* Bouton recherche */}
                <button
                  onClick={() => handleSearch()}
                  disabled={searchAutocomplete.isSearching}
                  className="px-8 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all transform hover:scale-105 font-semibold disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[120px]"
                >
                  {searchAutocomplete.isSearching ? (
                    <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                  ) : (
                    'Rechercher'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- CATÉGORIES, FILTRES, CAROUSELS --- */}
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Explorez par catégorie</h2>
          <p className="text-gray-600 text-lg">Découvrez nos catégories les plus populaires</p>
        </div>
        {/* Grille de boutons de catégories */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6 mb-16">
          <button
            onClick={() => setFilters({ ...filters, categorie: '' })}
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
          {categories.map((category) => (
            <button
              key={category._id}
              onClick={() => handleCategoryFilter(category._id)}
              className={`group relative overflow-hidden rounded-3xl p-6 text-center transition-all duration-300 transform hover:scale-105 hover:shadow-2xl category-card ${
                filters.categorie === category._id
                  ? 'bg-gradient-to-br from-orange-400 to-pink-500 text-white shadow-xl scale-105'
                  : 'bg-white hover:shadow-xl shadow-lg'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all ${
                  filters.categorie === category._id
                    ? 'bg-white/20'
                    : 'bg-gradient-to-br from-orange-100 to-pink-100 group-hover:from-orange-200 group-hover:to-pink-200'
                }`}>
                  <span className="text-3xl">{category.icone}</span>
                </div>
                <p className={`font-semibold transition-colors ${filters.categorie === category._id ? 'text-white' : 'text-gray-800 group-hover:text-orange-600'}`}>
                  {category.nom}
                </p>
              </div>
            </button>
          ))}
        </div>
        {/* Résultats / Carousels */}
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
            {/* Annonces récentes */}
            {recentAnnonces.length > 0 && (
              <div className="mb-16">
                <CategoryCarousel
                  title="Annonces récentes"
                  annonces={recentAnnonces}
                  icon="🆕"
                />
              </div>
            )}
            {/* Annonces par catégorie */}
            {Object.values(annoncesByCategory).map(({ category, annonces }) => (
              <div key={category._id} className="mb-16">
                <CategoryCarousel
                  title={category.nom}
                  annonces={annonces}
                  icon={category.icone}
                  categoryId={category._id}
                />
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;
