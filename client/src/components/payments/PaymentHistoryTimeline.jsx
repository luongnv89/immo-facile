/**
 * PaymentHistoryTimeline Component
 * Task 1.1.3: Frontend - Payment Status UI
 *
 * Timeline view showing payment history and events
 */

import React from 'react';
import {
  CheckCircleIcon,
  ClockIcon,
  EnvelopeIcon,
  EyeIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import PaymentStatusBadge from './PaymentStatusBadge';

const PaymentHistoryTimeline = ({ receipt }) => {
  if (!receipt) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Aucun historique disponible</p>
      </div>
    );
  }

  // Build timeline events from receipt data
  const events = [];

  // Receipt generated event
  if (receipt.created_at) {
    events.push({
      id: 'generated',
      type: 'generated',
      title: 'Quittance générée',
      date: receipt.created_at,
      icon: DocumentTextIcon,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    });
  }

  // Email sent event
  if (receipt.email_sent && receipt.email_sent_at) {
    events.push({
      id: 'email_sent',
      type: 'email',
      title: 'Email envoyé',
      date: receipt.email_sent_at,
      icon: EnvelopeIcon,
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      description: receipt.email ? `Envoyé à ${receipt.email}` : undefined,
    });
  }

  // Email opened event
  if (receipt.email_opened && receipt.email_opened_at) {
    events.push({
      id: 'email_opened',
      type: 'opened',
      title: 'Email ouvert',
      date: receipt.email_opened_at,
      icon: EyeIcon,
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
    });
  }

  // Payment reminders
  if (receipt.reminder_sent_count > 0 && receipt.last_reminder_sent_at) {
    events.push({
      id: 'reminder',
      type: 'reminder',
      title: `Rappel envoyé (${receipt.reminder_sent_count})`,
      date: receipt.last_reminder_sent_at,
      icon: ClockIcon,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
    });
  }

  // Payment recorded event
  if (receipt.payment_date) {
    const paymentMethodLabels = {
      bank_transfer: 'Virement bancaire',
      check: 'Chèque',
      cash: 'Espèces',
      other: 'Autre',
    };

    events.push({
      id: 'payment',
      type: 'payment',
      title: 'Paiement reçu',
      date: receipt.payment_date,
      icon: CheckCircleIcon,
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      description: receipt.payment_method
        ? `Mode: ${paymentMethodLabels[receipt.payment_method] || receipt.payment_method}`
        : undefined,
      notes: receipt.notes,
    });
  }

  // Sort events by date (most recent first)
  events.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Format date for display
  const formatDate = dateString => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Aucun événement enregistré</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Status */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <h4 className="text-sm font-medium text-gray-700">Statut actuel</h4>
          <p className="text-xs text-gray-500 mt-0.5">
            {receipt.firstName} {receipt.lastName} - {receipt.month}/{receipt.year}
          </p>
        </div>
        <PaymentStatusBadge status={receipt.payment_status || 'pending'} size="lg" />
      </div>

      {/* Timeline */}
      <div className="flow-root">
        <ul role="list" className="-mb-8">
          {events.map((event, eventIdx) => {
            const Icon = event.icon;
            const isLast = eventIdx === events.length - 1;

            return (
              <li key={event.id}>
                <div className="relative pb-8">
                  {/* Connecting line */}
                  {!isLast && (
                    <span
                      className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200"
                      aria-hidden="true"
                    />
                  )}

                  <div className="relative flex items-start space-x-3">
                    {/* Icon */}
                    <div className="relative">
                      <div
                        className={`
                          h-10 w-10 rounded-full flex items-center justify-center ring-8 ring-white
                          ${event.iconBg}
                        `}
                      >
                        <Icon className={`h-5 w-5 ${event.iconColor}`} aria-hidden="true" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{event.title}</div>
                        <p className="mt-0.5 text-xs text-gray-500">{formatDate(event.date)}</p>
                      </div>

                      {/* Description */}
                      {event.description && (
                        <div className="mt-2 text-sm text-gray-700">{event.description}</div>
                      )}

                      {/* Notes */}
                      {event.notes && (
                        <div className="mt-2 text-sm text-gray-600 bg-gray-50 rounded p-2 border border-gray-200">
                          <span className="font-medium">Note: </span>
                          {event.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default PaymentHistoryTimeline;
