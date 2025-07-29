// ProfilePage.js - Version complète avec toutes les fonctionnalités préservées
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import PasswordChangeForm from '../components/PasswordChangeForm';

const ProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const location = useLocation(); // Ajout
  const from = location.state?.from || '/'; // Ajout
  
  const [profileData, setProfileData] = useState(null);
  const [userAnnonces, setUserAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [activeTab, setActiveTab] = useState('annonces');
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Comparaison robuste pour isOwnProfile
  const isOwnProfile = currentUser && (
    String(currentUser.id) === String(userId) || 
    currentUser._id === userId ||
    String(currentUser._id) === String(userId)
  );

  // Calculer les statistiques
  const stats = {
    totalAnnonces: userAnnonces.length,
    annoncesActives: userAnnonces.filter(a => a.statut === 'active').length,
    annonceVendues: 0, // À implémenter selon votre logique
    vuesMoyennes: userAnnonces.length > 0 
      ? Math.round(userAnnonces.reduce((sum, a) => sum + (a.nombre_vues || 0), 0) / userAnnonces.length)
      : 0
  };

  useEffect(() => {
    fetchProfileData();
    fetchUserAnnonces();
  }, [userId]);

  const fetchProfileData = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/${userId}`);
      setProfileData(response.data);
      setFormData({
        nom: response.data.nom,
        email: response.data.email,
        telephone: response.data.telephone || ''
      });
    } catch (error) {
      console.error('Erreur lors du chargement du profil:', error);
    }
  };

  const fetchUserAnnonces = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/annonces/user/${userId}`);
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
      await axios.put(`${process.env.REACT_APP_API_URL}/api/users/${userId}`, formData, {
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
    setError('');
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
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MAD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading && !profileData) {
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

  // Fonction pour obtenir le texte du bouton retour
  const getBackButtonText = () => {
    if (from.startsWith('/annonce/')) return 'Retour à l\'annonce';
    if (from.startsWith('/mes-annonces')) return 'Retour à mes annonces';
    if (from.startsWith('/admin')) return 'Retour à l\'administration';
    if (from.startsWith('/profil/')) return 'Retour au profil';
    if (from.startsWith('/nouvelle-annonce')) return 'Retour à la création d\'annonce';
    if (from.startsWith('/modifier-annonce/')) return 'Retour à la modification d\'annonce';
    if (from.startsWith('/demande-vendeur')) return 'Retour à la demande vendeur';
    if (from.startsWith('/wishlist')) return 'Retour à la wishlist';
    if (from.startsWith('/category')) return 'Retour aux catégories';
    if (from === '/' || from === '' || !from) return 'Retour à l\'accueil';
    return 'Retour';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">      
      {/* Header du profil moderne */}
      <div className="bg-gradient-to-r from-blue-500 via-purple-600 to-pink-600 relative overflow-hidden">
        {/* Bouton de retour - À ajouter avant le header */}
        <div className="max-w-7xl mx-auto px-4 pt-6 relative z-10">
          <button
            onClick={() => navigate(from)}
            className="flex items-center space-x-2 text-white hover:text-orange-500 transition-colors group mb-4"
          >
            <FontAwesomeIcon
              icon={faArrowLeft}
              className="group-hover:-translate-x-1 transition-transform"
            />
            <span className="font-medium">{getBackButtonText()}</span>
          </button>
        </div>
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
        
        {/* Formes décoratives */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-white/10 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-yellow-400/20 to-transparent rounded-full blur-3xl"></div>

        <div className="relative max-w-7xl mx-auto px-4 py-16">
          <div className="flex flex-col md:flex-row items-center space-y-6 md:space-y-0 md:space-x-8">
            {/* Avatar amélioré */}
            <div className="relative">
              <div className="w-32 h-32 gradient-blue rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-all">
                <span className="text-white font-bold text-4xl">
                  {profileData?.nom?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              {/* Badge de vérification */}
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            {/* Informations utilisateur */}
            <div className="text-center md:text-left flex-1">
              <h1 className="text-white text-4xl font-bold mb-2">
                {profileData?.nom || 'Utilisateur'}
              </h1>
              <p className="text-white/80 text-lg mb-4">
                Membre depuis {profileData?.date_inscription ? 
                  formatDate(profileData.date_inscription) : 'récemment'
                }
              </p>
              
              {/* Stats en ligne */}
              <div className="flex flex-wrap justify-center md:justify-start gap-6 text-white">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.totalAnnonces}</div>
                  <div className="text-sm opacity-80">Annonces</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.annoncesActives}</div>
                  <div className="text-sm opacity-80">Actives</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.vuesMoyennes}</div>
                  <div className="text-sm opacity-80">Vues moy.</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            {isOwnProfile && (
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate('/nouvelle-annonce', { state: { from: location.pathname } })}
                  className="bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-all font-medium flex items-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  <span>Nouvelle annonce</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar - Informations du profil */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
              {/* Messages d'erreur et de succès */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-xl text-sm">
                  {success}
                </div>
              )}

              {/* Contenu conditionnel */}
              {showPasswordForm && (isOwnProfile || (currentUser && currentUser.role === "admin")) ? (
                // Formulaire de changement de mot de passe
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Changer le mot de passe</h3>
                    <button
                      onClick={handlePasswordChangeCancel}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
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
              ) : editMode && (isOwnProfile || (currentUser && currentUser.role === "admin")) ? (
                // Formulaire de modification du profil
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Modifier le profil</h3>
                    <button
                      onClick={() => setEditMode(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                      <input
                        type="text"
                        name="nom"
                        value={formData.nom}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                      <input
                        type="tel"
                        name="telephone"
                        value={formData.telephone}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent transition-all"
                      />
                    </div>
                    
                    <div className="flex space-x-3">
                      <button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 rounded-xl hover:shadow-lg transition-all transform hover:scale-105 font-semibold"
                      >
                        Sauvegarder
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditMode(false)}
                        className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 transition-all font-semibold"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                // Vue normale du profil
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations de contact</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium text-gray-900">{profileData.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Téléphone</p>
                        <p className="font-medium text-gray-900">{profileData.telephone || 'Non renseigné'}</p>
                      </div>
                    </div>
                  </div>
                  
                  {(isOwnProfile || (currentUser && currentUser.role === "admin")) && (
                    <div className="space-y-3">
                      <button
                        onClick={() => setEditMode(true)}
                        className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-3 rounded-xl hover:shadow-lg transition-all transform hover:scale-105 font-semibold flex items-center justify-center space-x-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Modifier le profil</span>
                      </button>
                      
                      <button
                        onClick={() => setShowPasswordForm(true)}
                        className="w-full bg-gradient-to-r from-gray-500 to-gray-600 text-white py-3 rounded-xl hover:shadow-lg transition-all transform hover:scale-105 font-semibold flex items-center justify-center space-x-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <span>Changer le mot de passe</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Contenu principal - Onglets */}
          <div className="lg:col-span-2">
            {/* Navigation par onglets moderne */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8 overflow-hidden">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('annonces')}
                  className={`flex-1 py-4 px-6 font-medium transition-all relative ${
                    activeTab === 'annonces'
                      ? 'text-orange-600 bg-orange-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span>Annonces ({userAnnonces.length})</span>
                  </div>
                  {activeTab === 'annonces' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 gradient-orange"></div>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab('stats')}
                  className={`flex-1 py-4 px-6 font-medium transition-all relative ${
                    activeTab === 'stats'
                      ? 'text-orange-600 bg-orange-50'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>Statistiques</span>
                  </div>
                  {activeTab === 'stats' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 gradient-orange"></div>
                  )}
                </button>
              </div>
            </div>

            {/* Contenu des onglets */}
            {activeTab === 'annonces' && (
              <div>
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, index) => (
                      <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
                        <div className="h-48 shimmer"></div>
                        <div className="p-6 space-y-3">
                          <div className="h-4 shimmer rounded"></div>
                          <div className="h-4 shimmer rounded w-3/4"></div>
                          <div className="h-6 shimmer rounded w-1/2"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : userAnnonces.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userAnnonces.map((annonce) => (
                      <div
                        key={annonce._id}
                        onClick={() => navigate(`/annonce/${annonce._id}`)}
                        className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 advanced-card group"
                      >
                        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                          {annonce.images && annonce.images.length > 0 ? (
                            <img
                              src={`${process.env.REACT_APP_API_URL}/${annonce.images[0]}`}
                              alt={annonce.titre}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.parentElement.querySelector('.placeholder').style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div className="placeholder absolute inset-0 flex items-center justify-center text-gray-400">
                            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                                                    

                          {/* Badge de vues */}
                          <div className="absolute top-3 right-3 glass-dark text-white px-2 py-1 rounded-lg text-xs flex items-center space-x-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span>{annonce.nombre_vues || 0}</span>
                          </div>
                        </div>
                        
                        <div className="p-6">
                          <h3 className="font-bold text-lg mb-2 text-gray-900 line-clamp-2 group-hover:text-orange-600 transition-colors">
                            {annonce.titre}
                          </h3>
                          <p className="text-orange-600 font-bold text-xl mb-3">
                            {formatPrice(annonce.prix)}
                          </p>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              <span>{annonce.ville}</span>
                            </div>
                            <span>{formatDate(annonce.date_publication)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 bg-white rounded-2xl shadow-lg">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-6">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucune annonce</h3>
                    <p className="text-gray-600">Cet utilisateur n'a publié aucune annonce pour le moment.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 gradient-blue rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stats.totalAnnonces}</div>
                      <div className="text-sm text-gray-600">Total annonces</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 gradient-teal rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stats.annoncesActives}</div>
                      <div className="text-sm text-gray-600">Annonces actives</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 gradient-orange rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stats.vuesMoyennes}</div>
                      <div className="text-sm text-gray-600">Vues moyennes</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 gradient-purple rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{stats.annonceVendues}</div>
                      <div className="text-sm text-gray-600">Annonces vendues</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;