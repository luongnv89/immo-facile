/**
 * RecordPaymentModal Component
 * Task 1.1.3: Frontend - Payment Status UI
 *
 * Modal for recording payment details with validation
 */

import React, { useState } from 'react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';

const RecordPaymentModal = ({ isOpen, onClose, onSubmit, receipt, loading = false }) => {
  const [formData, setFormData] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'bank_transfer',
    notes: '',
  });

  const [errors, setErrors] = useState({});

  // Reset form when modal opens (render-phase adjustment)
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setFormData({
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'bank_transfer',
        notes: '',
      });
      setErrors({});
    }
  }

  const paymentMethods = [
    { value: 'bank_transfer', label: 'Virement bancaire' },
    { value: 'check', label: 'Chèque' },
    { value: 'cash', label: 'Espèces' },
    { value: 'other', label: 'Autre' },
  ];

  const validateForm = () => {
    const newErrors = {};

    // Validate payment date
    if (!formData.payment_date) {
      newErrors.payment_date = 'La date de paiement est requise';
    } else {
      const paymentDate = new Date(formData.payment_date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today

      if (paymentDate > today) {
        newErrors.payment_date = 'La date de paiement ne peut pas être dans le futur';
      }
    }

    // Validate payment method
    if (!formData.payment_method) {
      newErrors.payment_method = 'Le mode de paiement est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = e => {
    e.preventDefault();

    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform overflow-hidden rounded-lg bg-white shadow-xl transition-all">
          {/* Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 id="modal-title" className="text-lg font-semibold text-gray-900">
                Enregistrer le paiement
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Fermer"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit} className="px-6 py-4">
            {/* Receipt Info */}
            {receipt && (
              <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm">
                <p className="font-medium text-blue-900">
                  {receipt.firstName} {receipt.lastName}
                </p>
                <p className="text-blue-700">
                  {receipt.month}/{receipt.year} - {receipt.amount}€
                </p>
              </div>
            )}

            {/* Payment Date */}
            <div className="mb-4">
              <label
                htmlFor="payment_date"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Date de paiement <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                id="payment_date"
                name="payment_date"
                value={formData.payment_date}
                onChange={handleChange}
                max={new Date().toISOString().split('T')[0]}
                className={`
                  block w-full rounded-lg border px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${
                    errors.payment_date
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500'
                  }
                `}
                required
                aria-invalid={errors.payment_date ? 'true' : 'false'}
                aria-describedby={errors.payment_date ? 'payment_date-error' : undefined}
              />
              {errors.payment_date && (
                <p id="payment_date-error" className="mt-1 text-sm text-red-600">
                  {errors.payment_date}
                </p>
              )}
            </div>

            {/* Payment Method */}
            <div className="mb-4">
              <label
                htmlFor="payment_method"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Mode de paiement <span className="text-red-500">*</span>
              </label>
              <select
                id="payment_method"
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                className={`
                  block w-full rounded-lg border px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  ${
                    errors.payment_method
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500'
                  }
                `}
                required
                aria-invalid={errors.payment_method ? 'true' : 'false'}
                aria-describedby={errors.payment_method ? 'payment_method-error' : undefined}
              >
                {paymentMethods.map(method => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
              {errors.payment_method && (
                <p id="payment_method-error" className="mt-1 text-sm text-red-600">
                  {errors.payment_method}
                </p>
              )}
            </div>

            {/* Notes */}
            <div className="mb-4">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optionnel)
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                placeholder="Ajouter des notes sur ce paiement..."
                className="
                  block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                  focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500
                  resize-none
                "
                maxLength={500}
              />
              <p className="mt-1 text-xs text-gray-500">{formData.notes.length}/500 caractères</p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="
                  flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium
                  text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                "
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="
                  flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white
                  hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors inline-flex items-center justify-center gap-2
                "
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RecordPaymentModal;
