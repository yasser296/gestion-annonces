import React, { useState, useEffect } from 'react';

const CitySelect = ({ 
  value = '', 
  onChange, 
  categoryId = null,
  apiUrl = process.env.REACT_APP_API_URL,
  className = '',
  showCount = true
}) => {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCities();
  }, [categoryId]);

  const fetchCities = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryId) {
        params.append('category', categoryId);
      }
      
      const response = await fetch(
        `${apiUrl}/api/annonces/cities/all?${params}`
      );
      
      if (!response.ok) {
        throw new Error('Erreur réseau');
      }
      
      const data = await response.json();
      setCities(data);
    } catch (error) {
      console.error('Erreur lors du chargement des villes:', error);
      setCities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <div className="relative">
      <select
        value={value}
        onChange={handleChange}
        disabled={loading}
        className={`
          w-full rounded-xl border border-gray-200 px-4 py-3 pr-10
          focus:outline-none focus:ring-2 focus:ring-orange-500/50 
          focus:border-transparent transition-all duration-200 bg-white
          disabled:bg-gray-100 disabled:cursor-not-allowed
          appearance-none
          ${className}
        `}
      >
        <option value="">
          {loading ? 'Chargement...' : 'Toutes les villes'}
        </option>
        
        {cities.length > 0 && (
          <>
            {/* Optgroup pour les villes populaires (top 5) */}
            {cities.slice(0, 5).some(city => city.count > 10) && (
              <optgroup label="Villes populaires">
                {cities.slice(0, 5).map((city) => (
                  city.count > 10 && (
                    <option key={`popular-${city.ville}`} value={city.ville}>
                      ⭐ {city.ville} {showCount && `(${city.count} annonce${city.count > 1 ? 's' : ''})`}
                    </option>
                  )
                ))}
              </optgroup>
            )}
            
            {/* Toutes les villes */}
            <optgroup label="Toutes les villes">
              {cities.map((city) => (
                <option key={city.ville} value={city.ville}>
                  {city.ville} {showCount && `(${city.count} annonce${city.count > 1 ? 's' : ''})`}
                </option>
              ))}
            </optgroup>
          </>
        )}
      </select>
      
      {/* Icône de flèche custom */}
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <svg 
          className={`w-5 h-5 text-gray-400 transition-opacity ${loading ? 'opacity-50' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {/* Indicateur de chargement */}
      {loading && (
        <div className="absolute inset-y-0 right-10 flex items-center">
          <svg className="animate-spin h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      )}
    </div>
  );
};

export default CitySelect;