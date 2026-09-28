/**
 * Email tracking API integration tests — Task 5.6 (#48).
 * The public pixel endpoint plus the authenticated analytics getters.
 */
const request = require('supertest');

describe('Email tracking API', () => {
  let app;
  let token;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    const { initializeDatabase, closeDatabase } = require('../../database/db');
    await initializeDatabase();
    app = require('../../../index');
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'changeme123',
      });
    token = res.body.token;
  });

  afterAll(async () => {
    const { closeDatabase } = require('../../database/db');
    await closeDatabase();
  });

  const authed = r => r.set('Authorization', `Bearer ${token}`);

  it('serves the tracking pixel publicly, even for unknown tokens', async () => {
    const res = await request(app).get('/api/email-tracking/pixel/unknown-token-xyz').send();
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('image/gif');
    expect(res.headers['cache-control']).toContain('no-store');
    expect(res.headers.pragma).toBe('no-cache');
    // 1x1 transparent GIF signature
    expect(res.body.subarray(0, 3).toString('ascii')).toBe('GIF');
  });

  it('returns analytics with a derived open rate', async () => {
    const res = await authed(request(app).get('/api/email-tracking/analytics')).send();
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('total_sent');
    expect(res.body.data).toHaveProperty('open_rate');
    expect(typeof res.body.data.open_rate).toBe('number');
  });

  it('accepts date-range filters on analytics', async () => {
    const res = await authed(
      request(app).get(
        '/api/email-tracking/analytics?startDate=2026-01-01&endDate=2026-12-31&emailType=reminder'
      )
    ).send();
    expect(res.status).toBe(200);
    expect(res.body.data.open_rate).toBeDefined();
  });

  it('returns email client and device distributions', async () => {
    const clients = await authed(request(app).get('/api/email-tracking/clients')).send();
    expect(clients.status).toBe(200);
    expect(Array.isArray(clients.body.data)).toBe(true);

    const devices = await authed(request(app).get('/api/email-tracking/devices')).send();
    expect(devices.status).toBe(200);
    expect(Array.isArray(devices.body.data)).toBe(true);
  });

  it('returns (possibly empty) stats for any receipt id', async () => {
    const res = await authed(request(app).get('/api/email-tracking/receipt/999999')).send();
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
