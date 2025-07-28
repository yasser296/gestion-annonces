import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import AttributesForm from '../components/AttributesForm'; // NOUVEAU

const EditAnnoncePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || '/mes-annonces';
  
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    prix: '',
    ville: '',
    marque: '',
    etat: '',
    categorie_id: '',
    sous_categorie_id: '',
  });
  
  const [attributeValues, setAttributeValues] = useState({}); // NOUVEAU
  const [existingImages, setExistingImages] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sousCategories, setSousCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnnonce();
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

  const fetchAnnonce = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/annonces/${id}`);
      const { titre, description, prix, ville, marque, etat, categorie_id, sous_categorie_id, images } = res.data;
      setFormData({
        titre,
        description,
        prix,
        ville,
        marque,
        etat,
        categorie_id: typeof categorie_id === 'object' && categorie_id !== null ? categorie_id._id : categorie_id,
        sous_categorie_id: typeof sous_categorie_id === 'object' && sous_categorie_id !== null ? sous_categorie_id._id : sous_categorie_id || '',
      });
      setExistingImages(images || []);
      
      console.log("Categorie reçue :", categorie_id);
      console.log("Sous-categorie reçue :", sous_categorie_id);
    } catch (err) {
      console.error(err);
      setError('Erreur lors du chargement de l\'annonce');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/categories`);
      setCategories(res.data);
      console.log("Categories chargées :", res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSousCategoriesByCategory = async (categorieId) => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/sous-categories/by-category/${categorieId}`);
      setSousCategories(res.data);
      console.log("Sous-catégories chargées :", res.data);
    } catch (err) {
      console.error(err);
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
    const totalImages = existingImages.length + newImages.length + files.length;
    
    if (totalImages > 5) {
      setError('Vous ne pouvez avoir que 5 images maximum au total');
      return;
    }

    setNewImages([...newImages, ...files]);
    
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

  const removeExistingImage = (index) => {
    const newExistingImages = existingImages.filter((_, i) => i !== index);
    setExistingImages(newExistingImages);
  };

  const removeNewImage = (index) => {
    const newImagesList = newImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setNewImages(newImagesList);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const formDataToSend = new FormData();
      
      // Ajouter les données du formulaire
      Object.keys(formData).forEach(key => {
        if (formData[key]) { // Ne pas envoyer les champs vides
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Ajouter les images existantes à conserver
      formDataToSend.append('existingImages', JSON.stringify(existingImages));
      
      // Ajouter les nouvelles images
      newImages.forEach(image => {
        formDataToSend.append('images', image);
      });
      
      // 1. Mettre à jour l'annonce
      await axios.put(`${process.env.REACT_APP_API_URL}/api/annonces/${id}`, formDataToSend, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // 2. Sauvegarder les attributs si ils existent - NOUVEAU
      if (Object.keys(attributeValues).length > 0) {
        await axios.post(`${process.env.REACT_APP_API_URL}/api/attributes/values/${id}`, {
          attributes: attributeValues
        }, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
      }
      
      navigate(from);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Erreur lors de la modification');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Modifier l'annonce</h1>
        
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
                value={formData.categorie_id || ''}
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
                value={formData.sous_categorie_id || ''}
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
            annonceId={id}
            onAttributesChange={setAttributeValues}
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Images (max 5 au total)
            </label>
            
            {/* Images existantes */}
            {existingImages.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">Images actuelles :</p>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {existingImages.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={`${process.env.REACT_APP_API_URL}${image}`}
                        alt={`Image ${index + 1}`}
                        className="w-full h-24 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeExistingImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Bouton d'ajout d'images */}
            <div className="flex items-center space-x-4">
              <label className="cursor-pointer bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-700 transition">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={existingImages.length + newImages.length >= 5}
                />
                Ajouter des images
              </label>
              <span className="text-sm text-gray-500">
                {existingImages.length + newImages.length}/5 images
              </span>
            </div>
            
            {/* Nouvelles images */}
            {imagePreviews.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Nouvelles images :</p>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative">
                      <img
                        src={preview}
                        alt={`Nouvelle ${index + 1}`}
                        className="w-full h-24 object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeNewImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex space-x-4">
            <button
              type="submit"
              className="flex-1 bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-700 transition"
            >
              Enregistrer les modifications
            </button>
            <button
              type="button"
              onClick={() => navigate(from)}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAnnoncePage;