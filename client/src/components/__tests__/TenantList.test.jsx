/**
 * TenantList state tests (#56): French empty state with an embedded CTA and
 * an error state with retry; deletion goes through the in-app ConfirmDialog.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import TenantList from '../TenantList';
import { fetchTenants } from '../../store/slices/tenantSlice';
import fr from '../../i18n/fr';

vi.mock('../../store/slices/tenantSlice', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    fetchTenants: vi.fn(() => ({ type: 'tenants/fetch' })),
    deleteTenant: vi.fn(() => ({ type: 'tenants/delete' })),
  };
});

const buildStore = tenantState =>
  configureStore({
    reducer: {
      tenants: () => tenantState,
      apartments: () => ({ items: [], loading: false, error: null }),
      notifications: () => ({ items: [] }),
    },
  });

const setup = (tenantState, props = {}) => {
  const store = buildStore(tenantState);
  const dispatchSpy = vi.spyOn(store, 'dispatch');
  render(
    <Provider store={store}>
      <TenantList {...props} />
    </Provider>
  );
  return { dispatchSpy };
};

const emptyState = { items: [], loading: false, error: null };

describe('TenantList states', () => {
  it('renders the French empty state with an embedded CTA', () => {
    setup(emptyState);

    expect(screen.getByText(fr.tenants.emptyTitle)).toBeInTheDocument();
    const cta = screen.getByRole('link', { name: fr.tenants.emptyCta });
    expect(cta).toBeInTheDocument();
    expect(cta.getAttribute('href')).toBe('#/tenants/new');
  });

  it('renders an error state with a retry button that re-fetches', () => {
    const { dispatchSpy } = setup({ ...emptyState, error: 'oops' });

    fireEvent.click(screen.getByRole('button', { name: fr.common.retry }));

    expect(fetchTenants).toHaveBeenCalled();
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'tenants/fetch' }));
  });

  it('opens the in-app delete confirmation instead of window.confirm', async () => {
    window.confirm = vi.fn();
    setup({
      ...emptyState,
      items: [
        {
          id: 1,
          firstName: 'Jean',
          lastName: 'Dupont',
          email: 'jean@example.com',
          rentAmount: 800,
        },
      ],
    });

    fireEvent.click(screen.getByTitle(fr.tenants.deleteAction));

    expect(window.confirm).not.toHaveBeenCalled();
    expect(await screen.findByTestId('confirm-dialog')).toBeInTheDocument();
    expect(screen.getByText(/« Jean Dupont »/)).toBeInTheDocument();

    // Cancel keeps the row
    fireEvent.click(screen.getByRole('button', { name: fr.common.cancel }));
    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
  });
});
