import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation  } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEye, faToggleOn, faToggleOff, faEdit, faFilter, faChevronDown, faChevronUp, faTimes } from '@fortawesome/free-solid-svg-icons';
import { confirmDialog } from "../../utils/confirmDialog";
import SearchInput from '../../components/SearchInput';
import { useNotification } from '../../contexts/ToastContext';


const AdminAnnonces = () => {
  const [annonces, setAnnonces] = useState([]);
  const [filteredAnnonces, setFilteredAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState(''); // NOUVEAU: terme de recherche
  const [statusFilter, setStatusFilter] = useState('all');
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useNotification();

  // NOUVEAU: États pour les filtres catégories
  const [categories, setCategories] = useState([]);
  const [sousCategories, setSousCategories] = useState([]);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subCategoryFilter, setSubCategoryFilter] = useState('');

  // Statistiques
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    recent: 0
  });

  useEffect(() => {
    fetchAnnonces();
    fetchCategories();
  }, []);

    // NOUVEAU: Charger les sous-catégories quand une catégorie est sélectionnée
  useEffect(() => {
    if (categoryFilter) {
      fetchSousCategoriesByCategory(categoryFilter);
      // Reset sous-catégorie quand on change de catégorie
      setSubCategoryFilter('');
    } else {
      setSousCategories([]);
      setSubCategoryFilter('');
    }
  }, [categoryFilter]);

  // NOUVEAU: Effet pour filtrer les annonces quand le terme de recherche ou le filtre de statut change
  useEffect(() => {
    filterAnnonces();
  }, [annonces, searchTerm, statusFilter, categoryFilter, subCategoryFilter]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  };

  // NOUVEAU: Fonction pour charger les sous-catégories par catégorie
  const fetchSousCategoriesByCategory = async (categorieId) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/sous-categories/by-category/${categorieId}`);
      setSousCategories(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des sous-catégories:', error);
      setSousCategories([]);
    }
  };

  // NOUVEAU: Fonction de filtrage
  const filterAnnonces = () => {
    let filtered = annonces;

    // Filtrage par terme de recherche
    if (searchTerm.trim()) {
      filtered = filtered.filter(annonce => 
        annonce.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        annonce.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (annonce.user_id?.nom && annonce.user_id.nom.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (annonce.user_id?.email && annonce.user_id.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filtrage par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(annonce => {
        if (statusFilter === 'active') return annonce.is_active;
        if (statusFilter === 'inactive') return !annonce.is_active;
        return true;
      });
    }

    // NOUVEAU: Filtrage par catégorie
    if (categoryFilter) {
      filtered = filtered.filter(annonce => {
        const annonceCategorie = annonce.categorie_id?._id || annonce.categorie_id;
        return annonceCategorie === categoryFilter;
      });
    }

    // NOUVEAU: Filtrage par sous-catégorie
    if (subCategoryFilter) {
      filtered = filtered.filter(annonce => {
        const annonceSousCategorie = annonce.sous_categorie_id?._id || annonce.sous_categorie_id;
        return annonceSousCategorie === subCategoryFilter;
      });
    }
    
    setFilteredAnnonces(filtered);
    setCurrentPage(1); // Reset à la première page lors d'une nouvelle recherche
  };

  // NOUVEAU: Gérer le changement du terme de recherche
  const handleSearchChange = (value) => {
    setSearchTerm(value);
  };

  // NOUVEAU: Effacer la recherche
  const clearSearch = () => {
    setSearchTerm('');
  };

  // NOUVEAU: Gérer le changement du filtre de statut
  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
  };

  // NOUVEAU: Gérer les changements de filtres catégories
  const handleCategoryFilterChange = (categoryId) => {
    setCategoryFilter(categoryId);
  };

  const handleSubCategoryFilterChange = (subCategoryId) => {
    setSubCategoryFilter(subCategoryId);
  };

  // NOUVEAU: Réinitialiser tous les filtres
  const resetAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setCategoryFilter('');
    setSubCategoryFilter('');
  };

  // NOUVEAU: Vérifier s'il y a des filtres actifs
  const hasActiveFilters = () => {
    return searchTerm || statusFilter !== 'all' || categoryFilter || subCategoryFilter;
  };

  const fetchAnnonces = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/annonces`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setAnnonces(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des annonces:', error);
      toast.error('Erreur lors du chargement des annonces');
      if (error.response?.status === 403) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  // NOUVEAU: Calcul des statistiques
  const calculateStats = (annonceData = annonces) => {
    const total = annonceData.length;
    const active = annonceData.filter(a => a.is_active).length;
    const inactive = annonceData.filter(a => !a.is_active).length;
    
    // Annonces récentes (derniers 7 jours)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recent = annonceData.filter(a => new Date(a.date_publication) > weekAgo).length;
    
    setStats({ total, active, inactive, recent });
  };

  const handleToggleStatus = async (id) => {
    try {
      await axios.patch(
        `${process.env.REACT_APP_API_URL}/api/admin/annonces/${id}/toggle-status`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      // Mettre à jour l'état local
      const updatedAnnonces = annonces.map(annonce => 
        annonce._id === id ? { ...annonce, is_active: !annonce.is_active } : annonce
      );
      setAnnonces(updatedAnnonces);
      calculateStats(updatedAnnonces);
      toast.success('Statut mis à jour avec succès');
      fetchAnnonces();
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      toast.error('Erreur lors du changement de statut');
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirmDialog({
      text: "Êtes-vous sûr de vouloir supprimer cette annonce ?",
      confirmText: "Oui, supprimer",
      cancelButtonText: 'Annuler'
    });
    if (confirmed) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/api/admin/annonces/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        const updatedAnnonces = annonces.filter(a => a._id !== id);
        setAnnonces(updatedAnnonces);
        calculateStats(updatedAnnonces);
        toast.success('Annonce supprimée avec succès');
        fetchAnnonces();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const formatPrice = (price) => {
  // Format fr-FR pour forcer l'espace insécable, puis remplace par un espace normal
  return (
    new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(price)
      .replace(/\u202f/g, ' ') // remplace espace insécable fine par espace classique
    + ' DH'
  );
};


  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  // NOUVEAU: Pagination pour les résultats filtrés
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAnnonces = filteredAnnonces.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAnnonces.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Header avec statistiques */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
        <div>
          <h1 className="text-3xl font-bold">Gestion des annonces</h1>
          <div className="flex flex-wrap gap-4 mt-3 text-sm font-secondary">
            <span className="text-gray-600">{stats.total} annonces au total</span>
            <span className="text-green-600">{stats.active} actives</span>
            <span className="text-red-600">{stats.inactive} inactives</span>
            <span className="text-blue-600">{stats.recent} nouvelles cette semaine</span>
          </div>
        </div>
      </div>

      {/* NOUVEAU: Barre de recherche et filtres */}
      <div className="mb-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            {/* Barre de recherche */}
            <div className="flex-1">
              <SearchInput
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Rechercher par titre, description, nom du vendeur..."
                onClear={clearSearch}
              />
            </div>
            
            {/* Filtres de statut */}
            <div className="flex gap-2">
              <button
                onClick={() => handleStatusFilterChange('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  statusFilter === 'all'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Toutes
              </button>
              <button
                onClick={() => handleStatusFilterChange('active')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  statusFilter === 'active'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Actives
              </button>
              <button
                onClick={() => handleStatusFilterChange('inactive')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  statusFilter === 'inactive'
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Inactives
              </button>
            </div>

            {/* NOUVEAU: Bouton filtres avancés */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 ${
                showAdvancedFilters || categoryFilter || subCategoryFilter
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <FontAwesomeIcon icon={faFilter} />
              Filtres
              <FontAwesomeIcon icon={showAdvancedFilters ? faChevronUp : faChevronDown} />
            </button>
            
            {/* Résultats */}
            {hasActiveFilters() && (
              <div className="text-sm text-gray-600 font-secondary">
                {filteredAnnonces.length} résultat{filteredAnnonces.length !== 1 ? 's' : ''} sur {annonces.length}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* NOUVEAU: Panneau de filtres avancés */}
      {showAdvancedFilters && (
        <div className="mb-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 border-t-4 border-t-blue-500">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FontAwesomeIcon icon={faFilter} className="text-blue-500" />
                Filtres avancés
              </h3>
              {(categoryFilter || subCategoryFilter) && (
                <button
                  onClick={() => {
                    setCategoryFilter('');
                    setSubCategoryFilter('');
                  }}
                  className="text-red-500 hover:text-red-600 transition text-sm flex items-center gap-1"
                >
                  <FontAwesomeIcon icon={faTimes} />
                  Effacer les filtres catégories
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Filtre par catégorie */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie
                </label>
                <select
                  value={categoryFilter}
                  onChange={(e) => handleCategoryFilterChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all"
                >
                  <option value="">Toutes les catégories</option>
                  {categories.map((category) => (
                    <option key={category._id} value={category._id}>
                      {category.icone} {category.nom}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtre par sous-catégorie */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sous-catégorie
                </label>
                <select
                  value={subCategoryFilter}
                  onChange={(e) => handleSubCategoryFilterChange(e.target.value)}
                  disabled={!categoryFilter}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {categoryFilter ? 'Toutes les sous-catégories' : 'Sélectionner une catégorie d\'abord'}
                  </option>
                  {sousCategories.map((subCategory) => (
                    <option key={subCategory._id} value={subCategory._id}>
                      {subCategory.icone} {subCategory.nom}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Résumé des filtres actifs */}
            {(categoryFilter || subCategoryFilter) && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Filtres actifs:</strong>
                  {categoryFilter && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 rounded text-xs">
                      {categories.find(c => c._id === categoryFilter)?.nom}
                    </span>
                  )}
                  {subCategoryFilter && (
                    <span className="ml-2 px-2 py-1 bg-blue-100 rounded text-xs">
                      {sousCategories.find(sc => sc._id === subCategoryFilter)?.nom}
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gestion des annonces</h1>
        <button
          onClick={() => navigate('/admin')}
          className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
        >
          Retour au tableau de bord
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Annonce
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Propriétaire
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Catégorie
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prix
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vues
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentAnnonces.map((annonce) => (
              <tr 
                key={annonce._id}
                className="hover:bg-gray-50 cursor-pointer"
                    onClick={(e) => {
                      // Ne pas naviguer si on clique sur un bouton, checkbox ou 
                      if ( 
                        e.target.closest('button') 
                      ) {
                        return;
                      }
                      navigate(`/annonce/${annonce._id}`, { state: { from: location.pathname } });
                    }}
              >
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {annonce.images && annonce.images[0] ? (
                        <img
                          className="h-10 w-10 rounded object-cover"
                          src={`${process.env.REACT_APP_API_URL}${annonce.images[0]}`}
                          alt={annonce.titre}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {annonce.titre}
                      </div>
                      <div className="text-sm text-gray-500">
                        {annonce.ville}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{annonce.user_id?.nom || 'Utilisateur supprimé'}</div>
                  <div className="text-sm text-gray-500">{annonce.user_id?.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm text-gray-900">
                      {annonce.categorie_id?.nom || 'Sans catégorie'}
                    </div>
                    {annonce.sous_categorie_id && (
                      <div className="text-xs text-gray-500 mt-1">
                        {annonce.sous_categorie_id.icone} {annonce.sous_categorie_id.nom}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatPrice(annonce.prix)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleStatus(annonce._id, annonce.is_active)}
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2"
                    style={{ backgroundColor: annonce.is_active !== false ? '#10b981' : '#ef4444' }}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      annonce.is_active !== false ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {annonce.nombre_vues}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(annonce.date_publication)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => navigate(`/annonce/${annonce._id}`, { state: { from: location.pathname } })}
                    className="text-orange-500 hover:text-orange-900 mr-3"
                  >
                    <FontAwesomeIcon icon={faEye} />
                  </button>
                  <button
                    onClick={() => handleDelete(annonce._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* NOUVEAU: Pagination mise à jour */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Précédent
            </button>
            
            {[...Array(Math.min(totalPages, 5)).keys()].map(index => {
              let pageNumber;
              if (totalPages <= 5) {
                pageNumber = index + 1;
              } else if (currentPage <= 3) {
                pageNumber = index + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + index;
              } else {
                pageNumber = currentPage - 2 + index;
              }
              
              return (
                <button
                  key={pageNumber}
                  onClick={() => paginate(pageNumber)}
                  className={`px-3 py-2 text-sm rounded-md ${
                    currentPage === pageNumber
                      ? 'bg-orange-500 text-white'
                      : 'bg-white border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
            
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* Message si aucun résultat */}
      {filteredAnnonces.length === 0 && (searchTerm || statusFilter !== 'all') && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">
            {searchTerm 
              ? `Aucune annonce trouvée pour "${searchTerm}"` 
              : 'Aucune annonce trouvée avec ce filtre'
            }
          </div>
          <button
            onClick={() => {
              clearSearch();
              handleStatusFilterChange('all');
            }}
            className="mt-4 text-orange-500 hover:text-orange-600 transition"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}

      {/* Message si pas d'annonces du tout */}
      {annonces.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">
            Aucune annonce dans la base de données
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnnonces;