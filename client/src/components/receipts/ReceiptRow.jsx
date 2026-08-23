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
import { TOUCH_TARGET_CLASS } from '../../i18n/fr';

const PAYMENT_METHOD_LABELS = {
  bank_transfer: 'Virement',
  check: 'Chèque',
  cash: 'Espèces',
};

/**
 * Single receipt row: tenant identity, status badges and quick actions.
 *
 * Purely presentational — overdue display comes from
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
          <PaymentStatusBadge status={receipt.payment_status || 'pending'} size="sm" />
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

      {/* Row actions: >=44x44 hit area (#56) */}
      <div className="flex items-center space-x-1">
        {/* View Receipt Action */}
        <button
          type="button"
          onClick={() => onView(receipt)}
          className={`${TOUCH_TARGET_CLASS} rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors`}
          title="Voir la quittance"
        >
          <DocumentMagnifyingGlassIcon className="h-5 w-5" />
        </button>
        {receipt.payment_status !== 'paid' && (
          <button
            type="button"
            onClick={() => onRecordPayment(receipt)}
            className={`${TOUCH_TARGET_CLASS} rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors`}
            title="Enregistrer le paiement"
          >
            <CurrencyEuroIcon className="h-5 w-5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDownload(receipt)}
          className={`${TOUCH_TARGET_CLASS} rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors`}
          title="Télécharger la quittance"
        >
          <ArrowDownTrayIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => onSendEmail(receipt)}
          disabled={receipt.email_sent}
          className={`${TOUCH_TARGET_CLASS} rounded-lg transition-colors ${
            receipt.email_sent
              ? 'text-green-500 cursor-not-allowed'
              : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
          }`}
          title={receipt.email_sent ? 'Email déjà envoyé' : 'Envoyer par email'}
        >
          {receipt.email_sent ? (
            <CheckCircleIcon className="h-5 w-5" />
          ) : (
            <EnvelopeIcon className="h-5 w-5" />
          )}
        </button>
        <button
          type="button"
          onClick={() => onDelete(receipt)}
          className={`${TOUCH_TARGET_CLASS} rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors`}
          title="Supprimer la quittance"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default ReceiptRow;
