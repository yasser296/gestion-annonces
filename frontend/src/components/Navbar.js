import React, { useEffect ,useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import usePopUp from '../hooks/usePopUp';


const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
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
    // Réinitialiser le compteur de favoris lors de la déconnexion
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
  }, [user]); // Se déclenche quand user change

  // Fonction pour récupérer le nombre de demandes vendeur en attente
  const fetchNotificationCount = async () => {
    try {
      const response = await axios.get(
        'http://localhost:5000/api/demandes-vendeur/admin/toutes?statut=en_attente',
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
      const response = await axios.get('http://localhost:5000/api/demandes-vendeur/can-create-annonce', {
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
      const response = await axios.get('http://localhost:5000/api/wishlist/count', {
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
  }, [user])

  const handleCreateAnnonceClick = () => {
    if (canCreateAnnonce) {
      navigate('/nouvelle-annonce');
    } 
    else if (createAnnonceReason === 'demande_en_cours') {
      // Utiliser le PopUp au lieu d'alert
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
        <nav className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link to="/" className="text-2xl font-bold text-orange-500 hover:text-orange-600 transition">
                  Annonces.ma
                </Link>
              </div>
              
              <div className="flex items-center space-x-4">
                {user ? (
                  <>
                    {/* Icône de notification pour les admins */}
                    {user.role === 'admin' && (
                      <Link
                        to="/admin/demandes-vendeur"
                        className="relative p-2 text-gray-700 hover:text-orange-500 transition"
                        title="Demandes vendeur en attente"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                        {notificationCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {notificationCount > 99 ? '99+' : notificationCount}
                          </span>
                        )}
                      </Link>
                    )}

                    <Link
                      to="/wishlist"
                      className="relative p-2 text-gray-700 hover:text-orange-500 transition"
                      title="Mes favoris"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      {wishlistCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {wishlistCount}
                        </span>
                      )}
                    </Link>

                    <button
                      onClick={handleCreateAnnonceClick}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg  transition"
                    >
                      + Déposer une annonce
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login?redirect=nouvelle-annonce"
                    className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg  transition"
                  >
                    + Déposer une annonce
                  </Link>
                )}

                {user ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                    >
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                    
                    {showMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                        <div className="px-4 py-2 text-sm text-gray-700 border-b">
                          {user.nom}
                        </div>
                        {user && user.role === 'admin' && (
                          <Link
                            to="/admin"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setShowMenu(false)}
                          >
                            Administration
                          </Link>
                        )}
                        <Link
                          to={`/profil/${user.id}`}
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowMenu(false)}
                        >
                          Mon profil
                        </Link>
                        <Link
                          to="/mes-annonces"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowMenu(false)}
                        >
                          Mes annonces
                        </Link>
                        <Link
                          to="/wishlist"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowMenu(false)}
                        >
                          Mes favoris ({wishlistCount})
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Déconnexion
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <Link
                      to="/login"
                      className="text-gray-700 hover:text-gray-900 px-3 py-2"
                    >
                      Connexion
                    </Link>
                    <Link
                      to="/register"
                      className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                    >
                      Inscription
                    </Link>
                  </div>
                )}
                
              </div>
            </div>
          </div>
        </nav>
    </>
  );
};

export default Navbar;