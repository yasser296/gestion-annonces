// frontend/src/pages/HomePage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CategoryCarousel from '../components/CategoryCarousel';
import SearchResultsGrid from '../components/SearchResultsGrid';
import { useAuth } from '../contexts/AuthContext';

const HomePage = () => {
  const [annonces, setAnnonces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    categorie: '',
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
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
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
      
      const response = await axios.get(`http://localhost:5000/api/annonces?${params}`);
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
    setFilters({
      ...filters,
      categorie: categoryId === filters.categorie ? '' : categoryId
    });
  };

  const handleSearch = () => {
    fetchAnnonces();
  };

  const handleResetFilters = () => {
    setFilters({
      categorie: '',
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">Trouvez ce que vous cherchez</h1>
          <p className="text-xl mb-8">Des milliers d'annonces dans toutes les catégories</p>
          
          {/* Barre de recherche principale */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                type="text"
                name="recherche"
                placeholder="Que recherchez-vous ?"
                value={filters.recherche}
                onChange={handleFilterChange}
                className="flex-1 px-4 py-3 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <select
                name="categorie"
                value={filters.categorie}
                onChange={handleFilterChange}
                className="px-4 py-3 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                <option value="">Toutes catégories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.icone} {cat.nom}
                  </option>
                ))}
              </select>
              <input
                type="text"
                name="ville"
                placeholder="Ville"
                value={filters.ville}
                onChange={handleFilterChange}
                className="px-4 py-3 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <button
                onClick={handleSearch}
                className="bg-orange-500 text-white px-8 py-3 rounded-lg hover:bg-orange-600 transition"
              >
                Rechercher
              </button>
            </div>
            
            {/* Filtres avancés */}
            <div className="mt-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-orange-500 hover:text-orange-600 text-sm font-medium"
              >
                {showFilters ? 'Masquer' : 'Afficher'} les filtres avancés
              </button>
              
              {showFilters && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="number"
                    name="min_prix"
                    placeholder="Prix minimum"
                    value={filters.min_prix}
                    onChange={handleFilterChange}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                  <input
                    type="number"
                    name="max_prix"
                    placeholder="Prix maximum"
                    value={filters.max_prix}
                    onChange={handleFilterChange}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                  <button
                    onClick={handleResetFilters}
                    className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Catégories principales avec indication de sélection */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Catégories</h2>
          {filters.categorie && (
            <button
              onClick={() => {
                setFilters({ ...filters, categorie: '' });
              }}
              className="text-sm text-orange-500 hover:text-orange-600 flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Afficher toutes les catégories</span>
            </button>
          )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-12">
          {/* Bouton "Toutes" */}
          <button
            onClick={() => handleCategoryFilter('')}
            className={`rounded-lg shadow-md p-4 transition-all duration-200 ${
              !filters.categorie 
                ? 'bg-orange-500 text-white shadow-lg transform scale-105' 
                : 'bg-white hover:shadow-lg hover:scale-105'
            }`}
          >
            <div className="text-3xl mb-2 text-center">🏠</div>
            <p className="text-sm font-medium text-center">Toutes</p>
          </button>
          
          {/* Boutons de catégories */}
          {categories.map((category) => (
            <button
              key={category._id}
              onClick={() => handleCategoryFilter(category._id)}
              className={`rounded-lg shadow-md p-4 transition-all duration-200 ${
                filters.categorie === category._id 
                  ? 'bg-orange-500 text-white shadow-lg transform scale-105' 
                  : 'bg-white hover:shadow-lg hover:scale-105'
              }`}
            >
              <div className="text-3xl mb-2 text-center">{category.icone}</div>
              <p className={`text-sm font-medium text-center ${
                filters.categorie === category._id ? 'text-white' : 'text-gray-700'
              }`}>
                {category.nom}
              </p>
            </button>
          ))}
        </div>

        {/* Si des filtres sont appliqués, afficher les résultats de recherche */}
        {isFiltered ? (
          <SearchResultsGrid 
            annonces={annonces.filter(a => !user || (a.user_id !== user.id && a.user_id?._id !== user.id))}
            title={
              filters.categorie 
                ? `Résultats dans "${categories.find(c => c._id === filters.categorie)?.nom || 'Catégorie'}"`
                : "Résultats de recherche"
            }
            loading={loading}
          />
        ) : (
          <>
            {/* Annonces récentes */}
            {recentAnnonces.length > 0 && (
              <CategoryCarousel
                title="Annonces récentes"
                annonces={recentAnnonces}
                icon="🆕"
              />
            )}

            {/* Annonces par catégorie */}
            {Object.values(annoncesByCategory).map(({ category, annonces }) => (
              <CategoryCarousel
                key={category._id}
                title={`${category.nom} populaires`}
                annonces={annonces}
                icon={category.icone}
                categoryId={category._id}
                onViewAll={() => {
                  handleCategoryFilter(category._id);
                  window.scrollTo(0, 0);
                }}
              />
            ))}
          </>
        )}

        {/* Message si aucune annonce */}
        {annonces.length === 0 && (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 text-lg">Aucune annonce trouvée</p>
            <button
              onClick={handleResetFilters}
              className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition"
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