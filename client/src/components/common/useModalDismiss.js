/**
 * useModalDismiss — standardized modal dismissal behavior (#55).
 *
 * Centralizes Escape-key handling and backdrop-click dismissal with an
 * optional dirty-form gate: when `isDirty` is true, closing first opens a
 * confirmation dialog (rendered by the caller by spreading `confirmProps`
 * onto <ConfirmDialog>) instead of closing immediately.
 */
import { useCallback, useEffect, useState } from 'react';
import fr from '../../i18n/fr';

export const useModalDismiss = ({ isOpen, onClose, isDirty = false }) => {
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Reset a pending prompt on open (render-phase adjustment — no cascading
  // effect renders) so a stale prompt can never survive a reopen.
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) setConfirmOpen(false);
  }

  const requestClose = useCallback(() => {
    if (isDirty) {
      setConfirmOpen(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = e => {
      if (e.key === 'Escape') requestClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, requestClose]);

  const handleBackdropClick = useCallback(() => {
    requestClose();
  }, [requestClose]);

  const confirmProps = {
    isOpen: isOpen && confirmOpen,
    title: fr.modals.dirtyConfirm.title,
    message: fr.modals.dirtyConfirm.message,
    confirmLabel: fr.modals.dirtyConfirm.confirmLabel,
    cancelLabel: fr.modals.dirtyConfirm.cancelLabel,
    tone: 'primary',
    onConfirm: () => {
      setConfirmOpen(false);
      onClose();
    },
    onCancel: () => setConfirmOpen(false),
  };

  return { requestClose, handleBackdropClick, confirmProps };
};

export default useModalDismiss;
