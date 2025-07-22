import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { confirmDialog } from "../../utils/confirmDialog";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import usePopUp from '../../hooks/usePopUp';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const { showPopup, PopUpComponent } = usePopUp();
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    role: ''
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
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/users', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      if (error.response?.status === 403) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      nom: user.nom,
      email: user.email,
      telephone: user.telephone,
      role: user.role
    });
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditingUser(null);
    setFormData({ nom: '', email: '', telephone: '', role: '' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      // Mettre à jour les informations de base
      await axios.put(
        `http://localhost:5000/api/admin/users/${editingUser._id}`,
        {
          nom: formData.nom,
          email: formData.email,
          telephone: formData.telephone
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // Si le rôle a changé, mettre à jour le rôle
      if (formData.role !== editingUser.role) {
        await axios.patch(
          `http://localhost:5000/api/admin/users/${editingUser._id}/role`,
          { role: formData.role },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
      }

      fetchUsers();
      handleCloseModal();
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      // alert(error.response?.data?.message || 'Erreur lors de la modification');
      showPopup({
        type: 'error',
        title: 'Erreur',
        message: error.response?.data?.message || 'Erreur lors de la modification'
      });
    }
  };

  const handleQuickRoleChange = async (userId, newRoleId) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/admin/users/${userId}/role`,
        { role_id: parseInt(newRoleId) }, // Envoyer role_id au lieu de role
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      fetchUsers();
    } catch (error) {
      console.error('Erreur:', error);
      showPopup({
        type: 'error',
        title: 'Erreur',
        message: error.response?.data?.message || 'Erreur lors du changement de rôle'
      });
    }
  };

  const handleDelete = async (userId) => {
    const confirmed = await confirmDialog({
      text: "Êtes-vous sûr de vouloir supprimer cet utilisateur et toutes ses annonces ?",
      confirmText: "Oui, supprimer",
    });
    if (confirmed) {
      try {
        await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        fetchUsers();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        // alert(error.response?.data?.message || 'Erreur lors de la suppression');
        showPopup({
          type: 'error',
          title: 'Erreur',
          message: error.response?.data?.message || 'Erreur lors de la suppression'
        });
      }
    }
  };

  const handleToggleBloquerDemande = async (userId, bloquer) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/demandes-vendeur/admin/user/${userId}/bloquer`,
        { bloquer },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      fetchUsers();
    } catch (error) {
      console.error('Erreur:', error);
      // alert('Erreur lors de la modification');
      showPopup({
        type: 'error',
        title: 'Erreur',
        message: error.response?.data?.message || 'Erreur lors de la modification'
      });
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR');
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Gestion des utilisateurs</h1>
          <button
            onClick={() => navigate('/admin')}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            Retour au tableau de bord
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
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
                  Demandes vendeur
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id} 
                  className="hover:bg-gray-50 cursor-pointer"
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
                      <div className="text-sm text-gray-500">{user.telephone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.date_inscription)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.nombre_annonces || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.role_id === 1 ? ( // Admin
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${roleStyles.admin.bg} ${roleStyles.admin.text}`}
                      >
                        {roleStyles.admin.label}
                      </span>
                    ) : (
                      <select
                        value={user.role_id}
                        onChange={(e) => handleQuickRoleChange(user._id, e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className={`text-xs font-semibold rounded-full px-3 py-1 border-0 cursor-pointer
                          ${roleMapping[user.role_id]?.style.bg || roleStyles.user.bg}
                          ${roleMapping[user.role_id]?.style.text || roleStyles.user.text}
                          hover:opacity-80 transition-opacity`}
                      >
                        <option value="2">Utilisateur</option>
                        <option value="3">Vendeur</option>
                        <option value="1">Admin</option>
                      </select>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {user && user.role_id === 2 && ( // Seulement pour les users (id=2)
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleBloquerDemande(user._id, !user.bloque_demande_vendeur);
                        }}
                        className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2"
                        style={{ backgroundColor: user.bloque_demande_vendeur === false ? '#10b981' : '#ef4444' }}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            user.bloque_demande_vendeur === false ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {user.role_id !== 1 && ( // Pas admin
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(user);
                          }}
                          className="text-orange-500 hover:text-orange-900 mr-3"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(user._id);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal de modification */}
        {showEditModal && editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4">Modifier l'utilisateur</h2>
              
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Téléphone
                  </label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rôle
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                    disabled={editingUser.role === 'admin'}
                  >
                    <option value="user">Utilisateur</option>
                    <option value="vendeur">Vendeur</option>
                    <option value="admin">Admin</option>
                  </select>
                  {editingUser.role === 'admin' && (
                    <p className="text-sm text-gray-500 mt-1">
                      Le rôle admin ne peut pas être modifié
                    </p>
                  )}
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-700 transition"
                  >
                    Enregistrer
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
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