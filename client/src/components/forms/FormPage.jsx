/**
 * FormPage — shared scaffold for the hash-routed create/edit pages (#113).
 * Owns the loading/error chrome, the ≥44px back control, h1 focus on view
 * mount (so route changes announce for keyboard/screen-reader users), the
 * dirty-form confirm gate, and the dirty broadcast that lets Dashboard gate
 * hash/tab navigation + the native beforeunload guard for refresh/close.
 */
import React, { useEffect, useRef } from 'react';
import ConfirmDialog from '../common/ConfirmDialog';
import { useModalDismiss } from '../common/useModalDismiss';
import { setFormDirty, isNavConfirmOpen } from '../../utils/dirtyForm';
import fr from '../../i18n/fr';

const FormPage = ({
  title,
  loading,
  error,
  isDirty,
  saving,
  submitLabel,
  onNavigate,
  onSubmit,
  loadingTestId,
  children,
}) => {
  const titleRef = useRef(null);

  // Move focus onto the page heading when the form view is shown.
  useEffect(() => {
    if (!loading && !error) titleRef.current?.focus();
  }, [loading, error]);

  // Broadcast dirty state to the nav layer and guard refresh/close.
  useEffect(() => {
    if (!isDirty) {
      setFormDirty(null);
      return undefined;
    }
    setFormDirty(window.location.hash);
    const onBeforeUnload = e => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      setFormDirty(null);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [isDirty]);

  // Dirty-form gate (#55): in-page exits (Retour / Annuler / Escape) ask
  // for confirmation before onNavigate runs.
  const { requestClose, confirmProps } = useModalDismiss({
    isOpen: true,
    onClose: onNavigate,
    isDirty,
    // While Dashboard's nav-gate confirm dialog is open it owns Escape —
    // without this the same keystroke would also reopen the form's dialog.
    isSuppressed: isNavConfirmOpen,
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32" data-testid={loadingTestId}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4" role="alert">
        <p className="text-red-800">{error}</p>
        <button type="button" onClick={requestClose} className="btn-secondary mt-3">
          {fr.common.back}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center space-x-2 mb-6">
        <button
          type="button"
          onClick={requestClose}
          className="inline-flex items-center min-h-11 px-2 text-sm text-gray-600 hover:text-gray-900"
        >
          ← {fr.common.back}
        </button>
        <h1 ref={titleRef} tabIndex={-1} className="text-2xl font-bold text-gray-900">
          {title}
        </h1>
      </div>

      <form onSubmit={onSubmit} className="bg-white shadow rounded-lg p-6 space-y-4">
        {children}
        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={requestClose} className="btn-secondary">
            {fr.common.cancel}
          </button>
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
            {submitLabel}
          </button>
        </div>
      </form>

      <ConfirmDialog {...confirmProps} />
    </div>
  );
};

export default FormPage;
