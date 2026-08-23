/**
 * ConfirmDialog — in-app confirmation dialog (#55).
 *
 * Replaces window.confirm: names the object and the consequence of the
 * action, dismisses on Escape and backdrop click, and is fully keyboard
 * accessible (role="alertdialog").
 */
import React, { useEffect, useRef } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import fr from '../../i18n/fr';

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmLabel = fr.common.delete,
  cancelLabel = fr.common.cancel,
  tone = 'danger',
  onConfirm,
  onCancel,
}) => {
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = e => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onCancel]);

  useEffect(() => {
    if (isOpen) cancelRef.current?.focus();
  }, [isOpen]);

  if (!isOpen) return null;

  const toneClasses =
    tone === 'danger'
      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500';

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-message"
      data-testid="confirm-dialog"
    >
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-60 transition-opacity"
        onClick={onCancel}
        aria-hidden="true"
        data-testid="confirm-dialog-backdrop"
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl">
          <div className="px-6 pt-6">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-red-100 p-2">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true" />
              </div>
              <div>
                <h3 id="confirm-dialog-title" className="text-base font-semibold text-gray-900">
                  {title}
                </h3>
                <p id="confirm-dialog-message" className="mt-2 text-sm text-gray-600">
                  {message}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-3 px-6 pb-5">
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              className="inline-flex h-11 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              data-testid="confirm-dialog-confirm"
              className={`inline-flex h-11 items-center justify-center rounded-lg px-4 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${toneClasses}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
