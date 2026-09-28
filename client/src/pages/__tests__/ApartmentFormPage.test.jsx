/**
 * ApartmentFormPage smoke tests (#113): edit-mode fetch-by-id fills the
 * form, create submit dispatches the create thunk and navigates back to the
 * list hash, and dirty input gates Cancel behind the ConfirmDialog.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ApartmentFormPage from '../ApartmentFormPage';
import { createApartment, updateApartment } from '../../store/slices/apartmentSlice';
import { apartmentAPI } from '../../services/api';
import { resetFormDirty } from '../../utils/dirtyForm';
import fr from '../../i18n/fr';

const okAction = (type, payload) => ({
  type,
  payload,
  unwrap: () => Promise.resolve(payload),
});

vi.mock('../../store/slices/apartmentSlice', async importOriginal => {
  const actual = await importOriginal();
  return {
    ...actual,
    fetchApartments: vi.fn(() => ({ type: 'apartments/fetch' })),
    createApartment: vi.fn(payload => okAction('apartments/create', payload)),
    updateApartment: vi.fn(payload => okAction('apartments/update', payload)),
  };
});

vi.mock('../../services/api', () => ({
  apartmentAPI: { getById: vi.fn() },
  tenantAPI: { getById: vi.fn() },
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}));

const buildStore = () =>
  configureStore({
    reducer: {
      apartments: () => ({ items: [], loading: false, error: null }),
      ui: () => ({ notifications: [] }),
    },
  });

const setup = props =>
  render(
    <Provider store={buildStore()}>
      <ApartmentFormPage {...props} />
    </Provider>
  );

beforeEach(() => {
  vi.clearAllMocks();
  resetFormDirty();
  window.history.replaceState(null, '', '/');
});

describe('ApartmentFormPage', () => {
  it('create mode renders an empty form and focuses the heading', () => {
    setup();

    const heading = screen.getByRole('heading', { level: 1, name: fr.apartments.addNew });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveFocus();
    expect(apartmentAPI.getById).not.toHaveBeenCalled();
  });

  it('edit mode loads the record into the form', async () => {
    apartmentAPI.getById.mockResolvedValue({
      data: {
        data: {
          id: 3,
          name: 'Studio 1',
          address: '1 rue A',
          city: 'Paris',
          postalCode: '75011',
        },
      },
    });
    setup({ apartmentId: '3' });

    expect(apartmentAPI.getById).toHaveBeenCalledWith('3');
    expect(await screen.findByDisplayValue('Studio 1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('75011')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: fr.apartments.edit })).toBeInTheDocument();
  });

  it('edit submit dispatches updateApartment and returns to the list', async () => {
    apartmentAPI.getById.mockResolvedValue({
      data: {
        data: { id: 3, name: 'Studio 1', address: '1 rue A', city: 'Paris', postalCode: '75011' },
      },
    });
    setup({ apartmentId: '3' });

    await screen.findByDisplayValue('Studio 1');
    fireEvent.click(screen.getByRole('button', { name: fr.common.update }));

    await waitFor(() => expect(updateApartment).toHaveBeenCalled());
    expect(updateApartment.mock.calls[0][0]).toEqual(
      expect.objectContaining({ id: '3', data: expect.objectContaining({ name: 'Studio 1' }) })
    );
    expect(createApartment).not.toHaveBeenCalled();
    expect(window.location.hash).toBe('#/apartments');
  });

  it('create submit dispatches createApartment and returns to the list', async () => {
    setup();

    // jsdom enforces required-field validation on submit clicks — fill all.
    fireEvent.change(screen.getByLabelText(fr.apartments.name), {
      target: { value: 'Appart 2A' },
    });
    fireEvent.change(screen.getByLabelText(fr.apartments.address), {
      target: { value: '5 rue B' },
    });
    fireEvent.change(screen.getByLabelText(fr.apartments.city), {
      target: { value: 'Lyon' },
    });
    fireEvent.change(screen.getByLabelText(fr.apartments.postalCode), {
      target: { value: '69001' },
    });
    fireEvent.click(screen.getByRole('button', { name: fr.common.create }));

    await waitFor(() => expect(createApartment).toHaveBeenCalled());
    expect(createApartment.mock.calls[0][0]).toEqual(
      expect.objectContaining({ name: 'Appart 2A', city: 'Lyon' })
    );
    expect(updateApartment).not.toHaveBeenCalled();
    expect(window.location.hash).toBe('#/apartments');
  });

  it('dirty input gates Cancel behind the confirm dialog', async () => {
    setup();

    fireEvent.change(screen.getByLabelText(fr.apartments.name), {
      target: { value: 'Appart 2A' },
    });
    fireEvent.click(screen.getByRole('button', { name: fr.common.cancel }));

    expect(await screen.findByTestId('confirm-dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: fr.modals.dirtyConfirm.confirmLabel }));
    expect(window.location.hash).toBe('#/apartments');
  });
});
