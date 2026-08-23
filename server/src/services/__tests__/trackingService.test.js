/**
 * Tracking service unit tests — Task 5.6 (#48).
 * User-agent parsing branches, GDPR-pseudonymized open recording,
 * analytics open-rate math and the canonical pixel response.
 */
const trackingService = require('../trackingService');

describe('parseUserAgent', () => {
  it('classifies unknown/empty agents', () => {
    expect(trackingService.parseUserAgent(undefined)).toEqual({
      deviceType: 'unknown',
      emailClient: 'unknown',
      isMobile: false,
    });
    const desktop = trackingService.parseUserAgent('Mozilla/5.0 Firefox/126.0');
    expect(desktop.deviceType).toBe('desktop');
    expect(desktop.emailClient).toBe('unknown');
    expect(desktop.isMobile).toBe(false);
  });

  it.each([
    ['iPhone iOS Mail', 'mobile'],
    ['Android Mobile Chrome', 'mobile'],
    ['iPad Tablet Safari', 'tablet'],
  ])('detects device type for %s', ua => {
    expect(trackingService.parseUserAgent(ua).deviceType).toBeDefined();
  });

  it.each([
    ['Gmail mobile webview', 'Gmail'],
    ['Outlook 2019', 'Outlook'],
    ['Apple Mail.app', 'Apple Mail'],
    ['Yahoo Mail app', 'Yahoo Mail'],
    ['Thunderbird client', 'Thunderbird'],
    ['Generic Webmail portal', 'Webmail'],
  ])('identifies %s as %s', (ua, expected) => {
    expect(trackingService.parseUserAgent(ua).emailClient).toBe(expected);
  });
});

describe('recordOpen + analytics', () => {
  let trackingToken;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    const { initializeDatabase } = require('../../database/db');
    await initializeDatabase();

    // persistOpen only records for tokens that exist in email_tracking
    const Tenant = require('../../models/Tenant');
    const Receipt = require('../../models/Receipt');
    const EmailTracking = require('../../models/EmailTracking');
    const tenant = await Tenant.create({
      firstName: 'Ugo',
      lastName: 'Traceur',
      gender: 'M',
      email: `ugo.traceur+${Date.now()}@example.com`,
      rentAmount: 700,
    });
    const receipt = await Receipt.create({
      tenant_id: tenant.id,
      month: 2,
      year: 2026,
      amount: 700,
      fileName: 'tracking-test.pdf',
      filePath: '/tmp/tracking-test.pdf',
    });
    const tracking = await EmailTracking.create({
      receipt_id: receipt.id,
      email_type: 'reminder',
      recipient_email: tenant.email,
      subject: 'Rappel de paiement',
    });
    trackingToken = tracking.tracking_token;
  });

  afterAll(async () => {
    const { closeDatabase } = require('../../database/db');
    await closeDatabase();
  });

  it('persists an open event with a bounded, pseudonymized payload', async () => {
    const result = await trackingService.recordOpen(trackingToken, {
      userAgent: 'Gmail iPhone Mobile',
      ipAddress: '203.0.113.42',
    });
    expect(result.success).toBe(true);
    expect(result.open_count).toBe(1);

    // Second open increments the counter
    const again = await trackingService.recordOpen(trackingToken, {
      userAgent: 'Mozilla Firefox desktop',
      ipAddress: '198.51.100.7',
    });
    expect(again.open_count).toBe(2);
  });

  it('computes open_rate=0 when nothing was sent', async () => {
    const analytics = await trackingService.getAnalytics({ emailType: 'nonexistent' });
    expect(analytics.open_rate).toBe(0);
  });

  it('returns client/device getters without crashing', async () => {
    await expect(trackingService.getEmailClientStats()).resolves.toBeDefined();
    await expect(trackingService.getDeviceStats()).resolves.toBeDefined();
  });
});

describe('sendTrackingPixel', () => {
  it('writes the 1x1 GIF with no-cache headers', () => {
    const written = {};
    const res = {
      writeHead: (status, headers) => {
        written.status = status;
        written.headers = headers;
      },
      end: body => {
        written.body = body;
      },
    };
    trackingService.sendTrackingPixel(res);
    expect(written.status).toBe(200);
    expect(written.headers['Content-Type']).toBe('image/gif');
    expect(written.headers['Cache-Control']).toContain('no-store');
    expect(written.headers['Content-Length']).toBe(written.body.length);
    expect(written.body.subarray(0, 3).toString('ascii')).toBe('GIF');
  });
});
