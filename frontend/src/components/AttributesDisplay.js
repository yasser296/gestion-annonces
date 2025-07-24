import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AttributesDisplay = ({ 
  annonceId,
  categoryId,
  className = "",
  showTitle = true,
  variant = "default" // "default", "compact", "table"
}) => {
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (annonceId && categoryId) {
      fetchAttributesWithValues();
    }
  }, [annonceId, categoryId]);

  const fetchAttributesWithValues = async () => {
    try {
      setLoading(true);

      // Récupérer les attributs de la catégorie et les valeurs de l'annonce
      const [attributesResponse, valuesResponse] = await Promise.all([
        axios.get(`http://localhost:5000/api/attributes/by-category/${categoryId}`),
        axios.get(`http://localhost:5000/api/attributes/values/${annonceId}`)
      ]);

      const categoryAttributes = attributesResponse.data;
      const attributeValues = valuesResponse.data;

      // Combiner les attributs avec leurs valeurs
      const attributesWithValues = categoryAttributes
        .map(attr => {
          const valueData = attributeValues[attr._id];
          return {
            ...attr,
            value: valueData?.value,
            hasValue: valueData !== undefined && valueData.value !== null && valueData.value !== ''
          };
        })
        .filter(attr => attr.hasValue); // Ne montrer que les attributs avec des valeurs

      setAttributes(attributesWithValues);
    } catch (error) {
      console.error('Erreur lors du chargement des attributs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (attribute, value) => {
    if (value === undefined || value === null || value === '') {
      return '-';
    }

    switch (attribute.type) {
      case 'boolean':
        return (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {value ? '✓ Oui' : '✗ Non'}
          </span>
        );
      case 'number':
        return (
          <span className="font-medium">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
        );
      case 'select':
        return (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {value}
          </span>
        );
      default:
        return <span className="font-medium">{value}</span>;
    }
  };

  const getAttributeIcon = (type) => {
    const icons = {
      string: '📝',
      number: '🔢',
      boolean: '☑️',
      select: '📋'
    };
    return icons[type] || '📝';
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (attributes.length === 0) {
    return null;
  }

  // Rendu selon la variante
  if (variant === "compact") {
    return (
      <div className={`space-y-2 ${className}`}>
        {showTitle && (
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Spécifications</h4>
        )}
        <div className="flex flex-wrap gap-2">
          {attributes.map((attribute) => (
            <div key={attribute._id} className="inline-flex items-center space-x-1 text-xs">
              <span>{getAttributeIcon(attribute.type)}</span>
              <span className="text-gray-600">{attribute.nom}:</span>
              {formatValue(attribute, attribute.value)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className={className}>
        {showTitle && (
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Spécifications</h3>
        )}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="bg-white divide-y divide-gray-200">
              {attributes.map((attribute, index) => (
                <tr key={attribute._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-3 text-sm font-medium text-gray-900 flex items-center space-x-2">
                    <span>{getAttributeIcon(attribute.type)}</span>
                    <span>{attribute.nom}</span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-700">
                    {formatValue(attribute, attribute.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Rendu par défaut
  return (
    <div className={className}>
      {showTitle && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Spécifications</h3>
      )}
      
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {attributes.map((attribute) => (
            <div key={attribute._id} className="flex justify-between items-center py-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{getAttributeIcon(attribute.type)}</span>
                <span className="text-sm text-gray-600">{attribute.nom}</span>
              </div>
              <div className="text-right">
                {formatValue(attribute, attribute.value)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Description si disponible */}
      {attributes.some(attr => attr.description) && (
        <div className="mt-4 text-xs text-gray-500">
          {attributes
            .filter(attr => attr.description)
            .map(attr => (
              <div key={`desc-${attr._id}`} className="mb-1">
                <strong>{attr.nom}:</strong> {attr.description}
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
};

export default AttributesDisplay;