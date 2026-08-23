import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import api from '../api';

const requestHandler = api.interceptors.request.handlers[0];
const responseHandler = api.interceptors.response.handlers[0];

describe('api service interceptors (#16, #47)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('attaches the stored JWT as a Bearer header', () => {
    localStorage.setItem('immofacile_token', 'jwt-123');
    const config = requestHandler.fulfilled({ method: 'get', url: '/tenants', headers: {} });
    expect(config.headers.Authorization).toBe('Bearer jwt-123');
  });

  it('sends requests without an Authorization header when no token exists', () => {
    const config = requestHandler.fulfilled({ method: 'get', url: '/tenants', headers: {} });
    expect(config.headers.Authorization).toBeUndefined();
  });

  it('passes successful responses through untouched', () => {
    const response = { status: 200, config: { url: '/tenants' } };
    expect(responseHandler.fulfilled(response)).toBe(response);
  });

  it('flattens nested { error: { message } } bodies into plain strings', async () => {
    const error = {
      response: {
        status: 400,
        data: { error: { message: 'Champs manquants', code: 'VALIDATION_ERROR' } },
      },
      config: { url: '/tenants' },
    };
    await expect(responseHandler.rejected(error)).rejects.toBe(error);
    expect(error.response.data.error).toBe('Champs manquants');
  });

  it('keeps already-flat string errors intact', async () => {
    const error = {
      response: { status: 409, data: { error: 'Email déjà utilisé' } },
      config: { url: '/tenants' },
    };
    await expect(responseHandler.rejected(error)).rejects.toBe(error);
    expect(error.response.data.error).toBe('Email déjà utilisé');
  });

  it('clears the token and broadcasts auth:logout on a 401 outside /auth/login', async () => {
    localStorage.setItem('immofacile_token', 'expired-token');
    const logoutListener = vi.fn();
    window.addEventListener('auth:logout', logoutListener);

    const error = {
      response: { status: 401, data: { error: 'Session expirée' } },
      config: { url: '/receipts' },
    };
    await expect(responseHandler.rejected(error)).rejects.toBe(error);

    expect(localStorage.getItem('immofacile_token')).toBeNull();
    expect(logoutListener).toHaveBeenCalledTimes(1);
    window.removeEventListener('auth:logout', logoutListener);
  });

  it('does not broadcast auth:logout for a failed login attempt', async () => {
    localStorage.setItem('immofacile_token', 'stale');
    const logoutListener = vi.fn();
    window.addEventListener('auth:logout', logoutListener);

    const error = {
      response: { status: 401, data: { error: 'Identifiants invalides' } },
      config: { url: '/auth/login' },
    };
    await expect(responseHandler.rejected(error)).rejects.toBe(error);

    expect(localStorage.getItem('immofacile_token')).toBe('stale');
    expect(logoutListener).not.toHaveBeenCalled();
    window.removeEventListener('auth:logout', logoutListener);
  });

  it('handles network errors without a response body', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const error = { message: 'Network Error' };
    await expect(responseHandler.rejected(error)).rejects.toBe(error);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

describe('api instance defaults', () => {
  it('targets the /api namespace with credentials enabled', () => {
    expect(api.defaults.baseURL).toMatch(/\/api$/);
    expect(api.defaults.withCredentials).toBe(true);
    expect(api.defaults.headers['Content-Type']).toBe('application/json');
  });
});
