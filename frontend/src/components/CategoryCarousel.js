// CategoryCarousel.js - Version moderne avec design amélioré
import React, { useRef, useState, useEffect } from 'react';
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

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (scrollContainer) {
      handleScroll(); // Check initial state
      scrollContainer.addEventListener('scroll', handleScroll);
      return () => scrollContainer.removeEventListener('scroll', handleScroll);
    }
  }, [annonces]);

  const formatPrice = (price) => {
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
      {/* Header moderne avec gradient */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Icon avec effet glassmorphism */}
            <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl filter drop-shadow-sm">{icon}</span>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{title}</h2>
              <div className="flex items-center space-x-3">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-orange-100 text-orange-600 rounded-full text-sm font-semibold">
                  {annonces.length}
                </span>
                <span className="text-gray-600">
                  annonce{annonces.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
          
          {/* Bouton "Voir tout" moderne */}
          {(onViewAll || categoryId) && (
            <button
              onClick={onViewAll || (() => navigate(`/category/${categoryId}`))}
              className="group flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all transform hover:scale-105 font-medium"
            >
              <span>Voir tout</span>
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Carousel Container avec shadows améliorées */}
      <div className="relative">
        {/* Left Arrow avec glassmorphism */}
        {showLeftArrow && (
          <button
            onClick={() => scroll('left')}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-md rounded-full p-3 shadow-2xl hover:bg-white hover:shadow-3xl transition-all duration-300 transform hover:scale-110 border border-white/20"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Right Arrow avec glassmorphism */}
        {showRightArrow && (
          <button
            onClick={() => scroll('right')}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-md rounded-full p-3 shadow-2xl hover:bg-white hover:shadow-3xl transition-all duration-300 transform hover:scale-110 border border-white/20"
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
          className="flex space-x-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4 px-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {annonces.map((annonce) => (
            <div
              key={annonce._id}
              className="flex-none w-80 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer group border border-gray-100 overflow-hidden"
              onClick={() => navigate(`/annonce/${annonce._id}`, { state: { from: location.pathname } })}
            >
              {/* Image Container avec overlay moderne */}
              <div className="relative h-52 overflow-hidden">
                {annonce.images && annonce.images[0] ? (
                  <img
                    src={`${process.env.REACT_APP_API_URL}${annonce.images[0]}`}
                    alt={annonce.titre}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-16 h-16 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-gray-400 font-medium">Aucune image</span>
                    </div>
                  </div>
                )}
                
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Badges modernes */}
                <div className="absolute top-3 left-3 flex flex-col space-y-2">
                  {annonce.etat === 'Neuf' && (
                    <span className="bg-green-500/90 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg">
                      ✨ Neuf
                    </span>
                  )}
                  {annonce.nombre_vues > 100 && (
                    <span className="bg-red-500/90 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg">
                      🔥 Populaire
                    </span>
                  )}
                  {new Date() - new Date(annonce.date_publication) < 24 * 60 * 60 * 1000 && (
                    <span className="bg-blue-500/90 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg">
                      🆕 Nouveau
                    </span>
                  )}
                </div>
                
                {/* Wishlist Button amélioré */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  <WishlistButton 
                    annonceId={annonce._id} 
                    isOwner={user && (annonce.user_id === user.id || annonce.user_id?._id === user.id)}
                    className="shadow-2xl backdrop-blur-sm bg-white/90 hover:bg-white"
                  />
                </div>

                {/* Badges de catégorie en bas */}
                <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                  {annonce.categorie_id && (
                    <span className="bg-white/95 backdrop-blur-sm text-gray-800 text-xs px-3 py-1.5 rounded-full font-medium shadow-lg flex items-center space-x-1">
                      <span>{annonce.categorie_id.icone || '📁'}</span>
                      <span>{annonce.categorie_id.nom}</span>
                    </span>
                  )}
                  {annonce.sous_categorie_id && (
                    <span className="bg-orange-100/95 backdrop-blur-sm text-orange-800 text-xs px-3 py-1.5 rounded-full font-medium shadow-lg flex items-center space-x-1">
                      <span>{annonce.sous_categorie_id.icone || '📂'}</span>
                      <span>{annonce.sous_categorie_id.nom}</span>
                    </span>
                  )}
                </div>
              </div>
              
              {/* Content avec spacing amélioré */}
              <div className="p-6">
                {/* Titre avec gradient hover */}
                <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 text-lg group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-pink-500 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                  {annonce.titre}
                </h3>
                
                {/* Prix avec styling amélioré */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                    {formatPrice(annonce.prix)}
                  </p>
                  {annonce.marque && (
                    <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full font-medium">
                      {annonce.marque}
                    </span>
                  )}
                </div>
                
                {/* Métadonnées avec icons */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      <span className="font-medium">{annonce.ville}</span>
                    </div>
                    <span className="text-gray-500">{formatDate(annonce.date_publication)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>{annonce.nombre_vues} vues</span>
                    </div>
                    
                    {/* État badge */}
                    {annonce.etat && (
                      <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                        annonce.etat === 'Neuf' 
                          ? 'bg-green-100 text-green-700' 
                          : annonce.etat === 'Comme neuf'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {annonce.etat}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Carte "Voir plus" à la fin */}
          {(onViewAll || categoryId) && (
            <div
              onClick={onViewAll || (() => navigate(`/category/${categoryId}`))}
              className="flex-none w-80 bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative h-full flex flex-col items-center justify-center p-8 text-white text-center">
                <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-2">Voir toutes les annonces</h3>
                <p className="text-white/80 text-sm">
                  Découvrez {annonces.length}+ annonces dans cette catégorie
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryCarousel;