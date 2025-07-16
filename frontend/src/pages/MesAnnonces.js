import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const MesAnnonces = () => {
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMesAnnonces();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCardClick = (id) => {
    if (openMenuId !== id) {
      navigate(`/annonce/${id}`);
    }
  };



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
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Mes annonces</h1>
        <button
          onClick={() => navigate('/nouvelle-annonce')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Nouvelle annonce
        </button>
      </div>

      {annonces.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-500 text-lg mb-4">Vous n'avez pas encore d'annonces</p>
          <button
            onClick={() => navigate('/nouvelle-annonce')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Créer votre première annonce
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {annonces.map((annonce) => (
            <div
              key={annonce.id}
              onClick={() => handleCardClick(annonce.id)}
              className="relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow group"
            >

              <div className="h-48 bg-gray-200">
                {annonce.images && annonce.images[0] ? (
                  <img
                    src={`http://localhost:5000${annonce.images[0]}`}
                    alt={annonce.titre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>

              <div className="absolute top-2 right-2 z-10">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId(openMenuId === annonce.id ? null : annonce.id);
                  }}
                  className="hidden group-hover:block text-gray-600 bg-white rounded-full p-1 shadow hover:bg-gray-100"
                >
                  ⋯
                </button>
              </div>

              
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2 truncate">{annonce.titre}</h3>
                <p className="text-2xl font-bold text-blue-600 mb-2">{formatPrice(annonce.prix)}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {annonce.categorie_nom}
                  </span>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {annonce.ville}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatDate(annonce.date_publication)}</span>                 
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {annonce.nombre_vues} vues
                  </span>
                </div>
              </div>
              {openMenuId === annonce.id && (
                <div
                  ref={menuRef}
                  className="absolute top-10 right-2 bg-white shadow-lg rounded-md p-2 z-20"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => navigate(`/modifier-annonce/${annonce.id}`)}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-blue-600"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm('Voulez-vous vraiment supprimer cette annonce ?')) {
                        try {
                          await axios.delete(`http://localhost:5000/api/annonces/${annonce.id}`, {
                            headers: {
                              Authorization: `Bearer ${localStorage.getItem('token')}`
                            }
                          });
                          setOpenMenuId(null);
                          fetchMesAnnonces();
                        } catch (err) {
                          console.error(err);
                          alert("Erreur lors de la suppression");
                        }
                      }
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
                  >
                    Supprimer
                  </button>
                </div>
              )}

            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MesAnnonces;