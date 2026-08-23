/**
 * Dashboard navigation tests — the Rappels tab must reach ReminderManagement.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import Dashboard from '../Dashboard';

vi.mock('../../store/slices/tenantSlice', () => ({
  fetchTenants: vi.fn(() => ({ type: 'tenants/fetch' })),
}));
vi.mock('../../store/slices/receiptSlice', () => ({
  fetchReceipts: vi.fn(() => ({ type: 'receipts/fetch' })),
}));
vi.mock('../../store/slices/apartmentSlice', () => ({
  fetchApartments: vi.fn(() => ({ type: 'apartments/fetch' })),
}));

const buildStore = () =>
  configureStore({
    reducer: {
      tenants: () => ({ items: [], status: 'idle', error: null }),
      receipts: () => ({ items: [], status: 'idle', error: null }),
      apartments: () => ({ items: [], status: 'idle', error: null }),
      notifications: () => ({ items: [] }),
      owner: () => ({}),
    },
  });

const renderDashboard = () =>
  render(
    <Provider store={buildStore()}>
      <Dashboard />
    </Provider>
  );

describe('Dashboard navigation', () => {
  it('exposes a Rappels tab in the dashboard navigation', () => {
    renderDashboard();

    expect(screen.getByRole('button', { name: 'Rappels' })).toBeInTheDocument();
  });

  it('renders the reminders page in at most one click from the dashboard', () => {
    renderDashboard();

    fireEvent.click(screen.getByRole('button', { name: 'Rappels' }));

    expect(screen.getByText('Gestion des Rappels')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Statistiques/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Configuration/ })).toBeInTheDocument();
  });
});
