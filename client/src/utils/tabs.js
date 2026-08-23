/**
 * Dashboard tab registry (#55): single source of truth for the valid
 * URL-routed sections and their hash mapping.
 */
export const VALID_TABS = ['dashboard', 'apartments', 'tenants', 'owner', 'reminders'];

export const readHashTab = () => {
  const hash = window.location.hash.replace(/^#\/?/, '');
  return VALID_TABS.includes(hash) ? hash : null;
};

export const tabHref = tab => `#/${tab}`;
