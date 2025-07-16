import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const ProfilePage = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [userAnnonces, setUserAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isOwnProfile = currentUser && currentUser.id === parseInt(userId);

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
      
      // Mettre à jour les données locales si c'est le profil de l'utilisateur connecté
      if (isOwnProfile) {
        const updatedUser = { ...currentUser, ...formData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            {!editMode ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{profileData.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Téléphone</p>
                  <p className="font-medium">{profileData.telephone}</p>
                </div>
                
                {isOwnProfile && (
                  <button
                    onClick={() => setEditMode(true)}
                    className="w-full mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Modifier le profil
                  </button>
                )}
              </div>
            ) : (
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
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

        {/* Annonces de l'utilisateur */}
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
                  className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Créer une annonce
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userAnnonces.map((annonce) => (
                <div
                  key={annonce.id}
                  onClick={() => navigate(`/annonce/${annonce.id}`)}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-xl transition-shadow"
                >
                  <div className="h-48 bg-gray-200">
                    {annonce.images && annonce.images[0] ? (
                      <img
                        src={`http://localhost:5000${annonce.images[0]}`}
                        alt={annonce.titre}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 truncate">{annonce.titre}</h3>
                    <p className="text-xl font-bold text-blue-600 mb-2">{formatPrice(annonce.prix)}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {annonce.ville}
                      </span>
                      <span>{formatDate(annonce.date_publication)}</span>
                    </div>
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