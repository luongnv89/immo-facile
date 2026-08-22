/**
 * GDPR guardrails for tracking data — Task 1.4 (#19).
 * IPs are pseudonymized (hashed) before storage; user agents truncated.
 */
const crypto = require('crypto');

const USER_AGENT_MAX = 256;

/**
 * Hash an IP with the server-side pepper so stored values are not
 * personally identifiable but still usable as opaque correlation keys.
 * IPv6 and IPv4 both hash to 64 hex chars.
 */
const pseudonymizeIp = ip => {
  if (!ip) return null;
  return crypto
    .createHash('sha256')
    .update(`${ip}|${process.env.TRACKING_PEPPER || 'immo-facile-tracking'}`)
    .digest('hex');
};

/** Truncate long user-agent strings to a bounded length. */
const boundUserAgent = userAgent => (userAgent ? String(userAgent).slice(0, USER_AGENT_MAX) : null);

module.exports = { pseudonymizeIp, boundUserAgent, USER_AGENT_MAX };
