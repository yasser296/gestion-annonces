// frontend/src/pages/DemandeVendeur.js (partie modifiée)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import usePopUp from '../hooks/usePopUp';

const DemandeVendeur = () => {
  const [demande, setDemande] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [canMakeRequest, setCanMakeRequest] = useState(true);
  const navigate = useNavigate();
  const { showPopup, PopUpComponent } = usePopUp();

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      // Vérifier le statut actuel de l'utilisateur
      const canCreateResponse = await axios.get(
        'http://localhost:5000/api/demandes-vendeur/can-create-annonce',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      // Si l'utilisateur peut créer des annonces, il est déjà vendeur
      if (canCreateResponse.data.canCreate) {
        showPopup({
          type: 'info',
          title: 'Déjà vendeur',
          message: 'Vous êtes déjà vendeur et pouvez créer des annonces',
          onConfirm: () => navigate('/nouvelle-annonce')
        });
        return;
      }

      // Si bloqué
      if (canCreateResponse.data.reason === 'bloque') {
        setCanMakeRequest(false);
        showPopup({
          type: 'error',
          title: 'Accès refusé',
          message: canCreateResponse.data.message,
          onConfirm: () => navigate('/')
        });
        return;
      }

      // Vérifier les demandes existantes
      const demandeResponse = await axios.get(
        'http://localhost:5000/api/demandes-vendeur/ma-demande',
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (demandeResponse.data) {
        setDemande(demandeResponse.data);
      }
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
      showPopup({
        type: 'warning',
        title: 'Message trop long',
        message: 'Votre message ne doit pas dépasser 500 caractères'
      });
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
      
      // Rediriger vers l'accueil au lieu de popup + navigation
      navigate('/');
      
      showPopup({
        type: 'success',
        title: 'Demande envoyée',
        message: 'Votre demande a été envoyée avec succès !'
      });
      
    } catch (error) {
      showPopup({
        type: 'error',
        title: 'Erreur',
        message: error.response?.data?.message || 'Erreur lors de l\'envoi de la demande'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!canMakeRequest) {
    return null; // Déjà redirigé par le popup
  }

  // Si une demande existe et est en attente
  if (demande && demande.statut === 'en_attente') {
    return (
      <>
        <PopUpComponent />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h1 className="text-2xl font-bold mb-6">Demande en cours</h1>
            
            <div className="p-4 rounded-lg mb-4 bg-yellow-50 border border-yellow-200">
              <p className="font-semibold mb-2">
                Statut : En attente de traitement
              </p>
              <p className="text-sm text-gray-600">
                Date de demande : {new Date(demande.date_demande).toLocaleDateString('fr-FR')}
              </p>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold mb-2">Votre message :</h3>
              <p className="text-gray-700 bg-gray-50 p-3 rounded">{demande.message_demande}</p>
            </div>

            <p className="text-sm text-gray-600 text-center">
              Votre demande est en cours d'examen. Vous serez notifié dès qu'une décision sera prise.
            </p>
          </div>
        </div>
      </>
    );
  }

  // Formulaire de demande (nouvelle demande ou après refus)
  return (
    <>
      <PopUpComponent />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6">
            {demande && demande.statut === 'refusee' 
              ? 'Nouvelle demande pour devenir vendeur' 
              : 'Demande pour devenir vendeur'}
          </h1>

          {/* Afficher l'historique si demande refusée */}
          {demande && demande.statut === 'refusee' && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-900 mb-2">Demande précédente refusée</h3>
              <p className="text-sm text-red-800 mb-2">
                Date : {new Date(demande.date_demande).toLocaleDateString('fr-FR')}
              </p>
              {demande.message_admin && (
                <p className="text-sm text-red-800">
                  Raison : {demande.message_admin}
                </p>
              )}
            </div>
          )}
          
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <h3 className="font-semibold text-orange-900 mb-2">Pourquoi devenir vendeur ?</h3>
            <ul className="list-disc list-inside text-orange-800 space-y-1">
              <li>Publiez vos annonces sur notre plateforme</li>
              <li>Gérez facilement vos produits</li>
              <li>Accédez aux statistiques de vos annonces</li>
              <li>Communiquez directement avec les acheteurs</li>
            </ul>
          </div>

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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
              <p className="mt-1 text-sm text-gray-500">
                Maximum 500 caractères ({message.length}/500)
              </p>
            </div>

            <button
              type="submit"
              disabled={message.length > 500}
              className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Envoyer ma demande
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default DemandeVendeur;