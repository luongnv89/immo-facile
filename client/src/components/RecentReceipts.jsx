import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchReceipts,
  downloadReceipt,
  deleteReceipt,
  sendReceiptEmail,
  recordPayment, // Task 1.1.5: Import Redux action
} from '../store/slices/receiptSlice';
import { addNotification } from '../store/slices/uiSlice';
import {
  ArrowDownTrayIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  EyeIcon,
  CurrencyEuroIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  DocumentMagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { PaymentStatusBadge, PaymentStatusFilter, RecordPaymentModal } from './payments';
import ViewReceiptModal from './ViewReceiptModal';

const RecentReceipts = () => {
  const dispatch = useDispatch();
  const receipts = useSelector(state => state.receipts?.items || []);
  const loading = useSelector(state => state.receipts?.loading || false);

  // State for search, filter, and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState('');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState(''); // Task 1.1.4: Payment status filter
  const [sortBy, setSortBy] = useState('date'); // date, tenant, month
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [showAll, setShowAll] = useState(false);

  // Task 1.1.4: Payment modal state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // View receipt modal state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewReceipt, setViewReceipt] = useState(null);
  const [recordingPayment, setRecordingPayment] = useState(false);

  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Get unique tenants for filter dropdown
  const uniqueTenants = useMemo(() => {
    const tenants = receipts.reduce((acc, receipt) => {
      const tenantName = `${receipt.firstName} ${receipt.lastName}`;
      if (!acc.find(t => t.name === tenantName)) {
        acc.push({ name: tenantName, id: receipt.tenant_id });
      }
      return acc;
    }, []);
    return tenants.sort((a, b) => a.name.localeCompare(b.name));
  }, [receipts]);

  // Filter and sort receipts
  const filteredAndSortedReceipts = useMemo(() => {
    let filtered = receipts.slice();

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(receipt => {
        const tenantName = `${receipt.firstName} ${receipt.lastName}`.toLowerCase();
        const monthYear = `${receipt.month}/${receipt.year}`;
        return (
          tenantName.includes(searchTerm.toLowerCase()) ||
          monthYear.includes(searchTerm.toLowerCase())
        );
      });
    }

    // Apply tenant filter
    if (selectedTenant) {
      filtered = filtered.filter(
        receipt => `${receipt.firstName} ${receipt.lastName}` === selectedTenant
      );
    }

    // Task 1.1.4: Apply payment status filter
    if (selectedPaymentStatus) {
      filtered = filtered.filter(
        receipt => (receipt.payment_status || 'pending') === selectedPaymentStatus
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'tenant': {
          const nameA = `${a.firstName} ${a.lastName}`;
          const nameB = `${b.firstName} ${b.lastName}`;
          comparison = nameA.localeCompare(nameB);
          break;
        }
        case 'month': {
          const dateA = new Date(a.year, a.month - 1);
          const dateB = new Date(b.year, b.month - 1);
          comparison = dateA - dateB;
          break;
        }
        case 'date':
        default: {
          comparison = new Date(a.generated_at) - new Date(b.generated_at);
          break;
        }
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Limit to recent if not showing all
    return showAll ? filtered : filtered.slice(0, 5);
  }, [receipts, searchTerm, selectedTenant, selectedPaymentStatus, sortBy, sortOrder, showAll]);

  const handleDownload = async receipt => {
    try {
      await dispatch(downloadReceipt(receipt.id)).unwrap();
      dispatch(
        addNotification({
          type: 'success',
          message: 'Receipt downloaded successfully',
        })
      );
    } catch (error) {
      dispatch(
        addNotification({
          type: 'error',
          message: error || 'Failed to download receipt',
        })
      );
    }
  };

  const handleSendEmail = async receipt => {
    if (receipt.email_sent) {
      dispatch(
        addNotification({
          type: 'info',
          message: 'Email has already been sent for this receipt',
        })
      );
      return;
    }

    try {
      await dispatch(sendReceiptEmail(receipt.id)).unwrap();
      dispatch(
        addNotification({
          type: 'success',
          message: 'Receipt sent via email successfully',
        })
      );
    } catch (error) {
      dispatch(
        addNotification({
          type: 'error',
          message: error || 'Failed to send receipt email',
        })
      );
    }
  };

  const handleDelete = async receipt => {
    if (window.confirm('Are you sure you want to delete this receipt?')) {
      try {
        await dispatch(deleteReceipt(receipt.id)).unwrap();
        dispatch(
          addNotification({
            type: 'success',
            message: 'Receipt deleted successfully',
          })
        );
      } catch (error) {
        dispatch(
          addNotification({
            type: 'error',
            message: error || 'Failed to delete receipt',
          })
        );
      }
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTenant('');
    setSelectedPaymentStatus(''); // Task 1.1.4
    setSortBy('date');
    setSortOrder('desc');
  };

  // Task 1.1.4: Payment tracking handlers
  const handleRecordPayment = receipt => {
    setSelectedReceipt(receipt);
    setIsPaymentModalOpen(true);
  };

  // View receipt handler
  const handleViewReceipt = receipt => {
    setViewReceipt(receipt);
    setIsViewModalOpen(true);
  };

  // Task 1.1.5: Use Redux action for recording payment
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

      dispatch(
        addNotification({
          type: 'success',
          message: 'Paiement enregistré avec succès',
        })
      );

      setIsPaymentModalOpen(false);
      setSelectedReceipt(null);
    } catch (error) {
      dispatch(
        addNotification({
          type: 'error',
          message: error || "Échec de l'enregistrement du paiement",
        })
      );
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
      dispatch(
        addNotification({
          type: 'success',
          message: 'Données mises à jour',
        })
      );
    } catch (error) {
      dispatch(
        addNotification({
          type: 'error',
          message: error || 'Échec de la mise à jour des données',
        })
      );
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

  // Task 1.1.4: Calculate days overdue
  const getDaysOverdue = receipt => {
    if (!receipt.month || !receipt.year) return 0;

    // Assume payment is due on the 5th of the following month
    const dueDate = new Date(receipt.year, receipt.month, 5);
    const today = new Date();
    const diffTime = today - dueDate;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays > 0 ? diffDays : 0;
  };

  // Task 1.1.4: Check if receipt is overdue
  const isOverdue = receipt => {
    const status = receipt.payment_status || 'pending';
    return status !== 'paid' && getDaysOverdue(receipt) > 5;
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

          {/* Task 1.1.4: Payment Status Filter */}
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
          {(searchTerm ||
            selectedTenant ||
            selectedPaymentStatus ||
            sortBy !== 'date' ||
            sortOrder !== 'desc') && (
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
          {filteredAndSortedReceipts.map(receipt => {
            const overdueStatus = isOverdue(receipt);
            const daysOverdue = getDaysOverdue(receipt);

            return (
              <div
                key={receipt.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  overdueStatus ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {receipt.firstName} {receipt.lastName}
                    </p>
                    {/* Task 1.1.4: Payment Status Badge */}
                    <PaymentStatusBadge status={receipt.payment_status || 'pending'} size="sm" />
                    {/* Task 1.1.4: Overdue Indicator */}
                    {overdueStatus && (
                      <span className="inline-flex items-center gap-1 text-xs text-red-600 font-medium">
                        <ExclamationTriangleIcon className="h-3 w-3" />
                        {daysOverdue}j en retard
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {receipt.month}/{receipt.year} • €{receipt.amount}
                    {receipt.payment_method && (
                      <span className="ml-2 text-gray-400">
                        •{' '}
                        {receipt.payment_method === 'bank_transfer'
                          ? 'Virement'
                          : receipt.payment_method === 'check'
                            ? 'Chèque'
                            : receipt.payment_method === 'cash'
                              ? 'Espèces'
                              : 'Autre'}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 flex items-center space-x-2">
                    <span>
                      {new Date(receipt.generated_at || receipt.created_at).toLocaleDateString(
                        'fr-FR'
                      )}
                    </span>
                    {receipt.email_sent && (
                      <span className="inline-flex items-center space-x-1 text-green-600">
                        <CheckCircleIcon className="h-3 w-3" />
                        <span>Email envoyé</span>
                      </span>
                    )}
                    {receipt.email_opened && (
                      <span className="inline-flex items-center space-x-1 text-blue-600">
                        <EyeIcon className="h-3 w-3" />
                        <span>Ouvert</span>
                      </span>
                    )}
                    {receipt.payment_date && (
                      <span className="inline-flex items-center space-x-1 text-green-600">
                        <CheckCircleIcon className="h-3 w-3" />
                        <span>
                          Payé le {new Date(receipt.payment_date).toLocaleDateString('fr-FR')}
                        </span>
                      </span>
                    )}
                  </p>
                </div>

                <div className="flex items-center space-x-1">
                  {/* View Receipt Action */}
                  <button
                    onClick={() => handleViewReceipt(receipt)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Voir la quittance"
                  >
                    <DocumentMagnifyingGlassIcon className="h-4 w-4" />
                  </button>
                  {/* Task 1.1.4: Record Payment Quick Action */}
                  {receipt.payment_status !== 'paid' && (
                    <button
                      onClick={() => handleRecordPayment(receipt)}
                      className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                      title="Enregistrer le paiement"
                    >
                      <CurrencyEuroIcon className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(receipt)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Télécharger la quittance"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleSendEmail(receipt)}
                    disabled={receipt.email_sent}
                    className={`p-1 transition-colors ${
                      receipt.email_sent
                        ? 'text-green-500 cursor-not-allowed'
                        : 'text-gray-400 hover:text-green-600'
                    }`}
                    title={receipt.email_sent ? 'Email déjà envoyé' : 'Envoyer par email'}
                  >
                    {receipt.email_sent ? (
                      <CheckCircleIcon className="h-4 w-4" />
                    ) : (
                      <EnvelopeIcon className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(receipt)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Supprimer la quittance"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task 1.1.4: Record Payment Modal */}
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
