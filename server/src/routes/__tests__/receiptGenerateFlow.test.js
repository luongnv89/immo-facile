/**
 * End-to-end receipt generation flow.
 * Proves the refactored controller → service → pdfGenerator wiring
 * produces a real, persisted quittance over HTTP.
 */
const request = require('supertest');
const fs = require('fs');
const path = require('path');

describe('POST /api/receipts/generate (service extraction #49/#50)', () => {
  let app;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    const { initializeDatabase, closeDatabase } = require('../../database/db');
    await initializeDatabase();
    app = require('../../../index');
  });

  afterAll(async () => {
    const { closeDatabase } = require('../../database/db');
    await closeDatabase();
  });

  async function adminToken() {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'changeme123',
      });
    return res.body?.token;
  }

  async function createTenant() {
    const Tenant = require('../../models/Tenant');
    return Tenant.create({
      firstName: 'Marie',
      lastName: 'Martin',
      gender: 'F',
      email: `marie+${Date.now()}@example.com`,
      rentAmount: 850,
    });
  }

  it('generates, persists and stores a real PDF', async () => {
    const token = await adminToken();
    expect(token).toBeTruthy();
    const tenant = await createTenant();

    const res = await request(app)
      .post('/api/receipts/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tenantId: tenant.id,
        month: 7,
        year: 2026,
        amount: 850,
        charges: 40,
        paymentDate: '2026-08-01',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe('Receipt generated successfully');
    expect(res.body.emailSent).toBeNull();

    const { fileName, filePath, id } = res.body.data;
    expect(fileName).toMatch(/^2026_07_quittance_de_loyer_MARTIN_Marie\.pdf$/);

    const receiptsDir = process.env.RECEIPTS_DIR;
    const expectedPath = path.join(receiptsDir, fileName);
    expect(filePath).toBe(expectedPath);
    expect(fs.existsSync(expectedPath)).toBe(true);

    // Real PDF magic bytes prove pdfGenerator ran through the service
    const head = fs.readFileSync(expectedPath).subarray(0, 5).toString();
    expect(head).toBe('%PDF-');

    const Receipt = require('../../models/Receipt');
    const row = await Receipt.findById(id);
    expect(row).toMatchObject({
      tenant_id: tenant.id,
      month: 7,
      year: 2026,
      amount: 850,
      fileName,
    });
  }, 20000);

  it('rejects a duplicate period with 409 via the typed error path', async () => {
    const token = await adminToken();
    const tenant = await createTenant();

    const payload = { tenantId: tenant.id, month: 8, year: 2026, amount: 850 };
    const first = await request(app)
      .post('/api/receipts/generate')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/receipts/generate')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect(second.status).toBe(409);
    expect(second.body?.error?.message ?? second.body?.error).toBeTruthy();
  }, 30000);

  it('rejects invalid input with 400 before touching the service flow', async () => {
    const token = await adminToken();
    const tenant = await createTenant();

    const res = await request(app)
      .post('/api/receipts/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ tenantId: tenant.id, month: 13, year: 2026, amount: 100 });

    expect(res.status).toBe(400);
  });

  it('rejects an unknown tenant with 404 without generating a file', async () => {
    const token = await adminToken();
    const receiptsDir = process.env.RECEIPTS_DIR;
    const before = fs.readdirSync(receiptsDir).length;

    const res = await request(app)
      .post('/api/receipts/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ tenantId: 99999999, month: 9, year: 2026, amount: 500 });

    expect(res.status).toBe(404);
    expect(fs.readdirSync(receiptsDir).length).toBe(before);
  });
});
