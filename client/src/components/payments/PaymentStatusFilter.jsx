/**
 * PaymentStatusFilter Component
 * Task 1.1.3: Frontend - Payment Status UI
 *
 * Filter dropdown for payment status with counts
 */

import React from 'react';
import { FunnelIcon } from '@heroicons/react/24/outline';

const PaymentStatusFilter = ({
  selectedStatus,
  onStatusChange,
  receipts = [],
  showCounts = true,
}) => {
  // Calculate counts for each status
  const statusCounts = receipts.reduce((acc, receipt) => {
    const status = receipt.payment_status || 'pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const statusOptions = [
    { value: '', label: 'Tous les statuts', count: receipts.length },
    { value: 'pending', label: 'En attente', count: statusCounts.pending || 0 },
    { value: 'paid', label: 'Payé', count: statusCounts.paid || 0 },
    { value: 'late', label: 'En retard', count: statusCounts.late || 0 },
    { value: 'partial', label: 'Partiel', count: statusCounts.partial || 0 },
  ];

  return (
    <div className="relative">
      <label htmlFor="payment-status-filter" className="sr-only">
        Filtrer par statut de paiement
      </label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <FunnelIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <select
          id="payment-status-filter"
          value={selectedStatus}
          onChange={e => onStatusChange(e.target.value)}
          className="
            block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-10
            text-sm text-gray-900 shadow-sm
            focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500
            hover:border-gray-400 transition-colors
            cursor-pointer
          "
          aria-label="Filtrer les quittances par statut de paiement"
        >
          {statusOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
              {showCounts && ` (${option.count})`}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default PaymentStatusFilter;
