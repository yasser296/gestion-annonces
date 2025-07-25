// AnnonceCard.js - Version moderne avec variantes
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import WishlistButton from './WishlistButton';
import { useAuth } from '../contexts/AuthContext';

const AnnonceCard = ({ annonce, variant = 'default' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

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

  const isOwner = user && (annonce.user_id === user.id || annonce.user_id?._id === user.id);
  const isNew = new Date() - new Date(annonce.date_publication) < 24 * 60 * 60 * 1000;

  // Variante Liste (horizontale)
  if (variant === 'list') {
    return (
      <div
        className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer group border border-gray-100 overflow-hidden"
        onClick={() => navigate(`/annonce/${annonce._id}`, { state: { from: location.pathname } })}
      >
        <div className="flex">
          {/* Image */}
          <div className="relative w-64 h-48 flex-shrink-0 overflow-hidden">
            {annonce.images && annonce.images[0] ? (
              <img
                src={`${process.env.REACT_APP_API_URL}${annonce.images[0]}`}
                alt={annonce.titre}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            
            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col space-y-2">
              {annonce.etat === 'Neuf' && (
                <span className="bg-green-500/90 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg">
                  ✨ Neuf
                </span>
              )}
              {isNew && (
                <span className="bg-blue-500/90 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg">
                  🆕 Nouveau
                </span>
              )}
            </div>

            {/* Wishlist Button */}
            {!isOwner && (
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300">
                <WishlistButton 
                  annonceId={annonce._id} 
                  isOwner={isOwner}
                  className="shadow-2xl backdrop-blur-sm bg-white/90 hover:bg-white"
                />
              </div>
            )}
          </div>

          {/* Contenu */}
          <div className="flex-1 p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-pink-500 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                {annonce.titre}
              </h3>
              
              <p className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent mb-4">
                {formatPrice(annonce.prix)}
              </p>

              {/* Description si disponible */}
              {annonce.description && (
                <p className="text-gray-600 text-sm line-clamp-2 mb-4">
                  {annonce.description}
                </p>
              )}
            </div>

            <div className="space-y-3">
              {/* Catégories */}
              {(annonce.categorie_id || annonce.sous_categorie_id) && (
                <div className="flex flex-wrap gap-2">
                  {annonce.categorie_id && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-3 py-1.5 rounded-full font-medium flex items-center space-x-1">
                      <span>{annonce.categorie_id.icone || '📁'}</span>
                      <span>{annonce.categorie_id.nom}</span>
                    </span>
                  )}
                  {annonce.sous_categorie_id && (
                    <span className="bg-orange-100 text-orange-800 text-xs px-3 py-1.5 rounded-full font-medium flex items-center space-x-1">
                      <span>{annonce.sous_categorie_id.icone || '📂'}</span>
                      <span>{annonce.sous_categorie_id.nom}</span>
                    </span>
                  )}
                </div>
              )}

              {/* Métadonnées */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span className="font-medium">{annonce.ville}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{annonce.nombre_vues} vues</span>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{formatDate(annonce.date_publication)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Variante par défaut (grille)
  return (
    <div
      className={`bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer group border border-gray-100 overflow-hidden ${
        variant === 'featured' ? 'ring-2 ring-orange-200' : ''
      }`}
      onClick={() => navigate(`/annonce/${annonce._id}`, { state: { from: location.pathname } })}
    >
      {/* Image Container */}
      <div className={`relative overflow-hidden ${
        variant === 'featured' ? 'h-64' : variant === 'compact' ? 'h-40' : 'h-48'
      }`}>
        {annonce.images && annonce.images[0] ? (
          <img
            src={`${process.env.REACT_APP_API_URL}${annonce.images[0]}`}
            alt={annonce.titre}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 via-gray-50 to-gray-200 flex items-center justify-center">
            <div className="text-center">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-xs text-gray-400">Aucune image</span>
            </div>
          </div>
        )}
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        {/* Badges top-left */}
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
          {isNew && (
            <span className="bg-blue-500/90 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg">
              🆕 Nouveau
            </span>
          )}
          {!annonce.is_active && (
            <span className="bg-gray-500/90 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full font-semibold shadow-lg">
              Inactive
            </span>
          )}
        </div>
        
        {/* Wishlist Button top-right */}
        {!isOwner && (
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
            <WishlistButton 
              annonceId={annonce._id} 
              isOwner={isOwner}
              className="shadow-2xl backdrop-blur-sm bg-white/90 hover:bg-white"
            />
          </div>
        )}

        {/* Category badges bottom */}
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
      
      {/* Content */}
      <div className="p-6">
        {/* Title */}
        <h3 className="font-bold text-gray-900 mb-3 line-clamp-2 group-hover:bg-gradient-to-r group-hover:from-orange-500 group-hover:to-pink-500 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
          {annonce.titre}
        </h3>
        
        {/* Price et Marque */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
            {formatPrice(annonce.prix)}
          </p>
          {annonce.marque && (
            <span className="bg-gray-100 text-gray-700 text-xs px-3 py-1.5 rounded-full font-medium">
              {annonce.marque}
            </span>
          )}
        </div>
        
        {/* Métadonnées */}
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
              <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
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
  );
};

export default AnnonceCard;