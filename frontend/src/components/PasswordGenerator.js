// frontend/src/components/PasswordGenerator.js
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faRefresh, faCopy, faCheck } from '@fortawesome/free-solid-svg-icons';

const PasswordGenerator = ({ 
  value = '', 
  onChange = () => {}, 
  placeholder = 'Mot de passe',
  required = false,
  minLength = 8,
  showGenerator = true,
  showToggle = true,
  showCopy = true,
  className = '',
  label = null,
  disabled = false
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [generated, setGenerated] = useState(false);

  // Génération de mot de passe sécurisé
  const generatePassword = (length = 12) => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    // Assurer qu'on a au moins un caractère de chaque type
    let password = '';
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Compléter avec des caractères aléatoires
    const allChars = lowercase + uppercase + numbers + symbols;
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Mélanger le mot de passe
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleGenerate = () => {
    const newPassword = generatePassword();
    onChange(newPassword);
    setGenerated(true);
    setShowPassword(true); // Montrer le mot de passe généré
    
    // Réinitialiser l'indicateur après 3 secondes
    setTimeout(() => setGenerated(false), 3000);
  };

  const handleCopy = async () => {
    if (value) {
      try {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Erreur lors de la copie:', error);
      }
    }
  };

  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: '' };
    
    let score = 0;
    const checks = {
      length: password.length >= 8,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /\d/.test(password),
      symbols: /[^A-Za-z0-9]/.test(password)
    };
    
    score = Object.values(checks).filter(Boolean).length;
    
    if (score <= 2) return { score, label: 'Faible', color: 'text-red-500' };
    if (score <= 3) return { score, label: 'Moyen', color: 'text-yellow-500' };
    if (score <= 4) return { score, label: 'Bon', color: 'text-blue-500' };
    return { score, label: 'Excellent', color: 'text-green-500' };
  };

  const strength = getPasswordStrength(value);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 font-secondary">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <input
          type={showPassword ? "text" : "password"}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setGenerated(false);
          }}
          placeholder={placeholder}
          required={required}
          minLength={minLength}
          disabled={disabled}
          className={`w-full px-3 py-2 pr-24 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300 font-secondary ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
        />
        
        <div className="absolute right-2 top-2 flex space-x-1">
          {/* Bouton copier */}
          {showCopy && value && (
            <button
              type="button"
              onClick={handleCopy}
              className={`text-sm hover:text-blue-700 transition-colors ${
                copied ? 'text-green-500' : 'text-blue-500'
              }`}
              title="Copier le mot de passe"
              disabled={disabled}
            >
              <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
            </button>
          )}
          
          {/* Bouton afficher/masquer */}
          {showToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              title={showPassword ? "Masquer" : "Afficher"}
              disabled={disabled}
            >
              <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
            </button>
          )}
          
          {/* Bouton générer */}
          {showGenerator && (
            <button
              type="button"
              onClick={handleGenerate}
              className={`hover:text-blue-700 transition-colors ${
                generated ? 'text-green-500' : 'text-blue-500'
              }`}
              title="Générer un mot de passe sécurisé"
              disabled={disabled}
            >
              <FontAwesomeIcon icon={faRefresh} />
            </button>
          )}
        </div>
      </div>
      
      {/* Indicateurs */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-4">
          {/* Force du mot de passe */}
          {value && (
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Force:</span>
              <span className={`font-medium ${strength.color}`}>
                {strength.label}
              </span>
              <div className="flex space-x-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < strength.score ? strength.color.replace('text-', 'bg-') : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Indicateur de génération */}
          {generated && (
            <span className="text-green-600 flex items-center space-x-1">
              <FontAwesomeIcon icon={faCheck} />
              <span>Généré</span>
            </span>
          )}
          
          {/* Indicateur de copie */}
          {copied && (
            <span className="text-green-600 flex items-center space-x-1">
              <FontAwesomeIcon icon={faCheck} />
              <span>Copié</span>
            </span>
          )}
        </div>
        
        {/* Longueur */}
        <span className="text-gray-500">
          {value.length} / {minLength} min.
        </span>
      </div>
      
      {/* Conseils de sécurité */}
      {value && strength.score < 4 && (
        <div className="text-xs text-gray-600 space-y-1">
          <p className="font-medium">Conseils pour renforcer :</p>
          <ul className="list-disc list-inside space-y-0.5 text-gray-500">
            {value.length < 8 && <li>Au moins 8 caractères</li>}
            {!/[a-z]/.test(value) && <li>Lettres minuscules</li>}
            {!/[A-Z]/.test(value) && <li>Lettres majuscules</li>}
            {!/\d/.test(value) && <li>Chiffres</li>}
            {!/[^A-Za-z0-9]/.test(value) && <li>Caractères spéciaux</li>}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PasswordGenerator;