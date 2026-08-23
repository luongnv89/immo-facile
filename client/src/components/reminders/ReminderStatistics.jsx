/**
 * ReminderStatistics Component
 *
 * Displays reminder statistics and analytics
 */

import React, { useState, useEffect } from 'react';
import { ChartBarIcon, EnvelopeIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { reminderAPI } from '../../services/api';
import ConfirmDialog from '../common/ConfirmDialog';
import fr from '../../i18n/fr';

const ReminderStatistics = () => {
  const [statistics, setStatistics] = useState(null);
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await reminderAPI.getStatistics(period);
      setStatistics(response.data.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const response = await reminderAPI.getStatistics(period);
        if (!cancelled) setStatistics(response.data.data);
      } catch (error) {
        console.error('Error fetching statistics:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [period]);

  const handleManualTrigger = async () => {
    try {
      setTriggering(true);
      const response = await reminderAPI.triggerManual();
      setTriggerResult(response.data.data);

      // Refresh statistics after trigger
      setTimeout(() => {
        fetchStatistics();
        setTriggerResult(null);
      }, 3000);
    } catch (error) {
      console.error('Error triggering manual check:', error);
      setTriggerResult({ error: true });
    } finally {
      setTriggering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Quittances totales',
      value: statistics?.total_receipts || 0,
      icon: ChartBarIcon,
      color: 'blue',
    },
    {
      label: 'Quittances impayées',
      value: statistics?.unpaid_receipts || 0,
      icon: ClockIcon,
      color: 'yellow',
    },
    {
      label: 'Rappels envoyés',
      value: statistics?.total_reminders_sent || 0,
      icon: EnvelopeIcon,
      color: 'green',
    },
    {
      label: 'Moyenne par quittance',
      value: statistics?.avg_reminders_per_receipt
        ? parseFloat(statistics.avg_reminders_per_receipt).toFixed(1)
        : '0.0',
      icon: ChartBarIcon,
      color: 'purple',
    },
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Statistiques des Rappels</h2>
          <p className="text-sm text-gray-500 mt-1">Analyse des rappels de paiement envoyés</p>
        </div>

        {/* Period Selector */}
        <select
          value={period}
          onChange={e => {
            setPeriod(parseInt(e.target.value));
            fetchStatistics();
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value={7}>7 derniers jours</option>
          <option value={30}>30 derniers jours</option>
          <option value={90}>90 derniers jours</option>
          <option value={365}>1 an</option>
        </select>
      </div>

      {/* Trigger Result Message */}
      {triggerResult && (
        <div
          className={`p-4 rounded-lg ${
            triggerResult.error
              ? 'bg-red-50 border border-red-200'
              : 'bg-green-50 border border-green-200'
          }`}
        >
          {triggerResult.error ? (
            <p className="text-sm text-red-800 font-medium">
              ❌ Erreur lors du déclenchement manuel
            </p>
          ) : (
            <div className="text-sm text-green-800">
              <p className="font-medium mb-1">✅ Vérification manuelle terminée</p>
              <p>
                {triggerResult.sent} envoyé{triggerResult.sent > 1 ? 's' : ''},{' '}
                {triggerResult.skipped} ignoré{triggerResult.skipped > 1 ? 's' : ''},{' '}
                {triggerResult.errors} erreur{triggerResult.errors > 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2 rounded-lg ${colorClasses[stat.color]}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Manual Trigger Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Déclenchement Manuel</h3>
            <p className="text-sm text-gray-600 mb-4">
              Lancez immédiatement une vérification des paiements en retard et envoyez les rappels
              nécessaires. Cette action s'exécute indépendamment du planificateur automatique.
            </p>
            <ul className="text-sm text-gray-600 space-y-1 mb-4">
              <li>• Vérifie toutes les quittances impayées</li>
              <li>• Calcule les jours de retard</li>
              <li>• Envoie les rappels selon les règles configurées</li>
              <li>• Met à jour les compteurs de rappels</li>
            </ul>
          </div>
        </div>

        <button
          onClick={() => setConfirmOpen(true)}
          disabled={triggering}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {triggering ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              Vérification en cours...
            </>
          ) : (
            <>
              <ArrowPathIcon className="h-5 w-5" />
              Déclencher maintenant
            </>
          )}
        </button>
      </div>

      {/* Additional Info */}
      {statistics && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChartBarIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                Informations complémentaires
              </h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>
                  • Période analysée : <strong>{period} jours</strong>
                </p>
                <p>
                  • Maximum de rappels envoyés à une quittance :{' '}
                  <strong>{statistics.max_reminders_sent || 0}</strong>
                </p>
                <p>
                  • Taux de rappel :{' '}
                  <strong>
                    {statistics.total_receipts > 0
                      ? (
                          (statistics.total_reminders_sent / statistics.total_receipts) *
                          100
                        ).toFixed(1)
                      : 0}
                    %
                  </strong>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        title={fr.reminderStats.confirmTriggerTitle}
        message={fr.reminderStats.confirmTriggerMessage}
        confirmLabel={fr.reminderStats.confirmTriggerLabel}
        tone="primary"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          handleManualTrigger();
        }}
      />
    </div>
  );
};

export default ReminderStatistics;
