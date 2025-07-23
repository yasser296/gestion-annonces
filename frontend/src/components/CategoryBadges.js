import React from 'react';
import { useNavigate } from 'react-router-dom';

const CategoryBadges = ({ 
  categorie, 
  sousCategorie, 
  variant = 'default', 
  clickable = false,
  size = 'sm' 
}) => {
  const navigate = useNavigate();

  const handleCategoryClick = (e) => {
    if (!clickable || !categorie) return;
    e.stopPropagation();
    navigate(`/category/${categorie._id}`);
  };

  const handleSubCategoryClick = (e) => {
    if (!clickable || !sousCategorie || !categorie) return;
    e.stopPropagation();
    navigate(`/category/${categorie._id}?sous_categorie=${sousCategorie._id}`);
  };

  // Classes de base selon la variante
  const getVariantClasses = (type) => {
    const baseClasses = {
      sm: 'text-xs px-2 py-1',
      md: 'text-sm px-3 py-1',
      lg: 'text-base px-4 py-2'
    };

    const variants = {
      default: {
        category: 'bg-blue-100 text-blue-800',
        subcategory: 'bg-orange-100 text-orange-800'
      },
      light: {
        category: 'bg-white/90 backdrop-blur-sm text-gray-800',
        subcategory: 'bg-orange-100/90 backdrop-blur-sm text-orange-800'
      },
      solid: {
        category: 'bg-blue-500 text-white',
        subcategory: 'bg-orange-500 text-white'
      },
      outline: {
        category: 'border border-blue-300 text-blue-700 bg-transparent',
        subcategory: 'border border-orange-300 text-orange-700 bg-transparent'
      }
    };

    const sizeClass = baseClasses[size];
    const variantClass = variants[variant]?.[type] || variants.default[type];
    const hoverClass = clickable ? 'hover:opacity-80 cursor-pointer transition-opacity' : '';

    return `${sizeClass} ${variantClass} ${hoverClass} rounded-full font-medium flex items-center space-x-1`;
  };

  if (!categorie && !sousCategorie) {
    return (
      <span className={`${getVariantClasses('category')} opacity-60`}>
        Sans catégorie
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {categorie && (
        <span
          onClick={handleCategoryClick}
          className={getVariantClasses('category')}
          title={clickable ? `Voir toutes les annonces dans ${categorie.nom}` : undefined}
        >
          <span>{categorie.icone || '📁'}</span>
          <span>{categorie.nom}</span>
        </span>
      )}
      
      {sousCategorie && (
        <span
          onClick={handleSubCategoryClick}
          className={getVariantClasses('subcategory')}
          title={clickable ? `Voir les annonces dans ${sousCategorie.nom}` : undefined}
        >
          <span>{sousCategorie.icone || '📂'}</span>
          <span>{sousCategorie.nom}</span>
        </span>
      )}
    </div>
  );
};

// Composant pour l'affichage en ligne (texte simple)
export const CategoryText = ({ categorie, sousCategorie, separator = ' > ' }) => {
  const parts = [];
  
  if (categorie) {
    parts.push(`${categorie.icone || '📁'} ${categorie.nom}`);
  }
  
  if (sousCategorie) {
    parts.push(`${sousCategorie.icone || '📂'} ${sousCategorie.nom}`);
  }

  if (parts.length === 0) {
    return <span className="text-gray-500">Sans catégorie</span>;
  }

  return <span>{parts.join(separator)}</span>;
};

export default CategoryBadges;