import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import usePopUp from '../hooks/usePopUp';

const WishlistPage = () => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { showPopup, PopUpComponent } = usePopUp();
  const [cleaning, setCleaning] = useState(false);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/wishlist', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setWishlistItems(response.data);
      // Le backend nettoie automatiquement, donc on émet l'événement
      window.dispatchEvent(new Event('wishlistUpdated'));
    } catch (error) {
      console.error('Erreur lors du chargement de la wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const cleanWishlist = async () => {
    setCleaning(true);
    try {
      const response = await axios.post(
        'http://localhost:5000/api/wishlist/clean',
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data.cleanedCount > 0) {
        showPopup({
          type: 'success',
          title: 'Nettoyage effectué',
          message: `${response.data.cleanedCount} annonce(s) supprimée(s) de vos favoris`
        });
        fetchWishlist();
      } else {
        showPopup({
          type: 'info',
          title: 'Aucun nettoyage nécessaire',
          message: 'Tous vos favoris sont valides'
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      showPopup({
        type: 'error',
        title: 'Erreur',
        message: 'Erreur lors du nettoyage des favoris'
      });
    } finally {
      setCleaning(false);
    }
  };

  const handleRemoveFromWishlist = async (annonceId) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/wishlist/remove/${annonceId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      // Retirer l'élément de la liste locale
      setWishlistItems(wishlistItems.filter(item => item.annonce_id._id !== annonceId));
      // Émettre un événement pour mettre à jour le compteur dans la navbar
      window.dispatchEvent(new Event('wishlistUpdated'));
    } catch (error) {
      console.error('Erreur:', error);
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
          <h1 className="text-3xl font-bold">Mes favoris</h1>
          
          {wishlistItems.length > 0 && (
            <button
              onClick={cleanWishlist}
              disabled={cleaning}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
            >
              {cleaning ? 'Nettoyage...' : 'Nettoyer les favoris'}
            </button>
          )}
        </div>  

        {wishlistItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <p className="text-gray-500 text-lg mb-4">Vous n'avez pas encore de favoris</p>
            <button
              onClick={() => navigate('/')}
              className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-700 transition"
            >
              Découvrir des annonces
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item) => {
              const annonce = item.annonce_id;
              if (!annonce) return null;
              
              return (
                <div
                  key={item._id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow relative"
                >
                  <div 
                    onClick={() => navigate(`/annonce/${annonce._id}`, { state: { from: location.pathname } })}
                    className="cursor-pointer"
                  >
                    <div className="h-48 bg-gray-200 relative">
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
                      
                      {/* Badge si l'annonce n'est pas active */}
                      {!annonce.is_active && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 text-xs rounded">
                          Inactive
                        </div>
                      )}
                    </div>
                    
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 truncate">{annonce.titre}</h3>
                      <p className="text-2xl font-bold text-orange-500 mb-2">{formatPrice(annonce.prix)}</p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                        <span>{annonce.categorie_id?.nom || 'Sans catégorie'}</span>
                        <span className="flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {annonce.ville}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Ajouté le {formatDate(item.date_ajout)}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFromWishlist(annonce._id);
                          }}
                          className="text-red-500 hover:text-red-700 font-medium"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default WishlistPage;