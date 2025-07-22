// frontend/src/components/SearchResultsGrid.js
import React, { useState } from 'react';
import AnnonceCard from './AnnonceCard';

const SearchResultsGrid = ({ annonces, title, loading }) => {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('recent'); // 'recent', 'price-asc', 'price-desc', 'views'

  // Trier les annonces
  const sortedAnnonces = [...annonces].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.prix - b.prix;
      case 'price-desc':
        return b.prix - a.prix;
      case 'views':
        return b.nombre_vues - a.nombre_vues;
      case 'recent':
      default:
        return new Date(b.date_publication) - new Date(a.date_publication);
    }
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 skeleton"></div>
              <div className="p-4">
                <div className="h-6 skeleton mb-2"></div>
                <div className="h-8 skeleton w-1/2 mb-3"></div>
                <div className="h-4 skeleton w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header avec options de tri et vue */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 space-y-4 md:space-y-0">
        <div>
          {title && <h2 className="text-2xl font-bold text-gray-800">{title}</h2>}
          <p className="text-gray-600 mt-1">
            {annonces.length} annonce{annonces.length > 1 ? 's' : ''} trouvée{annonces.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Tri */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Trier par:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              <option value="recent">Plus récentes</option>
              <option value="price-asc">Prix croissant</option>
              <option value="price-desc">Prix décroissant</option>
              <option value="views">Plus consultées</option>
            </select>
          </div>

          {/* Mode d'affichage */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
              title="Vue grille"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
              title="Vue liste"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Résultats */}
      {sortedAnnonces.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-md">
          <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 text-lg">Aucune annonce ne correspond à vos critères</p>
          <p className="text-gray-400 mt-2">Essayez de modifier vos filtres</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fadeIn">
          {sortedAnnonces.map((annonce, index) => (
            <div
              key={annonce._id}
              className="animate-fadeIn"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <AnnonceCard annonce={annonce} variant="default" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4 animate-fadeIn">
          {sortedAnnonces.map((annonce, index) => (
            <div
              key={annonce._id}
              className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer animate-slideInLeft"
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => window.location.href = `/annonce/${annonce._id}`}
            >
              <div className="flex space-x-4">
                {/* Image */}
                <div className="w-48 h-32 flex-shrink-0 rounded-lg overflow-hidden">
                  {annonce.images && annonce.images[0] ? (
                    <img
                      src={`http://localhost:5000${annonce.images[0]}`}
                      alt={annonce.titre}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-800 mb-1 hover:text-orange-500 transition-colors">
                        {annonce.titre}
                      </h3>
                      <p className="text-2xl font-bold text-orange-500 mb-2">
                        {new Intl.NumberFormat('fr-MA', {
                          style: 'currency',
                          currency: 'MAD',
                          minimumFractionDigits: 0
                        }).format(annonce.prix)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {annonce.etat === 'Neuf' && (
                        <span className="badge badge-success">Neuf</span>
                      )}
                      {annonce.nombre_vues > 100 && (
                        <span className="badge badge-danger">Populaire</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{annonce.ville}</span>
                    </div>
                    {annonce.marque && (
                      <span className="font-medium">{annonce.marque}</span>
                    )}
                    <div className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>{annonce.nombre_vues} vues</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchResultsGrid;