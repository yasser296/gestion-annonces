import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AttributesForm from '../components/AttributesForm'; // NOUVEAU

const CreateAnnonce = () => {
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    prix: '',
    categorie_id: '',
    sous_categorie_id: '',
    ville: '',
    marque: '',
    etat: ''
  });
  
  const [attributeValues, setAttributeValues] = useState({}); // NOUVEAU
  const [categories, setCategories] = useState([]);
  const [sousCategories, setSousCategories] = useState([]);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  // Charger les sous-catégories quand une catégorie est sélectionnée
  useEffect(() => {
    if (formData.categorie_id) {
      fetchSousCategoriesByCategory(formData.categorie_id);
    } else {
      setSousCategories([]);
      setFormData(prev => ({ ...prev, sous_categorie_id: '' }));
    }
  }, [formData.categorie_id]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des catégories:', error);
    }
  };

  const fetchSousCategoriesByCategory = async (categorieId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/sous-categories/by-category/${categorieId}`);
      setSousCategories(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des sous-catégories:', error);
      setSousCategories([]);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length > 5) {
      setError('Vous ne pouvez télécharger que 5 images maximum');
      return;
    }

    setImages([...images, ...files]);
    
    // Créer les previews
    const newPreviews = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result);
        if (newPreviews.length === files.length) {
          setImagePreviews([...imagePreviews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formDataToSend = new FormData();
    Object.keys(formData).forEach(key => {
      if (formData[key]) { // Ne pas envoyer les champs vides
        formDataToSend.append(key, formData[key]);
      }
    });
    
    images.forEach(image => {
      formDataToSend.append('images', image);
    });

    try {
      // 1. Créer l'annonce
      const annonceResponse = await axios.post('http://localhost:5000/api/annonces', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      const annonceId = annonceResponse.data.annonce._id;

      // 2. Sauvegarder les attributs si ils existent - NOUVEAU
      if (Object.keys(attributeValues).length > 0) {
        await axios.post(`http://localhost:5000/api/attributes/values/${annonceId}`, {
          attributes: attributeValues
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
      }

      navigate('/mes-annonces');
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors de la création de l\'annonce');
    } finally {
      setLoading(false);
    }
  };

  console.log('Debug AttributesForm:', {
    categoryId: formData.categorie_id,
    attributeValues: attributeValues,
    selectedCategory: categories.find(cat => cat._id === formData.categorie_id)
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Déposer une annonce</h1>
        
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Titre de l'annonce *
            </label>
            <input
              type="text"
              name="titre"
              required
              value={formData.titre}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              required
              rows={5}
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Prix (MAD) *
              </label>
              <input
                type="number"
                name="prix"
                value={formData.prix}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (value >= 0 || e.target.value === '') {
                    setFormData({ ...formData, prix: e.target.value });
                  }
                }}
                placeholder="Prix"
                className="w-full p-2 border rounded"
                min="0"
                step="1"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Catégorie *
              </label>
              <select
                name="categorie_id"
                required
                value={formData.categorie_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.icone} {cat.nom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sous-catégorie - affiché seulement si une catégorie est sélectionnée */}
          {formData.categorie_id && sousCategories.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sous-catégorie (optionnel)
              </label>
              <select
                name="sous_categorie_id"
                value={formData.sous_categorie_id}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                <option value="">Sélectionner une sous-catégorie</option>
                {sousCategories.map((sousCat) => (
                  <option key={sousCat._id} value={sousCat._id}>
                    {sousCat.icone} {sousCat.nom}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ville *
              </label>
              <input
                type="text"
                name="ville"
                required
                value={formData.ville}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>

            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                État
              </label>
              <select
                name="etat"
                value={formData.etat}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
              >
                <option value="">Sélectionner l'état</option>
                <option value="Neuf">Neuf</option>
                <option value="Comme neuf">Comme neuf</option>
                <option value="Bon état">Bon état</option>
                <option value="État moyen">État moyen</option>
              </select>
            </div> */}
            
            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marque
              </label>
              <input
                type="text"
                name="marque"
                value={formData.marque}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div> */}
          </div>
          
          

          {/* NOUVEAU: Formulaire des attributs */}
          <AttributesForm
            categoryId={formData.categorie_id}
            onAttributesChange={setAttributeValues}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Images (max 5)
            </label>
            <div className="flex items-center space-x-4">
              <label className="cursor-pointer bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-700 transition">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={images.length >= 5}
                />
                Ajouter des images
              </label>
              <span className="text-sm text-gray-500">
                {images.length}/5 images
              </span>
            </div>
            
            {imagePreviews.length > 0 && (
              <div className="mt-4 grid grid-cols-3 md:grid-cols-5 gap-2">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
          >
            {loading ? 'Publication...' : 'Publier l\'annonce'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateAnnonce;