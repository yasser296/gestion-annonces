// frontend/src/App.js 
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage'; // Remplace SearchPage
import AnnonceDetail from './pages/AnnonceDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateAnnonce from './pages/CreateAnnonce';
import MesAnnonces from './pages/MesAnnonces';
import EditAnnoncePage from './pages/EditAnnoncePage';
import ProfilePage from './pages/ProfilePage';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAnnonces from './pages/admin/AdminAnnonces';
import DemandeVendeur from './pages/DemandeVendeur';
import AdminDemandesVendeur from './pages/admin/AdminDemandesVendeur';
import WishlistPage from './pages/WishlistPage';
// import SearchPage from './pages/SearchPage'; // SUPPRIMÉ
import AdminAttributes from './pages/admin/AdminAttributes';
import AdminCategories from './pages/admin/AdminCategories';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider position="top-right">
          <Router>
            <div className="min-h-screen bg-gray-50 font-primary">
              <Navbar />
              <main className="pb-8">
                <Routes>
                  {/* Routes publiques */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/category/:categoryId" element={<CategoryPage />} />
                  <Route path="/annonce/:id" element={<AnnonceDetail />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/profil/:userId" element={<ProfilePage />} />
                  
                  {/* SUPPRIMÉ: Route vers SearchPage */}
                  {/* <Route path="/search" element={<SearchPage />} /> */}
                  
                  {/* NOUVEAU: Redirection de /search vers la page d'accueil */}
                  <Route 
                    path="/search" 
                    element={<Navigate to="/" replace />} 
                  />

                  {/* Routes protégées - Utilisateurs connectés */}
                  <Route
                    path="/nouvelle-annonce"
                    element={
                      <PrivateRoute>
                        <CreateAnnonce />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/mes-annonces"
                    element={
                      <PrivateRoute>
                        <MesAnnonces />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/modifier-annonce/:id"
                    element={
                      <PrivateRoute>
                        <EditAnnoncePage />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/demande-vendeur"
                    element={
                      <PrivateRoute>
                        <DemandeVendeur />
                      </PrivateRoute>
                    }
                  />
                  <Route
                    path="/wishlist"
                    element={
                      <PrivateRoute>
                        <WishlistPage />
                      </PrivateRoute>
                    }
                  />

                  {/* Routes Admin */}
                  <Route
                    path="/admin/*"
                    element={
                      <AdminRoute>
                        <Routes>
                          <Route path="/" element={<AdminDashboard />} />
                          <Route path="/users" element={<AdminUsers />} />
                          <Route path="/annonces" element={<AdminAnnonces />} />
                          <Route path="/demandes-vendeur" element={<AdminDemandesVendeur />} />
                          <Route path="/attributes" element={<AdminAttributes />} />
                          <Route path="/categories" element={<AdminCategories />} />
                        </Routes>
                      </AdminRoute>
                    }
                  />
                </Routes>
              </main>
            </div>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

// NOUVEAU: Composant de page 404
const NotFound = () => (
  <div className="max-w-4xl mx-auto px-4 py-16 text-center">
    <div className="bg-white rounded-lg shadow-md p-8">
      <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Page non trouvée</h2>
      <p className="text-gray-600 mb-8 font-secondary">
        La page que vous recherchez n'existe pas ou a été déplacée.
      </p>
      <div className="space-x-4">
        <a
          href="/"
          className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 transition font-secondary"
        >
          Retour à l'accueil
        </a>
        <button
          onClick={() => window.history.back()}
          className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition font-secondary"
        >
          Page précédente
        </button>
      </div>
    </div>
  </div>
);

// NOUVEAU: Composant Footer
const Footer = () => (
  <footer className="bg-gray-800 text-white py-8 mt-16">
    <div className="max-w-7xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Logo et description */}
        <div className="md:col-span-2">
          <h3 className="text-xl font-bold mb-4">Plateforme d'Annonces</h3>
          <p className="text-gray-300 font-secondary">
            La marketplace de référence pour acheter et vendre en toute confiance.
            Des milliers d'annonces dans toutes les catégories.
          </p>
        </div>
        
        {/* Liens rapides */}
        <div>
          <h4 className="font-bold mb-4 font-secondary">Liens rapides</h4>
          <ul className="space-y-2 font-secondary">
            <li><a href="/" className="text-gray-300 hover:text-white transition">Accueil</a></li>
            <li><a href="/search" className="text-gray-300 hover:text-white transition">Rechercher</a></li>
            <li><a href="/nouvelle-annonce" className="text-gray-300 hover:text-white transition">Déposer une annonce</a></li>
            <li><a href="/demande-vendeur" className="text-gray-300 hover:text-white transition">Devenir vendeur</a></li>
          </ul>
        </div>
        
        {/* Contact */}
        <div>
          <h4 className="font-bold mb-4 font-secondary">Contact</h4>
          <ul className="space-y-2 text-gray-300 font-secondary">
            <li>Email: contact@plateforme.com</li>
            <li>Tél: +33 1 23 45 67 89</li>
            <li>Horaires: 9h-18h (Lun-Ven)</li>
          </ul>
        </div>
      </div>
      
      <div className="border-t border-gray-700 mt-8 pt-8 text-center">
        <p className="text-gray-300 font-secondary">
          © {new Date().getFullYear()} Plateforme d'Annonces. Tous droits réservés.
        </p>
      </div>
    </div>
  </footer>
);

export default App;