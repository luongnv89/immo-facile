/**
 * ReminderManagement Page
 *
 * Main page for managing reminder settings and viewing statistics
 */

import React, { useState } from 'react';
import { BellIcon, ChartBarIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import ReminderSettings from '../components/reminders/ReminderSettings';
import ReminderStatistics from '../components/reminders/ReminderStatistics';

const ReminderManagement = () => {
  const [activeTab, setActiveTab] = useState('statistics');

  const tabs = [
    {
      id: 'statistics',
      label: 'Statistiques',
      icon: ChartBarIcon,
      component: ReminderStatistics,
    },
    {
      id: 'settings',
      label: 'Configuration',
      icon: Cog6ToothIcon,
      component: ReminderSettings,
    },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-600 rounded-xl">
              <BellIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Rappels</h1>
              <p className="text-gray-600 mt-1">
                Configurez et surveillez les rappels de paiement automatiques
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors
                    ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="pb-8">{ActiveComponent && <ActiveComponent />}</div>
      </div>
    </div>
  );
};

export default ReminderManagement;
