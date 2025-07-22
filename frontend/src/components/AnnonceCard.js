// frontend/src/components/AnnonceCard.js
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import WishlistButton from './WishlistButton';
import { useAuth } from '../contexts/AuthContext';

const AnnonceCard = ({ annonce, variant = 'default' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (date) => {
    const now = new Date();
    const annonceDate = new Date(date);
    const diffTime = Math.abs(now - annonceDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    return annonceDate.toLocaleDateString('fr-FR');
  };

  const isOwner = user && (annonce.user_id === user.id || annonce.user_id?._id === user.id);

  // Différentes variantes de cartes
  const cardClasses = {
    default: "bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 group",
    compact: "bg-white rounded-lg shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-all duration-200 group",
    featured: "bg-white rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 group border-2 border-orange-200"
  };

  const imageHeightClasses = {
    default: "h-48",
    compact: "h-32",
    featured: "h-64"
  };

  return (
    <div
      className={cardClasses[variant]}
      onClick={() => navigate(`/annonce/${annonce._id}`, { state: { from: location.pathname } })}
    >
      {/* Image Container */}
      <div className={`relative ${imageHeightClasses[variant]} overflow-hidden`}>
        {annonce.images && annonce.images[0] ? (
          <img
            src={`http://localhost:5000${annonce.images[0]}`}
            alt={annonce.titre}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-wrap gap-2">
          {annonce.etat === 'Neuf' && (
            <span className="badge badge-success">
              ✨ Neuf
            </span>
          )}
          {annonce.nombre_vues > 100 && (
            <span className="badge badge-danger">
              🔥 Populaire
            </span>
          )}
          {variant === 'featured' && (
            <span className="badge badge-primary">
              ⭐ Premium
            </span>
          )}
          {!annonce.is_active && (
            <span className="bg-gray-800 text-white text-xs px-2 py-1 rounded-full font-medium">
              Inactive
            </span>
          )}
        </div>
        
        {/* Wishlist Button */}
        {!isOwner && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <WishlistButton 
              annonceId={annonce._id} 
              isOwner={isOwner}
              className="shadow-lg backdrop-blur-sm bg-white/80"
            />
          </div>
        )}

        {/* Category Badge */}
        {annonce.categorie_id && (
          <div className="absolute bottom-2 left-2">
            <span className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs px-3 py-1 rounded-full font-medium flex items-center space-x-1">
              <span>{annonce.categorie_id.icone || '📁'}</span>
              <span>{annonce.categorie_id.nom}</span>
            </span>
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-orange-500 transition-colors">
          {annonce.titre}
        </h3>
        
        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-2xl font-bold text-orange-500">
            {formatPrice(annonce.prix)}
          </p>
          {annonce.marque && (
            <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded">
              {annonce.marque}
            </span>
          )}
        </div>
        
        {/* Location and Date */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
          <div className="flex items-center space-x-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{annonce.ville}</span>
          </div>
          <span>{formatDate(annonce.date_publication)}</span>
        </div>
        
        {/* Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-3 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{annonce.nombre_vues}</span>
            </div>
            {annonce.user_id && (
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="truncate max-w-[100px]">
                  {annonce.user_id.nom || 'Anonyme'}
                </span>
              </div>
            )}
          </div>
          
          {/* Quick Action Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.location.href = `tel:${annonce.user_id?.telephone}`;
            }}
            className="text-orange-500 hover:text-orange-600 transition-colors"
            title="Appeler"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnonceCard;