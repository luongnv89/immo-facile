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
import { setFormDirty, resetFormDirty } from '../../utils/dirtyForm';
import fr from '../../i18n/fr';

vi.mock('../../store/slices/tenantSlice', () => ({
  fetchTenants: vi.fn(() => ({ type: 'tenants/fetch' })),
  createTenant: vi.fn(payload => ({ type: 'tenants/create', payload })),
  updateTenant: vi.fn(payload => ({ type: 'tenants/update', payload })),
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
  resetFormDirty();
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

describe('dirty-form navigation gate (#113)', () => {
  it('asks for confirmation before switching tabs while a form is dirty', async () => {
    setFormDirty('#/tenants/new');
    renderDashboard();

    fireEvent.click(screen.getByRole('link', { name: 'Appartements' }));

    expect(await screen.findByTestId('confirm-dialog')).toBeInTheDocument();
    expect(window.location.hash).not.toBe('#/apartments');

    // Continuing the edit just closes the dialog — no navigation
    fireEvent.click(screen.getByRole('button', { name: fr.modals.dirtyConfirm.cancelLabel }));
    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
  });

  it('confirms a pending tab navigation after abandonment', async () => {
    setFormDirty('#/tenants/new');
    renderDashboard();

    fireEvent.click(screen.getByRole('link', { name: 'Appartements' }));
    fireEvent.click(
      await screen.findByRole('button', { name: fr.modals.dirtyConfirm.confirmLabel })
    );

    expect(window.location.hash).toBe('#/apartments');
    fireEvent(window, new Event('hashchange'));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Appartements' })
    ).toBeInTheDocument();
  });

  it('reverts a hashchange away from a dirty form and asks first', async () => {
    setFormDirty('#/tenants/new');
    renderDashboard();

    window.location.hash = '#/tenants';
    fireEvent(window, new Event('hashchange'));

    // URL reverted to the dirty route while the dialog is open
    expect(await screen.findByTestId('confirm-dialog')).toBeInTheDocument();
    expect(window.location.hash).toBe('#/tenants/new');

    fireEvent.click(screen.getByRole('button', { name: fr.modals.dirtyConfirm.confirmLabel }));
    expect(window.location.hash).toBe('#/tenants');
  });

  it('Escape on the nav-gate dialog does not double-fire the form dialog', async () => {
    window.history.replaceState(null, '', '/#/tenants/new');
    renderDashboard();

    // the lazy form page mounts; typing makes it dirty
    const firstName = await screen.findByLabelText(fr.tenants.firstName);
    fireEvent.change(firstName, { target: { value: 'X' } });

    fireEvent.click(screen.getByRole('link', { name: 'Appartements' }));
    expect(await screen.findByTestId('confirm-dialog')).toBeInTheDocument();

    // Escape closes only the nav-gate dialog — the form's own dirty
    // confirm must not stack on top of it.
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText(fr.tenants.firstName)).toHaveValue('X');
    expect(window.location.hash).toBe('#/tenants/new');

    // A second Escape reaches the form's own dirty-confirm normally.
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(await screen.findByTestId('confirm-dialog')).toBeInTheDocument();
  });
});
