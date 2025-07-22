// frontend/src/pages/Login.js
import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import usePopUp from '../hooks/usePopUp';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    mot_de_passe: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showPopup, PopUpComponent } = usePopUp();
  
  // Récupérer la destination de redirection depuis l'URL
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirect') || '/';
    const targetPath = redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`;
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Fonction pour gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(formData.email, formData.mot_de_passe);
    
    if (result.success) {
      // Ajouter un slash si nécessaire
      const targetPath = redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`;
      
      // Vérifier si l'utilisateur doit créer une demande vendeur
      if (targetPath === '/nouvelle-annonce' && result.user && result.user.role_id === 2) {
        const confirmed = await showPopup({
          type: 'info',
          title: 'Devenir vendeur',
          message: "Vous devez d'abord devenir vendeur pour déposer une annonce",
          confirmText: 'OK',
          showCancel: false
        });
        if (confirmed) {
          navigate('/demande-vendeur');
        }
      } else {
        navigate(targetPath);
      }
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <>
      <PopUpComponent />
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Connexion à votre compte
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Ou{' '}
              <Link 
                to={`/register${location.search}`} 
                className="font-medium text-orange-500 hover:text-orange-300"
              >
                créez un nouveau compte
              </Link>
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  </div>
                </div>
              </div>
            )}
            
            <div className="rounded-md shadow-sm -space-y-px">
              <div>
                <label htmlFor="email" className="sr-only">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-orange-300 focus:border-orange-300 focus:z-10 sm:text-sm"
                  placeholder="Adresse email"
                />
              </div>
              <div>
                <label htmlFor="mot_de_passe" className="sr-only">
                  Mot de passe
                </label>
                <input
                  id="mot_de_passe"
                  name="mot_de_passe"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.mot_de_passe}
                  onChange={handleChange}
                  className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-orange-300 focus:border-orange-300 focus:z-10 sm:text-sm"
                  placeholder="Mot de passe"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-300 disabled:opacity-50"
              >
                {loading ? 'Connexion...' : 'Se connecter'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Login;