import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';
import usePopUp from '../../hooks/usePopUp';

const AdminAttributes = () => {
  const [attributes, setAttributes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState(null);
  const navigate = useNavigate();
  const { showPopup, PopUpComponent } = usePopUp();

  const [formData, setFormData] = useState({
    nom: '',
    categorie_id: '',
    type: 'string',
    options: [],
    required: false,
    ordre: 0,
    placeholder: '',
    description: '',
    isActive: true
  });

  const [newOption, setNewOption] = useState('');

  useEffect(() => {
    fetchAttributes();
    fetchCategories();
  }, []);

  const fetchAttributes = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/attributes/admin/all', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setAttributes(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/categories', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setCategories(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAttribute) {
        await axios.put(
          `http://localhost:5000/api/attributes/admin/${editingAttribute._id}`,
          formData,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        showPopup({ type: 'success', title: 'Succès', message: 'Attribut mis à jour' });
      } else {
        await axios.post(
          'http://localhost:5000/api/attributes/admin',
          formData,
          { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
        );
        showPopup({ type: 'success', title: 'Succès', message: 'Attribut créé' });
      }
      fetchAttributes();
      handleCloseModal();
    } catch (error) {
      showPopup({
        type: 'error',
        title: 'Erreur',
        message: error.response?.data?.message || 'Erreur lors de l\'opération'
      });
    }
  };

  const handleEdit = (attribute) => {
    setEditingAttribute(attribute);
    setFormData({
      nom: attribute.nom,
      categorie_id: attribute.categorie_id._id,
      type: attribute.type,
      options: attribute.options || [],
      required: attribute.required,
      ordre: attribute.ordre,
      placeholder: attribute.placeholder || '',
      description: attribute.description || '',
      isActive: attribute.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (attributeId) => {
    const confirmed = await showPopup({
      type: 'confirm',
      title: 'Confirmer la suppression',
      message: 'Voulez-vous vraiment supprimer cet attribut ? Toutes les valeurs associées seront également supprimées.',
      showCancel: true,
      confirmText: 'Oui, supprimer',
      cancelText: 'Annuler'
    });

    if (confirmed) {
      try {
        await axios.delete(`http://localhost:5000/api/attributes/admin/${attributeId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        showPopup({ type: 'success', title: 'Succès', message: 'Attribut supprimé' });
        fetchAttributes();
      } catch (error) {
        showPopup({
          type: 'error',
          title: 'Erreur',
          message: error.response?.data?.message || 'Erreur lors de la suppression'
        });
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAttribute(null);
    setFormData({
      nom: '',
      categorie_id: '',
      type: 'string',
      options: [],
      required: false,
      ordre: 0,
      placeholder: '',
      description: '',
      isActive: true
    });
    setNewOption('');
  };

  const addOption = () => {
    if (newOption.trim() && !formData.options.includes(newOption.trim())) {
      setFormData({
        ...formData,
        options: [...formData.options, newOption.trim()]
      });
      setNewOption('');
    }
  };

  const removeOption = (optionToRemove) => {
    setFormData({
      ...formData,
      options: formData.options.filter(option => option !== optionToRemove)
    });
  };

  const getTypeIcon = (type) => {
    const icons = {
      string: '📝',
      number: '🔢',
      boolean: '☑️',
      select: '📋'
    };
    return icons[type] || '📝';
  };

  const getTypeLabel = (type) => {
    const labels = {
      string: 'Texte',
      number: 'Nombre',
      boolean: 'Oui/Non',
      select: 'Liste déroulante'
    };
    return labels[type] || 'Texte';
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
        <h1 className="text-3xl font-bold">Gestion des attributs</h1>
        <div className="flex justify-end items-center mb-8 space-x-2">
          <div className="space-x-2">
            <button
              onClick={() => setShowModal(true)}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition flex items-center space-x-2"
            >
              <FontAwesomeIcon icon={faPlus} />
              <span>Nouvel attribut</span>
            </button>
          </div>
          <div className="space-x-2">           
            <button
              onClick={() => navigate('/admin')}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Retour au tableau de bord
            </button>
          </div>
        </div>

        

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requis</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ordre</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {attributes.map((attribute) => (
                <tr key={attribute._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium">{attribute.nom}</div>
                      {attribute.description && (
                        <div className="text-sm text-gray-500">{attribute.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span>{attribute.categorie_id?.icone}</span>
                      <span>{attribute.categorie_id?.nom}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span>{getTypeIcon(attribute.type)}</span>
                      <span>{getTypeLabel(attribute.type)}</span>
                    </div>
                    {attribute.type === 'select' && attribute.options && (
                      <div className="text-xs text-gray-500 mt-1">
                        {attribute.options.length} option(s)
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      attribute.required ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {attribute.required ? 'Requis' : 'Optionnel'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{attribute.ordre}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      attribute.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {attribute.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleEdit(attribute)}
                      className="text-orange-500 hover:text-orange-700 mr-3"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button
                      onClick={() => handleDelete(attribute._id)}
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

        {/* Modal de création/modification */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-xl font-bold mb-4">
                {editingAttribute ? 'Modifier l\'attribut' : 'Nouvel attribut'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                    <input
                      type="text"
                      value={formData.nom}
                      onChange={(e) => setFormData({...formData, nom: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                    <select
                      value={formData.categorie_id}
                      onChange={(e) => setFormData({...formData, categorie_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                      required
                    >
                      <option value="">Sélectionner une catégorie</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>
                          {category.icone} {category.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({...formData, type: e.target.value, options: e.target.value === 'select' ? formData.options : []})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                    >
                      <option value="string">Texte</option>
                      <option value="number">Nombre</option>
                      <option value="boolean">Oui/Non</option>
                      <option value="select">Liste déroulante</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ordre</label>
                    <input
                      type="number"
                      value={formData.ordre}
                      onChange={(e) => setFormData({...formData, ordre: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder</label>
                  <input
                    type="text"
                    value={formData.placeholder}
                    onChange={(e) => setFormData({...formData, placeholder: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                    placeholder="Texte d'aide pour l'utilisateur"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                    placeholder="Description de l'attribut"
                  />
                </div>

                {/* Options pour le type select */}
                {formData.type === 'select' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newOption}
                          onChange={(e) => setNewOption(e.target.value)}
                          placeholder="Nouvelle option"
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                        />
                        <button
                          type="button"
                          onClick={addOption}
                          className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                        >
                          Ajouter
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.options.map((option, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800"
                          >
                            {option}
                            <button
                              type="button"
                              onClick={() => removeOption(option)}
                              className="ml-2 hover:text-orange-600"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="required"
                      checked={formData.required}
                      onChange={(e) => setFormData({...formData, required: e.target.checked})}
                      className="mr-2"
                    />
                    <label htmlFor="required" className="text-sm text-gray-700">Champ requis</label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                      className="mr-2"
                    />
                    <label htmlFor="isActive" className="text-sm text-gray-700">Actif</label>
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition"
                  >
                    {editingAttribute ? 'Modifier' : 'Créer'}
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

export default AdminAttributes;