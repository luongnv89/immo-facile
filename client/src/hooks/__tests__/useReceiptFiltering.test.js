/**
 * useReceiptFiltering Hook Tests.
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReceiptFiltering } from '../useReceiptFiltering';

const makeReceipt = overrides => ({
  id: 1,
  firstName: 'Jean',
  lastName: 'Dupont',
  tenant_id: 10,
  month: 1,
  year: 2026,
  amount: 800,
  payment_status: 'pending',
  generated_at: '2026-01-05T10:00:00Z',
  ...overrides,
});

const receipts = [
  makeReceipt({ id: 1 }),
  makeReceipt({
    id: 2,
    firstName: 'Marie',
    lastName: 'Martin',
    tenant_id: 20,
    month: 2,
    generated_at: '2026-02-05T10:00:00Z',
  }),
  makeReceipt({ id: 3, month: 3, generated_at: '2026-03-05T10:00:00Z' }),
];

describe('useReceiptFiltering', () => {
  it('sorts by date desc and limits to 5 by default', () => {
    const many = Array.from({ length: 7 }, (_, i) =>
      makeReceipt({
        id: i + 1,
        generated_at: `2026-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
      })
    );
    const { result } = renderHook(() => useReceiptFiltering(many));

    expect(result.current.filteredAndSortedReceipts).toHaveLength(5);
    expect(result.current.filteredAndSortedReceipts[0].id).toBe(7);
  });

  it('returns everything when showAll is true', () => {
    const many = Array.from({ length: 7 }, (_, i) =>
      makeReceipt({
        id: i + 1,
        generated_at: `2026-01-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
      })
    );
    const { result } = renderHook(() => useReceiptFiltering(many));

    act(() => result.current.setShowAll(true));
    expect(result.current.filteredAndSortedReceipts).toHaveLength(7);
  });

  it('filters by search term across tenant name (case-insensitive)', () => {
    const { result } = renderHook(() => useReceiptFiltering(receipts));

    act(() => result.current.setSearchTerm('marie'));
    expect(result.current.filteredAndSortedReceipts.map(r => r.id)).toEqual([2]);
  });

  it('filters by search term across month/year', () => {
    const { result } = renderHook(() => useReceiptFiltering(receipts));

    act(() => result.current.setSearchTerm('2/2026'));
    expect(result.current.filteredAndSortedReceipts.map(r => r.id)).toEqual([2]);
  });

  it('filters by exact tenant selection', () => {
    const { result } = renderHook(() => useReceiptFiltering(receipts));

    act(() => result.current.setSelectedTenant('Jean Dupont'));
    expect(result.current.filteredAndSortedReceipts.map(r => r.id)).toEqual([3, 1]);
  });

  it('applies the payment status filter with pending as implicit default', () => {
    const noStatus = [
      makeReceipt({ id: 1 }),
      makeReceipt({ id: 2, firstName: 'Marie', lastName: 'Martin', payment_status: 'paid' }),
    ];
    const { result } = renderHook(() => useReceiptFiltering(noStatus));

    act(() => result.current.setSelectedPaymentStatus('pending'));
    expect(result.current.filteredAndSortedReceipts.map(r => r.id)).toEqual([1]);

    act(() => result.current.setSelectedPaymentStatus('paid'));
    expect(result.current.filteredAndSortedReceipts.map(r => r.id)).toEqual([2]);
  });

  it('sorts by tenant alphabetically in both directions', () => {
    const { result } = renderHook(() => useReceiptFiltering(receipts));

    act(() => result.current.setSortBy('tenant'));
    act(() => result.current.toggleSortOrder()); // desc -> asc
    expect(result.current.sortOrder).toBe('asc');
    expect(result.current.filteredAndSortedReceipts[0].lastName).toBe('Dupont');

    act(() => result.current.toggleSortOrder()); // asc -> desc
    expect(result.current.sortOrder).toBe('desc');
    expect(result.current.filteredAndSortedReceipts[0].lastName).toBe('Martin');
  });

  it('sorts by month chronologically regardless of generated_at order', () => {
    const shuffled = [
      makeReceipt({ id: 1, month: 3, generated_at: '2026-01-01T10:00:00Z' }),
      makeReceipt({ id: 2, firstName: 'Marie', lastName: 'Martin', month: 1 }),
      makeReceipt({ id: 3, month: 2, generated_at: '2026-03-01T10:00:00Z' }),
    ];
    const { result } = renderHook(() => useReceiptFiltering(shuffled));

    act(() => result.current.setSortBy('month'));
    act(() => result.current.toggleSortOrder()); // asc
    expect(result.current.filteredAndSortedReceipts.map(r => r.id)).toEqual([2, 3, 1]);
  });

  it('builds a deduplicated, alphabetically sorted tenant list', () => {
    const { result } = renderHook(() => useReceiptFiltering(receipts));

    expect(result.current.uniqueTenants).toEqual([
      { name: 'Jean Dupont', id: 10 },
      { name: 'Marie Martin', id: 20 },
    ]);
  });

  it('tracks active filters and clears them back to defaults', () => {
    const { result } = renderHook(() => useReceiptFiltering(receipts));
    expect(result.current.hasActiveFilters).toBe(false);

    act(() => {
      result.current.setSearchTerm('dupont');
      result.current.setSortBy('month');
      result.current.toggleSortOrder();
      result.current.setSelectedTenant('Jean Dupont');
      result.current.setSelectedPaymentStatus('pending');
      result.current.setShowAll(true);
    });
    expect(result.current.hasActiveFilters).toBe(true);

    act(() => result.current.clearFilters());
    expect(result.current.searchTerm).toBe('');
    expect(result.current.selectedTenant).toBe('');
    expect(result.current.selectedPaymentStatus).toBe('');
    expect(result.current.sortBy).toBe('date');
    expect(result.current.sortOrder).toBe('desc');
    expect(result.current.hasActiveFilters).toBe(false);
    // showAll is a display toggle, not a filter — clearing leaves it alone
    expect(result.current.showAll).toBe(true);
  });
});
