// frontend/src/components/SearchInput.js
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons';

const SearchInput = ({
  value = '',
  onChange = () => {},
  placeholder = 'Rechercher...',
  className = '',
  disabled = false,
  onClear,
  ...props
}) => {
  const handleInputChange = (e) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    onChange('');
    if (onClear) {
      onClear();
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      {/* Icône de recherche */}
      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
        <FontAwesomeIcon 
          icon={faSearch} 
          className="w-5 h-5 text-gray-400" 
        />
      </div>
      
      {/* Input */}
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`
          w-full pl-12 pr-10 py-3 rounded-xl border border-gray-200 
          focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent 
          transition-all duration-200 bg-white text-gray-900
          ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}
        `}
        {...props}
      />
      
      {/* Bouton clear */}
      {value && !disabled && (
        <button
          onClick={handleClear}
          className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
          type="button"
        >
          <FontAwesomeIcon 
            icon={faTimes} 
            className="w-4 h-4" 
          />
        </button>
      )}
    </div>
  );
};

export default SearchInput;