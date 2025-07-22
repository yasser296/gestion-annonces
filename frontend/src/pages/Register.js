// frontend/src/pages/Register.js
import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import usePopUp from '../hooks/usePopUp';

const Register = () => {
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    mot_de_passe: '',
    confirm_mot_de_passe: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showPopup, PopUpComponent } = usePopUp();
  
  // Récupérer la destination de redirection depuis l'URL
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirect') || '/';

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.mot_de_passe !== formData.confirm_mot_de_passe) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    const { confirm_mot_de_passe, ...userData } = formData;
    const result = await register(userData);
    
    if (result.success) {
      showPopup({
        type: 'success',
        title: 'Inscription réussie',
        message: 'Votre compte a été créé avec succès. Veuillez vous connecter.',
        onConfirm: () => navigate(`/login?redirect=${redirectTo}`)
      });
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
              Créer un nouveau compte
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Ou{' '}
              <Link 
                to={`/login${location.search}`} 
                className="font-medium text-orange-500 hover:text-orange-300"
              >
                connectez-vous à votre compte existant
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
            
            <div className="space-y-4">
              <div>
                <label htmlFor="nom" className="block text-sm font-medium text-gray-700">
                  Nom complet
                </label>
                <input
                  id="nom"
                  name="nom"
                  type="text"
                  required
                  value={formData.nom}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-orange-300 focus:border-orange-300 focus:z-10 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-orange-300 focus:border-orange-300 focus:z-10 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="telephone" className="block text-sm font-medium text-gray-700">
                  Téléphone
                </label>
                <input
                  id="telephone"
                  name="telephone"
                  type="tel"
                  required
                  value={formData.telephone}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-orange-300 focus:border-orange-300 focus:z-10 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="mot_de_passe" className="block text-sm font-medium text-gray-700">
                  Mot de passe
                </label>
                <input
                  id="mot_de_passe"
                  name="mot_de_passe"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.mot_de_passe}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-orange-300 focus:border-orange-300 focus:z-10 sm:text-sm"
                />
              </div>
              
              <div>
                <label htmlFor="confirm_mot_de_passe" className="block text-sm font-medium text-gray-700">
                  Confirmer le mot de passe
                </label>
                <input
                  id="confirm_mot_de_passe"
                  name="confirm_mot_de_passe"
                  type="password"
                  required
                  value={formData.confirm_mot_de_passe}
                  onChange={handleChange}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-orange-300 focus:border-orange-300 focus:z-10 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-300 disabled:opacity-50"
              >
                {loading ? 'Inscription...' : "S'inscrire"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Register;