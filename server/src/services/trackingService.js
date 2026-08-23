/**
 * Email-Open Tracking Service — Task 5.2 (#44)
 *
 * Single owner of the email-open tracking pipeline:
 * - recordOpen: GDPR pseudonymization (utils/privacy) + user-agent parsing + persistence
 * - stats/analytics getters (receipt stats, aggregate analytics, client/device splits)
 * - tracking-pixel response handling
 *
 * The controller is a thin HTTP adapter and the EmailTracking model is DB-only.
 */

const EmailTracking = require('../models/EmailTracking');
// Task 1.4 (#19): GDPR — store only pseudonymized IPs and bounded UAs
const { pseudonymizeIp, boundUserAgent } = require('../utils/privacy');

/** 1x1 transparent GIF returned by every tracking pixel request. */
const TRACKING_PIXEL_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
);

/** Canonical no-cache headers so mail clients always re-fetch the pixel. */
const TRACKING_PIXEL_HEADERS = {
  'Content-Type': 'image/gif',
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  Pragma: 'no-cache',
  Expires: '0',
};

/**
 * Parse user agent string to extract device info
 * @param {string} userAgent - User agent string
 * @returns {Object} Parsed device information
 */
function parseUserAgent(userAgent) {
  if (!userAgent) {
    return {
      deviceType: 'unknown',
      emailClient: 'unknown',
      isMobile: false,
    };
  }

  const ua = userAgent.toLowerCase();

  // Detect mobile
  const isMobile = /mobile|android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);

  // Detect device type
  let deviceType = 'desktop';
  if (/ipad|tablet/i.test(ua)) {
    deviceType = 'tablet';
  } else if (isMobile) {
    deviceType = 'mobile';
  }

  // Detect email client
  let emailClient = 'unknown';
  if (/gmail/i.test(ua)) {
    emailClient = 'Gmail';
  } else if (/outlook/i.test(ua)) {
    emailClient = 'Outlook';
  } else if (/apple mail|mail\.app/i.test(ua)) {
    emailClient = 'Apple Mail';
  } else if (/yahoo/i.test(ua)) {
    emailClient = 'Yahoo Mail';
  } else if (/thunderbird/i.test(ua)) {
    emailClient = 'Thunderbird';
  } else if (/webmail/i.test(ua)) {
    emailClient = 'Webmail';
  }

  return {
    deviceType,
    emailClient,
    isMobile,
  };
}

/**
 * Record an email open event with GDPR pseudonymization applied.
 * @param {string} trackingToken - Tracking token
 * @param {Object} metadata - Request metadata ({ userAgent, ipAddress })
 * @returns {Promise<Object>} Persist result ({ success, tracking_id, open_count })
 */
async function recordOpen(trackingToken, metadata = {}) {
  const { userAgent, ipAddress } = metadata;
  const safeIp = pseudonymizeIp(ipAddress);
  const safeUa = boundUserAgent(userAgent);
  const deviceInfo = parseUserAgent(userAgent);

  return EmailTracking.persistOpen(trackingToken, {
    userAgent: safeUa,
    ipAddress: safeIp,
    deviceType: deviceInfo.deviceType,
    emailClient: deviceInfo.emailClient,
    isMobile: deviceInfo.isMobile,
  });
}

/**
 * Get tracking statistics for a receipt.
 * @param {number} receiptId - Receipt ID
 * @returns {Promise<Array>} Tracking rows with event counts
 */
async function getReceiptStats(receiptId) {
  return EmailTracking.getStatsByReceipt(receiptId);
}

/**
 * Get overall email analytics, including the derived open rate.
 * @param {Object} filters - Filter options ({ startDate, endDate, emailType })
 * @returns {Promise<Object>} Analytics data with open_rate
 */
async function getAnalytics(filters = {}) {
  const stats = await EmailTracking.getAggregateAnalytics(filters);

  // Calculate open rate
  const openRate =
    stats.total_sent > 0 ? ((stats.total_opened / stats.total_sent) * 100).toFixed(2) : 0;

  return {
    ...stats,
    open_rate: parseFloat(openRate),
  };
}

/**
 * Get email client distribution.
 * @returns {Promise<Array>} Email client statistics
 */
async function getEmailClientStats() {
  return EmailTracking.getEmailClientStats();
}

/**
 * Get device type distribution.
 * @returns {Promise<Array>} Device type statistics
 */
async function getDeviceStats() {
  return EmailTracking.getDeviceStats();
}

/**
 * Send the canonical 1x1 transparent tracking pixel response.
 * Always responds 200 regardless of recording outcome.
 * @param {import('express').Response} res - Express response
 */
function sendTrackingPixel(res) {
  res.writeHead(200, {
    ...TRACKING_PIXEL_HEADERS,
    'Content-Length': TRACKING_PIXEL_GIF.length,
  });
  res.end(TRACKING_PIXEL_GIF);
}

module.exports = {
  parseUserAgent,
  recordOpen,
  getReceiptStats,
  getAnalytics,
  getEmailClientStats,
  getDeviceStats,
  sendTrackingPixel,
};
