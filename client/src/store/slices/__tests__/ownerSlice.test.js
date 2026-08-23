import { describe, it, expect, vi, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

vi.mock('../../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

const api = (await import('../../../services/api')).default;
const mod = await import('../ownerSlice');
const {
  default: reducer,
  fetchOwner,
  updateOwner,
  createOwner,
  uploadSignature,
  fetchSignatureImage,
  clearError,
} = mod;

const makeStore = () => configureStore({ reducer: { owner: reducer } });
const owner = { id: 1, name: 'Jean Propriétaire' };

describe('ownerSlice thunks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchOwner stores the owner profile', async () => {
    api.get.mockResolvedValueOnce({ data: { data: owner } });
    const store = makeStore();

    await store.dispatch(fetchOwner());
    expect(api.get).toHaveBeenCalledWith('/owner');
    expect(store.getState().owner.data).toEqual(owner);
    expect(store.getState().owner.loading).toBe(false);
  });

  it('updateOwner replaces the stored profile', async () => {
    const updated = { ...owner, name: 'Jeanne' };
    api.put.mockResolvedValueOnce({ data: { data: updated } });
    const store = makeStore();

    await store.dispatch(updateOwner({ name: 'Jeanne' }));
    expect(store.getState().owner.data.name).toBe('Jeanne');
  });

  it('createOwner stores the created record', async () => {
    api.post.mockResolvedValueOnce({ data: { data: owner } });
    const store = makeStore();

    await store.dispatch(createOwner({ name: owner.name }));
    expect(api.post).toHaveBeenCalledWith('/owner', { name: owner.name });
    expect(store.getState().owner.data).toEqual(owner);
  });

  it('uploadSignature posts multipart form data and stores the result', async () => {
    api.post.mockResolvedValueOnce({ data: { data: { signature_path: '/uploads/sig.png' } } });
    const store = makeStore();
    const file = new File(['png'], 'sig.png', { type: 'image/png' });

    await store.dispatch(uploadSignature(file));
    const [url, body, config] = api.post.mock.calls[0];
    expect(url).toBe('/owner/signature');
    expect(body).toBeInstanceOf(FormData);
    expect(config.headers['Content-Type']).toBe('multipart/form-data');
    expect(store.getState().owner.data.signature_path).toBe('/uploads/sig.png');
  });

  it('fetchSignatureImage stores the base64 image payload', async () => {
    const image = { mimeType: 'image/png', image: 'data:image/png;base64,AAA' };
    api.get.mockResolvedValueOnce({ data: { data: image } });
    const store = makeStore();

    await store.dispatch(fetchSignatureImage());
    expect(store.getState().owner.signatureImage).toEqual(image);
  });

  it.each([
    [fetchOwner, 'get'],
    [updateOwner, 'put'],
    [createOwner, 'post'],
  ])('surfaces network failures as plain messages (%#)', async (thunk, method) => {
    api[method].mockRejectedValueOnce(new Error('boom'));
    const store = makeStore();

    await store.dispatch(thunk({}));
    const state = store.getState().owner;
    expect(state.error).toBe('boom');
    expect(state.loading).toBe(false);
  });

  it('signature thunks surface failures too', async () => {
    const store = makeStore();

    api.post.mockRejectedValueOnce(new Error('file too large'));
    await store.dispatch(uploadSignature(new File([], 'x.png')));
    expect(store.getState().owner.error).toBe('file too large');

    api.get.mockRejectedValueOnce(new Error('not found'));
    await store.dispatch(fetchSignatureImage());
    expect(store.getState().owner.error).toBe('not found');
  });
});

describe('ownerSlice sync reducers', () => {
  it('clearError resets the error field', () => {
    let state = { ...reducer(undefined, { type: '@@INIT' }), error: 'x' };
    state = reducer(state, clearError());
    expect(state.error).toBeNull();
  });
});
