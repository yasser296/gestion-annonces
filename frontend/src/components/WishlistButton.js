import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import usePopUp from '../hooks/usePopUp';
import { useNavigate } from 'react-router-dom';

const WishlistButton = ({ annonceId, isOwner = false, className = "" }) => {
  const { user } = useAuth();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const { showPopup, PopUpComponent } = usePopUp();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !isOwner) {
      checkWishlistStatus();
    }
  }, [user, annonceId]);

  const checkWishlistStatus = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/wishlist/check/${annonceId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setIsInWishlist(response.data.isInWishlist);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const toggleWishlist = async (e) => {
    e.stopPropagation(); // Empêcher la navigation vers l'annonce
    
    if (!user) {
    //   alert('Veuillez vous connecter pour ajouter aux favoris');
      showPopup({
        type: 'info', // ou 'success', 'error', 'warning', 'confirm'
        title: "vous n'etes pas connecté",
        message: 'Veuillez vous connecter pour ajouter aux favoris',
        onConfirm: () => navigate('/register')
        });
      return;
    }

    if (isOwner) {
    //   alert('Vous ne pouvez pas ajouter votre propre annonce aux favoris');
      showPopup({
        type: 'error', // ou 'success', 'error', 'warning', 'confirm'
        title: "c'est votre propre annonce",
        message: 'Vous ne pouvez pas ajouter votre propre annonce aux favoris',        
        });
      return;
    }

    setLoading(true);
    try {
      if (isInWishlist) {
        await axios.delete(
          `http://localhost:5000/api/wishlist/remove/${annonceId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        setIsInWishlist(false);
        // Émettre un événement pour mettre à jour le compteur
        window.dispatchEvent(new Event('wishlistUpdated'));
      } else {
        await axios.post(
          `http://localhost:5000/api/wishlist/add/${annonceId}`,
          {},
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        setIsInWishlist(true);
        // Émettre un événement pour mettre à jour le compteur
        window.dispatchEvent(new Event('wishlistUpdated'));
      }
    } catch (error) {
      console.error('Erreur:', error);
    //   alert(error.response?.data?.message || 'Erreur lors de l\'opération');
        showPopup({
            type: 'error',
            title: 'Erreur',
            message: error.response?.data?.message || 'Erreur lors de l\'opération'
        });
    } finally {
      setLoading(false);
    }
  };

  if (isOwner || !user) {
    return null;
  }

  return (
    <>
        <PopUpComponent />
        <button
        onClick={toggleWishlist}
        disabled={loading}
        className={`p-2 rounded-full transition-all duration-200 ${
            isInWishlist 
            ? 'bg-red-500 text-white hover:bg-red-600' 
            : 'bg-white text-gray-600 hover:text-red-500 hover:bg-red-50'
        } ${className}`}
        title={isInWishlist ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
        <svg 
            className="w-5 h-5" 
            fill={isInWishlist ? 'currentColor' : 'none'} 
            stroke="currentColor" 
            viewBox="0 0 24 24"
        >
            <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
            />
        </svg>
        </button>
    </>
  );
};

export default WishlistButton;