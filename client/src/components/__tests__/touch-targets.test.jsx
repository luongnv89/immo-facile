/**
 * Touch-target tests (#56): row-action buttons must present a computed hit
 * area of at least 44x44px (h-11/w-11 = 44px at default font size).
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ReceiptRow } from '../receipts';
import TenantList from '../TenantList';
import ApartmentList from '../ApartmentList';

const baseReceipt = {
  id: 1,
  firstName: 'Marie',
  lastName: 'Martin',
  month: 8,
  year: 2026,
  amount: 800,
  payment_status: 'pending',
  generated_at: '2026-08-01T09:00:00Z',
};

const H_11 = 'h-11';
const W_11 = 'w-11';

const expectTouchTarget = button => {
  expect(button.className).toContain(H_11);
  expect(button.className).toContain(W_11);
};

describe('44x44 touch targets (#56)', () => {
  it('gives every receipt row action a >=44px hit area', () => {
    const noop = () => {};
    const { container } = render(
      <ReceiptRow
        receipt={baseReceipt}
        onView={noop}
        onRecordPayment={noop}
        onDownload={noop}
        onSendEmail={noop}
        onDelete={noop}
      />
    );

    const actions = container.querySelectorAll('button');
    expect(actions.length).toBeGreaterThanOrEqual(4);
    actions.forEach(expectTouchTarget);
  });

  it('gives every tenant row action a >=44px hit area', () => {
    const store = configureStore({
      reducer: {
        tenants: () => ({
          items: [
            {
              id: 1,
              firstName: 'Jean',
              lastName: 'Dupont',
              email: 'jean@example.com',
              rentAmount: 800,
            },
          ],
          loading: false,
          error: null,
        }),
        notifications: () => ({ items: [] }),
      },
    });
    const { container } = render(
      <Provider store={store}>
        <TenantList />
      </Provider>
    );

    const actions = container.querySelectorAll('button[title]');
    expect(actions.length).toBe(2); // edit + delete
    actions.forEach(expectTouchTarget);
  });

  it('gives every apartment row action a >=44px hit area', () => {
    const store = configureStore({
      reducer: {
        apartments: () => ({
          items: [{ id: 1, name: '2A', address: '1 rue', city: 'Versailles', postalCode: '78000' }],
          loading: false,
          error: null,
        }),
        notifications: () => ({ items: [] }),
      },
    });
    const { container } = render(
      <Provider store={store}>
        <ApartmentList />
      </Provider>
    );

    const actions = container.querySelectorAll('button[title]');
    expect(actions.length).toBe(2); // edit + delete
    actions.forEach(expectTouchTarget);
  });
});
