import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const EditAnnoncePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    prix: '',
    ville: '',
    marque: '',
    etat: '',
    categorie_id: '',
    images: [],
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnonce();
    fetchCategories();
  }, []);

  const fetchAnnonce = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/annonces/${id}`);
      const { titre, description, prix, ville, marque, etat, categorie_id, images } = res.data;
      setFormData({ titre, description, prix, ville, marque, etat, categorie_id, images });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const res = await axios.get('http://localhost:5000/api/categories');
    setCategories(res.data);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/annonces/${id}`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      navigate('/mes-annonces');
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la modification");
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-8 p-4 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Modifier l’annonce</h1>
      {loading ? <p>Chargement...</p> : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" name="titre" value={formData.titre} onChange={handleChange} placeholder="Titre" className="w-full p-2 border rounded" />
          <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" className="w-full p-2 border rounded" />
          <input type="number" name="prix" value={formData.prix} onChange={handleChange} placeholder="Prix" className="w-full p-2 border rounded" />
          <input type="text" name="ville" value={formData.ville} onChange={handleChange} placeholder="Ville" className="w-full p-2 border rounded" />
          <input type="text" name="marque" value={formData.marque} onChange={handleChange} placeholder="Marque" className="w-full p-2 border rounded" />
          <input type="text" name="etat" value={formData.etat} onChange={handleChange} placeholder="État" className="w-full p-2 border rounded" />
          <select name="categorie_id" value={formData.categorie_id} onChange={handleChange} className="w-full p-2 border rounded">
            <option value="">Sélectionner une catégorie</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
          </select>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Enregistrer</button>
        </form>
      )}
    </div>
  );
};

export default EditAnnoncePage;
