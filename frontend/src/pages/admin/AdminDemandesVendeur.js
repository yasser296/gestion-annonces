import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import usePopUp from '../../hooks/usePopUp';

const AdminDemandesVendeur = () => {
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('en_attente');
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [messageAdmin, setMessageAdmin] = useState('');
  const navigate = useNavigate();
  const { showPopup, PopUpComponent } = usePopUp();

  useEffect(() => {
    fetchDemandes();
  }, [filter]);

  const fetchDemandes = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/demandes-vendeur/admin/toutes?statut=${filter}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setDemandes(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      if (error.response?.status === 403) {
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTraiterDemande = async (id, statut) => {
    if (!messageAdmin && statut === 'refusee') {
      showPopup({
        type: 'warning',
        title: 'Message requis',
        message: 'Veuillez fournir une raison pour le refus'
      });
      return;
    }

    try {
      await axios.put(
        `http://localhost:5000/api/demandes-vendeur/admin/${id}/traiter`,
        { statut, message_admin: messageAdmin },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      showPopup({
        type: 'success',
        title: 'Succès',
        message: `Demande ${statut === 'acceptee' ? 'acceptée' : 'refusée'} avec succès`
      });
      setSelectedDemande(null);
      setMessageAdmin('');
      fetchDemandes();
      window.dispatchEvent(new Event('notificationUpdate'));
    } catch (error) {
      console.error('Erreur:', error);
      showPopup({
        type: 'error',
        title: 'Erreur',
        message: error.response?.data?.message || 'Erreur lors du traitement'
      });
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <h1 className="text-3xl font-bold">Demandes vendeur</h1>
          <button
            onClick={() => navigate('/admin')}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            Retour au tableau de bord
          </button>
        </div>

        {/* Filtres */}
        <div className="mb-6 flex space-x-4">
          <button
            onClick={() => setFilter('en_attente')}
            className={`px-4 py-2 rounded ${
              filter === 'en_attente' 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            En attente ({demandes.filter(d => d.statut === 'en_attente').length})
          </button>
          <button
            onClick={() => setFilter('acceptee')}
            className={`px-4 py-2 rounded ${
              filter === 'acceptee' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Acceptées
          </button>
          <button
            onClick={() => setFilter('refusee')}
            className={`px-4 py-2 rounded ${
              filter === 'refusee' 
                ? 'bg-red-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Refusées
          </button>
        </div>

        {/* Liste des demandes */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {demandes.length === 0 ? (
            <p className="p-8 text-center text-gray-500">
              Aucune demande {filter === 'en_attente' ? 'en attente' : filter === 'acceptee' ? 'acceptée' : 'refusée'}
            </p>
          ) : (
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date demande
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Message
                  </th>
                  {filter !== 'en_attente' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Traité par
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {demandes.map((demande) => (
                  <tr key={demande._id}>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">{demande.user_id?.nom}</p>
                        <p className="text-sm text-gray-500">{demande.user_id?.email}</p>
                        <p className="text-sm text-gray-500">{demande.user_id?.telephone}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {formatDate(demande.date_demande)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-700 max-w-xs truncate">
                        {demande.message_demande}
                      </p>
                    </td>
                    {filter !== 'en_attente' && (
                      <td className="px-6 py-4 text-sm">
                        <p>{demande.traite_par?.nom}</p>
                        <p className="text-xs text-gray-500">
                          {demande.date_traitement && formatDate(demande.date_traitement)}
                        </p>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      {demande.statut === 'en_attente' ? (
                        <button
                          onClick={() => setSelectedDemande(demande)}
                          className="text-orange-500 hover:text-orange-900"
                        >
                          Traiter
                        </button>
                      ) : (
                        <button
                          onClick={() => setSelectedDemande(demande)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Voir détails
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal de traitement */}
        {selectedDemande && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
              <h2 className="text-xl font-bold mb-4">
                {selectedDemande.statut === 'en_attente' ? 'Traiter la demande' : 'Détails de la demande'}
              </h2>
              
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Utilisateur :</h3>
                <p>{selectedDemande.user_id?.nom}</p>
                <p className="text-sm text-gray-600">{selectedDemande.user_id?.email}</p>
              </div>

              <div className="mb-4">
                <h3 className="font-semibold mb-2">Message de l'utilisateur :</h3>
                <p className="bg-gray-50 p-3 rounded">{selectedDemande.message_demande}</p>
              </div>

              {selectedDemande.statut === 'en_attente' ? (
                <>
                  <div className="mb-4">
                    <label className="block font-semibold mb-2">
                      Message de réponse (optionnel pour acceptation, obligatoire pour refus) :
                    </label>
                    <textarea
                      value={messageAdmin}
                      onChange={(e) => setMessageAdmin(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                      placeholder="Expliquez votre décision..."
                    />
                  </div>

                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleTraiterDemande(selectedDemande._id, 'acceptee')}
                      className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700"
                    >
                      Accepter
                    </button>
                    <button
                      onClick={() => handleTraiterDemande(selectedDemande._id, 'refusee')}
                      className="flex-1 bg-red-600 text-white py-2 rounded hover:bg-red-700"
                    >
                      Refuser
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDemande(null);
                        setMessageAdmin('');
                      }}
                      className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300"
                    >
                      Annuler
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {selectedDemande.message_admin && (
                    <div className="mb-4">
                      <h3 className="font-semibold mb-2">Réponse de l'administrateur :</h3>
                      <p className="bg-gray-50 p-3 rounded">{selectedDemande.message_admin}</p>
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedDemande(null)}
                    className="w-full bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300"
                  >
                    Fermer
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default AdminDemandesVendeur;