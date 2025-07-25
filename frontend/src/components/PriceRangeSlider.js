// PriceRangeSlider.js - VERSION ULTRA-ROBUSTE avec rc-slider

import React, { useState, useEffect, useRef } from 'react';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

const PriceRangeSlider = ({
  min = 0,
  max = 10000,
  value = [0, 10000],
  onChange = () => {},
  onChangeComplete = null,
  step = 100,
  currency = 'MAD',
  className = '',
  disabled = false,
  priceRanges = null
}) => {
  // PROTECTION 1: Validation et sécurisation des props
  const validatedMin = typeof min === 'number' && !isNaN(min) ? min : 0;
  const validatedMax = typeof max === 'number' && !isNaN(max) && max > validatedMin ? max : validatedMin + 1000;
  const validatedStep = typeof step === 'number' && step > 0 ? step : 100;
  
  // PROTECTION 2: État initial sécurisé
  const [values, setValues] = useState(() => {
    if (!Array.isArray(value) || value.length !== 2) {
      return [validatedMin, validatedMax];
    }
    
    const [val1, val2] = value;
    const safeVal1 = typeof val1 === 'number' && !isNaN(val1) ? val1 : validatedMin;
    const safeVal2 = typeof val2 === 'number' && !isNaN(val2) ? val2 : validatedMax;
    
    // S'assurer que min <= max et dans les limites
    const clampedMin = Math.max(validatedMin, Math.min(validatedMax, safeVal1));
    const clampedMax = Math.max(clampedMin + validatedStep, Math.min(validatedMax, safeVal2));
    
    return [clampedMin, clampedMax];
  });

  // PROTECTION 3: Références pour éviter les boucles infinies
  const isInitializing = useRef(true);
  const lastValidValues = useRef(values);
  const propsChangeTimeout = useRef(null);

  // PROTECTION 4: Synchronisation sécurisée avec les props
  useEffect(() => {
    // Annuler les timeouts précédents
    if (propsChangeTimeout.current) {
      clearTimeout(propsChangeTimeout.current);
    }

    // Délai pour éviter les changements rapides pendant l'initialisation
    propsChangeTimeout.current = setTimeout(() => {
      if (Array.isArray(value) && value.length === 2) {
        const [newVal1, newVal2] = value;
        
        // Valider les nouvelles valeurs
        if (typeof newVal1 === 'number' && typeof newVal2 === 'number' && 
            !isNaN(newVal1) && !isNaN(newVal2)) {
          
          const clampedMin = Math.max(validatedMin, Math.min(validatedMax, newVal1));
          const clampedMax = Math.max(clampedMin + validatedStep, Math.min(validatedMax, newVal2));
          
          // Ne mettre à jour que si les valeurs ont vraiment changé
          if (clampedMin !== values[0] || clampedMax !== values[1]) {
            setValues([clampedMin, clampedMax]);
            lastValidValues.current = [clampedMin, clampedMax];
          }
        }
      }
      
      isInitializing.current = false;
    }, isInitializing.current ? 100 : 0); // Délai plus long à l'initialisation

    return () => {
      if (propsChangeTimeout.current) {
        clearTimeout(propsChangeTimeout.current);
      }
    };
  }, [value, validatedMin, validatedMax, validatedStep, values]);

  // PROTECTION 5: Validation avant formatage
  const formatPrice = (price) => {
    if (typeof price !== 'number' || isNaN(price)) {
      return '0';
    }
    
    try {
      return new Intl.NumberFormat('fr-MA', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(Math.round(price));
    } catch (error) {
      return price.toString();
    }
  };

  // PROTECTION 6: Validation des changements du slider
  const handleChange = (newValues) => {
    if (!Array.isArray(newValues) || newValues.length !== 2) {
      return; // Ignorer les valeurs invalides
    }

    const [newMin, newMax] = newValues;
    
    // Valider les types
    if (typeof newMin !== 'number' || typeof newMax !== 'number' || 
        isNaN(newMin) || isNaN(newMax)) {
      return;
    }

    // S'assurer que les valeurs sont dans les limites
    const clampedMin = Math.max(validatedMin, Math.min(validatedMax, newMin));
    const clampedMax = Math.max(clampedMin + validatedStep, Math.min(validatedMax, newMax));
    
    const validatedValues = [clampedMin, clampedMax];
    
    // Ne pas déclencher de changement si les valeurs sont identiques
    if (validatedValues[0] === values[0] && validatedValues[1] === values[1]) {
      return;
    }

    setValues(validatedValues);
    lastValidValues.current = validatedValues;
    
    // Appeler onChange de manière sécurisée
    try {
      onChange(validatedValues);
    } catch (error) {
      console.warn('Erreur dans onChange:', error);
    }
  };

  // PROTECTION 7: Validation des inputs manuels
  const handleInputChange = (index, inputValue) => {
    if (disabled) return;
    
    const numValue = parseFloat(inputValue);
    
    // Valider la valeur d'entrée
    if (isNaN(numValue)) {
      return; // Ignorer les valeurs non numériques
    }
    
    const newValues = [...values];
    
    if (index === 0) {
      // Input min
      const newMin = Math.max(validatedMin, Math.min(numValue, values[1] - validatedStep));
      newValues[0] = newMin;
    } else {
      // Input max
      const newMax = Math.max(values[0] + validatedStep, Math.min(validatedMax, numValue));
      newValues[1] = newMax;
    }
    
    setValues(newValues);
    
    try {
      onChange(newValues);
    } catch (error) {
      console.warn('Erreur dans onChange:', error);
    }
  };

  // PROTECTION 8: Gestion sécurisée des presets
  const handlePresetClick = (range) => {
    if (!range || typeof range.min !== 'number' || typeof range.max !== 'number') {
      return;
    }

    const clampedMin = Math.max(validatedMin, Math.min(validatedMax, range.min));
    const clampedMax = Math.max(clampedMin + validatedStep, Math.min(validatedMax, range.max));
    
    const newValues = [clampedMin, clampedMax];
    setValues(newValues);
    
    try {
      onChange(newValues);
      if (onChangeComplete) {
        onChangeComplete(newValues);
      }
    } catch (error) {
      console.warn('Erreur dans les callbacks:', error);
    }
  };

  // PROTECTION 9: Fallback en cas de valeurs corrompues
  if (!Array.isArray(values) || values.length !== 2 || 
      typeof values[0] !== 'number' || typeof values[1] !== 'number' ||
      isNaN(values[0]) || isNaN(values[1])) {
    
    console.warn('Valeurs du slider corrompues, utilisation des valeurs de secours');
    const fallbackValues = [validatedMin, validatedMax];
    
    // Réinitialiser avec des valeurs sûres
    setTimeout(() => {
      setValues(fallbackValues);
      lastValidValues.current = fallbackValues;
    }, 0);
    
    return (
      <div className={`w-full ${className}`}>
        <div className="text-center py-4">
          <div className="text-sm text-gray-500">Initialisation du slider...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Affichage des valeurs */}
      <div className="mb-4">
        <div className="text-center mb-3">
          <div className="text-lg font-semibold text-gray-700">
            <span className="text-orange-600">
              {formatPrice(values[0])} - {formatPrice(values[1])}
            </span>
            <span className="ml-1 text-gray-500">{currency}</span>
          </div>
        </div>

        {/* Inputs min/max */}
        <div className="flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Min:</label>
            <input
              type="number"
              value={values[0]}
              onChange={(e) => handleInputChange(0, e.target.value)}
              disabled={disabled}
              min={validatedMin}
              max={validatedMax}
              step={validatedStep}
              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Max:</label>
            <input
              type="number"
              value={values[1]}
              onChange={(e) => handleInputChange(1, e.target.value)}
              disabled={disabled}
              min={validatedMin}
              max={validatedMax}
              step={validatedStep}
              className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* RC-SLIDER avec protection */}
      <div className="px-3 py-4">
        <Slider
          range
          min={validatedMin}
          max={validatedMax}
          step={validatedStep}
          value={values}
          onChange={handleChange}
          onChangeComplete={onChangeComplete}
          disabled={disabled}
          // Styles inchangés
          trackStyle={[
            {
              backgroundColor: '#f97316',
              height: 8,
              borderRadius: 4
            }
          ]}
          handleStyle={[
            {
              borderColor: '#f97316',
              height: 20,
              width: 20,
              marginTop: -6,
              backgroundColor: 'white',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              border: '3px solid #f97316'
            },
            {
              borderColor: '#f97316',
              height: 20,
              width: 20,
              marginTop: -6,
              backgroundColor: 'white',
              boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              border: '3px solid #f97316'
            }
          ]}
          railStyle={{
            backgroundColor: '#e5e7eb',
            height: 8,
            borderRadius: 4
          }}
          activeDotStyle={{
            borderColor: '#f97316'
          }}
        />
      </div>

      {/* Tranches populaires */}
      {priceRanges && Array.isArray(priceRanges) && priceRanges.length > 0 && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 mb-2 text-center">Tranches populaires :</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {priceRanges.map((range, index) => {
              // Validation de chaque range
              if (!range || typeof range.min !== 'number' || typeof range.max !== 'number') {
                return null;
              }
              
              return (
                <button
                  key={index}
                  onClick={() => handlePresetClick(range)}
                  disabled={disabled}
                  className={`text-xs px-3 py-1 rounded-full transition-colors ${
                    disabled 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'bg-gray-100 hover:bg-orange-100 hover:text-orange-700'
                  } ${
                    values[0] === range.min && values[1] === range.max
                      ? 'bg-orange-500 text-white'
                      : ''
                  }`}
                >
                  {range.label || `${formatPrice(range.min)} - ${formatPrice(range.max)}`}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceRangeSlider;