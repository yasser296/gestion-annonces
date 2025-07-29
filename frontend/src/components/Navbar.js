// Navbar.js - Version complète avec toutes les fonctionnalités préservées
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import usePopUp from '../hooks/usePopUp';


const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isCategoryPage = location.pathname.startsWith('/category/');
  const [showMenu, setShowMenu] = useState(false);
  const [canCreateAnnonce, setCanCreateAnnonce] = useState(false);
  const [createAnnonceReason, setCreateAnnonceReason] = useState('');
  const [wishlistCount, setWishlistCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const { showPopup, PopUpComponent } = usePopUp();

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowMenu(false);
    // Réinitialiser les compteurs lors de la déconnexion
    setWishlistCount(0);
    setNotificationCount(0);
  };

  useEffect(() => {
    if (user) {
      checkCanCreateAnnonce();
      fetchWishlistCount();
      
      // Récupérer les notifications pour les admins
      if (user.role === 'admin') {
        fetchNotificationCount();
        // Rafraîchir les notifications toutes les 30 secondes
        const interval = setInterval(fetchNotificationCount, 30000);
        return () => clearInterval(interval);
      }
    } else {
      // Réinitialiser les compteurs si pas d'utilisateur connecté
      setWishlistCount(0);
      setNotificationCount(0);
    }
  }, [user]);

  // Fonction pour récupérer le nombre de demandes vendeur en attente
  const fetchNotificationCount = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/demandes-vendeur/admin/toutes?statut=en_attente`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setNotificationCount(response.data.length);
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    }
  };

  // Ajouter un useEffect pour forcer le rechargement quand l'ID de l'utilisateur change
  useEffect(() => {
    if (user?.id) {
      fetchWishlistCount();
    }
  }, [user?.id]);

  // Écouter les événements de mise à jour de la wishlist
  useEffect(() => {
    const handleWishlistUpdate = () => {
      if (user) {
        fetchWishlistCount();
      }
    };

    window.addEventListener('wishlistUpdated', handleWishlistUpdate);

    return () => {
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
    };
  }, [user]);

  const checkCanCreateAnnonce = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/demandes-vendeur/can-create-annonce`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setCanCreateAnnonce(response.data.canCreate);
      setCreateAnnonceReason(response.data.reason);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchWishlistCount = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/wishlist/count`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setWishlistCount(response.data.count);
    } catch (error) {
      console.error('Erreur:', error);
      setWishlistCount(0);
    }
  };

  useEffect(() => {
    if (user) {
      // Rafraîchir le compteur toutes les 2 minutes
      const wishlistInterval = setInterval(() => {
        fetchWishlistCount();
      }, 120000); // 2 minutes

      return () => clearInterval(wishlistInterval);
    }
  }, [user]);

  useEffect(() => {
    const handleFocus = () => {
      if (user) {
        fetchWishlistCount();
        if (user.role === 'admin' || user.role_id === 1) {
          fetchNotificationCount();
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [user]);

  const handleCreateAnnonceClick = () => {
    if (canCreateAnnonce) {
      navigate('/nouvelle-annonce', { 
        state: { from: location.pathname } 
      });
    } 
    else if (createAnnonceReason === 'demande_en_cours') {
      showPopup({
        type: 'info',
        title: 'Demande en cours',
        message: 'Votre demande pour devenir vendeur est en cours de traitement'
      });
    }
    else if (createAnnonceReason === 'not_vendeur') {
      navigate('/demande-vendeur');
    } 
    else if (createAnnonceReason === 'bloque') {
      showPopup({
        type: 'error',
        title: 'Accès refusé',
        message: "Vous n'avez pas la permission de créer des annonces"
      });
    }
    else {
      showPopup({
        type: 'error',
        title: 'Erreur',
        message: "Vous n'avez pas la permission de créer une annonce"
      });
    }
  };

  return (
    <>
      <PopUpComponent />
      <nav className="navbar-glass sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo moderne */}
            <Link to="/" className="flex items-center space-x-3">
              <div className="gradient-orange p-2 rounded-xl shadow-lg transform hover:scale-105 transition-all">
                <span className="text-white font-bold text-xl">Annonces.ma</span>
              </div>
            </Link>

            {/* Navigation desktop */}
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                to="/" 
                className={`text-gray-700 hover:text-orange-500 transition-colors font-medium relative ${
                  location.pathname === '/' ? 'text-orange-500' : ''
                }`}
              >
                Accueil
                {location.pathname === '/' && (
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 gradient-orange rounded-full"></div>
                )}
              </Link>
              {isCategoryPage && (
              <Link 
                to="/categories" 
                className={`text-gray-700 hover:text-orange-500 transition-colors font-medium relative ${
                  location.pathname.includes('/category') ? 'text-orange-500' : ''
                }`}
              >
                Catégorie
                {location.pathname.includes('/category') && (
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 gradient-orange rounded-full"></div>
                )}
              </Link>
              )}

              {/* Bouton Déposer une annonce */}
              {user ? (
                <button
                  onClick={handleCreateAnnonceClick}
                  className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-2 rounded-full hover:shadow-lg transition-all transform hover:scale-105 font-medium flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Déposer une annonce</span>
                </button>
              ) : (
                <Link
                  to="/login?redirect=/nouvelle-annonce"
                  className="bg-gradient-to-r from-orange-500 to-pink-500 text-white px-6 py-2 rounded-full hover:shadow-lg transition-all transform hover:scale-105 font-medium flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Déposer une annonce</span>
                </Link>
              )}
            </div>

            {/* Actions utilisateur */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  {/* Icône de notification pour les admins */}
                  {user.role === 'admin' && (
                    <Link
                      to="/admin/demandes-vendeur"
                      className="relative p-2 text-gray-400 hover:text-orange-500 transition-colors"
                      title="Demandes vendeur en attente"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      {notificationCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center pulse-notification">
                          {notificationCount > 99 ? '99+' : notificationCount}
                        </span>
                      )}
                    </Link>
                  )}

                  {/* Wishlist avec compteur */}
                  <Link
                    to="/wishlist"
                    className="relative p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Mes favoris"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                    {wishlistCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center pulse-notification">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>

                  {/* Menu utilisateur */}
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="flex items-center space-x-2 p-2 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-10 h-10 gradient-blue rounded-xl flex items-center justify-center shadow-lg">
                        <span className="text-white font-semibold text-sm">
                          {user.nom?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Dropdown menu utilisateur */}
                    {showMenu && (
                      <div className="absolute right-0 mt-2 w-64 glass-effect rounded-2xl shadow-xl border border-white/20 z-50">
                        <div className="p-4 border-b border-gray-200">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 gradient-blue rounded-xl flex items-center justify-center">
                              <span className="text-white font-semibold">
                                {user.nom?.charAt(0)?.toUpperCase() || 'U'}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{user.nom}</p>
                              <p className="text-sm text-gray-600">{user.email}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="py-2">
                          {user.role === 'admin' && (
                            <Link
                              to="/admin"
                              className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                              onClick={() => setShowMenu(false)}
                            >
                              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>Administration</span>
                            </Link>
                          )}
                          
                          <Link
                            to={`/profil/${user.id}`}
                            className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setShowMenu(false)}
                          >
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span>Mon profil</span>
                          </Link>

                          <Link
                            to="/mes-annonces"
                            className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setShowMenu(false)}
                          >
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>Mes annonces</span>
                          </Link>

                          <Link
                            to="/wishlist"
                            className="flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            onClick={() => setShowMenu(false)}
                          >
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                            <span>Mes favoris ({wishlistCount})</span>
                          </Link>

                          <hr className="my-2" />

                          <button
                            onClick={handleLogout}
                            className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>Déconnexion</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex space-x-3">
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-orange-500 px-4 py-2 font-medium transition-colors"
                  >
                    Connexion
                  </Link>
                  <Link
                    to="/register"
                    className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-6 py-2 rounded-full hover:shadow-lg transition-all transform hover:scale-105 font-medium"
                  >
                    Inscription
                  </Link>
                </div>
              )}

              {/* Menu mobile */}
              <div className="md:hidden">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Menu mobile overlay */}
        {showMenu && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg">
              <Link to="/" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                Accueil
              </Link>
              {isCategoryPage && (
                <Link to="/categories" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                  Catégorie
                </Link>
              )}
              {user ? (
                <>
                  <Link to={`/profil/${user.id}`} className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                    Mon profil
                  </Link>
                  <Link to="/mes-annonces" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                    Mes annonces
                  </Link>
                  <button
                    onClick={handleCreateAnnonceClick}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg mx-3"
                  >
                    Déposer une annonce
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                    Connexion
                  </Link>
                  <Link to="/register" className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
                    Inscription
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
};

export default Navbar;