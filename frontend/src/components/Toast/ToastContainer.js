import React from 'react';
import Toast from './Toast';

const ToastContainer = ({ toasts, onRemove, position = 'top-right' }) => {
  const getPositionClasses = () => {
    const positions = {
      'top-right': 'top-4 right-4',
      'top-left': 'top-4 left-4',
      'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
      'bottom-right': 'bottom-4 right-4',
      'bottom-left': 'bottom-4 left-4',
      'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2'
    };
    return positions[position] || positions['top-right'];
  };

  if (toasts.length === 0) return null;

  return (
    <div className={`fixed ${getPositionClasses()} z-50 space-y-3 pointer-events-none`}>
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            {...toast}
            onClose={onRemove}
            position={position}
          />
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;