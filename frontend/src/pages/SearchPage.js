import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import SearchResultsGrid from '../components/SearchResultsGrid';
import { useAuth } from '../contexts/AuthContext';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [annonces, setAnnonces] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sousCategories, setSousCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    recherche: searchParams.get('q') || '',
    categorie: searchParams.get('categorie') || '',
    sous_categorie: searchParams.get('sous_categorie') || '',
    ville: searchParams.get('ville') || '',
    min_prix: searchParams.get('min_prix') || '',
    max_prix: searchParams.get('max_prix') || '',
    etat: searchParams.get('etat') || '',
    marque: searchParams.get('marque') || ''
  });

  useEffect(() => {
    fetchCategories();
    fetchSousCategories();
    fetchAnnonces();
  }, []);

  useEffect(() => {
    if (filters.categorie) {
      fetchSousCategoriesByCategory(filters.categorie);
    } else {
      fetchSousCategories();
    }
    // Réinitialiser la sous-catégorie si elle ne fait pas partie de la nouvelle catégorie
    if (filters.sous_categorie && filters.categorie) {
      const isValidSubCategory = sousCategories.some(sc => 
        sc._id === filters.sous_categorie && sc.categorie_id._id === filters.categorie
      );
      if (!isValidSubCategory) {
        setFilters(prev => ({ ...prev, sous_categorie: '' }));
      }
    }
  }, [filters.categorie]);

  useEffect(() => {
    fetchAnnonces();
    updateURL();
  }, [filters]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchSousCategories = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/sous-categories`);
      setSousCategories(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchSousCategoriesByCategory = async (categorieId) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/sous-categories/by-category/${categorieId}`);
      setSousCategories(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchAnnonces = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('show_inactive', 'false');
      
      // Ajouter tous les filtres non vides
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          if (key === 'recherche') {
            params.append('recherche', filters[key]);
          } else {
            params.append(key, filters[key]);
          }
        }
      });
      
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/annonces?${params}`);
      setAnnonces(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateURL = () => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        const paramKey = key === 'recherche' ? 'q' : key;
        params.set(paramKey, filters[key]);
      }
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
      recherche: '',
      categorie: '',
      sous_categorie: '',
      ville: '',
      min_prix: '',
      max_prix: '',
      etat: '',
      marque: ''
    });
  };

  const getSelectedCategoryName = () => {
    if (!filters.categorie) return null;
    const category = categories.find(c => c._id === filters.categorie);
    return category?.nom;
  };

  const getSelectedSubCategoryName = () => {
    if (!filters.sous_categorie) return null;
    const subCategory = sousCategories.find(sc => sc._id === filters.sous_categorie);
    return subCategory?.nom;
  };

  const filteredAnnonces = annonces.filter(a => 
    !user || (a.user_id !== user.id && a.user_id?._id !== user.id)
  );

  const buildTitle = () => {
    const parts = [];
    if (filters.recherche) parts.push(`"${filters.recherche}"`);
    if (filters.sous_categorie) parts.push(getSelectedSubCategoryName());
    else if (filters.categorie) parts.push(getSelectedCategoryName());
    if (filters.ville) parts.push(`à ${filters.ville}`);
    
    return parts.length > 0 
      ? `Résultats pour ${parts.join(' dans ')}`
      : 'Recherche avancée';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* En-tête */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{buildTitle()}</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {filteredAnnonces.length} résultat{filteredAnnonces.length > 1 ? 's' : ''} trouvé{filteredAnnonces.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filtres latéraux */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Filtres</h2>
                <button
                  onClick={handleResetFilters}
                  className="text-sm text-orange-500 hover:text-orange-600"
                >
                  Réinitialiser
                </button>
              </div>

              <div className="space-y-6">
                {/* Recherche textuelle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recherche
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

                {/* Catégorie */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Catégorie
                  </label>
                  <select
                    name="categorie"
                    value={filters.categorie}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                  >
                    <option value="">Toutes les catégories</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.icone} {cat.nom}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sous-catégorie */}
                {filters.categorie && sousCategories.length > 0 && (
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
                      {sousCategories.map((sousCat) => (
                        <option key={sousCat._id} value={sousCat._id}>
                          {sousCat.icone} {sousCat.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Localisation */}
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

                {/* Prix */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fourchette de prix (MAD)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      name="min_prix"
                      placeholder="Min"
                      value={filters.min_prix}
                      onChange={handleFilterChange}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                    <input
                      type="number"
                      name="max_prix"
                      placeholder="Max"
                      value={filters.max_prix}
                      onChange={handleFilterChange}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </div>
                </div>

                {/* État */}
                {/* <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
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
                </div> */}

                {/* Marque */}
                {/* <div>
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
                </div> */}
              </div>
            </div>
          </div>

          {/* Résultats */}
          <div className="lg:col-span-3">
            {/* Filtres actifs */}
            {Object.values(filters).some(value => value !== '') && (
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
                    if (!value) return null;
                    let displayValue = value;
                    let displayKey = key;

                    // Personnaliser l'affichage
                    if (key === 'categorie') {
                      displayValue = getSelectedCategoryName();
                      displayKey = 'Catégorie';
                    } else if (key === 'sous_categorie') {
                      displayValue = getSelectedSubCategoryName();
                      displayKey = 'Sous-catégorie';
                    } else if (key === 'recherche') {
                      displayKey = 'Recherche';
                    } else if (key === 'min_prix') {
                      displayKey = 'Prix min';
                      displayValue = `${value} DH`;
                    } else if (key === 'max_prix') {
                      displayKey = 'Prix max';
                      displayValue = `${value} DH`;
                    }

                    return (
                      <span
                        key={key}
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800"
                      >
                        {displayKey}: {displayValue}
                        <button
                          onClick={() => setFilters(prev => ({ ...prev, [key]: '' }))}
                          className="ml-2 hover:text-orange-600"
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Grille des résultats */}
            <SearchResultsGrid 
              annonces={filteredAnnonces}
              title=""
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchPage;