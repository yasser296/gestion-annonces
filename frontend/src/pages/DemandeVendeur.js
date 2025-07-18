import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const DemandeVendeur = () => {
  const [demande, setDemande] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    checkDemande();
  }, []);

  const checkDemande = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/demandes-vendeur/ma-demande', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setDemande(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (message.length > 500) {
      setError('Votre message ne doit pas depasser 500 caractères');
      return;
    }

    try {
      await axios.post(
        'http://localhost:5000/api/demandes-vendeur/demande',
        { message_demande: message },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      alert('Votre demande a été envoyée avec succès !');
      navigate('/');
    } catch (error) {
      setError(error.response?.data?.message || 'Erreur lors de l\'envoi de la demande');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Si une demande existe déjà
  if (demande) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6">Statut de votre demande</h1>
          
          <div className={`p-4 rounded-lg mb-4 ${
            demande.statut === 'en_attente' ? 'bg-yellow-50 border border-yellow-200' :
            demande.statut === 'acceptee' ? 'bg-green-50 border border-green-200' :
            'bg-red-50 border border-red-200'
          }`}>
            <p className="font-semibold mb-2">
              Statut : {
                demande.statut === 'en_attente' ? 'En attente de traitement' :
                demande.statut === 'acceptee' ? 'Acceptée' : 'Refusée'
              }
            </p>
            <p className="text-sm text-gray-600">
              Date de demande : {new Date(demande.date_demande).toLocaleDateString('fr-FR')}
            </p>
          </div>

          <div className="mb-4">
            <h3 className="font-semibold mb-2">Votre message :</h3>
            <p className="text-gray-700 bg-gray-50 p-3 rounded">{demande.message_demande}</p>
          </div>

          {demande.message_admin && (
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Réponse de l'administrateur :</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded">{demande.message_admin}</p>
            </div>
          )}

          {demande.statut === 'refusee' && (
            <button
              onClick={() =>
                setDemande(null) & setMessage('') & navigate('/demande-vendeur')
                 }
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
            >
              Créer une nouvelle demande
            </button>
          )}

          {demande.statut === 'acceptee' && (
            <button
              onClick={() => navigate('/nouvelle-annonce')}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition"
            >
              Créer votre première annonce
            </button>
          )}
        </div>
      </div>
    );
  }

  // Formulaire de demande
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Demande pour devenir vendeur</h1>
        
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">Pourquoi devenir vendeur ?</h3>
          <ul className="list-disc list-inside text-blue-800 space-y-1">
            <li>Publiez vos annonces sur notre plateforme</li>
            <li>Gérez facilement vos produits</li>
            <li>Accédez aux statistiques de vos annonces</li>
            <li>Communiquez directement avec les acheteurs</li>
          </ul>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pourquoi souhaitez-vous devenir vendeur ? *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              required
              placeholder="Décrivez votre activité, les types de produits que vous souhaitez vendre, votre expérience..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="mt-1 text-sm text-gray-500">
              Maximum 500 caractères ({message.length}/500)
            </p>
          </div>

          <button
            type="submit"
            disabled={message.length > 500}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Envoyer ma demande
          </button>
        </form>
      </div>
    </div>
  );
};

export default DemandeVendeur;