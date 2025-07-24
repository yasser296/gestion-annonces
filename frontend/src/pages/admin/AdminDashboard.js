// frontend/src/pages/admin/AdminDashboard.js - Version améliorée
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, 
  faClipboardList, 
  faEye, 
  faTags,
  faChartLine,
  faUserClock,
  faShoppingCart,
  faTrendUp,
  faCalendarAlt,
  faMapMarkerAlt
} from '@fortawesome/free-solid-svg-icons';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAnnonces: 0,
    totalViews: 0,
    totalCategories: 0,
    totalAttributes: 0,
    recentUsers: 0,
    activeAnnonces: 0,
    pendingApprovals: 0
  });
  
  const [recentActivity, setRecentActivity] = useState([]);
  const [topCategories, setTopCategories] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, activityRes, categoriesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/admin/stats', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get('http://localhost:5000/api/admin/recent-activity', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get('http://localhost:5000/api/admin/top-categories', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      setStats(statsRes.data);
      setRecentActivity(activityRes.data || []);
      setTopCategories(categoriesRes.data || []);
      
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, trend, subtitle, onClick }) => (
    <div 
      className={`bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:scale-105' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 font-secondary">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value.toLocaleString()}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1 font-secondary">{subtitle}</p>
          )}
          {trend && (
            <div className={`flex items-center mt-2 ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <FontAwesomeIcon icon={faTrendUp} className="mr-1" />
              <span className="text-sm font-secondary">
                {trend > 0 ? '+' : ''}{trend}% ce mois
              </span>
            </div>
          )}
        </div>
        <div className={`p-4 rounded-full ${color}`}>
          <FontAwesomeIcon icon={icon} className="text-white text-xl" />
        </div>
      </div>
    </div>
  );

  const ActivityItem = ({ type, description, time, user }) => {
    const getActivityIcon = (type) => {
      switch (type) {
        case 'user_registered': return faUsers;
        case 'annonce_created': return faClipboardList;
        case 'annonce_viewed': return faEye;
        default: return faChartLine;
      }
    };

    const getActivityColor = (type) => {
      switch (type) {
        case 'user_registered': return 'text-green-500';
        case 'annonce_created': return 'text-blue-500';
        case 'annonce_viewed': return 'text-gray-500';
        default: return 'text-purple-500';
      }
    };

    return (
      <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
        <div className={`p-2 rounded-full bg-gray-100 ${getActivityColor(type)}`}>
          <FontAwesomeIcon icon={getActivityIcon(type)} className="text-sm" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 font-secondary">{description}</p>
          {user && <p className="text-xs text-gray-500 font-secondary">{user}</p>}
        </div>
        <div className="text-xs text-gray-500 font-secondary">{time}</div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600 mt-2 font-secondary">
          Vue d'ensemble de votre plateforme
        </p>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Utilisateurs"
          value={stats.totalUsers}
          icon={faUsers}
          color="bg-blue-500"
          trend={12}
          subtitle="Total des inscrits"
          onClick={() => navigate('/admin/users')}
        />
        
        <StatCard
          title="Annonces"
          value={stats.totalAnnonces}
          icon={faClipboardList}
          color="bg-green-500"
          trend={8}
          subtitle="Publications actives"
          onClick={() => navigate('/admin/annonces')}
        />
        
        <StatCard
          title="Vues totales"
          value={stats.totalViews}
          icon={faEye}
          color="bg-purple-500"
          trend={15}
          subtitle="Toutes annonces"
        />
        
        <StatCard
          title="Catégories"
          value={stats.totalCategories}
          icon={faTags}
          color="bg-orange-500"
          subtitle="Avec attributs"
          onClick={() => navigate('/admin/categories')}
        />
      </div>

      {/* Statistiques secondaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Nouveaux utilisateurs"
          value={stats.recentUsers || 5}
          icon={faUserClock}
          color="bg-indigo-500"
          subtitle="Cette semaine"
        />
        
        <StatCard
          title="Annonces actives"
          value={stats.activeAnnonces || Math.floor(stats.totalAnnonces * 0.85)}
          icon={faShoppingCart}
          color="bg-teal-500"
          subtitle="En ligne actuellement"
        />
        
        <StatCard
          title="Attributs configurés"
          value={stats.totalAttributes || 24}
          icon={faChartLine}
          color="bg-pink-500"
          subtitle="Toutes catégories"
          onClick={() => navigate('/admin/attributes')}
        />
      </div>

      {/* Contenu en deux colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Activité récente */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Activité récente</h2>
            <FontAwesomeIcon icon={faCalendarAlt} className="text-gray-400" />
          </div>
          
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <ActivityItem key={index} {...activity} />
              ))
            ) : (
              // Données d'exemple si pas d'API
              <>
                <ActivityItem
                  type="user_registered"
                  description="Nouvel utilisateur inscrit"
                  user="Marie Dupont"
                  time="Il y a 2h"
                />
                <ActivityItem
                  type="annonce_created"
                  description="Nouvelle annonce publiée"
                  user="Jean Martin"
                  time="Il y a 3h"
                />
                <ActivityItem
                  type="annonce_viewed"
                  description="Annonce consultée 15 fois"
                  time="Il y a 1h"
                />
                <ActivityItem
                  type="user_registered"
                  description="Nouvel utilisateur inscrit"
                  user="Sophie Bernard"
                  time="Il y a 5h"
                />
                <ActivityItem
                  type="annonce_created"
                  description="Nouvelle annonce publiée"
                  user="Pierre Durand"
                  time="Il y a 6h"
                />
              </>
            )}
          </div>
        </div>

        {/* Top catégories */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Top catégories</h2>
            <FontAwesomeIcon icon={faTags} className="text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {topCategories.length > 0 ? (
              topCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{category.icone}</span>
                    <span className="font-medium font-secondary">{category.nom}</span>
                  </div>
                  <span className="text-sm text-gray-500 font-secondary">
                    {category.count} annonces
                  </span>
                </div>
              ))
            ) : (
              // Données d'exemple
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">🚗</span>
                    <span className="font-medium font-secondary">Automobile</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">15</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                      <div className="bg-orange-500 h-2 rounded-full" style={{width: '75%'}}></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">🏠</span>
                    <span className="font-medium font-secondary">Immobilier</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">12</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                      <div className="bg-orange-500 h-2 rounded-full" style={{width: '60%'}}></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">📱</span>
                    <span className="font-medium font-secondary">Électronique</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">8</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                      <div className="bg-orange-500 h-2 rounded-full" style={{width: '40%'}}></div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">👔</span>
                    <span className="font-medium font-secondary">Vêtements</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">6</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2 mt-1">
                      <div className="bg-orange-500 h-2 rounded-full" style={{width: '30%'}}></div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Navigation rapide */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Accès rapide</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/admin/users')}
            className="p-4 text-left rounded-lg border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 transition-all group"
          >
            <FontAwesomeIcon icon={faUsers} className="text-2xl text-orange-500 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-gray-900 font-secondary">Gestion des utilisateurs</h3>
            <p className="text-sm text-gray-600 font-secondary">Créer, modifier, supprimer</p>
          </button>

          <button
            onClick={() => navigate('/admin/annonces')}
            className="p-4 text-left rounded-lg border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 transition-all group"
          >
            <FontAwesomeIcon icon={faClipboardList} className="text-2xl text-green-500 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-gray-900 font-secondary">Gestion des annonces</h3>
            <p className="text-sm text-gray-600 font-secondary">Modérer, valider, supprimer</p>
          </button>

          <button
            onClick={() => navigate('/admin/categories')}
            className="p-4 text-left rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all group"
          >
            <FontAwesomeIcon icon={faTags} className="text-2xl text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-gray-900 font-secondary">Gestion des catégories</h3>
            <p className="text-sm text-gray-600 font-secondary">Organiser, structurer</p>
          </button>

          <button
            onClick={() => navigate('/admin/attributes')}
            className="p-4 text-left rounded-lg border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all group"
          >
            <FontAwesomeIcon icon={faChartLine} className="text-2xl text-purple-500 mb-3 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-gray-900 font-secondary">Gestion des attributs</h3>
            <p className="text-sm text-gray-600 font-secondary">Personnaliser les formulaires</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;