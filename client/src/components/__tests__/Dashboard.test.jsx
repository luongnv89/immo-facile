/**
 * Dashboard navigation tests (#54, #55, #58):
 * - French tab labels, including Rappels reaching ReminderManagement
 * - URL-routed tabs: the active section lives in the location hash and
 *   survives refresh, re-render and history traversal
 * - no English chrome strings on the rendered dashboard shell
 * - lazy tab pages (#58): content resolves on first visit behind Suspense
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
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

beforeEach(() => {
  // Reset the hash between tests so navigation state never leaks
  window.history.replaceState(null, '', '/');
});

describe('Dashboard navigation (French chrome)', () => {
  it('exposes a Rappels tab in the dashboard navigation', () => {
    renderDashboard();

    expect(screen.getByRole('link', { name: 'Rappels' })).toBeInTheDocument();
  });

  it('renders the reminders page from the Rappels tab', async () => {
    renderDashboard();

    fireEvent.click(screen.getByRole('link', { name: 'Rappels' }));

    expect(await screen.findByText('Gestion des Rappels')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Statistiques/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Configuration/ })).toBeInTheDocument();
  });

  it('renders only French chrome labels on the dashboard shell', () => {
    renderDashboard();

    ['Tableau de bord', 'Appartements', 'Locataires', 'Propriétaire', 'Rappels'].forEach(label => {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    });
    expect(screen.getByText('Générer une quittance')).toBeInTheDocument();
    expect(screen.getByText('Quittances récentes')).toBeInTheDocument();

    // String audit spot-checks: known English chrome strings are gone (#54)
    expect(screen.queryByText('Generate Receipt')).not.toBeInTheDocument();
    expect(screen.queryByText('Recent Receipts')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Apartments' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Tenants' })).not.toBeInTheDocument();
  });
});

describe('URL-routed tabs (#55)', () => {
  it('updates the URL hash when a tab is selected', async () => {
    renderDashboard();

    fireEvent.click(screen.getByRole('link', { name: 'Locataires' }));

    expect(window.location.hash).toBe('#/tenants');
    expect(await screen.findByText('Gestion des locataires')).toBeInTheDocument();
  });

  it('restores the active section from the URL on a fresh mount (refresh)', async () => {
    window.location.hash = '#/apartments';

    renderDashboard();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Appartements' })
    ).toBeInTheDocument();
    expect(await screen.findByTestId('apartment-list-empty')).toBeInTheDocument();
  });

  it('keeps the active section across re-renders', async () => {
    const view = renderDashboard();

    fireEvent.click(screen.getByRole('link', { name: 'Propriétaire' }));
    expect(window.location.hash).toBe('#/owner');
    expect(await screen.findByText('Informations du propriétaire')).toBeInTheDocument();

    view.rerender(
      <Provider store={buildStore()}>
        <Dashboard />
      </Provider>
    );

    expect(screen.getByText('Informations du propriétaire')).toBeInTheDocument();
    expect(window.location.hash).toBe('#/owner');
  });

  it('follows browser back/forward via the hashchange event', async () => {
    renderDashboard();

    fireEvent.click(screen.getByRole('link', { name: 'Locataires' }));
    expect(await screen.findByText('Gestion des locataires')).toBeInTheDocument();

    // Simulate a back-navigation landing on the dashboard hash
    window.location.hash = '#/dashboard';
    fireEvent(window, new Event('hashchange'));

    expect(screen.getByText('Générer une quittance')).toBeInTheDocument();
  });

  it('falls back to the dashboard tab for unknown hashes', () => {
    window.location.hash = '#/does-not-exist';

    renderDashboard();

    expect(screen.getByText('Générer une quittance')).toBeInTheDocument();
  });
});
