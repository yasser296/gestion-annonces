// hooks/usePopUp.js
import { useState } from 'react';
import PopUp from '../components/PopUp';

const usePopUp = () => {
  const [popupState, setPopupState] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    confirmText: 'OK',
    cancelText: 'Annuler',
    showCancel: false
  });

  const showPopup = ({
    title = '',
    message,
    type = 'info',
    onConfirm = null,
    confirmText = 'OK',
    cancelText = 'Annuler',
    showCancel = false
  }) => {
    setPopupState({
      isOpen: true,
      title,
      message,
      type,
      onConfirm,
      confirmText,
      cancelText,
      showCancel
    });
  };

  const closePopup = () => {
    setPopupState(prev => ({ ...prev, isOpen: false }));
  };

  const PopUpComponent = () => (
    <PopUp
      isOpen={popupState.isOpen}
      onClose={closePopup}
      title={popupState.title}
      message={popupState.message}
      type={popupState.type}
      onConfirm={popupState.onConfirm}
      confirmText={popupState.confirmText}
      cancelText={popupState.cancelText}
      showCancel={popupState.showCancel}
    />
  );

  return {
    showPopup,
    closePopup,
    PopUpComponent
  };
};

export default usePopUp;