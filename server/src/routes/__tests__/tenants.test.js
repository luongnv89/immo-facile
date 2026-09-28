/**
 * Tenants API integration tests — Task 5.6 (#48).
 * CRUD, validation, duplicate-email conflict and soft-delete email recycling.
 */
const request = require('supertest');

describe('Tenants API', () => {
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

  const authed = request => request.set('Authorization', `Bearer ${token}`);
  const validTenant = over => ({
    firstName: 'Jean',
    lastName: 'Dupont',
    gender: 'M',
    email: `jean.dupont+${Date.now()}@example.com`,
    phone: '06 12 34 56 78',
    rentAmount: 750,
    charges: 50,
    depositAmount: 1500,
    leaseStartDate: '2026-01-01',
    leaseEndDate: '2027-01-01',
    ...over,
  });

  it('blocks unauthenticated access', async () => {
    const res = await request(app).get('/api/tenants');
    expect(res.status).toBe(401);
  });

  it('creates a tenant (201) linked to an apartment', async () => {
    const Apartment = require('../../models/Apartment');
    const apartment = await Apartment.create(validApartmentData());

    const res = await authed(request(app).post('/api/tenants')).send(
      validTenant({ apartment_id: apartment.id })
    );
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(res.body.data.email.toLowerCase());
  });

  it('rejects missing fields, non-positive rent and duplicate emails', async () => {
    const missing = await authed(request(app).post('/api/tenants')).send({
      firstName: 'Solo',
    });
    expect(missing.status).toBe(400);
    expect(missing.body.error.code).toBe('VALIDATION_ERROR');

    const badRent = await authed(request(app).post('/api/tenants')).send(
      validTenant({ rentAmount: -10 })
    );
    expect(badRent.status).toBe(400);

    const dupEmail = validTenant().email;
    await authed(request(app).post('/api/tenants')).send(validTenant({ email: dupEmail }));
    const dup = await authed(request(app).post('/api/tenants')).send(
      validTenant({ email: dupEmail })
    );
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('CONFLICT');
  });

  it('lists tenants with apartment details joined', async () => {
    const res = await authed(request(app).get('/api/tenants')).send();
    expect(res.status).toBe(200);
    expect(res.body.count).toBeGreaterThanOrEqual(1);
    expect(res.body.data[0]).toHaveProperty('rentAmount');
  });

  it('gets a tenant by id; unknown id is a 404', async () => {
    const created = await authed(request(app).post('/api/tenants')).send(validTenant());
    const found = await authed(request(app).get(`/api/tenants/${created.body.data.id}`)).send();
    expect(found.status).toBe(200);
    expect(found.body.data.lastName).toBe('Dupont');

    const missing = await authed(request(app).get('/api/tenants/999999')).send();
    expect(missing.status).toBe(404);
  });

  it('updates a tenant (200)', async () => {
    const created = await authed(request(app).post('/api/tenants')).send(validTenant());
    const id = created.body.data.id;

    const updated = await authed(request(app).put(`/api/tenants/${id}`)).send(
      validTenant({
        email: `updated+${Date.now()}@example.com`,
        rentAmount: 800,
        firstName: 'Jeanne',
      })
    );
    expect(updated.status).toBe(200);
    expect(updated.body.data.rentAmount).toBe(800);
    expect(updated.body.data.firstName).toBe('Jeanne');
  });

  it('soft-deletes a tenant, frees the email, and 404s on unknown delete', async () => {
    const email = `todelete+${Date.now()}@example.com`;
    const created = await authed(request(app).post('/api/tenants')).send(validTenant({ email }));
    const id = created.body.data.id;

    const deleted = await authed(request(app).delete(`/api/tenants/${id}`)).send();
    expect(deleted.status).toBe(200);
    expect(deleted.body.message).toMatch(/deleted/i);

    const recreated = await authed(request(app).post('/api/tenants')).send(validTenant({ email }));
    expect(recreated.status).toBe(201);

    const missing = await authed(request(app).delete('/api/tenants/999999')).send();
    expect(missing.status).toBe(404);
  });

  function validApartmentData() {
    return {
      name: `T2 Test ${Date.now()}`,
      address: '9 avenue du Château',
      city: 'Versailles',
      postalCode: '78000',
    };
  }
});
