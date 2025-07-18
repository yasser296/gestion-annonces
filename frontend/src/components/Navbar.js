import React, { useEffect ,useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [canCreateAnnonce, setCanCreateAnnonce] = useState(false);
  const [createAnnonceReason, setCreateAnnonceReason] = useState('');


  const handleLogout = () => {
    logout();
    navigate('/');
    setShowMenu(false);
  };

  useEffect(() => {
    if (user) {
      checkCanCreateAnnonce();
    }
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

  const handleCreateAnnonceClick = () => {
    console.log(canCreateAnnonce);
    console.log(createAnnonceReason);
    if (canCreateAnnonce) {
      navigate('/nouvelle-annonce');
    } 
    else if (createAnnonceReason === 'demande_en_cours') {
      alert('Votre demande pour devenir vendeur est en cours de traitement');
    }
    else if (createAnnonceReason === 'demande_refusee') {
      navigate('/demande-vendeur');
    } 

    else if (createAnnonceReason === 'not_vendeur') {
      navigate('/demande-vendeur');
    } 
    else {
      alert("Vous n'avez pas la permission de créer une annonce ");
      navigate('/');
    }
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-blue-600">
              Annonces.ma
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            {user ? (
              <button
                onClick={handleCreateAnnonceClick}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                + Déposer une annonce
              </button>
            ) : (
              <Link
                to="/login"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
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
  );
};

export default Navbar;