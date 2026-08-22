/**
 * Static asset lockdown + CORS validation — Task 1.3 (#18).
 */
const request = require('supertest');
const fs = require('fs');
const path = require('path');

describe('static assets and CORS lockdown', () => {
  let app;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    const { initializeDatabase, closeDatabase } = require('../../database/db');
    await initializeDatabase();
    app = require('../../../index');

    // Create a dummy receipt file so the route has something to find
    const receiptsDir = path.join(__dirname, '../../../receipts');
    if (!fs.existsSync(receiptsDir)) fs.mkdirSync(receiptsDir, { recursive: true });
    fs.writeFileSync(path.join(receiptsDir, 'test-quittance.pdf'), '%PDF-1.4 test');
  });

  afterAll(async () => {
    const { closeDatabase } = require('../../database/db');
    await closeDatabase();
    const p = path.join(__dirname, '../../../receipts/test-quittance.pdf');
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });

  it('rejects direct GET of a quittance PDF without a token', async () => {
    const res = await request(app).get('/receipts/test-quittance.pdf');
    expect([401, 404]).toContain(res.status);
  });

  it('rejects direct GET under /uploads without a token', async () => {
    const res = await request(app).get('/uploads/signature.png');
    expect([401, 404]).toContain(res.status);
  });

  it('blocks traversal attempts through the guarded routes', async () => {
    const token = (
      await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'changeme123' })
    ).body?.token;
    // admin may not exist in this suite's DB (seeded from env); login as seeded user
    const resNoToken = await request(app).get('/receipts/..%2f..%2fpackage.json');
    expect([401, 404]).toContain(resNoToken.status);
  });
});

describe('CORS origin validation', () => {
  const { validateCorsOrigin } = require('../../config/envValidation');

  it('accepts a normal origin', () => {
    process.env.CORS_ORIGIN = 'https://immo.example';
    expect(() => validateCorsOrigin()).not.toThrow();
  });

  it('rejects CORS_ORIGIN=*', () => {
    process.env.CORS_ORIGIN = '*';
    expect(() => validateCorsOrigin()).toThrow(/\*/);
    delete process.env.CORS_ORIGIN;
  });
});
