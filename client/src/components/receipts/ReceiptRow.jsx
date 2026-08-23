import React from 'react';
import {
  ArrowDownTrayIcon,
  TrashIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  EyeIcon,
  CurrencyEuroIcon,
  ExclamationTriangleIcon,
  DocumentMagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { PaymentStatusBadge } from '../payments';
import { getDaysOverdue, isOverdue } from '../../utils/receiptOverdue';

const PAYMENT_METHOD_LABELS = {
  bank_transfer: 'Virement',
  check: 'Chèque',
  cash: 'Espèces',
};

/**
 * Single receipt row: tenant identity, status badges and quick actions.
 *
 * Purely presentational (Task 5.9 / F-CLEAN-003) — overdue display comes from
 * the shared `receiptOverdue` util and every action is delegated to the
 * handlers passed by the parent list.
 */
const ReceiptRow = ({ receipt, onView, onRecordPayment, onDownload, onSendEmail, onDelete }) => {
  const overdueStatus = isOverdue(receipt);
  const daysOverdue = getDaysOverdue(receipt);

  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
        overdueStatus ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium text-gray-900 truncate">
            {receipt.firstName} {receipt.lastName}
          </p>
          {/* Task 1.1.4: Payment Status Badge */}
          <PaymentStatusBadge status={receipt.payment_status || 'pending'} size="sm" />
          {/* Task 1.1.4: Overdue Indicator */}
          {overdueStatus && (
            <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
              <ExclamationTriangleIcon className="h-3 w-3" />
              {daysOverdue}j en retard
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500">
          {receipt.month}/{receipt.year} • €{receipt.amount}
          {receipt.payment_method && (
            <span className="ml-2 text-gray-400">
              • {PAYMENT_METHOD_LABELS[receipt.payment_method] || 'Autre'}
            </span>
          )}
        </p>
        <p className="text-xs text-gray-400 flex items-center space-x-2">
          <span>
            {new Date(receipt.generated_at || receipt.created_at).toLocaleDateString('fr-FR')}
          </span>
          {receipt.email_sent && (
            <span className="inline-flex items-center space-x-1 text-green-600">
              <CheckCircleIcon className="h-3 w-3" />
              <span>Email envoyé</span>
            </span>
          )}
          {receipt.email_opened && (
            <span className="inline-flex items-center space-x-1 text-blue-600">
              <EyeIcon className="h-3 w-3" />
              <span>Ouvert</span>
            </span>
          )}
          {receipt.payment_date && (
            <span className="inline-flex items-center space-x-1 text-green-600">
              <CheckCircleIcon className="h-3 w-3" />
              <span>Payé le {new Date(receipt.payment_date).toLocaleDateString('fr-FR')}</span>
            </span>
          )}
        </p>
      </div>

      <div className="flex items-center space-x-1">
        {/* View Receipt Action */}
        <button
          onClick={() => onView(receipt)}
          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
          title="Voir la quittance"
        >
          <DocumentMagnifyingGlassIcon className="h-4 w-4" />
        </button>
        {/* Task 1.1.4: Record Payment Quick Action */}
        {receipt.payment_status !== 'paid' && (
          <button
            onClick={() => onRecordPayment(receipt)}
            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
            title="Enregistrer le paiement"
          >
            <CurrencyEuroIcon className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => onDownload(receipt)}
          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
          title="Télécharger la quittance"
        >
          <ArrowDownTrayIcon className="h-4 w-4" />
        </button>
        <button
          onClick={() => onSendEmail(receipt)}
          disabled={receipt.email_sent}
          className={`p-1 transition-colors ${
            receipt.email_sent
              ? 'text-green-500 cursor-not-allowed'
              : 'text-gray-400 hover:text-green-600'
          }`}
          title={receipt.email_sent ? 'Email déjà envoyé' : 'Envoyer par email'}
        >
          {receipt.email_sent ? (
            <CheckCircleIcon className="h-4 w-4" />
          ) : (
            <EnvelopeIcon className="h-4 w-4" />
          )}
        </button>
        <button
          onClick={() => onDelete(receipt)}
          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
          title="Supprimer la quittance"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default ReceiptRow;
