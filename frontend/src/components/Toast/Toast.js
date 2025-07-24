// frontend/src/components/Toast/Toast.js
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCheck, 
  faExclamationTriangle, 
  faInfoCircle, 
  faTimes,
  faTimesCircle 
} from '@fortawesome/free-solid-svg-icons';

const Toast = ({ 
  id,
  type = 'info', 
  title, 
  message, 
  duration = 5000, 
  onClose,
  position = 'top-right',
  showProgress = true,
  persistent = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Animation d'entrée
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (persistent) return;

    // Barre de progression
    if (showProgress && duration > 0) {
      const interval = setInterval(() => {
        setProgress(prev => {
          const newProgress = prev - (100 / (duration / 100));
          return newProgress <= 0 ? 0 : newProgress;
        });
      }, 100);

      // Auto-fermeture
      const autoCloseTimer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => {
        clearInterval(interval);
        clearTimeout(autoCloseTimer);
      };
    }
  }, [duration, persistent, showProgress]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  const getToastStyles = () => {
    const baseStyles = {
      info: {
        bg: 'bg-blue-50 border-blue-200',
        text: 'text-blue-800',
        icon: 'text-blue-500',
        progress: 'bg-blue-500'
      },
      success: {
        bg: 'bg-green-50 border-green-200',
        text: 'text-green-800',
        icon: 'text-green-500',
        progress: 'bg-green-500'
      },
      warning: {
        bg: 'bg-yellow-50 border-yellow-200',
        text: 'text-yellow-800',
        icon: 'text-yellow-500',
        progress: 'bg-yellow-500'
      },
      error: {
        bg: 'bg-red-50 border-red-200',
        text: 'text-red-800',
        icon: 'text-red-500',
        progress: 'bg-red-500'
      }
    };

    return baseStyles[type] || baseStyles.info;
  };

  const getIcon = () => {
    const icons = {
      success: faCheck,
      warning: faExclamationTriangle,
      error: faTimesCircle,
      info: faInfoCircle
    };
    return icons[type] || icons.info;
  };

  const styles = getToastStyles();

  return (
    <div
      className={`
        relative max-w-sm w-full border rounded-lg shadow-lg overflow-hidden
        transform transition-all duration-300 ease-in-out font-secondary
        ${styles.bg} ${styles.text}
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'}
        ${isLeaving ? 'translate-x-full opacity-0 scale-95' : ''}
      `}
    >
      {/* Contenu principal */}
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <FontAwesomeIcon 
              icon={getIcon()} 
              className={`text-lg ${styles.icon}`}
            />
          </div>
          
          <div className="ml-3 flex-1">
            {title && (
              <h4 className="text-sm font-bold mb-1">{title}</h4>
            )}
            <p className="text-sm">{message}</p>
          </div>
          
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={handleClose}
              className={`inline-flex rounded-md p-1.5 hover:bg-gray-100 focus:outline-none transition-colors ${styles.text}`}
            >
              <FontAwesomeIcon icon={faTimes} className="text-xs" />
            </button>
          </div>
        </div>
      </div>

      {/* Barre de progression */}
      {showProgress && !persistent && (
        <div className="h-1 bg-gray-200">
          <div 
            className={`h-full transition-all duration-100 ease-linear ${styles.progress}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default Toast;