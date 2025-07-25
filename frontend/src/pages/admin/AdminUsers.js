// frontend/src/pages/admin/AdminUsers.js - Version finale avec PasswordGenerator
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { confirmDialog } from "../../utils/confirmDialog";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faDownload, faFileExport } from '@fortawesome/free-solid-svg-icons';
import usePopUp from '../../hooks/usePopUp';
import PasswordGenerator from '../../components/PasswordGenerator';
import { useNotification } from '../../contexts/ToastContext'; // NOUVEAU

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { showPopup, PopUpComponent } = usePopUp();
  const toast = useNotification(); // NOUVEAU
  
  // États pour le formulaire d'édition
  const [editFormData, setEditFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    role: ''
  });

  // États pour le formulaire de création - AMÉLIORÉ
  const [createFormData, setCreateFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    mot_de_passe: '',
    role_id: 2
  });

  // Statistiques
  const [stats, setStats] = useState({
    total: 0,
    admins: 0,
    vendeurs: 0,
    users: 0,
    recent: 0
  });

  const navigate = useNavigate();
  
  const roleStyles = {
    admin:    { bg: "bg-purple-100", text: "text-purple-800", label: "Admin" },
    vendeur:  { bg: "bg-orange-100", text: "text-orange-800", label: "Vendeur" },
    user:     { bg: "bg-green-100",  text: "text-green-800",  label: "Utilisateur" }
  };

  const roleMapping = {
    1: { titre: 'admin', style: roleStyles.admin },
    2: { titre: 'user', style: roleStyles.user },
    3: { titre: 'vendeur', style: roleStyles.vendeur }
  };

  useEffect(() => {
    fetchUsers();
    calculateStats();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setUsers(response.data);
      calculateStats(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
      if (error.response?.status === 403) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (userData = users) => {
    const total = userData.length;
    const admins = userData.filter(u => u.role_id === 1).length;
    const vendeurs = userData.filter(u => u.role_id === 3).length;
    const users = userData.filter(u => u.role_id === 2).length;
    
    // Utilisateurs récents (derniers 7 jours)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recent = userData.filter(u => new Date(u.date_inscription) > weekAgo).length;
    
    setStats({ total, admins, vendeurs, users, recent });
  };

  // NOUVEAU: Gérer la création d'utilisateur avec le nouveau composant
  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    // Validation côté client
    if (!createFormData.nom.trim() || !createFormData.email.trim() || !createFormData.mot_de_passe.trim()) {
      toast.error('Nom, email et mot de passe sont requis');
      return;
    }

    if (createFormData.mot_de_passe.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/admin/users`,
        createFormData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      toast.success('Utilisateur créé avec succès');

      // Ajouter le nouvel utilisateur à la liste
      const newUsers = [response.data.user, ...users];
      setUsers(newUsers);
      calculateStats(newUsers);
      
      // Réinitialiser et fermer le modal
      handleCloseCreateModal();
      
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la création de l\'utilisateur');
    }
  };

  // NOUVEAU: Fermer le modal de création
  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCreateFormData({
      nom: '',
      email: '',
      telephone: '',
      mot_de_passe: '',
      role_id: 2
    });
  };

  // NOUVEAU: Exporter les données utilisateurs
  const exportUsers = () => {
    const csvContent = [
      ['Nom', 'Email', 'Téléphone', 'Rôle', 'Date d\'inscription', 'Nb Annonces'].join(','),
      ...users.map(user => [
        user.nom,
        user.email,
        user.telephone || '',
        roleMapping[user.role_id]?.style?.label || 'Inconnu',
        new Date(user.date_inscription).toLocaleDateString('fr-FR'),
        user.nombre_annonces || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Export réalisé avec succès');
  };

  // Fonctions existantes pour l'édition (inchangées)
  const handleEdit = (user) => {
    setEditingUser(user);
    setEditFormData({
      nom: user.nom,
      email: user.email,
      telephone: user.telephone,
      role: user.role
    });
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingUser(null);
    setEditFormData({ nom: '', email: '', telephone: '', role: '' });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/api/admin/users/${editingUser._id}`,
        {
          nom: editFormData.nom,
          email: editFormData.email,
          telephone: editFormData.telephone
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (editFormData.role !== editingUser.role) {
        await axios.patch(
          `${process.env.REACT_APP_API_URL}/api/admin/users/${editingUser._id}/role`,
          { role_id: editFormData.role },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
      }

      toast.success('Utilisateur mis à jour avec succès');
      fetchUsers();
      handleCloseEditModal();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast.error(error.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  const handleDelete = async (userId) => {
    const result = await confirmDialog({
      title: 'Supprimer l\'utilisateur',
      text: 'Cette action supprimera définitivement l\'utilisateur et toutes ses annonces. Voulez-vous continuer ?',
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/api/admin/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        toast.success('Utilisateur supprimé avec succès');
        const newUsers = users.filter(u => u._id !== userId);
        setUsers(newUsers);
        calculateStats(newUsers);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <>
      <PopUpComponent />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header avec statistiques */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
          <div>
            <h1 className="text-3xl font-bold">Gestion des utilisateurs</h1>
            <div className="flex flex-wrap gap-4 mt-3 text-sm font-secondary">
              <span className="text-gray-600">{stats.total} utilisateurs au total</span>
              <span className="text-purple-600">{stats.admins} admins</span>
              <span className="text-orange-600">{stats.vendeurs} vendeurs</span>
              <span className="text-green-600">{stats.users} utilisateurs</span>
              <span className="text-blue-600">{stats.recent} récents (7j)</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* NOUVEAU: Bouton d'export */}
            <button
              onClick={exportUsers}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition flex items-center space-x-2 font-secondary"
            >
              <FontAwesomeIcon icon={faDownload} />
              <span>Exporter CSV</span>
            </button>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition flex items-center space-x-2 font-secondary"
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>Créer un utilisateur</span>
            </button>
            
            <button
              onClick={() => navigate('/admin')}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition font-secondary"
            >
              Retour au tableau de bord
            </button>
          </div>
        </div>

        {/* Tableau des utilisateurs */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full ui-text">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Inscrit le
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Annonces
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id} 
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={(e) => {
                    if (e.target.closest('button') || e.target.closest('select')) return;
                    navigate(`/profil/${user._id}`);
                  }}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{user.nom}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm text-gray-900">{user.email}</div>
                      <div className="text-sm text-gray-500">{user.telephone || 'Non renseigné'}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.date_inscription)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-secondary">
                      {user.nombre_annonces || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.role_id === 1 ? (
                      <span className={`px-2 py-1 text-xs rounded-full font-secondary ${roleMapping[user.role_id]?.style?.bg} ${roleMapping[user.role_id]?.style?.text}`}>
                        {roleMapping[user.role_id]?.style?.label}
                      </span>
                    ) : (
                      <select
                        value={user.role_id}
                        onChange={async (e) => {
                          const newRoleId = parseInt(e.target.value);
                          try {
                            await axios.patch(
                              `${process.env.REACT_APP_API_URL}/api/admin/users/${user._id}/role`,
                              { role_id: newRoleId },
                              {
                                headers: {
                                  Authorization: `Bearer ${localStorage.getItem('token')}`
                                }
                              }
                            );
                            fetchUsers();
                            toast.success('Rôle mis à jour avec succès');
                          } catch (error) {
                            console.error('Erreur:', error);
                            toast.error('Erreur lors du changement de rôle');
                          }
                        }}
                        className="text-xs rounded-full border-none focus:ring-2 focus:ring-orange-300 font-secondary"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value={2}>Utilisateur</option>
                        <option value={3}>Vendeur</option>
                        <option value={1}>Admin</option>
                      </select>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(user);
                        }}
                        className="text-orange-500 hover:text-orange-700 transition-colors"
                        title="Modifier"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      {user.role_id !== 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(user._id);
                          }}
                          className="text-red-600 hover:text-red-900 transition-colors"
                          title="Supprimer"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* NOUVEAU: Modal de création avec PasswordGenerator */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">Créer un nouvel utilisateur</h2>
              
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-secondary">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    value={createFormData.nom}
                    onChange={(e) => setCreateFormData({...createFormData, nom: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300 font-secondary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-secondary">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({...createFormData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300 font-secondary"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-secondary">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={createFormData.telephone}
                    onChange={(e) => setCreateFormData({...createFormData, telephone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300 font-secondary"
                  />
                </div>

                {/* NOUVEAU: Utilisation du composant PasswordGenerator */}
                <PasswordGenerator
                  label="Mot de passe *"
                  value={createFormData.mot_de_passe}
                  onChange={(password) => setCreateFormData({...createFormData, mot_de_passe: password})}
                  required={true}
                  minLength={6}
                  placeholder="Entrez un mot de passe sécurisé"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-secondary">
                    Rôle
                  </label>
                  <select
                    value={createFormData.role_id}
                    onChange={(e) => setCreateFormData({...createFormData, role_id: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300 font-secondary"
                  >
                    <option value={2}>Utilisateur</option>
                    <option value={3}>Vendeur</option>
                    <option value={1}>Admin</option>
                  </select>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-green-500 text-white py-2 rounded-lg hover:bg-green-600 transition font-secondary"
                  >
                    Créer l'utilisateur
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseCreateModal}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition font-secondary"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal d'édition (simplifié) */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4">Modifier l'utilisateur</h2>
              
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-secondary">Nom</label>
                  <input
                    type="text"
                    value={editFormData.nom}
                    onChange={(e) => setEditFormData({...editFormData, nom: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300 font-secondary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-secondary">Email</label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300 font-secondary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-secondary">Téléphone</label>
                  <input
                    type="tel"
                    value={editFormData.telephone}
                    onChange={(e) => setEditFormData({...editFormData, telephone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300 font-secondary"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition font-secondary"
                  >
                    Sauvegarder
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseEditModal}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition font-secondary"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminUsers;