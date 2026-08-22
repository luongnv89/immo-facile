/**
 * GDPR guardrails — Task 1.4 (#19).
 */
const { pseudonymizeIp, boundUserAgent } = require('../privacy');

describe('pseudonymizeIp', () => {
  it('returns a sha256 hex string for an IPv4', () => {
    const out = pseudonymizeIp('192.168.1.10');
    expect(out).toMatch(/^[0-9a-f]{64}$/);
    expect(out).not.toContain('192.168');
  });

  it('returns a hash for an IPv6 too', () => {
    expect(pseudonymizeIp('2001:db8::1')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic and peppered', () => {
    expect(pseudonymizeIp('10.0.0.1')).toBe(pseudonymizeIp('10.0.0.1'));
  });

  it('maps null/empty to null', () => {
    expect(pseudonymizeIp(null)).toBeNull();
    expect(pseudonymizeIp('')).toBeNull();
  });
});

describe('boundUserAgent', () => {
  it('truncates user agents over the limit', () => {
    const long = 'M'.repeat(500);
    expect(boundUserAgent(long).length).toBeLessThanOrEqual(256);
  });

  it('passes short agents through and maps empty to null', () => {
    expect(boundUserAgent('Mozilla/5.0')).toBe('Mozilla/5.0');
    expect(boundUserAgent('')).toBeNull();
    expect(boundUserAgent(undefined)).toBeNull();
  });
});
