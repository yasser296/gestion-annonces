// hooks/usePopUp.js
import { useState } from 'react';
import PopUp from '../components/PopUp';

const usePopUp = () => {
  const [popupState, setPopupState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'OK',
    cancelText: 'Annuler',
    showCancel: false,
    resolve: null // Ajouté
  });

  const showPopup = ({
    title = '',
    message,
    type = 'info',
    confirmText = 'OK',
    cancelText = 'Annuler',
    showCancel = false
  }) => {
    return new Promise((resolve) => {
      setPopupState({
        isOpen: true,
        title,
        message,
        type,
        confirmText,
        cancelText,
        showCancel,
        resolve // On stocke la fonction à appeler
      });
    });
  };

  const handleConfirm = () => {
    if (popupState.resolve) popupState.resolve(true);
    setPopupState(prev => ({ ...prev, isOpen: false }));
  };

  const handleCancel = () => {
    if (popupState.resolve) popupState.resolve(false);
    setPopupState(prev => ({ ...prev, isOpen: false }));
  };

  const PopUpComponent = () => (
    <PopUp
      isOpen={popupState.isOpen}
      onClose={handleCancel}
      title={popupState.title}
      message={popupState.message}
      type={popupState.type}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
      confirmText={popupState.confirmText}
      cancelText={popupState.cancelText}
      showCancel={popupState.showCancel}
    />
  );

  return { showPopup, closePopup: handleCancel, PopUpComponent };
};


export default usePopUp;