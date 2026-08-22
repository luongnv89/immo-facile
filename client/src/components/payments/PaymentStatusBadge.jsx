/**
 * PaymentStatusBadge Component
 * Task 1.1.3: Frontend - Payment Status UI
 *
 * Displays color-coded payment status badges
 * - Green: paid
 * - Yellow: pending
 * - Red: late
 * - Orange: partial
 */

import React from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  MinusCircleIcon,
} from '@heroicons/react/24/solid';

const PaymentStatusBadge = ({ status = 'pending', size = 'md', showIcon = true }) => {
  // Status configuration with colors and icons
  const statusConfig = {
    paid: {
      label: 'Payé',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-200',
      icon: CheckCircleIcon,
    },
    pending: {
      label: 'En attente',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-200',
      icon: ClockIcon,
    },
    late: {
      label: 'En retard',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      borderColor: 'border-red-200',
      icon: ExclamationCircleIcon,
    },
    partial: {
      label: 'Partiel',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-800',
      borderColor: 'border-orange-200',
      icon: MinusCircleIcon,
    },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  // Size variants
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border font-medium
        ${config.bgColor} ${config.textColor} ${config.borderColor}
        ${sizeClasses[size]}
      `}
      role="status"
      aria-label={`Statut de paiement: ${config.label}`}
    >
      {showIcon && <Icon className={iconSizes[size]} aria-hidden="true" />}
      <span>{config.label}</span>
    </span>
  );
};

export default PaymentStatusBadge;
