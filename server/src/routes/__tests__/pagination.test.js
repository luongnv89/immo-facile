/**
 * List-endpoint pagination regression tests (#57).
 *
 * Seeds more than one page of rows and asserts that
 * GET /tenants, /receipts and /apartments honor ?page=/?limit=,
 * default to 50 items, cap the page size at 50, and expose metadata.
 */
const request = require('supertest');

describe('list endpoint pagination (#57)', () => {
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
    token = res.body?.token;
  });

  afterAll(async () => {
    const { closeDatabase } = require('../../database/db');
    await closeDatabase();
  });

  const seedTenants = async count => {
    const { getDatabase } = require('../../database/db');
    const db = getDatabase();
    const stamp = Date.now();
    for (let i = 0; i < count; i += 1) {
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO tenants (firstName, lastName, email, rentAmount) VALUES (?, ?, ?, ?)',
          [`First${i}`, `Last${i}`, `seed${stamp}-${i}@example.com`, 500],
          e => (e ? reject(e) : resolve())
        );
      });
    }
  };

  const seedReceipts = async (tenantId, count) => {
    const { getDatabase } = require('../../database/db');
    const db = getDatabase();
    for (let i = 0; i < count; i += 1) {
      // UNIQUE(tenant_id, month, year): spread over months/years
      const month = (i % 12) + 1;
      const year = 2020 + Math.floor(i / 12);
      await new Promise((resolve, reject) => {
        db.run(
          'INSERT INTO receipts (tenant_id, month, year, amount, fileName) VALUES (?, ?, ?, ?, ?)',
          [tenantId, month, year, 500, `q-${tenantId}-${month}-${year}.pdf`],
          e => (e ? reject(e) : resolve())
        );
      });
    }
  };

  it('GET /api/tenants paginates: default page of 50, second page holds the rest', async () => {
    await seedTenants(55);

    const page1 = await request(app).get('/api/tenants').set('Authorization', `Bearer ${token}`);
    expect(page1.status).toBe(200);
    expect(page1.body.data).toHaveLength(50);
    expect(page1.body.count).toBe(50);
    expect(page1.body.page).toBe(1);
    expect(page1.body.limit).toBe(50);
    expect(page1.body.totalPages).toBe(2);

    const page2 = await request(app)
      .get('/api/tenants?page=2')
      .set('Authorization', `Bearer ${token}`);
    expect(page2.status).toBe(200);
    expect(page2.body.data.length).toBeGreaterThan(0);
    expect(page2.body.data.length).toBeLessThanOrEqual(50);
    expect(page2.body.page).toBe(2);
    // No overlap between pages
    const ids1 = new Set(page1.body.data.map(t => t.id));
    page2.body.data.forEach(t => expect(ids1.has(t.id)).toBe(false));
  }, 30000);

  it('GET /api/receipts paginates and honors ?page= with capped limit', async () => {
    const Tenant = require('../../models/Tenant');
    const { rows: tenants } = await Tenant.findAll({ page: 1, limit: 1 });
    await seedReceipts(tenants[0].id, 55);

    const res = await request(app).get('/api/receipts').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(50);
    expect(res.body.total).toBeGreaterThanOrEqual(55);

    const page2 = await request(app)
      .get('/api/receipts?page=2&limit=100')
      .set('Authorization', `Bearer ${token}`);
    expect(page2.status).toBe(200);
    // limit is capped at 50 even when the client asks for more
    expect(page2.body.limit).toBe(50);
    expect(page2.body.data.length).toBeLessThan(50);
    expect(page2.body.page).toBe(2);
  }, 30000);

  it('GET /api/apartments exposes pagination metadata on an empty collection', async () => {
    const res = await request(app).get('/api/apartments').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(50);
    expect(typeof res.body.total).toBe('number');
    expect(res.body.totalPages).toBeGreaterThanOrEqual(1);
  });

  it.each(['/api/tenants', '/api/receipts', '/api/apartments'])(
    'GET %s?page=<astronomical> answers 200 with an empty page, no SQL error',
    async route => {
      const res = await request(app)
        .get(`${route}?page=999999999999999999999`)
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
      expect(res.body.page).toBe(10000000);
    },
    30000
  );
});
