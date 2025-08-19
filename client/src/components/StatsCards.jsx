import React from 'react';
import { UserGroupIcon, DocumentTextIcon, CurrencyEuroIcon, CalendarIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';

const StatsCards = ({ tenants = [], receipts = [], apartments = [] }) => {
  const totalRent = tenants.reduce((sum, tenant) => sum + (tenant.rentAmount || 0), 0);
  const thisMonthReceipts = receipts.filter(receipt => {
    const receiptDate = new Date(receipt.generated_at);
    const now = new Date();
    return receiptDate.getMonth() === now.getMonth() && receiptDate.getFullYear() === now.getFullYear();
  }).length;

  const occupiedApartments = apartments.filter(apt => 
    tenants.some(tenant => tenant.apartment_id === apt.id)
  ).length;

  const stats = [
    {
      name: 'Apartments',
      value: `${occupiedApartments}/${apartments.length}`,
      description: 'Occupied/Total',
      icon: BuildingOfficeIcon,
      color: 'bg-indigo-500',
    },
    {
      name: 'Total Tenants',
      value: tenants.length,
      description: 'Active tenants',
      icon: UserGroupIcon,
      color: 'bg-blue-500',
    },
    {
      name: 'Monthly Revenue',
      value: `€${totalRent.toLocaleString()}`,
      description: 'Total rent income',
      icon: CurrencyEuroIcon,
      color: 'bg-green-500',
    },
    {
      name: 'Receipts Generated',
      value: `${thisMonthReceipts}/${receipts.length}`,
      description: 'This month/Total',
      icon: DocumentTextIcon,
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => (
        <div key={stat.name} className="card">
          <div className="flex items-center">
            <div className={`${stat.color} rounded-lg p-3`}>
              <stat.icon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{stat.name}</p>
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              {stat.description && (
                <p className="text-xs text-gray-500">{stat.description}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
