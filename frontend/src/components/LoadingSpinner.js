// frontend/src/components/LoadingSpinner.js
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const LoadingSpinner = ({ 
  size = 'md', 
  color = 'orange', 
  text = 'Chargement...', 
  className = '',
  overlay = false,
  fullScreen = false 
}) => {
  const getSizeClasses = () => {
    const sizes = {
      xs: 'w-4 h-4',
      sm: 'w-6 h-6', 
      md: 'w-8 h-8',
      lg: 'w-12 h-12',
      xl: 'w-16 h-16'
    };
    return sizes[size] || sizes.md;
  };

  const getColorClasses = () => {
    const colors = {
      orange: 'text-orange-500',
      blue: 'text-blue-500',
      green: 'text-green-500',
      red: 'text-red-500',
      gray: 'text-gray-500',
      white: 'text-white'
    };
    return colors[color] || colors.orange;
  };

  const spinner = (
    <div className={`flex flex-col items-center justify-center space-y-3 ${className}`}>
      <FontAwesomeIcon 
        icon={faSpinner} 
        className={`animate-spin ${getSizeClasses()} ${getColorClasses()}`}
      />
      {text && (
        <p className={`font-secondary text-sm ${getColorClasses()}`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-gray-50 flex items-center justify-center z-50">
        {spinner}
      </div>
    );
  }

  if (overlay) {
    return (
      <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
        {spinner}
      </div>
    );
  }

  return spinner;
};

// Variantes spécialisées
export const PageLoader = ({ text = 'Chargement de la page...' }) => (
  <LoadingSpinner fullScreen={true} size="lg" text={text} />
);

export const ComponentLoader = ({ text = 'Chargement...' }) => (
  <LoadingSpinner overlay={true} size="md" text={text} />
);

export const ButtonLoader = ({ size = 'sm', color = 'white' }) => (
  <FontAwesomeIcon 
    icon={faSpinner} 
    className={`animate-spin ${
      size === 'xs' ? 'w-3 h-3' : 
      size === 'sm' ? 'w-4 h-4' : 
      'w-5 h-5'
    } ${
      color === 'white' ? 'text-white' : 
      color === 'orange' ? 'text-orange-500' :
      'text-gray-500'
    }`}
  />
);

export const InlineLoader = ({ text = 'Chargement...', size = 'sm' }) => (
  <div className="inline-flex items-center space-x-2">
    <FontAwesomeIcon 
      icon={faSpinner} 
      className={`animate-spin ${
        size === 'xs' ? 'w-3 h-3' : 
        size === 'sm' ? 'w-4 h-4' : 
        'w-5 h-5'
      } text-gray-500`}
    />
    <span className="text-sm text-gray-500 font-secondary">{text}</span>
  </div>
);

export default LoadingSpinner;