import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchReceipts,
  downloadReceipt,
  deleteReceipt,
  sendReceiptEmail,
  recordPayment,
} from '../store/slices/receiptSlice';
import { addNotification } from '../store/slices/uiSlice';
import { MagnifyingGlassIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { PaymentStatusFilter, RecordPaymentModal } from './payments';
import ViewReceiptModal from './ViewReceiptModal';
import { ReceiptRow } from './receipts';
import { useReceiptFiltering } from '../hooks/useReceiptFiltering';

const RecentReceipts = () => {
  const dispatch = useDispatch();
  const receipts = useSelector(state => state.receipts?.items || []);
  const loading = useSelector(state => state.receipts?.loading || false);

  // Search / filter / sort state lives in the shared hook
  const {
    searchTerm,
    setSearchTerm,
    selectedTenant,
    setSelectedTenant,
    selectedPaymentStatus,
    setSelectedPaymentStatus,
    sortBy,
    setSortBy,
    sortOrder,
    toggleSortOrder,
    showAll,
    setShowAll,
    uniqueTenants,
    filteredAndSortedReceipts,
    clearFilters,
    hasActiveFilters,
  } = useReceiptFiltering(receipts);

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // View receipt modal state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewReceipt, setViewReceipt] = useState(null);
  const [recordingPayment, setRecordingPayment] = useState(false);

  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const notify = (type, message) => dispatch(addNotification({ type, message }));

  const handleDownload = async receipt => {
    try {
      await dispatch(downloadReceipt(receipt.id)).unwrap();
      notify('success', 'Receipt downloaded successfully');
    } catch (error) {
      notify('error', error || 'Failed to download receipt');
    }
  };

  const handleSendEmail = async receipt => {
    if (receipt.email_sent) {
      notify('info', 'Email has already been sent for this receipt');
      return;
    }

    try {
      await dispatch(sendReceiptEmail(receipt.id)).unwrap();
      notify('success', 'Receipt sent via email successfully');
    } catch (error) {
      notify('error', error || 'Failed to send receipt email');
    }
  };

  const handleDelete = async receipt => {
    if (window.confirm('Are you sure you want to delete this receipt?')) {
      try {
        await dispatch(deleteReceipt(receipt.id)).unwrap();
        notify('success', 'Receipt deleted successfully');
      } catch (error) {
        notify('error', error || 'Failed to delete receipt');
      }
    }
  };

  const handleRecordPayment = receipt => {
    setSelectedReceipt(receipt);
    setIsPaymentModalOpen(true);
  };

  // View receipt handler
  const handleViewReceipt = receipt => {
    setViewReceipt(receipt);
    setIsViewModalOpen(true);
  };

  const handlePaymentSubmit = async paymentData => {
    if (!selectedReceipt) return;

    setRecordingPayment(true);
    try {
      await dispatch(
        recordPayment({
          id: selectedReceipt.id,
          paymentData,
        })
      ).unwrap();

      notify('success', 'Paiement enregistré avec succès');

      setIsPaymentModalOpen(false);
      setSelectedReceipt(null);
    } catch (error) {
      notify('error', error || "Échec de l'enregistrement du paiement");
    } finally {
      setRecordingPayment(false);
    }
  };

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchReceipts()).unwrap();
      setLastRefreshed(new Date());
      notify('success', 'Données mises à jour');
    } catch (error) {
      notify('error', error || 'Échec de la mise à jour des données');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Format last refreshed time
  const getLastRefreshedText = () => {
    const now = new Date();
    const diffMs = now - lastRefreshed;
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return "Mis à jour à l'instant";
    if (diffMins === 1) return 'Mis à jour il y a 1 minute';
    if (diffMins < 60) return `Mis à jour il y a ${diffMins} minutes`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return 'Mis à jour il y a 1 heure';
    return `Mis à jour il y a ${diffHours} heures`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by tenant name or month/year..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Filter and Sort Controls */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-2 rounded-md transition-colors ${
              isRefreshing
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title="Actualiser les données des quittances"
          >
            <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Last Updated Text */}
          <span className="text-xs text-gray-500 mr-2">{getLastRefreshedText()}</span>

          {/* Tenant Filter */}
          <select
            value={selectedTenant}
            onChange={e => setSelectedTenant(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Tenants</option>
            {uniqueTenants.map(tenant => (
              <option key={tenant.name} value={tenant.name}>
                {tenant.name}
              </option>
            ))}
          </select>

          <PaymentStatusFilter
            selectedStatus={selectedPaymentStatus}
            onStatusChange={setSelectedPaymentStatus}
            receipts={receipts}
            showCounts={true}
          />

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="date">Sort by Date</option>
            <option value="tenant">Sort by Tenant</option>
            <option value="month">Sort by Month</option>
          </select>

          {/* Sort Order Toggle */}
          <button
            onClick={toggleSortOrder}
            className="text-sm px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
          </button>

          {/* Show All Toggle */}
          <button
            onClick={() => setShowAll(!showAll)}
            className={`text-sm px-3 py-1 rounded-md focus:ring-2 focus:ring-blue-500 ${
              showAll
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {showAll ? 'Show Recent' : 'Show All'}
          </button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm px-3 py-1 text-gray-600 hover:text-gray-800 underline"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Results Count */}
        <div className="text-xs text-gray-500">
          Showing {filteredAndSortedReceipts.length} of {receipts.length} receipts
          {!showAll &&
            filteredAndSortedReceipts.length === 5 &&
            receipts.length > 5 &&
            ' (limited to 5)'}
        </div>
      </div>

      {/* Receipts List */}
      {filteredAndSortedReceipts.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            {receipts.length === 0
              ? 'No receipts generated yet'
              : 'No receipts match your search criteria'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedReceipts.map(receipt => (
            <ReceiptRow
              key={receipt.id}
              receipt={receipt}
              onView={handleViewReceipt}
              onRecordPayment={handleRecordPayment}
              onDownload={handleDownload}
              onSendEmail={handleSendEmail}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      <RecordPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setSelectedReceipt(null);
        }}
        onSubmit={handlePaymentSubmit}
        receipt={selectedReceipt}
        loading={recordingPayment}
      />

      {/* View Receipt Modal */}
      <ViewReceiptModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewReceipt(null);
        }}
        receipt={viewReceipt}
        onDownload={handleDownload}
        onSendEmail={handleSendEmail}
      />
    </div>
  );
};

export default RecentReceipts;
