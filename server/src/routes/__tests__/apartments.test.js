/**
 * Apartments API integration tests — Task 5.6 (#48).
 * Full CRUD against the real app + :memory: DB, happy paths and error paths.
 */
const request = require('supertest');

describe('Apartments API', () => {
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
  const validApartment = () => ({
    name: `Villa Test ${Date.now()}`,
    address: '1 rue des Lilas',
    city: 'Palaiseau',
    postalCode: '91120',
    description: 'F3 avec balcon',
  });

  it('blocks unauthenticated access', async () => {
    const res = await request(app).get('/api/apartments');
    expect(res.status).toBe(401);
  });

  it('creates an apartment (201) and rejects missing fields (400)', async () => {
    const created = await authed(request(app).post('/api/apartments')).send(validApartment());
    expect(created.status).toBe(201);
    expect(created.body.success).toBe(true);
    expect(created.body.data.id).toBeDefined();

    const bad = await authed(request(app).post('/api/apartments')).send({ name: 'Only name' });
    expect(bad.status).toBe(400);
    expect(bad.body.success).toBe(false);
    expect(bad.body.required).toEqual(['name', 'address', 'city', 'postalCode']);
  });

  it('lists apartments with tenant counts', async () => {
    await authed(request(app).post('/api/apartments')).send(validApartment());

    const list = await authed(request(app).get('/api/apartments')).send();
    expect(list.status).toBe(200);
    expect(list.body.count).toBeGreaterThanOrEqual(1);
    expect(Array.isArray(list.body.data)).toBe(true);

    const withTenants = await authed(request(app).get('/api/apartments/with-tenants')).send();
    expect(withTenants.status).toBe(200);
    expect(withTenants.body.data[0]).toHaveProperty('tenantCount');
  });

  it('gets an apartment by id and returns 404 for unknown ids', async () => {
    const created = await authed(request(app).post('/api/apartments')).send(validApartment());
    const id = created.body.data.id;

    const found = await authed(request(app).get(`/api/apartments/${id}`)).send();
    expect(found.status).toBe(200);
    expect(found.body.data.id).toBe(id);

    const missing = await authed(request(app).get('/api/apartments/999999')).send();
    expect(missing.status).toBe(404);
    expect(missing.body.error).toBe('Apartment not found');
  });

  it('updates an apartment; 400 on validation, 404 when not found', async () => {
    const created = await authed(request(app).post('/api/apartments')).send(validApartment());
    const id = created.body.data.id;

    const updated = await authed(request(app).put(`/api/apartments/${id}`)).send({
      ...validApartment(),
      name: 'Villa Renommée',
    });
    expect(updated.status).toBe(200);
    expect(updated.body.data.name).toBe('Villa Renommée');

    const invalid = await authed(request(app).put(`/api/apartments/${id}`)).send({ city: 'X' });
    expect(invalid.status).toBe(400);

    const missing = await authed(request(app).put('/api/apartments/999999')).send(validApartment());
    expect(missing.status).toBe(404);
  });

  it('deletes an apartment (soft), then 404s on re-fetch and on unknown delete', async () => {
    const created = await authed(request(app).post('/api/apartments')).send(validApartment());
    const id = created.body.data.id;

    const deleted = await authed(request(app).delete(`/api/apartments/${id}`)).send();
    expect(deleted.status).toBe(200);
    expect(deleted.body.success).toBe(true);

    const gone = await authed(request(app).get(`/api/apartments/${id}`)).send();
    expect(gone.status).toBe(404);

    const again = await authed(request(app).delete('/api/apartments/999999')).send();
    expect(again.status).toBe(404);
  });
});
