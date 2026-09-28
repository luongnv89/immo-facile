/**
 * Hash routing tests (#113): parseHash resolves list/new/edit sub-routes so
 * the tenant & apartment form pages survive refresh without a router.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { parseHash, readHashTab, tabHref, tenantHref, apartmentHref } from '../tabs';

const setHash = hash => {
  window.location.hash = hash;
};

beforeEach(() => {
  window.history.replaceState(null, '', '/');
});

describe('parseHash', () => {
  it.each([
    ['', { tab: 'dashboard', action: 'list' }],
    ['#/', { tab: 'dashboard', action: 'list' }],
    ['#/dashboard', { tab: 'dashboard', action: 'list' }],
    ['#/tenants', { tab: 'tenants', action: 'list' }],
    ['#/tenants/new', { tab: 'tenants', action: 'new' }],
    ['#/tenants/5/edit', { tab: 'tenants', action: 'edit', id: '5' }],
    ['#/apartments/3/edit', { tab: 'apartments', action: 'edit', id: '3' }],
    ['#/apartments/new', { tab: 'apartments', action: 'new' }],
    // id segment without a trailing /edit falls back to the list view
    ['#/tenants/5', { tab: 'tenants', action: 'list' }],
    // unknown tabs fall back to the dashboard
    ['#/nope', { tab: 'dashboard', action: 'list' }],
    ['#/nope/new', { tab: 'dashboard', action: 'list' }],
    // extra segments after edit are ignored
    ['#/tenants/7/edit/extra', { tab: 'tenants', action: 'edit', id: '7' }],
  ])('hash %s -> %j', (hash, expected) => {
    setHash(hash);
    expect(parseHash()).toEqual(expected);
  });
});

describe('readHashTab', () => {
  it('returns the base tab of a sub-route hash', () => {
    setHash('#/tenants/5/edit');
    expect(readHashTab()).toBe('tenants');
  });

  it('returns null for unknown or empty hashes', () => {
    setHash('#/nope');
    expect(readHashTab()).toBeNull();
  });
});

describe('href builders', () => {
  it('builds the hashes parseHash resolves', () => {
    expect(tabHref('tenants')).toBe('#/tenants');
    expect(tenantHref.list()).toBe('#/tenants');
    expect(tenantHref.new()).toBe('#/tenants/new');
    expect(tenantHref.edit(5)).toBe('#/tenants/5/edit');
    expect(apartmentHref.list()).toBe('#/apartments');
    expect(apartmentHref.edit(3)).toBe('#/apartments/3/edit');
  });
});
