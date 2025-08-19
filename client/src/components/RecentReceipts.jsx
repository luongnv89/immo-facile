import React, { useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { downloadReceipt, deleteReceipt, sendReceiptEmail } from '../store/slices/receiptSlice';
import { addNotification } from '../store/slices/uiSlice';
import { ArrowDownTrayIcon, TrashIcon, MagnifyingGlassIcon, FunnelIcon, EnvelopeIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const RecentReceipts = () => {
  const dispatch = useDispatch();
  const { items: receipts, loading } = useSelector(state => state.receipts);
  
  // State for search, filter, and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState('');
  const [sortBy, setSortBy] = useState('date'); // date, tenant, month
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [showAll, setShowAll] = useState(false);

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
        return tenantName.includes(searchTerm.toLowerCase()) || 
               monthYear.includes(searchTerm.toLowerCase());
      });
    }

    // Apply tenant filter
    if (selectedTenant) {
      filtered = filtered.filter(receipt => 
        `${receipt.firstName} ${receipt.lastName}` === selectedTenant
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'tenant':
          const nameA = `${a.firstName} ${a.lastName}`;
          const nameB = `${b.firstName} ${b.lastName}`;
          comparison = nameA.localeCompare(nameB);
          break;
        case 'month':
          const dateA = new Date(a.year, a.month - 1);
          const dateB = new Date(b.year, b.month - 1);
          comparison = dateA - dateB;
          break;
        case 'date':
        default:
          comparison = new Date(a.generated_at) - new Date(b.generated_at);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Limit to recent if not showing all
    return showAll ? filtered : filtered.slice(0, 5);
  }, [receipts, searchTerm, selectedTenant, sortBy, sortOrder, showAll]);

  const handleDownload = async (receipt) => {
    try {
      await dispatch(downloadReceipt(receipt.id)).unwrap();
      dispatch(addNotification({
        type: 'success',
        message: 'Receipt downloaded successfully'
      }));
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: error || 'Failed to download receipt'
      }));
    }
  };

  const handleSendEmail = async (receipt) => {
    if (receipt.email_sent) {
      dispatch(addNotification({
        type: 'info',
        message: 'Email has already been sent for this receipt'
      }));
      return;
    }

    try {
      await dispatch(sendReceiptEmail(receipt.id)).unwrap();
      dispatch(addNotification({
        type: 'success',
        message: 'Receipt sent via email successfully'
      }));
    } catch (error) {
      dispatch(addNotification({
        type: 'error',
        message: error || 'Failed to send receipt email'
      }));
    }
  };

  const handleDelete = async (receipt) => {
    if (window.confirm('Are you sure you want to delete this receipt?')) {
      try {
        await dispatch(deleteReceipt(receipt.id)).unwrap();
        dispatch(addNotification({
          type: 'success',
          message: 'Receipt deleted successfully'
        }));
      } catch (error) {
        dispatch(addNotification({
          type: 'error',
          message: error || 'Failed to delete receipt'
        }));
      }
    }
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTenant('');
    setSortBy('date');
    setSortOrder('desc');
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
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Filter and Sort Controls */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Tenant Filter */}
          <select
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Tenants</option>
            {uniqueTenants.map((tenant) => (
              <option key={tenant.id} value={tenant.name}>
                {tenant.name}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
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
          {(searchTerm || selectedTenant || sortBy !== 'date' || sortOrder !== 'desc') && (
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
          {!showAll && filteredAndSortedReceipts.length === 5 && receipts.length > 5 && ' (limited to 5)'}
        </div>
      </div>

      {/* Receipts List */}
      {filteredAndSortedReceipts.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            {receipts.length === 0 ? 'No receipts generated yet' : 'No receipts match your search criteria'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAndSortedReceipts.map((receipt) => (
            <div key={receipt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {receipt.firstName} {receipt.lastName}
                </p>
                <p className="text-xs text-gray-500">
                  {receipt.month}/{receipt.year} • €{receipt.amount}
                </p>
                <p className="text-xs text-gray-400 flex items-center space-x-2">
                  <span>{new Date(receipt.created_at).toLocaleDateString()}</span>
                  {receipt.email_sent && (
                    <span className="inline-flex items-center space-x-1 text-green-600">
                      <CheckCircleIcon className="h-3 w-3" />
                      <span>Email sent</span>
                    </span>
                  )}
                </p>
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleDownload(receipt)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  title="Download receipt"
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
                  title={receipt.email_sent ? "Email already sent" : "Send via email"}
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
                  title="Delete receipt"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentReceipts;
