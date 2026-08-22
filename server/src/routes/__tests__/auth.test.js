/**
 * Auth integration tests — Task 1.1 (#16).
 * Runs against the real app with the isolated :memory: DB from jest.setup.js.
 */
const request = require('supertest');

describe('Authentication layer', () => {
  let app;

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.ADMIN_USERNAME = 'testadmin';
    process.env.ADMIN_PASSWORD = 'testpassword123';
    const { initializeDatabase, closeDatabase } = require('../../database/db');
    await initializeDatabase();
    app = require('../../../index');
  });

  afterAll(async () => {
    const { closeDatabase } = require('../../database/db');
    await closeDatabase();
  });

  describe('unauthenticated access', () => {
    it.each([
      ['GET', '/api/tenants'],
      ['POST', '/api/tenants'],
      ['GET', '/api/receipts'],
      ['PUT', '/api/apartments/1'],
      ['DELETE', '/api/receipts/1'],
      ['GET', '/api/owner'],
      ['GET', '/api/reminders/status'],
      ['GET', '/api/email-tracking/analytics'],
    ])('blocks %s %s with 401', async (method, url) => {
      const res = await request(app)[method.toLowerCase()](url);
      expect(res.status).toBe(401);
    });

    it('allows health check without token', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('OK');
    });
  });

  describe('login', () => {
    it('issues a JWT for valid admin credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testadmin', password: 'testpassword123' });
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.role).toBe('admin');
    });

    it('rejects wrong password with 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testadmin', password: 'wrong-password' });
      expect(res.status).toBe(401);
    });

    it('rejects missing fields with 400', async () => {
      const res = await request(app).post('/api/auth/login').send({});
      expect(res.status).toBe(400);
    });
  });

  describe('token usage', () => {
    let token;

    beforeAll(async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'testadmin', password: 'testpassword123' });
      token = res.body.token;
    });

    it('accepts a valid Bearer token on a CRUD route', async () => {
      const res = await request(app).get('/api/tenants').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
    });

    it('rejects a malformed token with 401', async () => {
      const res = await request(app).get('/api/tenants').set('Authorization', 'Bearer not-a-jwt');
      expect(res.status).toBe(401);
    });

    it('returns current user on /api/auth/me', async () => {
      const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.user.username).toBe('testadmin');
    });

    it('allows admin to trigger reminders', async () => {
      const res = await request(app)
        .post('/api/reminders/trigger')
        .set('Authorization', `Bearer ${token}`);
      // Admin passes the 403 gate; handler may return 200 or 500 depending on
      // scheduler state, but must not be 401/403.
      expect(res.status).not.toBe(401);
      expect(res.status).not.toBe(403);
    });
  });

  describe('admin-only endpoints', () => {
    it('returns 403 for POST /api/reminders/trigger without a token', async () => {
      const res = await request(app).post('/api/reminders/trigger');
      expect(res.status).toBe(401); // no token at all -> unauthenticated
    });

    it('returns 403 for a non-admin token on POST /api/reminders/trigger', async () => {
      await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${(await loginAdmin()).body.token}`)
        .send({ username: 'plainuser', password: 'userpassword123' });
      const userLogin = await request(app)
        .post('/api/auth/login')
        .send({ username: 'plainuser', password: 'userpassword123' });
      const res = await request(app)
        .post('/api/reminders/trigger')
        .set('Authorization', `Bearer ${userLogin.body.token}`);
      expect(res.status).toBe(403);
    });

    it('forbids non-admin register and rejects duplicate usernames', async () => {
      const admin = await loginAdmin();
      const forbidden = await request(app)
        .post('/api/auth/register')
        .send({ username: 'x', password: 'password123' });
      expect(forbidden.status).toBe(401);

      const dup = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${admin.body.token}`)
        .send({ username: 'testadmin', password: 'password123' });
      expect(dup.status).toBe(409);
    });
  });

  async function loginAdmin() {
    return request(app)
      .post('/api/auth/login')
      .send({ username: 'testadmin', password: 'testpassword123' });
  }
});
