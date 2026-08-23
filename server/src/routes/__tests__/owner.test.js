/**
 * Owner API integration tests — Task 5.6 (#48).
 * Profile CRUD plus signature upload validation (extension allowlist +
 * magic-byte sniffing) and base64 retrieval.
 */
const request = require('supertest');
const fs = require('fs');
const path = require('path');

describe('Owner API', () => {
  let app;
  let token;

  const PNG_BYTES = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(16, 0xab), // payload past the magic number
  ]);
  const GARBAGE_BYTES = Buffer.alloc(24, 0x00);

  const authed = request => request.set('Authorization', `Bearer ${token}`);
  const uploadsDir = path.join(__dirname, '../../../uploads');
  const uploadedFiles = () =>
    fs.existsSync(uploadsDir)
      ? fs.readdirSync(uploadsDir).filter(f => f.startsWith('signature-'))
      : [];

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
    uploadedFiles().forEach(f => fs.unlinkSync(path.join(uploadsDir, f)));
    const { closeDatabase } = require('../../database/db');
    await closeDatabase();
  });

  it('blocks unauthenticated access', async () => {
    const res = await request(app).get('/api/owner');
    expect(res.status).toBe(401);
  });

  it('returns the seeded default owner', async () => {
    const res = await authed(request(app).get('/api/owner')).send();
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBeTruthy();
  });

  it('updates owner info; 400 on missing fields or escaping signature_path', async () => {
    const valid = await authed(request(app).put('/api/owner')).send({
      name: 'Jean Propriétaire',
      address1: '12 rue de la Paix',
      address2: '78000 Versailles',
    });
    expect(valid.status).toBe(200);
    expect(valid.body.data.name).toBe('Jean Propriétaire');

    const refetched = await authed(request(app).get('/api/owner')).send();
    expect(refetched.body.data.address1).toBe('12 rue de la Paix');

    const missing = await authed(request(app).put('/api/owner')).send({ name: 'Sans adresse' });
    expect(missing.status).toBe(400);

    const traversal = await authed(request(app).put('/api/owner')).send({
      name: 'Jean Propriétaire',
      address1: '12 rue de la Paix',
      signature_path: '/etc/passwd',
    });
    expect(traversal.status).toBe(400);

    const relativeTraversal = await authed(request(app).put('/api/owner')).send({
      name: 'Jean Propriétaire',
      address1: '12 rue de la Paix',
      signature_path: '../../secrets/sig.png',
    });
    expect(relativeTraversal.status).toBe(400);
  });

  it('creates an owner record directly (201)', async () => {
    const res = await authed(request(app).post('/api/owner')).send({
      name: 'Deuxième Fiche',
      address1: '2 avenue Test',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    // GET-style payload returns the first owner row (LIMIT 1)
    expect(res.body.message).toMatch(/created/i);
  });

  it('returns 404 when no signature image exists yet', async () => {
    // Fresh per-file DB: no owner row has a signature_path at this point.
    const res = await authed(request(app).get('/api/owner/signature')).send();
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('rejects signature upload without a file (400)', async () => {
    const res = await authed(request(app).post('/api/owner/signature')).send();
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/no file/i);
  });

  it('rejects disallowed extensions (400)', async () => {
    const res = await authed(request(app).post('/api/owner/signature')).attach(
      'signature',
      PNG_BYTES,
      { filename: 'signature.txt', contentType: 'image/png' }
    );
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/extension/i);
    expect(uploadedFiles()).toHaveLength(0);
  });

  it('rejects image extensions with non-image bytes (400)', async () => {
    const res = await authed(request(app).post('/api/owner/signature')).attach(
      'signature',
      GARBAGE_BYTES,
      { filename: 'fake.png', contentType: 'image/png' }
    );
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/not a supported image/i);
    expect(uploadedFiles()).toHaveLength(0);
  });

  it('stores a genuine PNG signature and replaces the previous one', async () => {
    const first = await authed(request(app).post('/api/owner/signature')).attach(
      'signature',
      PNG_BYTES,
      { filename: 'signature-one.png', contentType: 'image/png' }
    );
    expect(first.status).toBe(200);
    expect(first.body.data.signature_path).toBeTruthy();
    const firstPath = first.body.data.signature_path;
    expect(fs.existsSync(firstPath)).toBe(true);

    const second = await authed(request(app).post('/api/owner/signature')).attach(
      'signature',
      PNG_BYTES,
      { filename: 'signature-two.png', contentType: 'image/png' }
    );
    expect(second.status).toBe(200);
    expect(fs.existsSync(firstPath)).toBe(false); // old file cleaned up
    expect(uploadedFiles()).toHaveLength(1);
  });

  it('serves the stored signature as base64 data URL', async () => {
    const res = await authed(request(app).get('/api/owner/signature')).send();
    expect(res.status).toBe(200);
    expect(res.body.data.mimeType).toBe('image/png');
    expect(res.body.data.image).toMatch(/^data:image\/png;base64,/);
    expect(res.body.data.filename).toMatch(/^signature-.+\.png$/);
  });
});
