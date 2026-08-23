/**
 * RecentReceipts state tests (#56): the receipts feed must render an error
 * state with a working retry, a spinner scoped to the list region (controls
 * stay visible), and French empty states.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import RecentReceipts from '../RecentReceipts';
import { fetchReceipts } from '../../store/slices/receiptSlice';
import fr from '../../i18n/fr';

vi.mock('../../store/slices/receiptSlice', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    fetchReceipts: vi.fn(() => ({ type: 'receipts/fetch' })),
    downloadReceipt: vi.fn(() => ({ type: 'receipts/download' })),
    deleteReceipt: vi.fn(() => ({ type: 'receipts/delete' })),
    sendReceiptEmail: vi.fn(() => ({ type: 'receipts/sendEmail' })),
    recordPayment: vi.fn(() => ({ type: 'receipts/recordPayment' })),
  };
});

const baseState = {
  items: [],
  loading: false,
  error: null,
  generating: false,
};

const buildStore = receiptsState =>
  configureStore({
    reducer: {
      tenants: () => ({ items: [], loading: false, error: null }),
      apartments: () => ({ items: [], loading: false, error: null }),
      notifications: () => ({ items: [] }),
      owner: () => ({}),
      receipts: () => receiptsState,
    },
  });

const setup = receiptsState => {
  const store = buildStore(receiptsState);
  const dispatchSpy = vi.spyOn(store, 'dispatch');
  render(
    <Provider store={store}>
      <RecentReceipts />
    </Provider>
  );
  return dispatchSpy;
};

describe('RecentReceipts feed states (#56)', () => {
  it('renders an error state with retry and retries on click', () => {
    const dispatchSpy = setup({ ...baseState, error: 'Network down' });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    const retry = screen.getByTestId('receipts-retry');
    fireEvent.click(retry);

    expect(fetchReceipts).toHaveBeenCalled();
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'receipts/fetch' }));
  });

  it('scopes the loading spinner to the list region, keeping controls visible', () => {
    setup({ ...baseState, loading: true });

    // Spinner lives in the list region only…
    expect(screen.getByTestId('receipts-list-loading')).toBeInTheDocument();
    // …while search/filter controls remain rendered above it.
    expect(screen.getByPlaceholderText(fr.feed.searchPlaceholder)).toBeInTheDocument();
  });

  it('renders the French empty state when no receipts exist', () => {
    setup(baseState);

    expect(screen.getByTestId('receipts-list-empty')).toBeInTheDocument();
    expect(screen.getByText(fr.feed.emptyNoReceipts)).toBeInTheDocument();
  });

  it('renders the filtered-out empty variant when nothing matches', () => {
    setup({
      ...baseState,
      items: [
        {
          id: 1,
          firstName: 'Marie',
          lastName: 'Martin',
          month: 8,
          year: 2026,
          amount: 800,
          generated_at: '2026-08-01T09:00:00Z',
        },
      ],
    });

    fireEvent.change(screen.getByPlaceholderText(fr.feed.searchPlaceholder), {
      target: { value: 'inconnu-au-bataillon' },
    });

    expect(screen.getByText(fr.feed.emptyNoMatch)).toBeInTheDocument();
  });
});
