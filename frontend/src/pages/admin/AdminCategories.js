import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import usePopUp from '../../hooks/usePopUp';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [sousCategories, setSousCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [activeTab, setActiveTab] = useState('categories');
  const navigate = useNavigate();
  const { showPopup, PopUpComponent } = usePopUp();

  const [categoryFormData, setCategoryFormData] = useState({
    nom: '',
    icone: '📁',
    ordre: 0,
    isActive: true
  });

  const [subCategoryFormData, setSubCategoryFormData] = useState({
    nom: '',
    icone: '📂',
    categorie_id: '',
    ordre: 0,
    isActive: true
  });

  useEffect(() => {
    fetchCategories();
    fetchSousCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/categories`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setCategories(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchSousCategories = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/sous-categories`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setSousCategories(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  // Gestion des catégories
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await axios.put(
          `${process.env.REACT_APP_API_URL}/api/admin/categories/${editingCategory._id}`,
          categoryFormData,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        showPopup({ type: 'success', title: 'Succès', message: 'Catégorie mise à jour' });
      } else {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/admin/categories`,
          categoryFormData,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        showPopup({ type: 'success', title: 'Succès', message: 'Catégorie créée' });
      }
      fetchCategories();
      handleCloseCategoryModal();
    } catch (error) {
      showPopup({
        type: 'error',
        title: 'Erreur',
        message: error.response?.data?.message || 'Erreur lors de l\'opération'
      });
    }
  };

  const handleEditCategory = (category) => {
    setEditingCategory(category);
    setCategoryFormData({
      nom: category.nom,
      icone: category.icone,
      ordre: category.ordre,
      isActive: category.isActive
    });
    setShowCategoryModal(true);
  };

  const handleDeleteCategory = async (categoryId) => {
    const confirmed = await showPopup({
      type: 'confirm',
      title: 'Confirmer la suppression',
      message: 'Voulez-vous vraiment supprimer cette catégorie ? Toutes ses sous-catégories seront également supprimées.',
      showCancel: true,
      confirmText: 'Oui, supprimer',
      cancelText: 'Annuler'
    });

    if (confirmed) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/api/admin/categories/${categoryId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        showPopup({ type: 'success', title: 'Succès', message: 'Catégorie supprimée' });
        fetchCategories();
        fetchSousCategories();
      } catch (error) {
        showPopup({
          type: 'error',
          title: 'Erreur',
          message: error.response?.data?.message || 'Erreur lors de la suppression'
        });
      }
    }
  };

  // Gestion des sous-catégories
  const handleSubCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSubCategory) {
        await axios.put(
          `${process.env.REACT_APP_API_URL}/api/admin/sous-categories/${editingSubCategory._id}`,
          subCategoryFormData,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        showPopup({ type: 'success', title: 'Succès', message: 'Sous-catégorie mise à jour' });
      } else {
        await axios.post(
          `${process.env.REACT_APP_API_URL}/api/admin/sous-categories`,
          subCategoryFormData,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        showPopup({ type: 'success', title: 'Succès', message: 'Sous-catégorie créée' });
      }
      fetchSousCategories();
      handleCloseSubCategoryModal();
    } catch (error) {
      showPopup({
        type: 'error',
        title: 'Erreur',
        message: error.response?.data?.message || 'Erreur lors de l\'opération'
      });
    }
  };

  const handleEditSubCategory = (subCategory) => {
    setEditingSubCategory(subCategory);
    setSubCategoryFormData({
      nom: subCategory.nom,
      icone: subCategory.icone,
      categorie_id: subCategory.categorie_id._id,
      ordre: subCategory.ordre,
      isActive: subCategory.isActive
    });
    setShowSubCategoryModal(true);
  };

  const handleDeleteSubCategory = async (subCategoryId) => {
    const confirmed = await showPopup({
      type: 'confirm',
      title: 'Confirmer la suppression',
      message: 'Voulez-vous vraiment supprimer cette sous-catégorie ?',
      showCancel: true,
      confirmText: 'Oui, supprimer',
      cancelText: 'Annuler'
    });

    if (confirmed) {
      try {
        await axios.delete(`${process.env.REACT_APP_API_URL}/api/admin/sous-categories/${subCategoryId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        showPopup({ type: 'success', title: 'Succès', message: 'Sous-catégorie supprimée' });
        fetchSousCategories();
      } catch (error) {
        showPopup({
          type: 'error',
          title: 'Erreur',
          message: error.response?.data?.message || 'Erreur lors de la suppression'
        });
      }
    }
  };

  const handleCloseCategoryModal = () => {
    setShowCategoryModal(false);
    setEditingCategory(null);
    setCategoryFormData({ nom: '', icone: '📁', ordre: 0, isActive: true });
  };

  const handleCloseSubCategoryModal = () => {
    setShowSubCategoryModal(false);
    setEditingSubCategory(null);
    setSubCategoryFormData({ nom: '', icone: '📂', categorie_id: '', ordre: 0, isActive: true });
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
          <h1 className="text-3xl font-bold">Gestion des catégories</h1>
          <button
            onClick={() => navigate('/admin')}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            Retour au tableau de bord
          </button>
        </div>

        {/* Onglets */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('categories')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'categories'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Catégories ({categories.length})
              </button>
              <button
                onClick={() => setActiveTab('sous-categories')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'sous-categories'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Sous-catégories ({sousCategories.length})
              </button>
            </nav>
          </div>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'categories' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Catégories principales</h2>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition flex items-center space-x-2"
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>Nouvelle catégorie</span>
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Icône</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ordre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sous-catégories</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {categories.map((category) => (
                    <tr key={category._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-2xl">{category.icone}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{category.nom}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{category.ordre}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {category.sousCategories?.length || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          category.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleEditCategory(category)}
                          className="text-orange-500 hover:text-orange-700 mr-3"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'sous-categories' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Sous-catégories</h2>
              <button
                onClick={() => setShowSubCategoryModal(true)}
                className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition flex items-center space-x-2"
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>Nouvelle sous-catégorie</span>
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Icône</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie parente</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ordre</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sousCategories.map((subCategory) => (
                    <tr key={subCategory._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-2xl">{subCategory.icone}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{subCategory.nom}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span>{subCategory.categorie_id?.icone}</span>
                          <span>{subCategory.categorie_id?.nom}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{subCategory.ordre}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          subCategory.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {subCategory.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleEditSubCategory(subCategory)}
                          className="text-orange-500 hover:text-orange-700 mr-3"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          onClick={() => handleDeleteSubCategory(subCategory._id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Catégorie */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingCategory ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </h2>
              
              <form onSubmit={handleCategorySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input
                    type="text"
                    value={categoryFormData.nom}
                    onChange={(e) => setCategoryFormData({...categoryFormData, nom: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icône</label>
                  <input
                    type="text"
                    value={categoryFormData.icone}
                    onChange={(e) => setCategoryFormData({...categoryFormData, icone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ordre</label>
                  <input
                    type="number"
                    value={categoryFormData.ordre}
                    onChange={(e) => setCategoryFormData({...categoryFormData, ordre: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={categoryFormData.isActive}
                    onChange={(e) => setCategoryFormData({...categoryFormData, isActive: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition"
                  >
                    {editingCategory ? 'Modifier' : 'Créer'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseCategoryModal}
                    className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Sous-catégorie */}
        {showSubCategoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingSubCategory ? 'Modifier la sous-catégorie' : 'Nouvelle sous-catégorie'}
              </h2>
              
              <form onSubmit={handleSubCategorySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <input
                    type="text"
                    value={subCategoryFormData.nom}
                    onChange={(e) => setSubCategoryFormData({...subCategoryFormData, nom: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Icône</label>
                  <input
                    type="text"
                    value={subCategoryFormData.icone}
                    onChange={(e) => setSubCategoryFormData({...subCategoryFormData, icone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie parente</label>
                  <select
                    value={subCategoryFormData.categorie_id}
                    onChange={(e) => setSubCategoryFormData({...subCategoryFormData, categorie_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                    required
                  >
                    <option value="">Sélectionner une catégorie</option>
                    {categories.filter(cat => cat.isActive).map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.icone} {category.nom}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ordre</label>
                  <input
                    type="number"
                    value={subCategoryFormData.ordre}
                    onChange={(e) => setSubCategoryFormData({...subCategoryFormData, ordre: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="subIsActive"
                    checked={subCategoryFormData.isActive}
                    onChange={(e) => setSubCategoryFormData({...subCategoryFormData, isActive: e.target.checked})}
                    className="mr-2"
                  />
                  <label htmlFor="subIsActive" className="text-sm text-gray-700">Active</label>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition"
                  >
                    {editingSubCategory ? 'Modifier' : 'Créer'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCloseSubCategoryModal}
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

export default AdminCategories;