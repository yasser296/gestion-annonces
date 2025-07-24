import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AttributesForm = ({ 
  categoryId, 
  annonceId = null, 
  onAttributesChange = () => {},
  disabled = false 
}) => {
  const [attributes, setAttributes] = useState([]);
  const [attributeValues, setAttributeValues] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (categoryId) {
      fetchAttributes();
    } else {
      setAttributes([]);
      setAttributeValues({});
    }
  }, [categoryId]);

  useEffect(() => {
    if (annonceId) {
      fetchAttributeValues();
    }
  }, [annonceId]);

  const fetchAttributes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/attributes/by-category/${categoryId}`);
      setAttributes(response.data);
      
      // Réinitialiser les valeurs quand on change de catégorie
      const newValues = {};
      response.data.forEach(attr => {
        newValues[attr._id] = '';
      });
      setAttributeValues(newValues);
      onAttributesChange(newValues);
    } catch (error) {
      console.error('Erreur lors du chargement des attributs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttributeValues = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/attributes/values/${annonceId}`);
      const values = {};
      Object.keys(response.data).forEach(attributeId => {
        values[attributeId] = response.data[attributeId].value;
      });
      setAttributeValues(values);
      onAttributesChange(values);
    } catch (error) {
      console.error('Erreur lors du chargement des valeurs:', error);
    }
  };

  const handleValueChange = (attributeId, value) => {
    const newValues = {
      ...attributeValues,
      [attributeId]: value
    };
    setAttributeValues(newValues);
    onAttributesChange(newValues);
  };

  const renderAttributeField = (attribute) => {
    const value = attributeValues[attribute._id] || '';
    
    const baseInputClasses = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300";
    const disabledClasses = disabled ? "bg-gray-100 cursor-not-allowed" : "";
    
    switch (attribute.type) {
      case 'string':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleValueChange(attribute._id, e.target.value)}
            placeholder={attribute.placeholder}
            disabled={disabled}
            className={`${baseInputClasses} ${disabledClasses}`}
          />
        );
        
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleValueChange(attribute._id, e.target.value)}
            placeholder={attribute.placeholder}
            disabled={disabled}
            className={`${baseInputClasses} ${disabledClasses}`}
          />
        );
        
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={value === true || value === 'true'}
              onChange={(e) => handleValueChange(attribute._id, e.target.checked)}
              disabled={disabled}
              className="rounded focus:ring-2 focus:ring-orange-300"
            />
            <span className="text-sm text-gray-600">
              {attribute.placeholder || 'Oui'}
            </span>
          </div>
        );
        
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleValueChange(attribute._id, e.target.value)}
            disabled={disabled}
            className={`${baseInputClasses} ${disabledClasses}`}
          >
            <option value="">
              {attribute.placeholder || 'Sélectionner une option'}
            </option>
            {attribute.options && attribute.options.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
        
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleValueChange(attribute._id, e.target.value)}
            placeholder={attribute.placeholder}
            disabled={disabled}
            className={`${baseInputClasses} ${disabledClasses}`}
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!categoryId || attributes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Spécifications additionnelles
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attributes.map((attribute) => (
            <div key={attribute._id} className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                {attribute.nom}
                {attribute.required && (
                  <span className="text-red-500 ml-1">*</span>
                )}
              </label>
              
              {renderAttributeField(attribute)}
              
              {attribute.description && (
                <p className="text-xs text-gray-500">
                  {attribute.description}
                </p>
              )}
              
              {/* Validation des champs requis côté client */}
              {attribute.required && !attributeValues[attribute._id] && (
                <p className="text-xs text-red-500">
                  Ce champ est requis
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AttributesForm;