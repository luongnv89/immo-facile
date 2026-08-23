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
import ConfirmDialog from './common/ConfirmDialog';
import fr, { TOUCH_TARGET_CLASS, MONTHS_FR } from '../i18n/fr';
import { useReceiptFiltering } from '../hooks/useReceiptFiltering';

const RecentReceipts = () => {
  const dispatch = useDispatch();
  const receipts = useSelector(state => state.receipts?.items || []);
  const loading = useSelector(state => state.receipts?.loading || false);
  const error = useSelector(state => state.receipts?.error || null);

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

  // Delete confirmation state (#55): in-app dialog instead of window.confirm
  const [receiptToDelete, setReceiptToDelete] = useState(null);

  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const notify = (type, message) => dispatch(addNotification({ type, message }));

  const handleDownload = async receipt => {
    try {
      await dispatch(downloadReceipt(receipt.id)).unwrap();
      notify('success', fr.feed.downloaded);
    } catch (err) {
      notify('error', err || fr.feed.errDownload);
    }
  };

  const handleSendEmail = async receipt => {
    if (receipt.email_sent) {
      notify('info', fr.feed.emailAlreadySent);
      return;
    }

    try {
      await dispatch(sendReceiptEmail(receipt.id)).unwrap();
      notify('success', fr.feed.emailSent);
    } catch (err) {
      notify('error', err || fr.feed.errEmail);
    }
  };

  const confirmDelete = async () => {
    const receipt = receiptToDelete;
    setReceiptToDelete(null);
    if (!receipt) return;
    try {
      await dispatch(deleteReceipt(receipt.id)).unwrap();
      notify('success', fr.feed.deleted);
    } catch (err) {
      notify('error', err || fr.feed.errDelete);
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

      notify('success', fr.feed.paymentRecorded);

      setIsPaymentModalOpen(false);
      setSelectedReceipt(null);
    } catch (err) {
      notify('error', err || fr.feed.errPayment);
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
      notify('success', fr.feed.refreshed);
    } catch (err) {
      notify('error', err || fr.feed.errRefresh);
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

  const formatPeriod = receipt => {
    const monthIndex = parseInt(receipt.month, 10);
    // Legacy rows may carry a non-numeric month label — fall back to raw text
    if (Number.isNaN(monthIndex)) return `${receipt.month} ${receipt.year}`;
    return `${MONTHS_FR[(monthIndex - 1 + 12) % 12]} ${receipt.year}`;
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder={fr.feed.searchPlaceholder}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Filter and Sort Controls */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`${TOUCH_TARGET_CLASS} rounded-md transition-colors ${
              isRefreshing
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title={fr.feed.refresh}
          >
            <ArrowPathIcon className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Last Updated Text */}
          <span className="text-xs text-gray-500 mr-2">{getLastRefreshedText()}</span>

          {/* Tenant Filter */}
          <select
            value={selectedTenant}
            onChange={e => setSelectedTenant(e.target.value)}
            aria-label={fr.feed.allTenants}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">{fr.feed.allTenants}</option>
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
            aria-label={fr.feed.sortByDate}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="date">{fr.feed.sortByDate}</option>
            <option value="tenant">{fr.feed.sortByTenant}</option>
            <option value="month">{fr.feed.sortByMonth}</option>
          </select>

          {/* Sort Order Toggle */}
          <button
            type="button"
            onClick={toggleSortOrder}
            className="inline-flex h-11 items-center text-sm px-3 border border-gray-300 rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {sortOrder === 'asc' ? fr.feed.asc : fr.feed.desc}
          </button>

          {/* Show All Toggle */}
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className={`inline-flex h-11 items-center text-sm px-3 rounded-md focus:ring-2 focus:ring-blue-500 ${
              showAll
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {showAll ? fr.feed.showRecent : fr.feed.showAll}
          </button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex h-11 items-center text-sm px-3 text-gray-600 hover:text-gray-800 underline"
            >
              {fr.feed.clearFilters}
            </button>
          )}
        </div>

        {/* Results Count */}
        <div className="text-xs text-gray-500">
          {fr.feed.showing(filteredAndSortedReceipts.length, receipts.length)}
          {!showAll &&
            filteredAndSortedReceipts.length === 5 &&
            receipts.length > 5 &&
            fr.feed.limited}
        </div>
      </div>

      {/* Receipts List — the loading spinner is scoped to this region (#56),
          so the filter controls above stay visible and usable. */}
      {loading ? (
        <div className="flex justify-center py-8" data-testid="receipts-list-loading">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-md p-4" role="alert">
          <p className="text-red-800">{fr.feed.errLoad}</p>
          <p className="mt-1 text-sm text-red-700">{error}</p>
          <button
            type="button"
            onClick={() => dispatch(fetchReceipts())}
            data-testid="receipts-retry"
            className="mt-3 inline-flex h-11 items-center rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {fr.common.retry}
          </button>
        </div>
      ) : filteredAndSortedReceipts.length === 0 ? (
        <div className="text-center py-4" data-testid="receipts-list-empty">
          <p className="text-sm text-gray-500">
            {receipts.length === 0 ? fr.feed.emptyNoReceipts : fr.feed.emptyNoMatch}
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
              onDelete={setReceiptToDelete}
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

      <ConfirmDialog
        isOpen={Boolean(receiptToDelete)}
        title={fr.feed.confirmDeleteTitle}
        message={
          receiptToDelete
            ? fr.feed.confirmDeleteMessage(
                `${receiptToDelete.firstName} ${receiptToDelete.lastName}`,
                formatPeriod(receiptToDelete)
              )
            : ''
        }
        confirmLabel={fr.common.delete}
        onCancel={() => setReceiptToDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default RecentReceipts;
