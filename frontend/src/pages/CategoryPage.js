// frontend/src/pages/CategoryPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AnnonceCard from '../components/AnnonceCard';
import { useAuth } from '../contexts/AuthContext';

const CategoryPage = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [annonces, setAnnonces] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [filters, setFilters] = useState({
    ville: '',
    min_prix: '',
    max_prix: '',
    marque: '',
    etat: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    fetchCategory();
    fetchAnnonces();
  }, [categoryId]);

  useEffect(() => {
    // Refetch quand la sous-catégorie change
    if (category) {
      fetchAnnonces();
    }
  }, [selectedSubCategory]);

  useEffect(() => {
    // Refetch quand les filtres changent (avec un délai pour éviter trop d'appels)
    const timeoutId = setTimeout(() => {
      if (category) {
        fetchAnnonces();
      }
    }, 500);
    
    return () => clearTimeout(timeoutId);
  }, [filters.etat, filters.marque]);

  const fetchCategory = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/categories');
      const currentCategory = response.data.find(cat => cat._id === categoryId);
      setCategory(currentCategory);
    } catch (error) {
      console.error('Erreur lors du chargement de la catégorie:', error);
    }
  };

  const fetchAnnonces = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('categorie', categoryId);
      params.append('show_inactive', 'false');
      
      // Ajouter tous les filtres
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      
      // Ajouter la sous-catégorie si sélectionnée
      if (selectedSubCategory) {
        params.append('sous_categorie', selectedSubCategory);
      }
      
      const response = await axios.get(`http://localhost:5000/api/annonces?${params}`);
      let filteredAnnonces = response.data;
      
      // Exclure les annonces de l'utilisateur connecté
      if (user) {
        filteredAnnonces = filteredAnnonces.filter(
          a => a.user_id !== user.id && a.user_id?._id !== user.id
        );
      }
      
      setAnnonces(filteredAnnonces);
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

  const handleSearch = () => {
    fetchAnnonces();
  };

  const handleResetFilters = () => {
    setFilters({
      ville: '',
      min_prix: '',
      max_prix: '',
      marque: '',
      etat: ''
    });
    setSelectedSubCategory('');
    fetchAnnonces();
  };

  // Trier les annonces
  const sortedAnnonces = [...annonces].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.prix - b.prix;
      case 'price-desc':
        return b.prix - a.prix;
      case 'views':
        return b.nombre_vues - a.nombre_vues;
      case 'recent':
      default:
        return new Date(b.date_publication) - new Date(a.date_publication);
    }
  });

  if (loading && !category) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header de catégorie */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="text-sm mb-4">
            <button 
              onClick={() => navigate('/')}
              className="hover:underline"
            >
              Accueil
            </button>
            <span className="mx-2">/</span>
            <span>{category?.nom || 'Catégorie'}</span>
          </nav>
          
          <div className="flex items-center space-x-4">
            <span className="text-5xl">{category?.icone}</span>
            <div>
              <h1 className="text-3xl font-bold">{category?.nom || 'Catégorie'}</h1>
              <p className="text-xl mt-2">
                {loading ? '...' : `${annonces.length} annonce${annonces.length > 1 ? 's' : ''} trouvée${annonces.length > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar avec filtres */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="font-bold text-lg mb-4">Filtres</h2>
              
              {/* Sous-catégories */}
              {category?.sousCategories && category.sousCategories.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3">Sous-catégories</h3>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="subcategory"
                        value=""
                        checked={selectedSubCategory === ''}
                        onChange={() => setSelectedSubCategory('')}
                        className="mr-2"
                      />
                      <span>Toutes</span>
                    </label>
                    {category.sousCategories.map((subCat) => (
                      <label key={subCat._id} className="flex items-center">
                        <input
                          type="radio"
                          name="subcategory"
                          value={subCat._id}
                          checked={selectedSubCategory === subCat._id}
                          onChange={() => setSelectedSubCategory(subCat._id)}
                          className="mr-2"
                        />
                        <span className="flex items-center">
                          {subCat.icone && <span className="mr-1">{subCat.icone}</span>}
                          {subCat.nom}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Autres filtres */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ville
                  </label>
                  <input
                    type="text"
                    name="ville"
                    value={filters.ville}
                    onChange={handleFilterChange}
                    placeholder="Ex: Casablanca"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix minimum (DH)
                  </label>
                  <input
                    type="number"
                    name="min_prix"
                    value={filters.min_prix}
                    onChange={handleFilterChange}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix maximum (DH)
                  </label>
                  <input
                    type="number"
                    name="max_prix"
                    value={filters.max_prix}
                    onChange={handleFilterChange}
                    placeholder="100000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marque
                  </label>
                  <input
                    type="text"
                    name="marque"
                    value={filters.marque}
                    onChange={handleFilterChange}
                    placeholder="Ex: Samsung"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    État
                  </label>
                  <select
                    name="etat"
                    value={filters.etat}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                  >
                    <option value="">Tous les états</option>
                    <option value="Neuf">Neuf</option>
                    <option value="Comme neuf">Comme neuf</option>
                    <option value="Bon état">Bon état</option>
                    <option value="État moyen">État moyen</option>
                  </select>
                </div>
                
                <div className="pt-4 space-y-2">
                  <button
                    onClick={handleSearch}
                    className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition"
                  >
                    Appliquer les filtres
                  </button>
                  <button
                    onClick={handleResetFilters}
                    className="w-full bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                  >
                    Réinitialiser
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Grille d'annonces */}
          <div className="lg:w-3/4">
            {/* Barre de tri */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex items-center justify-between">
              <span className="text-gray-700">
                {sortedAnnonces.length} résultat{sortedAnnonces.length > 1 ? 's' : ''}
              </span>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Trier par:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                >
                  <option value="recent">Plus récentes</option>
                  <option value="price-asc">Prix croissant</option>
                  <option value="price-desc">Prix décroissant</option>
                  <option value="views">Plus consultées</option>
                </select>
              </div>
            </div>
            
            {/* Annonces */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-4">
                      <div className="h-6 bg-gray-200 mb-2"></div>
                      <div className="h-8 bg-gray-200 w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : sortedAnnonces.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedAnnonces.map((annonce) => (
                  <AnnonceCard key={annonce._id} annonce={annonce} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-lg shadow-md">
                <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500 text-lg">Aucune annonce dans cette catégorie</p>
                <p className="text-gray-400 mt-2">Essayez de modifier vos filtres</p>
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
      </div>
    </div>
  );
};

export default CategoryPage;