import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';

vi.mock('../../../services/api', () => ({
  authAPI: {
    login: vi.fn(),
    me: vi.fn(),
  },
}));

const { authAPI } = await import('../../../services/api');
const mod = await import('../authSlice');
const { default: reducer, loginUser, logout, clearAuthError, selectIsAuthenticated } = mod;

const makeStore = () => configureStore({ reducer: { auth: reducer }, preloadedState: undefined });

describe('authSlice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('loginUser stores the token and user on success', async () => {
    const payload = { token: 'jwt-abc', user: { username: 'admin' } };
    authAPI.login.mockResolvedValueOnce({ data: payload });
    const store = makeStore();

    await store.dispatch(loginUser({ username: 'admin', password: 'pw' }));

    expect(authAPI.login).toHaveBeenCalledWith('admin', 'pw');
    expect(localStorage.getItem('immofacile_token')).toBe('jwt-abc');
    const state = store.getState().auth;
    expect(state.status).toBe('succeeded');
    expect(state.token).toBe('jwt-abc');
    expect(state.user).toEqual(payload.user);
    expect(selectIsAuthenticated(store.getState())).toBe(true);
  });

  it('loginUser rejects with the API error message', async () => {
    authAPI.login.mockRejectedValueOnce({
      response: { data: { error: 'Identifiants invalides' } },
    });
    const store = makeStore();

    await store.dispatch(loginUser({ username: 'admin', password: 'bad' }));
    expect(store.getState().auth).toMatchObject({
      status: 'failed',
      error: 'Identifiants invalides',
      token: null,
    });
  });

  it('loginUser falls back to the default French message without a response body', async () => {
    authAPI.login.mockRejectedValueOnce(new Error('socket hang up'));
    const store = makeStore();

    await store.dispatch(loginUser({ username: 'admin', password: 'bad' }));
    expect(store.getState().auth.error).toBe('Échec de la connexion');
  });

  it('logout clears token, user and stored credentials', async () => {
    localStorage.setItem('immofacile_token', 'stale-token');
    let state = reducer(undefined, loginUser.fulfilled({ token: 't', user: null }, '', {}));
    state = reducer(state, logout());
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.status).toBe('idle');
    expect(localStorage.getItem('immofacile_token')).toBeNull();
  });

  it('clearAuthError resets only the error field', async () => {
    let state = { ...reducer(undefined, { type: '@@INIT' }), error: 'boom' };
    state = reducer(state, clearAuthError());
    expect(state.error).toBeNull();
  });

  it('selectIsAuthenticated is false without a token', () => {
    const store = makeStore();
    expect(selectIsAuthenticated(store.getState())).toBe(false);
  });
});
