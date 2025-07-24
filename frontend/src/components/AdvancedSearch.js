// frontend/src/components/AdvancedSearch.js
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faFilter, 
  faTimes, 
  faChevronDown,
  faMapMarkerAlt,
  faTag,
  faEuroSign,
  faCalendarAlt,
  faSlidersH
} from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

const AdvancedSearch = ({ 
  onSearch, 
  onFiltersChange, 
  initialFilters = {},
  className = '',
  showAdvanced = false 
}) => {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(showAdvanced);
  const [filters, setFilters] = useState({
    recherche: '',
    categorie: '',
    sous_categorie: '',
    ville: '',
    min_prix: '',
    max_prix: '',
    etat: '',
    date_debut: '',
    date_fin: '',
    avec_images: false,
    tri: 'recent',
    ...initialFilters
  });

  const [categories, setCategories] = useState([]);
  const [sousCategories, setSousCategories] = useState([]);
  const [villes, setVilles] = useState([]);
  const [loading, setLoading] = useState(false);

  // États pour les attributs dynamiques
  const [categoryAttributes, setCategoryAttributes] = useState([]);
  const [attributeFilters, setAttributeFilters] = useState({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (filters.categorie) {
      fetchSousCategories(filters.categorie);
      fetchCategoryAttributes(filters.categorie);
    } else {
      setSousCategories([]);
      setCategoryAttributes([]);
      setAttributeFilters({});
    }
  }, [filters.categorie]);

  const fetchInitialData = async () => {
    try {
      const [categoriesRes, villesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/categories'),
        axios.get('http://localhost:5000/api/annonces/cities') // Nouvelle route pour les villes
      ]);
      
      setCategories(categoriesRes.data);
      setVilles(villesRes.data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    }
  };

  const fetchSousCategories = async (categorieId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/sous-categories/by-category/${categorieId}`);
      setSousCategories(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des sous-catégories:', error);
    }
  };

  const fetchCategoryAttributes = async (categorieId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/attributes/by-category/${categorieId}`);
      setCategoryAttributes(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des attributs:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    
    // Réinitialiser la sous-catégorie si on change de catégorie
    if (key === 'categorie') {
      newFilters.sous_categorie = '';
    }
    
    setFilters(newFilters);
    onFiltersChange && onFiltersChange(newFilters);
  };

  const handleAttributeFilterChange = (attributeId, value) => {
    const newAttributeFilters = { ...attributeFilters, [attributeId]: value };
    setAttributeFilters(newAttributeFilters);
    onFiltersChange && onFiltersChange({ ...filters, attributes: newAttributeFilters });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setLoading(true);
    
    const searchData = {
      ...filters,
      attributes: attributeFilters
    };
    
    onSearch && onSearch(searchData);
    setTimeout(() => setLoading(false), 500);
  };

  const clearFilters = () => {
    const clearedFilters = {
      recherche: '',
      categorie: '',
      sous_categorie: '',
      ville: '',
      min_prix: '',
      max_prix: '',
      etat: '',
      date_debut: '',
      date_fin: '',
      avec_images: false,
      tri: 'recent'
    };
    
    setFilters(clearedFilters);
    setAttributeFilters({});
    onFiltersChange && onFiltersChange(clearedFilters);
  };

  const renderAttributeFilter = (attribute) => {
    const value = attributeFilters[attribute._id] || '';
    
    switch (attribute.type) {
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleAttributeFilterChange(attribute._id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300 font-secondary"
          >
            <option value="">Tous</option>
            {attribute.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'boolean':
        return (
          <select
            value={value}
            onChange={(e) => handleAttributeFilterChange(attribute._id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300 font-secondary"
          >
            <option value="">Tous</option>
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
            placeholder={attribute.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300 font-secondary"
          />
        );
      
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleAttributeFilterChange(attribute._id, e.target.value)}
            placeholder={attribute.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300 font-secondary"
          />
        );
    }
  };

  const activeFiltersCount = Object.values(filters).filter(value => 
    value !== '' && value !== false && value !== 'recent'
  ).length + Object.keys(attributeFilters).filter(key => attributeFilters[key] !== '').length;

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {/* Barre de recherche principale */}
      <form onSubmit={handleSearch} className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <FontAwesomeIcon 
              icon={faSearch} 
              className="absolute left-3 top-3 text-gray-400" 
            />
            <input
              type="text"
              placeholder="Que recherchez-vous ?"
              value={filters.recherche}
              onChange={(e) => handleFilterChange('recherche', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300 font-secondary"
            />
          </div>
          
          <button
            type="button"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className={`px-4 py-2 border rounded-md transition-colors font-secondary flex items-center space-x-2 ${
              isAdvancedOpen 
                ? 'border-orange-500 text-orange-600 bg-orange-50' 
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <FontAwesomeIcon icon={faFilter} />
            <span>Filtres</span>
            {activeFiltersCount > 0 && (
              <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-1">
                {activeFiltersCount}
              </span>
            )}
            <FontAwesomeIcon 
              icon={faChevronDown} 
              className={`transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`}
            />
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition-colors font-secondary flex items-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <FontAwesomeIcon icon={faSearch} />
            )}
            <span>Rechercher</span>
          </button>
        </div>
      </form>

      {/* Filtres avancés */}
      {isAdvancedOpen && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {/* Première ligne de filtres */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Catégorie */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-secondary">
                <FontAwesomeIcon icon={faTag} className="mr-2" />
                Catégorie
              </label>
              <select
                value={filters.categorie}
                onChange={(e) => handleFilterChange('categorie', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300 font-secondary"
              >
                <option value="">Toutes catégories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.icone} {cat.nom}
                  </option>
                ))}
              </select>
            </div>

            {/* Sous-catégorie */}
            {sousCategories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-secondary">
                  Sous-catégorie
                </label>
                <select
                  value={filters.sous_categorie}
                  onChange={(e) => handleFilterChange('sous_categorie', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300 font-secondary"
                >
                  <option value="">Toutes sous-catégories</option>
                  {sousCategories.map((sousCat) => (
                    <option key={sousCat._id} value={sousCat._id}>
                      {sousCat.icone} {sousCat.nom}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Ville */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-secondary">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />
                Ville
              </label>
              <select
                value={filters.ville}
                onChange={(e) => handleFilterChange('ville', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300 font-secondary"
              >
                <option value="">Toutes villes</option>
                {villes.map((ville, index) => (
                  <option key={index} value={ville}>{ville}</option>
                ))}
              </select>
            </div>

            {/* État */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-secondary">
                État
              </label>
              <select
                value={filters.etat}
                onChange={(e) => handleFilterChange('etat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300 font-secondary"
              >
                <option value="">Tous états</option>
                <option value="Neuf">Neuf</option>
                <option value="Comme neuf">Comme neuf</option>
                <option value="Bon état">Bon état</option>
                <option value="État moyen">État moyen</option>
              </select>
            </div>
          </div>

          {/* Deuxième ligne de filtres */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {/* Prix minimum */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-secondary">
                <FontAwesomeIcon icon={faEuroSign} className="mr-2" />
                Prix min.
              </label>
              <input
                type="number"
                placeholder="0"
                value={filters.min_prix}
                onChange={(e) => handleFilterChange('min_prix', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300 font-secondary"
              />
            </div>

            {/* Prix maximum */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-secondary">
                Prix max.
              </label>
              <input
                type="number"
                placeholder="∞"
                value={filters.max_prix}
                onChange={(e) => handleFilterChange('max_prix', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300 font-secondary"
              />
            </div>

            {/* Date début */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-secondary">
                <FontAwesomeIcon icon={faCalendarAlt} className="mr-2" />
                Publié après
              </label>
              <input
                type="date"
                value={filters.date_debut}
                onChange={(e) => handleFilterChange('date_debut', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300 font-secondary"
              />
            </div>

            {/* Tri */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 font-secondary">
                <FontAwesomeIcon icon={faSlidersH} className="mr-2" />
                Trier par
              </label>
              <select
                value={filters.tri}
                onChange={(e) => handleFilterChange('tri', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300 font-secondary"
              >
                <option value="recent">Plus récent</option>
                <option value="ancien">Plus ancien</option>
                <option value="prix_asc">Prix croissant</option>
                <option value="prix_desc">Prix décroissant</option>
                <option value="populaire">Plus populaire</option>
              </select>
            </div>

            {/* Avec images */}
            <div className="flex items-center">
              <label className="flex items-center space-x-2 font-secondary">
                <input
                  type="checkbox"
                  checked={filters.avec_images}
                  onChange={(e) => handleFilterChange('avec_images', e.target.checked)}
                  className="rounded focus:ring-2 focus:ring-orange-300"
                />
                <span className="text-sm text-gray-700">Avec images</span>
              </label>
            </div>
          </div>

          {/* Filtres par attributs spécifiques à la catégorie */}
          {categoryAttributes.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3 font-secondary">
                Spécifications pour {categories.find(c => c._id === filters.categorie)?.nom}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {categoryAttributes.map((attribute) => (
                  <div key={attribute._id}>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-secondary">
                      {attribute.nom}
                    </label>
                    {renderAttributeFilter(attribute)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={clearFilters}
              className="text-gray-600 hover:text-gray-800 font-secondary flex items-center space-x-2"
            >
              <FontAwesomeIcon icon={faTimes} />
              <span>Effacer tous les filtres</span>
            </button>
            
            <div className="text-sm text-gray-500 font-secondary">
              {activeFiltersCount > 0 && (
                <span>{activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''} actif{activeFiltersCount > 1 ? 's' : ''}</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;