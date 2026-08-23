import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTenants } from '../store/slices/tenantSlice';
import { fetchReceipts } from '../store/slices/receiptSlice';
import { fetchApartments } from '../store/slices/apartmentSlice';
import Header from './Header';
import ReceiptGenerator from './ReceiptGenerator';
import RecentReceipts from './RecentReceipts';
import StatsCards from './StatsCards';
import fr from '../i18n/fr';
import { VALID_TABS, readHashTab, tabHref } from '../utils/tabs';

// URL-routed tabs (#55): the active section is mirrored into the location
// hash (e.g. #/tenants) so every section has a URL that survives refresh,
// without pulling in a router dependency.

// Code splitting (#58): each tab page is its own lazy chunk so the initial
// bundle only ships the dashboard shell; a page loads on first visit.
const Apartments = lazy(() => import('../pages/Apartments'));
const Owner = lazy(() => import('../pages/Owner'));
const Tenants = lazy(() => import('../pages/Tenants'));
const ReminderManagement = lazy(() => import('../pages/ReminderManagement'));

const Dashboard = () => {
  const dispatch = useDispatch();
  const tenants = useSelector(state => state.tenants?.items || []);
  const receipts = useSelector(state => state.receipts?.items || []);
  const apartments = useSelector(state => state.apartments?.items || []);
  const [activeTab, setActiveTab] = useState(() => readHashTab() || 'dashboard');

  const selectTab = useCallback(tab => {
    setActiveTab(tab);
    const href = tabHref(tab);
    if (window.location.hash !== href) {
      window.history.pushState(null, '', href);
    }
  }, []);

  // Browser back/forward and manual hash edits drive the active tab too.
  useEffect(() => {
    const onHashChange = () => {
      setActiveTab(readHashTab() || 'dashboard');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Lazy per-tab fetching (#57): the dashboard tab needs tenants, receipts
  // and apartments for its stats/generator/recent widgets; other tabs fetch
  // their own data when their content mounts (ApartmentList, Tenants page,
  // Owner page, ReminderManagement).
  useEffect(() => {
    if (activeTab !== 'dashboard') return undefined;
    dispatch(fetchTenants());
    dispatch(fetchReceipts());
    dispatch(fetchApartments());
    return undefined;
  }, [dispatch, activeTab]);

  const renderContent = () => {
    switch (activeTab) {
      case 'apartments':
        return <Apartments />;
      case 'tenants':
        return <Tenants />;
      case 'owner':
        return <Owner />;
      case 'reminders':
        return <ReminderManagement />;
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
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {fr.dashboard.generateReceipt}
                  </h3>
                  <ReceiptGenerator />
                </div>
              </div>

              {/* Right Column - Recent Activity */}
              <div className="space-y-8">
                <div className="card">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    {fr.dashboard.recentReceipts}
                  </h3>
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
            {VALID_TABS.map(tab => (
              <a
                key={tab}
                href={tabHref(tab)}
                onClick={e => {
                  e.preventDefault();
                  selectTab(tab);
                }}
                aria-current={activeTab === tab ? 'page' : undefined}
                data-testid={`tab-${tab}`}
                className={`inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {fr.dashboard.tabs[tab]}
              </a>
            ))}
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense
          fallback={
            <p role="status" className="py-12 text-center text-gray-500">
              {fr.common.loading}
            </p>
          }
        >
          {renderContent()}
        </Suspense>
      </main>
    </div>
  );
};

export default Dashboard;
