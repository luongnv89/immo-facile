import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTenants } from '../store/slices/tenantSlice';
import { fetchReceipts } from '../store/slices/receiptSlice';
import { fetchApartments } from '../store/slices/apartmentSlice';
import Header from './Header';
import TenantList from './TenantList';
import TenantForm from './TenantForm';
import ReceiptGenerator from './ReceiptGenerator';
import RecentReceipts from './RecentReceipts';
import StatsCards from './StatsCards';
import Apartments from '../pages/Apartments';
import Owner from '../pages/Owner';
import Tenants from '../pages/Tenants';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { items: tenants, loading: tenantsLoading } = useSelector(state => state.tenants);
  const { items: receipts, loading: receiptsLoading } = useSelector(state => state.receipts);
  const { items: apartments, loading: apartmentsLoading } = useSelector(state => state.apartments);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    dispatch(fetchTenants());
    dispatch(fetchReceipts());
    dispatch(fetchApartments());
  }, [dispatch]);

  const renderContent = () => {
    switch (activeTab) {
      case 'apartments':
        return <Apartments />;
      case 'tenants':
        return <Tenants />;
      case 'owner':
        return <Owner />;
      default:
        return (
          <>
            {/* Stats Overview */}
            <StatsCards tenants={tenants} receipts={receipts} apartments={apartments} />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
              {/* Left Column - Quick Actions */}
              <div className="space-y-8">
                <div className="card">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Receipt</h3>
                  <ReceiptGenerator />
                </div>
              </div>

              {/* Right Column - Recent Activity */}
              <div className="space-y-8">
                <div className="card">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Receipts</h3>
                  <RecentReceipts />
                </div>
              </div>
            </div>
          </>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Navigation Tabs */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('apartments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'apartments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Apartments
            </button>
            <button
              onClick={() => setActiveTab('tenants')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tenants'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Tenants
            </button>
            <button
              onClick={() => setActiveTab('owner')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'owner'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Owner
            </button>
          </nav>
        </div>
      </div>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default Dashboard;
