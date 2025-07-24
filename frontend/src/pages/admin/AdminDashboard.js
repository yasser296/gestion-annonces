import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAnnonces: 0,
    activeAnnonces: 0,
    totalViews: 0,
    totalCategories: 0, // NOUVEAU
    totalAttributes: 0  // NOUVEAU
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/admin/stats', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setStats(response.data);
      
      // NOUVEAU: Récupérer le nombre d'attributs
      const attributesResponse = await axios.get('http://localhost:5000/api/attributes/admin/all', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      setStats(prev => ({ ...prev, totalAttributes: attributesResponse.data.length }));
      
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      if (error.response?.status === 403) {
        navigate('/');
      }
    } finally {
      setLoading(false);
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Tableau de bord administrateur</h1>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Utilisateurs</p>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </div>
            <svg className="w-12 h-12 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total annonces</p>
              <p className="text-2xl font-bold">{stats.totalAnnonces}</p>
            </div>
            <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Annonces actives</p>
              <p className="text-2xl font-bold">{stats.activeAnnonces}</p>
            </div>
            <svg className="w-12 h-12 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Vues totales</p>
              <p className="text-2xl font-bold">{stats.totalViews}</p>
            </div>
            <svg className="w-12 h-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* NOUVEAU: Statistiques supplémentaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Catégories</p>
              <p className="text-2xl font-bold">{stats.totalCategories || 0}</p>
            </div>
            <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Attributs</p>
              <p className="text-2xl font-bold">{stats.totalAttributes || 0}</p>
            </div>
            <svg className="w-12 h-12 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <button
          onClick={() => navigate('/admin/users')}
          className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition flex items-center justify-between"
        >
          <div className="text-left">
            <h2 className="text-xl font-bold mb-2">Gestion des utilisateurs</h2>
            <p className="text-gray-600">Voir et gérer tous les utilisateurs</p>
          </div>
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          onClick={() => navigate('/admin/annonces')}
          className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition flex items-center justify-between"
        >
          <div className="text-left">
            <h2 className="text-xl font-bold mb-2">Gestion des annonces</h2>
            <p className="text-gray-600">Voir et gérer toutes les annonces</p>
          </div>
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          onClick={() => navigate('/admin/categories')}
          className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition flex items-center justify-between"
        >
          <div className="text-left">
            <h2 className="text-xl font-bold mb-2">Gestion des catégories</h2>
            <p className="text-gray-600">Voir et gérer les catégories</p>
          </div>
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* NOUVEAU: Gestion des attributs */}
        <button
          onClick={() => navigate('/admin/attributes')}
          className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition flex items-center justify-between"
        >
          <div className="text-left">
            <h2 className="text-xl font-bold mb-2">Gestion des attributs</h2>
            <p className="text-gray-600">Configurer les spécifications par catégorie</p>
          </div>
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <button
          onClick={() => navigate('/admin/demandes-vendeur')}
          className="bg-white rounded-lg shadow p-8 hover:shadow-lg transition flex items-center justify-between"
        >
          <div className="text-left">
            <h2 className="text-xl font-bold mb-2">Demandes vendeur</h2>
            <p className="text-gray-600">Gérer les demandes pour devenir vendeur</p>
          </div>
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;