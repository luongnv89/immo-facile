import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

vi.mock('../../../services/api', () => ({
  tenantAPI: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const { tenantAPI } = await import('../../../services/api');
const mod = await import('../tenantSlice');
const {
  default: reducer,
  fetchTenants,
  createTenant,
  updateTenant,
  deleteTenant,
  clearError,
  setSelectedTenant,
  clearSelectedTenant,
} = mod;

const makeStore = () => configureStore({ reducer: { tenants: reducer } });
const tenant = { id: 1, firstName: 'Jean', lastName: 'Dupont' };

describe('tenantSlice thunks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchTenants stores the list and surfaces failures', async () => {
    tenantAPI.getAll.mockResolvedValueOnce({ data: { data: [tenant] } });
    const store = makeStore();

    const promise = store.dispatch(fetchTenants());
    expect(store.getState().tenants.loading).toBe(true);
    await promise;
    expect(store.getState().tenants.items).toEqual([tenant]);

    tenantAPI.getAll.mockRejectedValueOnce({ response: { data: { error: 'Non autorisé' } } });
    await store.dispatch(fetchTenants());
    expect(store.getState().tenants.error).toBe('Non autorisé');
  });

  it('createTenant appends the record and prefers message over error', async () => {
    tenantAPI.create.mockResolvedValueOnce({ data: { data: tenant } });
    const store = makeStore();

    await store.dispatch(createTenant(tenant));
    expect(tenantAPI.create).toHaveBeenCalledWith(tenant);
    expect(store.getState().tenants.items).toEqual([tenant]);

    tenantAPI.create.mockRejectedValueOnce({
      response: { data: { message: 'Email déjà utilisé' } },
    });
    await store.dispatch(createTenant(tenant));
    expect(store.getState().tenants.error).toBe('Email déjà utilisé');

    tenantAPI.create.mockRejectedValueOnce(new Error('no response'));
    await store.dispatch(createTenant(tenant));
    expect(store.getState().tenants.error).toBe('Failed to create tenant');
  });

  it('updateTenant replaces the matching item by id only', async () => {
    const updated = { ...tenant, firstName: 'Jeanne' };
    tenantAPI.update.mockResolvedValueOnce({ data: { data: updated } });
    const store = makeStore();
    store.dispatch({ type: 'tenants/fetchTenants/fulfilled', payload: [tenant] });

    await store.dispatch(updateTenant({ id: 1, data: { firstName: 'Jeanne' } }));
    expect(store.getState().tenants.items[0].firstName).toBe('Jeanne');

    await store.dispatch(updateTenant({ id: 9999, data: {} }));
    expect(store.getState().tenants.items).toHaveLength(1);

    tenantAPI.update.mockRejectedValueOnce({ response: { data: { error: 'Introuvable' } } });
    await store.dispatch(updateTenant({ id: 1, data: {} }));
    expect(store.getState().tenants.error).toBe('Introuvable');
  });

  it('deleteTenant removes the targeted item and surfaces failures', async () => {
    tenantAPI.getAll.mockResolvedValue({ data: { data: [tenant, { ...tenant, id: 2 }] } });
    tenantAPI.delete.mockResolvedValueOnce({});
    const store = makeStore();
    await store.dispatch(fetchTenants());

    await store.dispatch(deleteTenant(1));
    expect(store.getState().tenants.items.map(t => t.id)).toEqual([2]);

    tenantAPI.delete.mockRejectedValueOnce({ response: { data: { error: 'Conflict' } } });
    await store.dispatch(deleteTenant(2));
    expect(store.getState().tenants.error).toBe('Conflict');
  });
});

describe('tenantSlice sync reducers', () => {
  it('selection reducers manage selectedTenant', () => {
    let state = reducer(undefined, setSelectedTenant(tenant));
    expect(state.selectedTenant).toEqual(tenant);
    state = reducer(state, clearSelectedTenant());
    expect(state.selectedTenant).toBeNull();
  });

  it('clearError resets the error field', () => {
    let state = { ...reducer(undefined, { type: '@@INIT' }), error: 'x' };
    state = reducer(state, clearError());
    expect(state.error).toBeNull();
  });
});
