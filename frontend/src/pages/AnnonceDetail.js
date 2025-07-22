import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import WishlistButton from '../components/WishlistButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import usePopUp from '../hooks/usePopUp';


const AnnonceDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [annonce, setAnnonce] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isOwner, setIsOwner] = useState(false);
  const location = useLocation();
  const from = location.state?.from || '/';
  const { showPopup, PopUpComponent } = usePopUp();
  const isAdmin = user && (user.role === "admin" || user.role_id === 1);


  const incrementViews = async () => {
    try {
      await axios.patch(`http://localhost:5000/api/annonces/${id}/vues`);
    } catch (err) {
      console.error("Erreur lors de l'incrémentation des vues :", err);
    }
  };

  

  const handleDelete = async () => {
    const confirmed = await showPopup({
      type: "warning",
      title: "Suppression",
      message: "Voulez-vous vraiment supprimer cette annonce ?",
      confirmText: "Oui, supprimer",
      cancelText: "Annuler",
      showCancel: true,
    });

    if (!confirmed) return;

    try {
      await axios.delete(`http://localhost:5000/api/annonces/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Navigation directe après suppression réussie
      navigate(from || '/');
      
      showPopup({
        type: "success",
        title: "Succès",
        message: "Annonce supprimée avec succès.",
      });
    } catch (error) {
      showPopup({
        type: 'error',
        title: 'Erreur',
        message: error.response?.data?.message || 'Erreur lors de la suppression de l\'annonce',
      });
    }
  };


  useEffect(() => {
    fetchAnnonce();

    const timer = setTimeout(() => {
      incrementViews();
    }, 2000);

    return () => clearTimeout(timer);
  }, [id]);

  useEffect(() => {
    // Vérifier si l'utilisateur est le propriétaire
    if (user && annonce && user.id === annonce.user_id?._id) {
      setIsOwner(true);
    }
  }, [user, annonce]);

  const fetchAnnonce = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/annonces/${id}`);
      setAnnonce(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement de l\'annonce:', error);
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
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!annonce) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-center text-gray-500">Annonce non trouvée</p>
      </div>
    );
  }

  return (
    <>
      <PopUpComponent />
        <div className="max-w-7xl mx-auto px-4 py-8">
          {(isOwner || isAdmin) && (
            <div className="mb-4 flex justify-end gap-3">
              <button
                onClick={() => navigate(`/modifier-annonce/${id}`, { 
                  state: { from: location.pathname } 
                })}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Modifier l'annonce
              </button>
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition flex items-center"
                title="Supprimer l'annonce"
              >
                <FontAwesomeIcon icon={faTrash} />
              </button>
            </div>
          )}



          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Images et description */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image principale */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="h-96 bg-gray-200">
                  {annonce.images && annonce.images[selectedImage] ? (
                    <img
                      src={`http://localhost:5000${annonce.images[selectedImage]}`}
                      alt={annonce.titre}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* Miniatures */}
                {annonce.images && annonce.images.length > 1 && (
                  <div className="flex space-x-2 p-4 overflow-x-auto">
                    {annonce.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded overflow-hidden ${
                          selectedImage === index ? 'ring-2 ring-orange-300' : ''
                        }`}
                      >
                        <img
                          src={`http://localhost:5000${image}`}
                          alt={`${annonce.titre} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold mb-4">Description</h2>
                <p className="text-gray-700 whitespace-pre-line">{annonce.description}</p>
                
                {(annonce.marque || annonce.etat) && (
                  <div className="mt-6 grid grid-cols-2 gap-4">
                    {annonce.marque && (
                      <div>
                        <span className="text-gray-500">Marque:</span>
                        <p className="font-semibold">{annonce.marque}</p>
                      </div>
                    )}
                    {annonce.etat && (
                      <div>
                        <span className="text-gray-500">État:</span>
                        <p className="font-semibold">{annonce.etat}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Informations et contact */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                <div className="flex justify-between items-start mb-4">
                  <h1 className="text-2xl font-bold">{annonce.titre}</h1>
                  <WishlistButton 
                    annonceId={annonce._id} 
                    isOwner={isOwner}
                    className="ml-2"
                    
                    
                  />
                </div>
                <p className="text-3xl font-bold text-orange-500 mb-4">{formatPrice(annonce.prix)}</p>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span>{annonce.categorie_id?.nom || 'Sans catégorie'}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{annonce.ville}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{formatDate(annonce.date_publication)}</span>
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{annonce.nombre_vues} vues</span>
                  </div>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-lg mb-4">Contact</h3>
                  <div 
                    className="mb-4 cursor-pointer hover:text-orange-500"
                    onClick={() => navigate(`/profil/${annonce.user_id?._id}`)}
                  >
                    <p className="text-gray-600">{annonce.user_id?.nom}</p>
                    <p className="text-sm text-gray-500">Voir le profil</p>
                  </div>
                  
                  {!isOwner && (
                    <>
                      <a
                        href={`tel:${annonce.user_id?.telephone}`}
                        className="block w-full bg-orange-500 text-white text-center py-3 rounded-lg hover:bg-orange-700 transition mb-3"
                      >
                        <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {annonce.user_id?.telephone}
                      </a>
                      
                      <a
                        href={`mailto:${annonce.user_id?.email}`}
                        className="block w-full border border-orange-500 text-orange-500 text-center py-3 rounded-lg hover:bg-orange-50 transition"
                      >
                        <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Envoyer un email
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
    </>
  );
};

export default AnnonceDetail;