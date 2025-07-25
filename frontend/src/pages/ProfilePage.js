// frontend/src/pages/ProfilePage.js - Version corrigée pour isOwnProfile
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import PasswordChangeForm from '../components/PasswordChangeForm';

const ProfilePage = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [userAnnonces, setUserAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const location = useLocation();
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // CORRECTION: Comparaison plus robuste pour isOwnProfile
  const isOwnProfile = currentUser && (
    String(currentUser.id) === String(userId) || 
    currentUser._id === userId 
  );

  // DEBUG: Ajoutons des console.log pour diagnostiquer
  useEffect(() => {
    console.log('DEBUG ProfilePage:');
    console.log('currentUser:', currentUser);
    console.log('userId from URL:', userId);
    console.log('currentUser.id:', currentUser?.id);
    console.log('currentUser._id:', currentUser?._id);
    console.log('isOwnProfile:', isOwnProfile);
  }, [currentUser, userId, isOwnProfile]);

  useEffect(() => {
    fetchProfileData();
    fetchUserAnnonces();
  }, [userId]);

  const fetchProfileData = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/users/${userId}`);
      setProfileData(response.data);
      setFormData({
        nom: response.data.nom,
        email: response.data.email,
        telephone: response.data.telephone
      });
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    }
  };

  const fetchUserAnnonces = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/annonces/user/${userId}`);
      setUserAnnonces(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des annonces:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await axios.put(`http://localhost:5000/api/users/${userId}`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setSuccess('Profil mis à jour avec succès');
      setEditMode(false);
      fetchProfileData();
      
      if (isOwnProfile) {
        const updatedUser = { ...currentUser, ...formData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const handlePasswordChangeSuccess = (message) => {
    setSuccess(message);
    setShowPasswordForm(false);
  };

  const handlePasswordChangeCancel = () => {
    setShowPasswordForm(false);
    setError('');
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return (
      new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(price)
        .replace(/\u202f/g, ' ') + ' DH'
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <p className="text-center text-gray-500">Profil non trouvé</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Informations du profil */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center mb-6">
              <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold">{profileData.nom}</h1>
              <p className="text-gray-600">Membre depuis {formatDate(profileData.date_inscription)}</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded text-sm">
                {success}
              </div>
            )}

            {/* Affichage conditionnel */}
            {showPasswordForm && (isOwnProfile || (currentUser && currentUser.role === "admin")) ? (
              // Formulaire de changement de mot de passe
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Changer le mot de passe</h3>
                  <button
                    onClick={handlePasswordChangeCancel}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <PasswordChangeForm
                  onSuccess={handlePasswordChangeSuccess}
                  onCancel={handlePasswordChangeCancel}
                  className="p-0 bg-transparent shadow-none"
                />
              </div>
            ) : !editMode ? (
              // Vue normale du profil
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{profileData.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Téléphone</p>
                  <p className="font-medium">{profileData.telephone}</p>
                </div>
                
                {(isOwnProfile || (currentUser && currentUser.role === "admin")) && (
                  <div className="space-y-2">
                    <button
                      onClick={() => setEditMode(true)}
                      className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-700 transition"
                    >
                      Modifier le profil
                    </button>
                    
                    {/* Bouton pour changer le mot de passe - avec condition simplifiée pour le test */}
                    {(isOwnProfile || (currentUser && currentUser.role === "admin")) && (
                      <button
                        onClick={() => {
                          console.log('Bouton mot de passe cliqué!');
                          setShowPasswordForm(true);
                        }}
                        className="w-full bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition flex items-center justify-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>Changer le mot de passe</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              // Formulaire de modification du profil (existant)
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    name="telephone"
                    value={formData.telephone}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-700 transition"
                  >
                    Enregistrer
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditMode(false);
                      setFormData({
                        nom: profileData.nom,
                        email: profileData.email,
                        telephone: profileData.telephone
                      });
                      setError('');
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600">
                <span className="font-medium">{userAnnonces.length}</span> annonce{userAnnonces.length > 1 ? 's' : ''} publiée{userAnnonces.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Annonces de l'utilisateur - Section inchangée */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">
            {isOwnProfile ? 'Mes annonces' : `Annonces de ${profileData.nom}`}
          </h2>
          
          {userAnnonces.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-500">Aucune annonce publiée</p>
              {isOwnProfile && (
                <button
                  onClick={() => navigate('/nouvelle-annonce')}
                  className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-700 transition"
                >
                  Créer une annonce
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userAnnonces.map((annonce) => (
                <div
                  key={annonce._id}
                  onClick={() => navigate(`/annonce/${annonce._id}`, { state: { from: location.pathname } })}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
                >
                  <div className="h-48 bg-gray-200">
                    {annonce.images && annonce.images[0] ? (
                      <img
                        src={`http://localhost:5000${annonce.images[0]}`}
                        alt={annonce.titre}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="w-full h-full flex items-center justify-center text-gray-400" style={{display: annonce.images && annonce.images[0] ? 'none' : 'flex'}}>
                      <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2 truncate">{annonce.titre}</h3>
                    <p className="text-orange-600 font-bold text-xl mb-2">
                      {formatPrice(annonce.prix)}
                    </p>
                    <p className="text-gray-600 text-sm mb-2">{annonce.ville}</p>
                    <p className="text-gray-500 text-xs">
                      {formatDate(annonce.date_publication)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;