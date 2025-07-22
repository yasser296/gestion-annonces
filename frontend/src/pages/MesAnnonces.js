import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation  } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import usePopUp from '../hooks/usePopUp';

const MesAnnonces = () => {
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { showPopup, PopUpComponent } = usePopUp();

  useEffect(() => {
    fetchMesAnnonces();
  }, []);

  const fetchMesAnnonces = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/annonces/user/mes-annonces');
      setAnnonces(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des annonces:', error);
    } finally {
      setLoading(false);
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


  const handleToggleStatus = async (id, currentStatus) => {
    try {
      // console.log("working");
      await axios.patch(
        `http://localhost:5000/api/annonces/${id}/toggle-status`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Mettre à jour l'état local
      setAnnonces(annonces.map(annonce => 
        annonce._id === id ? { ...annonce, is_active: !currentStatus } : annonce
      ));
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      // alert('Erreur lors du changement de statut');
      showPopup({
        type: 'error',
        title: 'Erreur',
        message: error.response?.data?.message || 'Erreur lors du changement de statut'
      });
    }
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Supprimer cette annonce ?',
      text: "Cette action est irréversible.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler',
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:5000/api/annonces/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        Swal.fire('Supprimé !', 'L\'annonce a été supprimée.', 'success');
        fetchMesAnnonces();
        window.dispatchEvent(new Event('wishlistUpdated'));
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        Swal.fire('Erreur', 'Erreur lors de la suppression', 'error');
      }
    }
  };

  // Gestion de la sélection
  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
      setSelectAll(false);
    } else {
      const allIds = currentAnnonces.map(annonce => annonce._id);
      setSelectedIds(allIds);
      setSelectAll(true);
    }
  };

  // Actions groupées
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) {
      showPopup({
        type: 'warning',
        title: 'Aucune sélection',
        message: 'Veuillez sélectionner au moins une annonce'
      });
      return;
    }

    showPopup({
      type: 'confirm',
      title: 'Confirmation',
      message: `Voulez-vous vraiment supprimer ${selectedIds.length} annonce(s) ?`,
      showCancel: true,
      onConfirm: async () => {
        try {
          await Promise.all(
            selectedIds.map(id =>
              axios.delete(`http://localhost:5000/api/annonces/${id}`, {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
                }
              })
            )
          );
          
          setSelectedIds([]);
          setSelectAll(false);
          fetchMesAnnonces();
          
          // Forcer le rafraîchissement du compteur wishlist
          window.dispatchEvent(new Event('wishlistUpdated'));
          
          showPopup({
            type: 'success',
            title: 'Succès',
            message: 'Les annonces ont été supprimées'
          });
        } catch (error) {
          console.error('Erreur lors de la suppression groupée:', error);
          showPopup({
            type: 'error',
            title: 'Erreur',
            message: 'Erreur lors de la suppression de certaines annonces'
          });
        }
      }
    });
  };

  const handleBulkToggleStatus = async (activate) => {
    if (selectedIds.length === 0) {
      // alert('Veuillez sélectionner au moins une annonce');
      showPopup({
        type: 'info', // ou 'success', 'error', 'warning', 'confirm'
        title: 'aucune annonce sélectionnée',
        message: 'Veuillez sélectionner au moins une annonce',
      });
      return;
    }

    try {
      // Modifier le statut de chaque annonce sélectionnée
      await Promise.all(
        selectedIds.map(id => {
          const annonce = annonces.find(a => a._id === id);
          if (annonce && annonce.is_active !== activate) {
            return axios.patch(
              `http://localhost:5000/api/annonces/${id}/toggle-status`,
              {},
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem('token')}`
                }
              }
            );
          }
          return Promise.resolve();
        })
      );
      
      setSelectedIds([]);
      setSelectAll(false);
      fetchMesAnnonces();
    } catch (error) {
      console.error('Erreur lors de la modification groupée:', error);
      // alert('Erreur lors de la modification de certaines annonces');
      showPopup({
        type: 'error',
        title: 'Erreur',
        message: error.response?.data?.message || 'Erreur lors de la modification de certaines annonces'
      });
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAnnonces = annonces.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(annonces.length / itemsPerPage);

  // Vérifier si toutes les annonces de la page actuelle sont sélectionnées
  useEffect(() => {
    const allCurrentSelected = currentAnnonces.length > 0 && 
      currentAnnonces.every(annonce => selectedIds.includes(annonce._id));
    setSelectAll(allCurrentSelected);
  }, [selectedIds, currentAnnonces]);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <>
      <PopUpComponent />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Mes annonces</h1>
          <button
            onClick={() => navigate('/nouvelle-annonce')}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition"
          >
            + Nouvelle annonce
          </button>
        </div>

        {/* Actions groupées */}
        {selectedIds.length > 0 && (
          <div className="mb-4 p-4 bg-orange-50 rounded-lg flex items-center justify-between">
            <span className="text-sm text-gray-700">
              {selectedIds.length} annonce{selectedIds.length > 1 ? 's' : ''} sélectionnée{selectedIds.length > 1 ? 's' : ''}
            </span>
            <div className="space-x-2">
              <button
                onClick={() => handleBulkToggleStatus(true)}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
              >
                Activer
              </button>
              <button
                onClick={() => handleBulkToggleStatus(false)}
                className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
              >
                Désactiver
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Supprimer
              </button>
              <button
                onClick={() => {
                  setSelectedIds([]);
                  setSelectAll(false);
                }}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {annonces.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500 text-lg mb-4">Vous n'avez pas encore d'annonces</p>
            <button
              onClick={() => navigate('/nouvelle-annonce')}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition"
            >
              Créer votre première annonce
            </button>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input 
                        type="checkbox" 
                        className="rounded"
                        checked={selectAll}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Produit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Catégorie
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vues
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prix
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
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
                          e.target.type === 'checkbox' || 
                          e.target.closest('button') ||
                          e.target.closest('.toggle-container')
                        ) {
                          return;
                        }
                        navigate(`/annonce/${annonce._id}`, { state: { from: location.pathname } });
                      }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input 
                          type="checkbox" 
                          className="rounded"
                          checked={selectedIds.includes(annonce._id)}
                          onChange={() => handleSelectOne(annonce._id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {annonce.images && annonce.images[0] ? (
                              <img
                                className="h-10 w-10 rounded-lg object-cover"
                                src={`http://localhost:5000${annonce.images[0]}`}
                                alt={annonce.titre}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-gray-200 flex items-center justify-center">
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
                        <span className="text-sm text-gray-900">
                          {annonce.categorie_id?.nom || 'Sans catégorie'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div 
                          className="toggle-container"
                          onClick={(e) => e.stopPropagation()}
                        >
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
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">{annonce.nombre_vues}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {formatPrice(annonce.prix)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/modifier-annonce/${annonce._id}`, { 
                              state: { from: location.pathname } 
                            });
                          }}
                          className="text-orange-500 hover:text-orange-900 mr-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(annonce._id);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-700">Afficher</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="text-sm text-gray-700">par page</span>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* Numéros de page */}
                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 2 && pageNumber <= currentPage + 2)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => paginate(pageNumber)}
                        className={`px-3 py-1 rounded ${
                          currentPage === pageNumber
                            ? 'bg-orange-500 text-white'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (
                    pageNumber === currentPage - 3 ||
                    pageNumber === currentPage + 3
                  ) {
                    return <span key={pageNumber}>...</span>;
                  }
                  return null;
                })}

                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default MesAnnonces;