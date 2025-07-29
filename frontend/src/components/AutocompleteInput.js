import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';

const AutocompleteInput = ({
  value = '',
  onChange = () => {},
  onSelect = () => {},
  placeholder = 'Rechercher...',
  type = 'all',
  category = null,
  className = '',
  icon = null,
  showTrending = false,
  disabled = false,
  debounceMs = 300,
  maxSuggestions = 8,
  ...props
}) => {
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [trendingData, setTrendingData] = useState([]);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const debounceRef = useRef(null);

  // Calculer la position du dropdown
  const updateDropdownPosition = useCallback(() => {
    if (inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, []);

  // Mettre à jour la position quand le menu s'ouvre
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      const handleReposition = () => updateDropdownPosition();
      window.addEventListener('scroll', handleReposition);
      window.addEventListener('resize', handleReposition);
      
      return () => {
        window.removeEventListener('scroll', handleReposition);
        window.removeEventListener('resize', handleReposition);
      };
    }
  }, [isOpen, updateDropdownPosition]);

  // Fonction pour récupérer les villes populaires
  const fetchPopularCities = async () => {
    try {
      const params = new URLSearchParams({ limit: 5 });
      if (category) {
        params.append('category', category);
      }
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/autocomplete/cities/popular?${params}`
      );
      
      setTrendingData(response.data.map(item => ({
        text: item.ville,
        type: 'city',
        icon: '📍',
        count: item.count,
        isTrending: true
      })));
    } catch (error) {
      console.error('Erreur popular cities:', error);
      setTrendingData([]);
    }
  };

  // Fonction pour récupérer les recherches tendance
  const fetchTrendingSearches = async () => {
    try {
      const params = new URLSearchParams({ limit: 5 });
      if (category) {
        params.append('category', category);
      }
      
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/autocomplete/searches/trending?${params}`
      );

      // Filtrer les résultats vides
      const validTrending = response.data.filter(item => 
        item.term && item.term.trim().length > 0
      );
      
      setTrendingData(validTrending.map(item => ({
        text: item.term.trim(),
        type: 'search',
        icon: '🔥',
        count: item.count
      })));
    } catch (error) {
      console.error('Erreur trending searches:', error);
      setTrendingData([]);
    }
  };

  // Récupérer les données trending au premier chargement et lors du changement de catégorie
  useEffect(() => {
    if (showTrending && type === 'cities') {
      fetchPopularCities();
    } else if (showTrending && type === 'titles') {
      fetchTrendingSearches();
    }
  }, [showTrending, type, category]);

  // Fonction pour récupérer les suggestions
  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        query: query.trim(),
        type: type,
        limit: maxSuggestions
      });

      if (category) {
        params.append('category', category);
      }

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/autocomplete/suggestions?${params}`
      );
      
      // Filtrer les suggestions valides
      const validSuggestions = response.data.filter(suggestion => 
        suggestion.text && suggestion.text.trim().length > 0
      );
      
      setSuggestions(validSuggestions);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('API error:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [type, category, maxSuggestions]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value && value.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(value);
      }, debounceMs);
    } else {
      setSuggestions([]);
      setLoading(false);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, debounceMs, fetchSuggestions]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    // Afficher les suggestions trending si aucune valeur
    if (!value && showTrending && trendingData.length > 0) {
      setSuggestions(trendingData);
    }
  };

  const handleInputBlur = () => {
    // Délai pour permettre la sélection
    setTimeout(() => {
      setIsOpen(false);
      setSelectedIndex(-1);
    }, 150);
  };

  const handleSuggestionClick = (suggestion) => {
    // Valider la suggestion avant de l'utiliser
    if (!suggestion.text || suggestion.text.trim().length === 0) {
      return;
    }
    
    onChange(suggestion.text.trim());
    onSelect({
      ...suggestion,
      text: suggestion.text.trim()
    });
    setIsOpen(false);
    setSuggestions([]);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && !isOpen) {
        setIsOpen(true);
        if (!value && showTrending && trendingData.length > 0) {
          setSuggestions(trendingData);
        }
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Scroll vers l'élément sélectionné
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedIndex]);

  const getTypeLabel = (type) => {
    const labels = {
      title: 'Titre',
      city: 'Ville',
      brand: 'Marque',
      user: 'Vendeur',
      category: 'Catégorie',
      subcategory: 'Sous-catégorie',
      search: 'Tendance'
    };
    return labels[type] || type;
  };

  const getSuggestionGroups = () => {
    const groups = {};
    suggestions.forEach(suggestion => {
      const groupKey = suggestion.isTrending ? 'trending' : suggestion.type;
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(suggestion);
    });
    return groups;
  };

  const shouldShowSuggestions = isOpen && (suggestions.length > 0 || loading || (value && value.trim().length >= 2));

  // Composant Dropdown rendu dans un portal
  const DropdownPortal = () => {
    if (!shouldShowSuggestions) return null;

    return createPortal(
      <div 
        style={{
          position: 'absolute',
          top: dropdownPosition.top,
          left: dropdownPosition.left,
          width: dropdownPosition.width,
          zIndex: 9999
        }}
      >
        <div className="bg-white rounded-xl border border-gray-200 shadow-2xl backdrop-blur-sm overflow-hidden max-h-80 overflow-y-auto">
          {loading && suggestions.length === 0 ? (
            <div className="p-4 text-center">
              <div className="inline-flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-orange-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-gray-500">Recherche...</span>
              </div>
            </div>
          ) : (
            <div ref={listRef}>
              {/* Afficher les suggestions groupées */}
              {Object.entries(getSuggestionGroups()).map(([groupType, groupSuggestions]) => (
                <div key={groupType}>
                  {groupType === 'trending' && (
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-100">
                      <div className="flex items-center gap-2 text-xs font-medium text-gray-600">
                        <span>🔥</span>
                        <span>Populaires dans cette catégorie</span>
                      </div>
                    </div>
                  )}
                  
                  {groupSuggestions.map((suggestion, index) => {
                    const globalIndex = suggestions.indexOf(suggestion);
                    const isSelected = globalIndex === selectedIndex;
                    
                    return (
                      <button
                        key={`${suggestion.type}-${suggestion.text}-${index}`}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={`
                          w-full px-4 py-3 flex items-center justify-between
                          transition-colors duration-150 group
                          ${isSelected ? 'bg-orange-50 text-orange-700' : 'hover:bg-gray-50 text-gray-700'}
                        `}
                        onMouseEnter={() => setSelectedIndex(globalIndex)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-lg flex-shrink-0">
                            {suggestion.icon}
                          </span>
                          
                          <div className="flex-1 text-left min-w-0">
                            <div className="font-medium truncate">
                              {suggestion.text}
                            </div>
                            {suggestion.count && (
                              <div className="text-xs text-gray-500">
                                {suggestion.count} annonce{suggestion.count > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                            {getTypeLabel(suggestion.type)}
                          </span>
                          <svg 
                            className={`w-4 h-4 transition-transform duration-150 ${
                              isSelected ? 'text-orange-500 scale-110' : 'text-gray-300 group-hover:text-gray-400'
                            }`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}

              {!loading && suggestions.length === 0 && value && value.trim().length >= 2 && (
                <div className="p-6 text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <div className="text-base font-medium text-gray-700 mb-1">
                    Aucun résultat trouvé
                  </div>
                  <div className="text-sm text-gray-400 mb-4">
                    pour "{value}"
                  </div>
                  <div className="text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-lg inline-block">
                    Essayez avec d'autres mots-clés ou vérifiez l'orthographe
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>,
      document.body
    );
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            {typeof icon === 'string' ? (
              <span className="text-gray-400 text-lg">{icon}</span>
            ) : (
              <div className="w-5 h-5 text-gray-400">{icon}</div>
            )}
          </div>
        )}
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full rounded-xl border border-gray-200 
            focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-transparent 
            transition-all duration-200 bg-white
            ${icon ? 'pl-12 pr-4' : 'px-4'} py-3
            ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'text-gray-900'}
            ${className}
          `}
          {...props}
        />
      </div>

      <DropdownPortal />
    </div>
  );
};

export default AutocompleteInput;