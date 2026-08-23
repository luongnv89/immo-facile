/**
 * EmailTracking regression tests — Task 4.1 (#37).
 * Verifies open tracking stores pseudonymized IPs (GDPR, #19) end-to-end.
 */
const EmailTracking = require('../EmailTracking');
const Receipt = require('../Receipt');
const Tenant = require('../Tenant');

describe('EmailTracking - recordOpen', () => {
  let tracking;

  beforeAll(async () => {
    const { initializeDatabase, closeDatabase } = require('../../database/db');
    await initializeDatabase();

    const t = await Tenant.create({
      firstName: 'Marie',
      lastName: 'Martin',
      gender: 'F',
      email: `marie+${Date.now()}@example.com`,
      rentAmount: 900,
      // no address column in tenants schema
    });
    const r = await Receipt.create({
      tenant_id: t.id,
      month: 9,
      year: 2026,
      amount: 900,
      fileName: 'q.pdf',
      filePath: '/receipts/q.pdf',
    });
    tracking = await EmailTracking.create({
      receipt_id: r.id,
      email_type: 'receipt',
      recipient_email: t.email,
      subject: 'Votre quittance',
    });
  });

  afterAll(async () => {
    const { closeDatabase } = require('../../database/db');
    await closeDatabase();
  });

  it('records an open event with a hashed IP, not the raw one', async () => {
    const rawIp = '203.0.113.42';
    await EmailTracking.recordOpen(tracking.tracking_token, {
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) TestRunner',
      ipAddress: rawIp,
    });

    const { getDatabase } = require('../../database/db');
    const row = await new Promise((resolve, reject) => {
      getDatabase().get(
        'SELECT ip_address, user_agent FROM email_events WHERE tracking_id = ?',
        [tracking.id],
        (err, row) => (err ? reject(err) : resolve(row))
      );
    });

    expect(row).toBeDefined();
    expect(row.ip_address).toMatch(/^[0-9a-f]{64}$/); // sha256 hex
    expect(row.ip_address).not.toContain(rawIp);
    expect(row.user_agent.length).toBeLessThanOrEqual(256);
  });

  it('increments open_count on repeat opens', async () => {
    await EmailTracking.recordOpen(tracking.tracking_token, { ipAddress: '198.51.100.7' });
    const stats = await EmailTracking.getStatsByReceipt(tracking.receipt_id);
    expect(stats[0].open_count).toBeGreaterThanOrEqual(2);
  });
});
