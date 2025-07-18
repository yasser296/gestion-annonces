import Swal from 'sweetalert2';

/**
 * Affiche une modale de confirmation réutilisable
 * @param {string} text - Le message à afficher
 * @param {string} confirmText - Texte du bouton de confirmation
 * @returns {Promise<boolean>} true si confirmé
 */
export async function confirmDialog({
  title = "Êtes-vous sûr ?",
  text = "Cette action est irréversible.",
  confirmText = "Confirmer",
  cancelText = "Annuler",
  icon = "warning",
  hideCancel = false // <<=== ICI !
} = {}) {
  const result = await Swal.fire({
    title,
    text,
    icon,
    showCancelButton: !hideCancel, // <<=== ON L'UTILISE ICI
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
  });
  return result.isConfirmed;
}

export function infoDialog({ text, title = "Info" }) {
  return confirmDialog({
    text,
    title,
    confirmText: "OK",
    icon: "info",
    hideCancel: true
  });
}


