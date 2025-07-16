import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import AnnonceDetail from './pages/AnnonceDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateAnnonce from './pages/CreateAnnonce';
import MesAnnonces from './pages/MesAnnonces';
import PrivateRoute from './components/PrivateRoute';
import EditAnnoncePage from './pages/EditAnnoncePage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/annonce/:id" element={<AnnonceDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/modifier-annonce/:id" element={<EditAnnoncePage />} />

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
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;