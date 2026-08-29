/**
 * Dashboard tab registry (#55): single source of truth for the valid
 * URL-routed sections and their hash mapping.
 * Extended to support sub-paths like #/tenants/new and #/tenants/:id/edit
 * so edit pages survive refresh without a router dependency.
 */
export const VALID_TABS = ['dashboard', 'apartments', 'tenants', 'owner', 'reminders'];

export const readHashTab = () => {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const base = hash.split('/')[0];
  return VALID_TABS.includes(base) ? base : null;
};

export const tabHref = tab => `#/${tab}`;

// New: parse full hash into { tab, action, id } for sub-routes
// #/tenants           -> { tab: 'tenants', action: 'list' }
// #/tenants/new       -> { tab: 'tenants', action: 'new' }
// #/tenants/123/edit  -> { tab: 'tenants', action: 'edit', id: '123' }
// #/apartments/5/edit -> { tab: 'apartments', action: 'edit', id: '5' }
export const parseHash = () => {
  const raw = window.location.hash.replace(/^#\/?/, '');
  if (!raw) return { tab: 'dashboard', action: 'list' };
  const parts = raw.split('/').filter(Boolean);
  const tab = parts[0];
  if (!VALID_TABS.includes(tab)) return { tab: 'dashboard', action: 'list' };
  if (parts.length === 1) return { tab, action: 'list' };
  if (parts[1] === 'new') return { tab, action: 'new' };
  if (parts[2] === 'edit' && parts[1]) return { tab, action: 'edit', id: parts[1] };
  return { tab, action: 'list' };
};

export const tenantHref = {
  list: () => `#/tenants`,
  new: () => `#/tenants/new`,
  edit: id => `#/tenants/${id}/edit`,
};

export const apartmentHref = {
  list: () => `#/apartments`,
  new: () => `#/apartments/new`,
  edit: id => `#/apartments/${id}/edit`,
};
