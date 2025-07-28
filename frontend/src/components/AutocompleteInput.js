// AutocompleteInput.js - Solution avec Portal pour éviter overflow-hidden
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
        top: rect.bottom + window.scrollY + 8, // 8px de marge
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, []);

  // Mettre à jour la position quand le menu s'ouvre
  useEffect(() => {
    if (isOpen) {
      updateDropdownPosition();
      // Recalculer lors du scroll/resize
      const handleReposition = () => updateDropdownPosition();
      window.addEventListener('scroll', handleReposition);
      window.addEventListener('resize', handleReposition);
      
      return () => {
        window.removeEventListener('scroll', handleReposition);
        window.removeEventListener('resize', handleReposition);
      };
    }
  }, [isOpen, updateDropdownPosition]);

  // Récupérer les données trending au premier chargement
  useEffect(() => {
    if (showTrending && type === 'cities') {
      fetchPopularCities();
    } else if (showTrending && type === 'titles') {
      fetchTrendingSearches();
    }
  }, [showTrending, type]);

  const fetchPopularCities = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/autocomplete/cities/popular?limit=5`
      );
      setTrendingData(response.data.map(item => ({
        text: item.ville,
        type: 'city',
        icon: '📍',
        count: item.count
      })));
    } catch (error) {
      console.error('Erreur popular cities:', error);
    }
  };

  const fetchTrendingSearches = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/autocomplete/searches/trending?limit=5`
      );
      setTrendingData(response.data.map(item => ({
        text: item.term,
        type: 'search',
        icon: '🔥',
        count: item.count
      })));
    } catch (error) {
      console.error('Erreur trending searches:', error);
    }
  };

  const fetchSuggestions = useCallback(async (query) => {
    console.log('🌐 fetchSuggestions called with:', query);
    
    if (!query || query.length < 2) {
      console.log('🚫 Query too short, clearing suggestions');
      setSuggestions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('📡 Making API call...');
      
      const params = new URLSearchParams({
        query: query,
        type: type,
        limit: maxSuggestions
      });

      if (category) {
        params.append('category', category);
      }

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/autocomplete/suggestions?${params}`
      );
      
      console.log('✅ API response:', response.data.length, 'suggestions');
      setSuggestions(response.data);
      setSelectedIndex(-1);
    } catch (error) {
      console.error('❌ API error:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [type, category, maxSuggestions]);

  // Debounced search
  useEffect(() => {
    console.log('⚡ useEffect fetchSuggestions - value:', value, 'length:', value?.length);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (value && value.length >= 2) {
      console.log('⏱️ Setting timeout for fetchSuggestions');
      debounceRef.current = setTimeout(() => {
        console.log('🚀 Calling fetchSuggestions with:', value);
        fetchSuggestions(value);
      }, debounceMs);
    } else {
      console.log('❌ Clearing suggestions - value too short');
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
    console.log('🔍 handleInputChange:', newValue);
    onChange(newValue);
    setIsOpen(true);
  };

  const handleInputFocus = () => {
    console.log('🎯 handleInputFocus - value:', value, 'trendingData:', trendingData.length);
    setIsOpen(true);
    if (!value && showTrending && trendingData.length > 0) {
      console.log('📈 Setting trending suggestions');
      setSuggestions(trendingData);
    }
  };

  const handleInputBlur = (e) => {
    // Délai pour permettre la sélection
    setTimeout(() => {
      setIsOpen(false);
      setSelectedIndex(-1);
    }, 150);
  };

  const handleSuggestionClick = (suggestion) => {
    onChange(suggestion.text);
    onSelect(suggestion);
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
      const groupKey = suggestion.type;
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(suggestion);
    });
    return groups;
  };

  const shouldShowSuggestions = isOpen && (suggestions.length > 0 || loading);

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
              <div className="flex items-center justify-center space-x-2 text-gray-500">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                <span className="text-sm">Recherche...</span>
              </div>
            </div>
          ) : (
            <div ref={listRef}>
              {Object.entries(getSuggestionGroups()).map(([groupType, groupSuggestions], groupIndex) => (
                <div key={groupType}>
                  {groupIndex > 0 && <div className="border-t border-gray-100" />}
                  
                  {groupSuggestions.map((suggestion, index) => {
                    const globalIndex = suggestions.findIndex(s => s === suggestion);
                    const isSelected = selectedIndex === globalIndex;
                    
                    return (
                      <button
                        key={`${suggestion.type}-${suggestion.text}-${index}`}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={`
                          w-full px-4 py-3 text-left transition-colors duration-150
                          flex items-center justify-between group
                          ${isSelected 
                            ? 'bg-gradient-to-r from-orange-50 to-pink-50 text-orange-700' 
                            : 'hover:bg-gray-50'
                          }
                        `}
                      >
                        <div className="flex items-center space-x-3 flex-1">
                          <span className="text-lg flex-shrink-0">
                            {suggestion.icon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {suggestion.text}
                            </div>
                            {suggestion.count && (
                              <div className="text-xs text-gray-500">
                                {suggestion.count} résultat{suggestion.count > 1 ? 's' : ''}
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

              {!loading && suggestions.length === 0 && value && value.length >= 2 && (
                <div className="p-4 text-center text-gray-500">
                  <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <div className="text-sm">Aucune suggestion trouvée</div>
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
      {/* Input avec icône */}
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
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}
            ${className}
          `}
          {...props}
        />

        {/* Indicateur de chargement */}
        {loading && (
          <div className="absolute inset-y-0 right-4 flex items-center">
            <svg className="w-5 h-5 text-orange-500 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
          </div>
        )}
      </div>

      {/* Dropdown rendu dans un portal */}
      <DropdownPortal />
    </div>
  );
};

export default AutocompleteInput;