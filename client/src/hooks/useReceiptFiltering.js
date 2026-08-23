import { useMemo, useState } from 'react';

const tenantNameOf = receipt => `${receipt.firstName} ${receipt.lastName}`;

/**
 * Search / tenant / payment-status filtering plus sorting and the
 * recent-only slice for the receipts list (Task 5.9 / F-CLEAN-003).
 *
 * @param {Array} receipts - Receipt items from the Redux store.
 * @returns {Object} Filter state, setters and derived values.
 */
export const useReceiptFiltering = receipts => {
  // State for search, filter, and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState('');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState(''); // Task 1.1.4
  const [sortBy, setSortBy] = useState('date'); // date, tenant, month
  const [sortOrder, setSortOrder] = useState('desc'); // asc, desc
  const [showAll, setShowAll] = useState(false);

  // Get unique tenants for filter dropdown
  const uniqueTenants = useMemo(() => {
    const tenants = receipts.reduce((acc, receipt) => {
      const name = tenantNameOf(receipt);
      if (!acc.find(t => t.name === name)) {
        acc.push({ name, id: receipt.tenant_id });
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
        const tenantName = tenantNameOf(receipt).toLowerCase();
        const monthYear = `${receipt.month}/${receipt.year}`;
        return (
          tenantName.includes(searchTerm.toLowerCase()) ||
          monthYear.includes(searchTerm.toLowerCase())
        );
      });
    }

    // Apply tenant filter
    if (selectedTenant) {
      filtered = filtered.filter(receipt => tenantNameOf(receipt) === selectedTenant);
    }

    // Task 1.1.4: Apply payment status filter
    if (selectedPaymentStatus) {
      filtered = filtered.filter(
        receipt => (receipt.payment_status || 'pending') === selectedPaymentStatus
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const comparison = (() => {
        switch (sortBy) {
          case 'tenant':
            return tenantNameOf(a).localeCompare(tenantNameOf(b));
          case 'month':
            return new Date(a.year, a.month - 1) - new Date(b.year, b.month - 1);
          case 'date':
          default:
            return new Date(a.generated_at) - new Date(b.generated_at);
        }
      })();

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Limit to recent if not showing all
    return showAll ? filtered : filtered.slice(0, 5);
  }, [receipts, searchTerm, selectedTenant, selectedPaymentStatus, sortBy, sortOrder, showAll]);

  const toggleSortOrder = () => {
    setSortOrder(order => (order === 'asc' ? 'desc' : 'asc'));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTenant('');
    setSelectedPaymentStatus(''); // Task 1.1.4
    setSortBy('date');
    setSortOrder('desc');
  };

  const hasActiveFilters =
    Boolean(searchTerm) ||
    Boolean(selectedTenant) ||
    Boolean(selectedPaymentStatus) ||
    sortBy !== 'date' ||
    sortOrder !== 'desc';

  return {
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
  };
};
