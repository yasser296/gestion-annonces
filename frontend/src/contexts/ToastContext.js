// frontend/src/contexts/ToastContext.js
import React, { createContext, useContext } from 'react';
import useToast from '../hooks/useToast';
import ToastContainer from '../components/Toast/ToastContainer';

const ToastContext = createContext();

export const useToastContext = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToastContext must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children, position = 'top-right' }) => {
  const toastManager = useToast();

  return (
    <ToastContext.Provider value={toastManager}>
      {children}
      <ToastContainer 
        toasts={toastManager.toasts}
        onRemove={toastManager.removeToast}
        position={position}
      />
    </ToastContext.Provider>
  );
};

// Hook pour utiliser les toasts dans les composants
export const useNotification = () => {
  const { toast } = useToastContext();
  return toast;
};