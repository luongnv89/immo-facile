/**
 * ViewReceiptModal Component
 *
 * Modal for viewing a receipt PDF in an embedded viewer
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  EnvelopeIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import { receiptAPI } from '../services/api';

const ViewReceiptModal = ({ isOpen, onClose, receipt, onDownload, onSendEmail }) => {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState(null);
  const pdfUrlRef = useRef(null);

  // Loading is derived: a PDF is being fetched whenever the modal is open
  // with a receipt but no blob URL or error is available yet.
  const loading = Boolean(isOpen && receipt && !pdfUrl && !error);

  // Fetch PDF when modal opens
  const loadPdf = async () => {
    setPdfUrl(null);
    setError(null);

    try {
      const response = await receiptAPI.download(receipt.id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      pdfUrlRef.current = url;
      setPdfUrl(url);
    } catch (err) {
      console.error('Failed to load PDF:', err);
      setError('Impossible de charger la quittance. Veuillez réessayer.');
    }
  };

  useEffect(() => {
    if (!isOpen || !receipt) return undefined;
    let cancelled = false;

    const run = async () => {
      try {
        const response = await receiptAPI.download(receipt.id);
        if (cancelled) return;
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        pdfUrlRef.current = url;
        if (!cancelled) setPdfUrl(url);
      } catch (err) {
        console.error('Failed to load PDF:', err);
        if (!cancelled) setError('Impossible de charger la quittance. Veuillez réessayer.');
      }
    };

    run();

    // Cleanup URL on unmount or when modal closes. The currently shown blob
    // URL is tracked in a ref so the effect does not need `pdfUrl` in its
    // dependency array (adding it would re-run the fetch on every load).
    return () => {
      cancelled = true;
      if (pdfUrlRef.current) {
        window.URL.revokeObjectURL(pdfUrlRef.current);
        pdfUrlRef.current = null;
      }
    };
  }, [isOpen, receipt?.id]);

  const handleDownload = () => {
    if (onDownload) {
      onDownload(receipt);
    }
  };

  const handleSendEmail = () => {
    if (onSendEmail) {
      onSendEmail(receipt);
    }
  };

  const handleClose = () => {
    if (pdfUrl) {
      window.URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="view-receipt-modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-75 transition-opacity"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-4xl transform overflow-hidden rounded-xl bg-white shadow-2xl transition-all">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 id="view-receipt-modal-title" className="text-lg font-semibold text-white">
                  Quittance de Loyer
                </h3>
                {receipt && (
                  <p className="text-blue-100 text-sm mt-1">
                    {receipt.firstName} {receipt.lastName} - {receipt.month}/{receipt.year}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Quick Actions */}
                <button
                  type="button"
                  onClick={handleDownload}
                  className="rounded-lg bg-white/10 hover:bg-white/20 p-2 text-white transition-colors"
                  title="Télécharger"
                >
                  <ArrowDownTrayIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={receipt?.email_sent}
                  className={`rounded-lg p-2 transition-colors ${
                    receipt?.email_sent
                      ? 'bg-green-500/30 text-green-100 cursor-not-allowed'
                      : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                  title={receipt?.email_sent ? 'Email déjà envoyé' : 'Envoyer par email'}
                >
                  {receipt?.email_sent ? (
                    <CheckCircleIcon className="h-5 w-5" />
                  ) : (
                    <EnvelopeIcon className="h-5 w-5" />
                  )}
                </button>
                <div className="w-px h-6 bg-white/30 mx-1" />
                <button
                  type="button"
                  onClick={handleClose}
                  className="rounded-lg bg-white/10 hover:bg-white/20 p-2 text-white transition-colors"
                  aria-label="Fermer"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Receipt Info Bar */}
          {receipt && (
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-3">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Montant:</span>
                  <span className="font-semibold text-gray-900">{receipt.amount}€</span>
                </div>
                <div className="h-4 w-px bg-gray-300" />
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Période:</span>
                  <span className="font-medium text-gray-700">
                    {receipt.month}/{receipt.year}
                  </span>
                </div>
                <div className="h-4 w-px bg-gray-300" />
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Créée le:</span>
                  <span className="font-medium text-gray-700">
                    {new Date(receipt.generated_at || receipt.created_at).toLocaleDateString(
                      'fr-FR'
                    )}
                  </span>
                </div>
                {receipt.email_sent && (
                  <>
                    <div className="h-4 w-px bg-gray-300" />
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircleIcon className="h-4 w-4" />
                      <span className="font-medium">Email envoyé</span>
                    </div>
                  </>
                )}
                {receipt.payment_status === 'paid' && (
                  <>
                    <div className="h-4 w-px bg-gray-300" />
                    <div className="flex items-center gap-1 text-green-600">
                      <CheckCircleIcon className="h-4 w-4" />
                      <span className="font-medium">Payé</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* PDF Viewer Body */}
          <div className="bg-gray-100" style={{ height: '70vh', minHeight: '400px' }}>
            {loading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                  <p className="mt-4 text-gray-600 font-medium">Chargement de la quittance...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-6">
                  <div className="rounded-full bg-red-100 p-3 mx-auto w-fit mb-4">
                    <XMarkIcon className="h-8 w-8 text-red-600" />
                  </div>
                  <p className="text-gray-900 font-medium mb-2">{error}</p>
                  <button
                    onClick={loadPdf}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Réessayer
                  </button>
                </div>
              </div>
            )}

            {pdfUrl && !loading && !error && (
              <iframe
                src={pdfUrl}
                className="w-full h-full border-0"
                title={`Quittance ${receipt?.firstName} ${receipt?.lastName} - ${receipt?.month}/${receipt?.year}`}
              />
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Quittance générée automatiquement par ImmoFacile
              </p>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewReceiptModal;
