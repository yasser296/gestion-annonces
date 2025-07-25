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
  const [categoryAttributes, setCategoryAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  
  // État des filtres - incluant les attributs dynamiques
  const [filters, setFilters] = useState({
    sous_categorie: searchParams.get('sous_categorie') || '',
    ville: searchParams.get('ville') || '',
    min_prix: searchParams.get('min_prix') || '',
    max_prix: searchParams.get('max_prix') || '',
    recherche: searchParams.get('recherche') || '',
    etat: searchParams.get('etat') || '',
    marque: searchParams.get('marque') || '',
    tri: searchParams.get('tri') || 'date_desc'
  });

  // État séparé pour les filtres d'attributs
  const [attributeFilters, setAttributeFilters] = useState({});

  useEffect(() => {
    if (categoryId) {
      fetchCategory();
      fetchSousCategories();
      fetchCategoryAttributes();
      fetchAnnonces();
    }
  }, [categoryId]);

  useEffect(() => {
    fetchAnnonces();
    updateURL();
  }, [filters, attributeFilters]);

  // Initialiser les filtres d'attributs depuis l'URL
  useEffect(() => {
    const initialAttributeFilters = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith('attr_')) {
        const attributeId = key.replace('attr_', '');
        initialAttributeFilters[attributeId] = value;
      }
    });
    setAttributeFilters(initialAttributeFilters);
  }, [searchParams]);

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

  const fetchCategoryAttributes = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/attributes/by-category/${categoryId}`);
      setCategoryAttributes(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des attributs:', error);
    }
  };

  const fetchAnnonces = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('categorie', categoryId);
      params.append('show_inactive', 'false');
      
      // Ajouter les filtres de base
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });

      // Ajouter les filtres d'attributs
      Object.keys(attributeFilters).forEach(attributeId => {
        if (attributeFilters[attributeId]) {
          params.append(`attr_${attributeId}`, attributeFilters[attributeId]);
        }
      });
      
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/annonces?${params}`);
      
      // FILTRAGE CÔTÉ CLIENT EN ATTENDANT LA MISE À JOUR BACKEND
      let filteredAnnonces = response.data;
      
      // Appliquer les filtres d'attributs côté client
      if (Object.keys(attributeFilters).length > 0) {
        for (const [attributeId, filterValue] of Object.entries(attributeFilters)) {
          if (filterValue) {
            const attribute = categoryAttributes.find(attr => attr._id === attributeId);
            if (attribute) {
              filteredAnnonces = await filterAnnoncesByAttribute(
                filteredAnnonces, 
                attributeId, 
                filterValue, 
                attribute.type
              );
            }
          }
        }
      }
      
      setAnnonces(filteredAnnonces);
    } catch (error) {
      console.error('Erreur lors du chargement des annonces:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrage côté client par attributs (temporaire jusqu'à la mise à jour backend)
  const filterAnnoncesByAttribute = async (annonces, attributeId, filterValue, attributeType) => {
    const filtered = [];
    
    for (const annonce of annonces) {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/attributes/values/${annonce._id}`
        );
        const attributeValues = response.data;
        const annonceAttributeValue = attributeValues[attributeId];
        
        if (annonceAttributeValue) {
          const value = annonceAttributeValue.value;
          let matches = false;
          
          switch (attributeType) {
            case 'string':
            case 'select':
              matches = value && value.toLowerCase().includes(filterValue.toLowerCase());
              break;
            case 'number':
              matches = value && parseFloat(value) === parseFloat(filterValue);
              break;
            case 'boolean':
              matches = value === (filterValue === 'true');
              break;
            default:
              matches = value && value.toString().toLowerCase().includes(filterValue.toLowerCase());
          }
          
          if (matches) {
            filtered.push(annonce);
          }
        }
      } catch (error) {
        console.error('Erreur lors du filtrage par attribut:', error);
      }
    }
    
    return filtered;
  };

  const updateURL = () => {
    const params = new URLSearchParams();
    
    // Ajouter les filtres de base
    Object.keys(filters).forEach(key => {
      if (filters[key]) params.set(key, filters[key]);
    });
    
    // Ajouter les filtres d'attributs
    Object.keys(attributeFilters).forEach(attributeId => {
      if (attributeFilters[attributeId]) {
        params.set(`attr_${attributeId}`, attributeFilters[attributeId]);
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

  const handleAttributeFilterChange = (attributeId, value) => {
    setAttributeFilters({
      ...attributeFilters,
      [attributeId]: value
    });
  };

  const handleResetFilters = () => {
    setFilters({
      sous_categorie: '',
      ville: '',
      min_prix: '',
      max_prix: '',
      recherche: '',
      etat: '',
      marque: '',
      tri: 'date_desc'
    });
    setAttributeFilters({});
  };

  const filteredAnnonces = annonces.filter(a => 
    !user || (a.user_id !== user.id && a.user_id?._id !== user.id)
  );

  const getSelectedSubCategoryName = () => {
    if (!filters.sous_categorie) return null;
    const subCategory = sousCategories.find(sc => sc._id === filters.sous_categorie);
    return subCategory?.nom;
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

      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleAttributeFilterChange(attribute._id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        );

      default: // string
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
                {/* Recherche dans la catégorie */}
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

                {/* Sous-catégories avec SELECT */}
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
                    Prix (MAD)
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

                {/* ATTRIBUTS SPÉCIFIQUES À LA CATÉGORIE */}
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
            {(Object.values(filters).some(value => value !== '' && value !== 'date_desc') || 
              Object.values(attributeFilters).some(value => value !== '')) && (
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
                  {/* Filtres de base */}
                  {Object.entries(filters).map(([key, value]) => {
                    if (!value || value === 'date_desc') return null;
                    
                    let displayValue = value;
                    let displayKey = key;
                    
                    if (key === 'sous_categorie') {
                      displayValue = getSelectedSubCategoryName();
                      displayKey = 'Sous-catégorie';
                    } else if (key === 'min_prix') {
                      displayKey = 'Prix min';
                      displayValue = `${value} MAD`;
                    } else if (key === 'max_prix') {
                      displayKey = 'Prix max';
                      displayValue = `${value} MAD`;
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

                  {/* Filtres d'attributs */}
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

            {/* Grille des résultats */}
            <SearchResultsGrid 
              annonces={filteredAnnonces}
              title={
                filters.sous_categorie 
                  ? `${getSelectedSubCategoryName()} dans ${category?.nom}`
                  : `Toutes les annonces dans ${category?.nom}`
              }
              loading={loading}
            />

            {/* Message si aucun résultat */}
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