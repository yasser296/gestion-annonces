import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import SearchResultsGrid from '../components/SearchResultsGrid';
import { useAuth } from '../contexts/AuthContext';

const CategoryPage = () => {
  const { categoryId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [annonces, setAnnonces] = useState([]);
  const [category, setCategory] = useState(null);
  const [sousCategories, setSousCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    sous_categorie: searchParams.get('sous_categorie') || '',
    ville: searchParams.get('ville') || '',
    min_prix: searchParams.get('min_prix') || '',
    max_prix: searchParams.get('max_prix') || '',
    recherche: searchParams.get('recherche') || '',
    etat: searchParams.get('etat') || ''
  });

  useEffect(() => {
    if (categoryId) {
      fetchCategory();
      fetchSousCategories();
      fetchAnnonces();
    }
  }, [categoryId]);

  useEffect(() => {
    fetchAnnonces();
    updateURL();
  }, [filters]);

  const fetchCategory = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/categories/${categoryId}`);
      setCategory(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement de la catégorie:', error);
    }
  };

  const fetchSousCategories = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/sous-categories/by-category/${categoryId}`);
      setSousCategories(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des sous-catégories:', error);
    }
  };

  const fetchAnnonces = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('categorie', categoryId);
      params.append('show_inactive', 'false');
      
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/annonces?${params}`);
      setAnnonces(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des annonces:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateURL = () => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.set(key, filters[key]);
    });
    setSearchParams(params);
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handleResetFilters = () => {
    setFilters({
      sous_categorie: '',
      ville: '',
      min_prix: '',
      max_prix: '',
      recherche: '',
      etat: ''
    });
  };

  const handleSubCategoryFilter = (subCategoryId) => {
    setFilters({
      ...filters,
      sous_categorie: subCategoryId === filters.sous_categorie ? '' : subCategoryId
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 })
      .format(price)
      .replace(/\u202f/g, ' ')
      + ' DH';
  };

  if (loading && !category) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Catégorie non trouvée</h1>
          <button
            onClick={() => navigate('/')}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const filteredAnnonces = annonces.filter(a => !user || (a.user_id !== user.id && a.user_id?._id !== user.id));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center mb-4">
            <button
              onClick={() => navigate('/')}
              className="mr-4 p-2 hover:bg-white/20 rounded-lg transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex items-center space-x-3">
              <span className="text-4xl">{category.icone}</span>
              <div>
                <h1 className="text-4xl font-bold">{category.nom}</h1>
                <p className="text-xl">
                  {filteredAnnonces.length} annonce{filteredAnnonces.length > 1 ? 's' : ''} disponible{filteredAnnonces.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
          
          {/* Barre de recherche */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <input
                type="text"
                name="recherche"
                placeholder="Rechercher dans cette catégorie..."
                value={filters.recherche}
                onChange={handleFilterChange}
                className="px-4 py-3 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              
              <select
                name="sous_categorie"
                value={filters.sous_categorie}
                onChange={handleFilterChange}
                className="px-4 py-3 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                <option value="">Toutes sous-catégories</option>
                {sousCategories.map((sousCat) => (
                  <option key={sousCat._id} value={sousCat._id}>
                    {sousCat.icone} {sousCat.nom}
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
              
              <select
                name="etat"
                value={filters.etat}
                onChange={handleFilterChange}
                className="px-4 py-3 text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                <option value="">Tous états</option>
                <option value="Neuf">Neuf</option>
                <option value="Comme neuf">Comme neuf</option>
                <option value="Bon état">Bon état</option>
                <option value="État moyen">État moyen</option>
              </select>
              
              <button
                onClick={handleResetFilters}
                className="bg-gray-200 text-gray-700 px-4 py-3 rounded-lg hover:bg-gray-300 transition"
              >
                Réinitialiser
              </button>
            </div>
            
            {/* Filtres de prix */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </div>
        </div>
      </div>

      {/* Sous-catégories */}
      {sousCategories.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Sous-catégories</h2>
          <div className="flex flex-wrap gap-3 mb-8">
            <button
              onClick={() => handleSubCategoryFilter('')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                !filters.sous_categorie
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              Toutes
            </button>
            {sousCategories.map((sousCategorie) => (
              <button
                key={sousCategorie._id}
                onClick={() => handleSubCategoryFilter(sousCategorie._id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition flex items-center space-x-2 ${
                  filters.sous_categorie === sousCategorie._id
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>{sousCategorie.icone}</span>
                <span>{sousCategorie.nom}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Résultats */}
      <SearchResultsGrid 
        annonces={filteredAnnonces}
        title={
          filters.sous_categorie && filters.sous_categorie !== ''
            ? `${sousCategories.find(sc => sc._id === filters.sous_categorie)?.nom || 'Sous-catégorie'} dans ${category.nom}`
            : category.nom
        }
        loading={loading}
      />
    </div>
  );
};

export default CategoryPage;