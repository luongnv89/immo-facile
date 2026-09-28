/**
 * TenantFormPage smoke tests (#113): edit-mode fetch-by-id fills the form,
 * create submit dispatches the create thunk and navigates back to the list
 * hash, and dirty input gates Cancel behind the ConfirmDialog.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import TenantFormPage from '../TenantFormPage';
import { createTenant, updateTenant } from '../../store/slices/tenantSlice';
import { tenantAPI } from '../../services/api';
import { resetFormDirty } from '../../utils/dirtyForm';
import fr from '../../i18n/fr';

const okAction = (type, payload) => ({
  type,
  payload,
  unwrap: () => Promise.resolve(payload),
});

vi.mock('../../store/slices/tenantSlice', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    fetchTenants: vi.fn(() => ({ type: 'tenants/fetch' })),
    createTenant: vi.fn(payload => okAction('tenants/create', payload)),
    updateTenant: vi.fn(payload => okAction('tenants/update', payload)),
  };
});

vi.mock('../../store/slices/apartmentSlice', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    fetchApartments: vi.fn(() => ({ type: 'apartments/fetch' })),
  };
});

vi.mock('../../services/api', () => ({
  tenantAPI: { getById: vi.fn() },
  apartmentAPI: { getById: vi.fn() },
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const APARTMENTS = [{ id: 2, name: 'Studio 1', address: '1 rue A', city: 'Paris' }];

const buildStore = () =>
  configureStore({
    reducer: {
      tenants: () => ({ items: [], loading: false, error: null }),
      apartments: () => ({ items: APARTMENTS, loading: false, error: null }),
      ui: () => ({ notifications: [] }),
    },
  });

const setup = props =>
  render(
    <Provider store={buildStore()}>
      <TenantFormPage {...props} />
    </Provider>
  );

beforeEach(() => {
  vi.clearAllMocks();
  resetFormDirty();
  window.history.replaceState(null, '', '/');
});

describe('TenantFormPage', () => {
  it('create mode renders an empty form and focuses the heading', () => {
    setup();

    const heading = screen.getByRole('heading', { level: 1, name: fr.tenants.addNew });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveFocus();
    expect(tenantAPI.getById).not.toHaveBeenCalled();
  });

  it('edit mode loads the record into the form', async () => {
    tenantAPI.getById.mockResolvedValue({
      data: {
        data: {
          id: 5,
          firstName: 'Jean',
          lastName: 'Dupont',
          gender: 'M',
          email: 'jean@example.com',
          apartment_id: 2,
          rentAmount: 800,
          leaseStartDate: '2025-01-01T00:00:00Z',
        },
      },
    });
    setup({ tenantId: '5' });

    expect(tenantAPI.getById).toHaveBeenCalledWith('5');
    expect(await screen.findByDisplayValue('Jean')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Dupont')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2025-01-01')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: fr.tenants.edit })).toBeInTheDocument();
  });

  it('edit submit dispatches updateTenant and returns to the list', async () => {
    tenantAPI.getById.mockResolvedValue({
      data: {
        data: {
          id: 5,
          firstName: 'Jean',
          lastName: 'Dupont',
          gender: 'M',
          email: 'jean@example.com',
          apartment_id: 2,
          rentAmount: 800,
        },
      },
    });
    setup({ tenantId: '5' });

    await screen.findByDisplayValue('Jean');
    fireEvent.click(screen.getByRole('button', { name: fr.common.update }));

    await waitFor(() => expect(updateTenant).toHaveBeenCalled());
    expect(updateTenant.mock.calls[0][0]).toEqual(
      expect.objectContaining({ id: '5', data: expect.objectContaining({ firstName: 'Jean' }) })
    );
    expect(createTenant).not.toHaveBeenCalled();
    expect(window.location.hash).toBe('#/tenants');
  });

  it('create submit dispatches createTenant and returns to the list', async () => {
    setup();

    // jsdom enforces required-field validation on submit clicks — fill all.
    fireEvent.change(screen.getByLabelText(fr.tenants.firstName), {
      target: { value: 'Marie' },
    });
    fireEvent.change(screen.getByLabelText(fr.tenants.lastName), {
      target: { value: 'Curie' },
    });
    fireEvent.change(screen.getByLabelText(fr.tenants.apartment), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByLabelText(fr.tenants.email), {
      target: { value: 'marie@example.com' },
    });
    fireEvent.change(screen.getByLabelText(fr.tenants.rentAmount), {
      target: { value: '900' },
    });
    fireEvent.click(screen.getByRole('button', { name: fr.common.create }));

    await waitFor(() => expect(createTenant).toHaveBeenCalled());
    expect(createTenant.mock.calls[0][0]).toEqual(expect.objectContaining({ firstName: 'Marie' }));
    expect(updateTenant).not.toHaveBeenCalled();
    expect(window.location.hash).toBe('#/tenants');
  });

  it('dirty input gates Cancel behind the confirm dialog', async () => {
    setup();

    fireEvent.change(screen.getByLabelText(fr.tenants.firstName), {
      target: { value: 'Marie' },
    });
    fireEvent.click(screen.getByRole('button', { name: fr.common.cancel }));

    expect(await screen.findByTestId('confirm-dialog')).toBeInTheDocument();
    expect(window.location.hash).not.toBe('#/tenants');

    // Staying keeps the typed value
    fireEvent.click(screen.getByRole('button', { name: fr.modals.dirtyConfirm.cancelLabel }));
    expect(screen.queryByTestId('confirm-dialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText(fr.tenants.firstName)).toHaveValue('Marie');

    // Confirming abandons and navigates back to the list
    fireEvent.click(screen.getByRole('button', { name: fr.common.cancel }));
    fireEvent.click(
      await screen.findByRole('button', { name: fr.modals.dirtyConfirm.confirmLabel })
    );
    expect(window.location.hash).toBe('#/tenants');
  });
});
