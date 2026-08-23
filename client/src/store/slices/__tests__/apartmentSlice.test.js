import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

vi.mock('../../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const api = (await import('../../../services/api')).default;
const reducerImport = await import('../apartmentSlice');
const {
  default: reducer,
  fetchApartments,
  createApartment,
  updateApartment,
  deleteApartment,
  clearError,
  setSelectedApartment,
  clearSelectedApartment,
} = reducerImport;

const makeStore = () => configureStore({ reducer: { apartments: reducer } });

const apartment = { id: 1, name: 'Villa Test' };

describe('apartmentSlice thunks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchApartments stores the list and toggles loading', async () => {
    api.get.mockResolvedValueOnce({ data: { data: [apartment] } });
    const store = makeStore();

    expect(store.getState().apartments.loading).toBe(false);
    const promise = store.dispatch(fetchApartments());
    expect(store.getState().apartments.loading).toBe(true);
    await promise;

    expect(api.get).toHaveBeenCalledWith('/apartments');
    expect(store.getState().apartments.loading).toBe(false);
    expect(store.getState().apartments.items).toEqual([apartment]);
  });

  it('fetchApartments rejects with the error message', async () => {
    api.get.mockRejectedValueOnce(new Error('network down'));
    const store = makeStore();

    await store.dispatch(fetchApartments());
    expect(store.getState().apartments.error).toBe('network down');
    expect(store.getState().apartments.loading).toBe(false);
  });

  it('createApartment appends the created record', async () => {
    api.post.mockResolvedValueOnce({ data: { data: apartment } });
    const store = makeStore();

    await store.dispatch(createApartment({ name: 'Villa Test' }));
    expect(api.post).toHaveBeenCalledWith('/apartments', { name: 'Villa Test' });
    expect(store.getState().apartments.items).toEqual([apartment]);
  });

  it('updateApartment replaces the matching item by id', async () => {
    const updated = { id: 1, name: 'Villa Renommée' };
    api.put.mockResolvedValueOnce({ data: { data: updated } });
    const store = makeStore();
    store.dispatch({ type: 'apartments/fetchApartments/fulfilled', payload: [apartment] });
    store.dispatch(setSelectedApartment(apartment));

    await store.dispatch(updateApartment({ id: 1, data: { name: 'Villa Renommée' } }));
    expect(store.getState().apartments.items).toEqual([updated]);
    expect(store.getState().apartments.selectedApartment).toBeNull();
  });

  it('updateApartment leaves items untouched when id is unknown', async () => {
    const other = { id: 42, name: 'Autre' };
    api.put.mockResolvedValueOnce({ data: { data: other } });
    const store = makeStore();
    store.dispatch({ type: 'apartments/fetchApartments/fulfilled', payload: [apartment] });
    store.dispatch(setSelectedApartment(apartment));

    await store.dispatch(updateApartment({ id: 9999, data: {} }));
    expect(store.getState().apartments.items).toEqual([apartment]);
    expect(store.getState().apartments.selectedApartment).toBeNull();
  });

  it('deleteApartment filters out the deleted id and surfaces failures', async () => {
    api.delete.mockResolvedValueOnce({ data: {} });
    api.get.mockResolvedValueOnce({ data: { data: [apartment] } });
    const store = makeStore();
    await store.dispatch(fetchApartments());

    await store.dispatch(deleteApartment(1));
    expect(api.delete).toHaveBeenCalledWith('/apartments/1');
    expect(store.getState().apartments.items).toEqual([]);

    api.delete.mockRejectedValueOnce(new Error('forbidden'));
    await store.dispatch(deleteApartment(2));
    expect(store.getState().apartments.error).toBe('forbidden');
  });
});

describe('apartmentSlice sync reducers', () => {
  it('setSelectedApartment / clearSelectedApartment manage selection', () => {
    let state = reducer(undefined, setSelectedApartment(apartment));
    expect(state.selectedApartment).toEqual(apartment);
    state = reducer(state, clearSelectedApartment());
    expect(state.selectedApartment).toBeNull();
  });

  it('clearError resets the error field', () => {
    let state = { ...reducer(undefined, { type: '@@INIT' }), error: 'boom' };
    state = reducer(state, clearError());
    expect(state.error).toBeNull();
  });
});
