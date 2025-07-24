// frontend/src/hooks/useToast.js
import { useState, useCallback } from 'react';

let toastId = 0;

const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({
    type = 'info',
    title,
    message,
    duration = 5000,
    persistent = false,
    showProgress = true
  }) => {
    const id = ++toastId;
    
    const toast = {
      id,
      type,
      title,
      message,
      duration,
      persistent,
      showProgress,
      timestamp: Date.now()
    };

    setToasts(prev => [...prev, toast]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Méthodes de convenance
  const toast = {
    success: (message, options = {}) => addToast({ 
      type: 'success', 
      message, 
      ...options 
    }),
    
    error: (message, options = {}) => addToast({ 
      type: 'error', 
      message, 
      duration: 7000, // Plus long pour les erreurs
      ...options 
    }),
    
    warning: (message, options = {}) => addToast({ 
      type: 'warning', 
      message, 
      duration: 6000,
      ...options 
    }),
    
    info: (message, options = {}) => addToast({ 
      type: 'info', 
      message, 
      ...options 
    }),

    // Toast persistant (ne se ferme pas automatiquement)
    persistent: (message, type = 'info', options = {}) => addToast({
      type,
      message,
      persistent: true,
      showProgress: false,
      ...options
    }),

    // Toast de confirmation avec callback
    confirm: (message, onConfirm, onCancel) => {
      const id = addToast({
        type: 'warning',
        title: 'Confirmation requise',
        message,
        persistent: true,
        showProgress: false,
        actions: [
          {
            label: 'Confirmer',
            action: () => {
              onConfirm && onConfirm();
              removeToast(id);
            },
            type: 'primary'
          },
          {
            label: 'Annuler',
            action: () => {
              onCancel && onCancel();
              removeToast(id);
            },
            type: 'secondary'
          }
        ]
      });
      return id;
    }
  };

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    toast
  };
};

export default useToast;