/**
 * ReminderSettings Component
 * Task 1.2.4: Reminder Configuration UI
 *
 * Manages reminder scheduler configuration and settings
 */

import React, { useState, useEffect } from 'react';
import {
  Cog6ToothIcon,
  PlayIcon,
  StopIcon,
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { reminderAPI } from '../../services/api';

const ReminderSettings = () => {
  const [status, setStatus] = useState(null);
  const [config, setConfig] = useState({
    enabled: true,
    schedule: '0 9 * * *',
    reminderDays: [3, 7, 14, 21, 30],
    maxReminders: 5,
    dueDay: 5,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await reminderAPI.getStatus();
      setStatus(response.data.data);
      if (response.data.data.config) {
        setConfig(response.data.data.config);
      }
    } catch (error) {
      console.error('Error fetching status:', error);
      showMessage('Erreur lors du chargement du statut', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setSaving(true);
      await reminderAPI.updateConfig(config);
      showMessage('Configuration enregistrée avec succès', 'success');
      await fetchStatus();
    } catch (error) {
      console.error('Error saving config:', error);
      showMessage("Erreur lors de l'enregistrement", 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleScheduler = async () => {
    try {
      if (status?.isRunning) {
        await reminderAPI.stop();
        showMessage('Planificateur arrêté', 'success');
      } else {
        await reminderAPI.start();
        showMessage('Planificateur démarré', 'success');
      }
      await fetchStatus();
    } catch (error) {
      console.error('Error toggling scheduler:', error);
      showMessage("Erreur lors du changement d'état", 'error');
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleReminderDaysChange = (day, checked) => {
    if (checked) {
      setConfig(prev => ({
        ...prev,
        reminderDays: [...prev.reminderDays, day].sort((a, b) => a - b),
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        reminderDays: prev.reminderDays.filter(d => d !== day),
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Cog6ToothIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Configuration des Rappels</h2>
            <p className="text-sm text-gray-500">
              Gérez les paramètres d'envoi automatique des rappels de paiement
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full ${
            status?.isRunning ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          }`}
        >
          <div
            className={`h-2 w-2 rounded-full ${
              status?.isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`}
          />
          <span className="text-sm font-medium">{status?.isRunning ? 'Actif' : 'Inactif'}</span>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircleIcon className="h-5 w-5" />
          ) : (
            <XCircleIcon className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Main Settings Card */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="p-6 space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900">
                Activer les rappels automatiques
              </label>
              <p className="text-sm text-gray-500 mt-1">
                Envoyer automatiquement des rappels pour les paiements en retard
              </p>
            </div>
            <button
              onClick={() => setConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.enabled ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <hr className="border-gray-200" />

          {/* Schedule */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Planification (Cron)
            </label>
            <input
              type="text"
              value={config.schedule}
              onChange={e => setConfig(prev => ({ ...prev, schedule: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="0 9 * * *"
            />
            <p className="text-xs text-gray-500 mt-1">
              Expression cron (ex: "0 9 * * *" = tous les jours à 9h00)
            </p>
          </div>

          {/* Reminder Days */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Jours de rappel après échéance
            </label>
            <div className="grid grid-cols-5 gap-3">
              {[3, 7, 14, 21, 30].map(day => (
                <label
                  key={day}
                  className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    config.reminderDays.includes(day)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={config.reminderDays.includes(day)}
                    onChange={e => handleReminderDaysChange(day, e.target.checked)}
                    className="sr-only"
                  />
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{day}</div>
                    <div className="text-xs text-gray-500">jours</div>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Sélectionnez les jours après l'échéance où envoyer des rappels
            </p>
          </div>

          {/* Max Reminders */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Nombre maximum de rappels
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={config.maxReminders}
              onChange={e =>
                setConfig(prev => ({ ...prev, maxReminders: parseInt(e.target.value) }))
              }
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Limite le nombre de rappels envoyés par quittance
            </p>
          </div>

          {/* Due Day */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Jour d'échéance du paiement
            </label>
            <input
              type="number"
              min="1"
              max="31"
              value={config.dueDay}
              onChange={e => setConfig(prev => ({ ...prev, dueDay: parseInt(e.target.value) }))}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Jour du mois suivant où le paiement est dû (ex: 5 = le 5 du mois)
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between rounded-b-lg">
          <button
            onClick={handleToggleScheduler}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              status?.isRunning
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            }`}
          >
            {status?.isRunning ? (
              <>
                <StopIcon className="h-4 w-4" />
                Arrêter le planificateur
              </>
            ) : (
              <>
                <PlayIcon className="h-4 w-4" />
                Démarrer le planificateur
              </>
            )}
          </button>

          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Enregistrement...
              </>
            ) : (
              <>
                <CheckCircleIcon className="h-4 w-4" />
                Enregistrer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReminderSettings;
