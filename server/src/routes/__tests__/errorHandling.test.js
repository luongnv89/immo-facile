/**
 * Integration tests for the centralized error middleware.
 * Typed errors thrown in controllers must surface as
 * { error: { message, code } } with the mapped status via the real app.
 */
const request = require('supertest');

describe('centralized error responses (#47)', () => {
  let app;
  let token;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.ADMIN_USERNAME = 'testadmin';
    process.env.ADMIN_PASSWORD = 'testpassword123';
    const { initializeDatabase, closeDatabase } = require('../../database/db');
    await initializeDatabase();
    app = require('../../../index');
    const login = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testadmin', password: 'testpassword123' });
    token = login.body.token;
  });

  afterAll(async () => {
    const { closeDatabase } = require('../../database/db');
    await closeDatabase();
  });

  it('maps NotFoundError to 404 with the typed envelope', async () => {
    const res = await request(app)
      .get('/api/tenants/999999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: { message: 'Tenant not found', code: 'NOT_FOUND' } });
  });

  it('maps ValidationError to 400 with details preserved', async () => {
    const res = await request(app)
      .post('/api/tenants')
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toBe('Missing required fields');
    expect(res.body.error.details).toEqual(['firstName', 'lastName', 'email', 'rentAmount']);
  });

  it('keeps auth flow statuses untouched (401 without token)', async () => {
    const res = await request(app).get('/api/tenants');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Authentication required' });
  });
});
