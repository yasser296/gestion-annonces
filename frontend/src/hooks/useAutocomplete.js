// hooks/useAutocomplete.js - Hook personnalisé pour l'autocomplétion
import { useState, useCallback } from 'react';

const useAutocomplete = (initialValue = '', onSearchCallback = null) => {
  const [searchValue, setSearchValue] = useState(initialValue);
  const [isSearching, setIsSearching] = useState(false);

  const handleInputChange = useCallback((value) => {
    setSearchValue(value);
  }, []);

  const handleSuggestionSelect = useCallback((suggestion) => {
    setSearchValue(suggestion.text);
    
    // Si c'est une suggestion avec navigation, déclencher l'action appropriée
    if (onSearchCallback) {
      setIsSearching(true);
      
      // Créer un objet de données enrichi pour le callback
      const searchData = {
        query: suggestion.text,
        type: suggestion.type,
        suggestionData: suggestion
      };

      // Exécuter le callback
      const result = onSearchCallback(searchData);
      
      // Si le callback retourne une promesse, attendre sa résolution
      if (result && typeof result.then === 'function') {
        result.finally(() => setIsSearching(false));
      } else {
        setIsSearching(false);
      }
    }
  }, [onSearchCallback]);

  const handleManualSearch = useCallback((customValue = null) => {
    const valueToSearch = customValue || searchValue;
    
    if (onSearchCallback && valueToSearch) {
      setIsSearching(true);
      
      const searchData = {
        query: valueToSearch,
        type: 'manual',
        suggestionData: null
      };

      const result = onSearchCallback(searchData);
      
      if (result && typeof result.then === 'function') {
        result.finally(() => setIsSearching(false));
      } else {
        setIsSearching(false);
      }
    }
  }, [searchValue, onSearchCallback]);

  const resetSearch = useCallback(() => {
    setSearchValue('');
    setIsSearching(false);
  }, []);

  return {
    // States
    searchValue,
    isSearching,
    
    // Handlers
    handleInputChange,
    handleSuggestionSelect,
    handleManualSearch,
    resetSearch,
    
    // Setters pour contrôle externe
    setSearchValue,
    setIsSearching
  };
};

export default useAutocomplete;