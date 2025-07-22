// frontend/src/components/CategoryCarousel.js
import React, { useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import WishlistButton from './WishlistButton';
import { useAuth } from '../contexts/AuthContext';

const CategoryCarousel = ({ title, annonces, icon, categoryId, onViewAll }) => {
  const scrollRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -400 : 400;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const formatPrice = (price) => {
  // Espace classique + "DH"
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 })
    .format(price)
    .replace(/\u202f/g, ' ')
    + ' DH';
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

  if (!annonces || annonces.length === 0) return null;

  return (
    <div className="mb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <span className="text-3xl">{icon}</span>
          <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
          <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-sm font-medium">
            {annonces.length} annonces
          </span>
        </div>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-orange-500 hover:text-orange-600 font-medium flex items-center space-x-1"
          >
            <span>Voir tout</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Carousel Container */}
      <div className="relative">
        {/* Left Arrow */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-all duration-200 hover:scale-110"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Right Arrow */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg hover:bg-white transition-all duration-200 hover:scale-110"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Annonces Container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex space-x-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {annonces.map((annonce) => (
            <div
              key={annonce._id}
              className="flex-none w-72 bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group"
              onClick={() => navigate(`/annonce/${annonce._id}`, { state: { from: location.pathname } })}
            >
              {/* Image Container */}
              <div className="relative h-48 overflow-hidden rounded-t-xl">
                {annonce.images && annonce.images[0] ? (
                  <img
                    src={`http://localhost:5000${annonce.images[0]}`}
                    alt={annonce.titre}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <svg className="w-20 h-20 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                
                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col space-y-2">
                  {annonce.etat === 'Neuf' && (
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      Neuf
                    </span>
                  )}
                  {annonce.nombre_vues > 100 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      Populaire
                    </span>
                  )}
                </div>
                
                {/* Wishlist Button */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <WishlistButton 
                    annonceId={annonce._id} 
                    isOwner={user && (annonce.user_id === user.id || annonce.user_id?._id === user.id)}
                    className="shadow-lg"
                  />
                </div>
              </div>
              
              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2 group-hover:text-orange-500 transition-colors">
                  {annonce.titre}
                </h3>
                
                <p className="text-2xl font-bold text-orange-500 mb-2">
                  {formatPrice(annonce.prix)}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{annonce.ville}</span>
                  </div>
                  <span>{formatDate(annonce.date_publication)}</span>
                </div>
                
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-1 text-sm text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{annonce.nombre_vues} vues</span>
                  </div>
                  {annonce.marque && (
                    <span className="text-sm font-medium text-gray-700">
                      {annonce.marque}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryCarousel;