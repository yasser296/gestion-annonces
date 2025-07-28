// WishlistButton.js - Version corrigée avec compatibilité API
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import usePopUp from '../hooks/usePopUp';
import { useNavigate } from 'react-router-dom';

const WishlistButton = ({ annonceId, isOwner = false, className = "", size = "md" }) => {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const { user } = useAuth();
  const { showPopup, PopUpComponent } = usePopUp();
  const navigate = useNavigate();

  // Tailles disponibles
  const sizes = {
    sm: {
      button: "w-8 h-8",
      icon: "w-4 h-4",
      padding: "p-1.5"
    },
    md: {
      button: "w-10 h-10",
      icon: "w-5 h-5", 
      padding: "p-2.5"
    },
    lg: {
      button: "w-12 h-12",
      icon: "w-6 h-6",
      padding: "p-3"
    }
  };

  const currentSize = sizes[size];

  useEffect(() => {
    if (user && !isOwner) {
      checkWishlistStatus();
    }
  }, [user, annonceId, isOwner]);

  const checkWishlistStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Utiliser la route /check comme dans l'ancien code
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/wishlist/check/${annonceId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      setIsInWishlist(response.data.isInWishlist);
    } catch (error) {
      console.error('Erreur lors de la vérification de la wishlist:', error);
    }
  };

  const toggleWishlist = async (e) => {
    e.stopPropagation();
    
    if (!user) {
      showPopup({
        type: 'info',
        title: "Vous n'êtes pas connecté",
        message: 'Veuillez vous connecter pour ajouter aux favoris',
        onConfirm: () => navigate('/register')
      });
      return;
    }

    if (isOwner) {
      showPopup({
        type: 'error',
        title: "C'est votre propre annonce",
        message: 'Vous ne pouvez pas ajouter votre propre annonce aux favoris',        
      });
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    setIsAnimating(true);

    try {
      const token = localStorage.getItem('token');
      
      if (isInWishlist) {
        // Retirer de la wishlist - utiliser l'ancienne route
        await axios.delete(
          `${process.env.REACT_APP_API_URL}/api/wishlist/remove/${annonceId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        setIsInWishlist(false);
        // Émettre un événement pour mettre à jour le compteur
        window.dispatchEvent(new Event('wishlistUpdated'));
      } else {
        // Ajouter à la wishlist - utiliser l'ancienne route
        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/wishlist/add/${annonceId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        setIsInWishlist(true);
        // Émettre un événement pour mettre à jour le compteur
        window.dispatchEvent(new Event('wishlistUpdated'));
      }
    } catch (error) {
      console.error('Erreur wishlist:', error);
      showPopup({
        type: 'error',
        title: 'Erreur',
        message: error.response?.data?.message || 'Erreur lors de l\'opération'
      });
    } finally {
      setIsLoading(false);
      // Animation se termine après un délai
      setTimeout(() => setIsAnimating(false), 600);
    }
  };

  // Ne pas afficher le bouton si c'est le propriétaire ou si pas d'utilisateur
  if (isOwner || !user) {
    return null;
  }

  return (
    <>
      <PopUpComponent />
      <button
        onClick={toggleWishlist}
        disabled={isLoading}
        className={`
          ${currentSize.button} ${currentSize.padding}
          rounded-full
          transition-all duration-300 ease-out
          focus:outline-none focus:ring-4 focus:ring-pink-500/30
          transform hover:scale-110 active:scale-95
          ${isInWishlist 
            ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg shadow-pink-500/25' 
            : 'bg-white/90 backdrop-blur-sm text-gray-600 hover:text-pink-500 shadow-lg hover:shadow-xl'
          }
          ${isLoading ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}
          ${isAnimating ? 'animate-pulse' : ''}
          ${className}
        `}
        title={isInWishlist ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      >
        <div className="relative flex items-center justify-center">
          {isLoading ? (
            // Spinner de chargement
            <svg 
              className={`${currentSize.icon} animate-spin`} 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : isInWishlist ? (
            // Cœur plein avec animation
            <div className="relative">
              <svg 
                className={`${currentSize.icon} transition-all duration-300 ${isAnimating ? 'animate-bounce' : ''}`} 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
              
              {/* Particules d'animation */}
              {isAnimating && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute inset-0 rounded-full bg-pink-400 opacity-70 animate-ping"
                      style={{
                        animationDelay: `${i * 200}ms`,
                        animationDuration: '1s'
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Cœur vide avec hover effect
            <div className="relative group">
              <svg 
                className={`${currentSize.icon} transition-all duration-300 group-hover:scale-110`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                />
              </svg>
              
              {/* Effet de hover subtil */}
              <div className="absolute inset-0 rounded-full bg-pink-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
            </div>
          )}
        </div>

        {/* Tooltip moderne */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
          {isInWishlist ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      </button>
    </>
  );
};

export default WishlistButton;