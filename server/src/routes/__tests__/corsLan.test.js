/**
 * CORS LAN origin gating (#113): private ranges + Tailscale CGNAT
 * (100.64.0.0/10) are allowed on any port over http/https; public IPs —
 * including the non-CGNAT part of 100/8 — are rejected with 403.
 */
const request = require('supertest');

describe('LAN CORS origin gating', () => {
  let app;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    const { initializeDatabase } = require('../../database/db');
    await initializeDatabase();
    app = require('../../../index');
  });

  afterAll(async () => {
    const { closeDatabase } = require('../../database/db');
    await closeDatabase();
  });

  it.each([
    'http://192.168.1.10:8080',
    'http://10.0.0.3:5001',
    'https://172.16.5.4:443',
    'https://172.31.255.1',
    'http://100.64.0.1:8080',
    'http://100.127.255.254:9999',
  ])('allows private/CGNAT origin %s', async origin => {
    const res = await request(app).get('/api/health').set('Origin', origin);
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe(origin);
  });

  it.each([
    'http://100.63.255.254:8080', // just below CGNAT — public space
    'http://100.128.0.1:8080', // just above CGNAT — public space
    'http://100.200.0.1:8080',
    'http://172.32.0.1:8080', // outside 172.16/12
    'https://evil.example.com',
  ])('rejects non-private origin %s', async origin => {
    const res = await request(app).get('/api/health').set('Origin', origin);
    expect(res.status).toBe(403);
  });
});
