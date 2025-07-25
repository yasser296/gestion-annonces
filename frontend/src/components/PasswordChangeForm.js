// frontend/src/components/PasswordChangeForm.js - Version simplifiée pour ProfilePage
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const PasswordChangeForm = ({ onSuccess, onCancel, className = '' }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    ancien_mot_de_passe: '',
    nouveau_mot_de_passe: '',
    confirmer_nouveau_mot_de_passe: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    ancien: false,
    nouveau: false,
    confirmer: false
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Réinitialiser l'erreur quand l'utilisateur tape
    if (error) setError('');
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field]
    });
  };

  const validateForm = () => {
    if (!formData.ancien_mot_de_passe) {
      setError('L\'ancien mot de passe est requis');
      return false;
    }
    
    if (!formData.nouveau_mot_de_passe) {
      setError('Le nouveau mot de passe est requis');
      return false;
    }
    
    if (formData.nouveau_mot_de_passe.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return false;
    }
    
    if (formData.nouveau_mot_de_passe !== formData.confirmer_nouveau_mot_de_passe) {
      setError('La confirmation du nouveau mot de passe ne correspond pas');
      return false;
    }
    
    if (formData.ancien_mot_de_passe === formData.nouveau_mot_de_passe) {
      setError('Le nouveau mot de passe doit être différent de l\'ancien');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.patch(
        `http://localhost:5000/api/users/${user.id}/password`,
        {
          ancien_mot_de_passe: formData.ancien_mot_de_passe,
          nouveau_mot_de_passe: formData.nouveau_mot_de_passe
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      // Appeler le callback de succès
      onSuccess && onSuccess(response.data.message);
      
    } catch (error) {
      console.error('Erreur lors de la modification du mot de passe:', error);
      setError(error.response?.data?.message || 'Erreur lors de la modification du mot de passe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Ancien mot de passe */}
        <div>
          <label htmlFor="ancien_mot_de_passe" className="block text-sm font-medium text-gray-700 mb-1">
            Ancien mot de passe
          </label>
          <div className="relative">
            <input
              type={showPasswords.ancien ? "text" : "password"}
              id="ancien_mot_de_passe"
              name="ancien_mot_de_passe"
              value={formData.ancien_mot_de_passe}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
              placeholder="Saisissez votre ancien mot de passe"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('ancien')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <FontAwesomeIcon icon={showPasswords.ancien ? faEyeSlash : faEye} />
            </button>
          </div>
        </div>

        {/* Nouveau mot de passe */}
        <div>
          <label htmlFor="nouveau_mot_de_passe" className="block text-sm font-medium text-gray-700 mb-1">
            Nouveau mot de passe
          </label>
          <div className="relative">
            <input
              type={showPasswords.nouveau ? "text" : "password"}
              id="nouveau_mot_de_passe"
              name="nouveau_mot_de_passe"
              value={formData.nouveau_mot_de_passe}
              onChange={handleChange}
              required
              minLength={6}
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
              placeholder="Minimum 6 caractères"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('nouveau')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <FontAwesomeIcon icon={showPasswords.nouveau ? faEyeSlash : faEye} />
            </button>
          </div>
        </div>

        {/* Confirmer le nouveau mot de passe */}
        <div>
          <label htmlFor="confirmer_nouveau_mot_de_passe" className="block text-sm font-medium text-gray-700 mb-1">
            Confirmer le nouveau mot de passe
          </label>
          <div className="relative">
            <input
              type={showPasswords.confirmer ? "text" : "password"}
              id="confirmer_nouveau_mot_de_passe"
              name="confirmer_nouveau_mot_de_passe"
              value={formData.confirmer_nouveau_mot_de_passe}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
              placeholder="Confirmez votre nouveau mot de passe"
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility('confirmer')}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
            >
              <FontAwesomeIcon icon={showPasswords.confirmer ? faEyeSlash : faEye} />
            </button>
          </div>
          
          {/* Indicateur de correspondance */}
          {formData.confirmer_nouveau_mot_de_passe && (
            <div className="mt-1">
              {formData.nouveau_mot_de_passe === formData.confirmer_nouveau_mot_de_passe ? (
                <p className="text-green-600 text-xs">✓ Les mots de passe correspondent</p>
              ) : (
                <p className="text-red-600 text-xs">✗ Les mots de passe ne correspondent pas</p>
              )}
            </div>
          )}
        </div>

        {/* Boutons d'action */}
        <div className="flex space-x-2 pt-4">
          <button
            type="submit"
            disabled={loading || !formData.ancien_mot_de_passe || !formData.nouveau_mot_de_passe || !formData.confirmer_nouveau_mot_de_passe}
            className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Modification...' : 'Changer le mot de passe'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Annuler
          </button>
        </div>
      </form>

      {/* Conseils de sécurité */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs">
        <p><strong>Conseils :</strong> Utilisez au moins 8 caractères avec majuscules, minuscules, chiffres et symboles.</p>
      </div>
    </div>
  );
};

export default PasswordChangeForm;