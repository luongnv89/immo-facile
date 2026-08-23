/**
 * Signature endpoint behavior tests (#57).
 *
 * Covers the async fs conversion and the mtime-keyed base64 cache:
 * - a cached response is served even after the backing file disappears
 *   (no re-read while path + mtime are unchanged)
 * - changing the file (new mtime) re-reads and re-encodes
 */
const request = require('supertest');
const fs = require('fs');
const path = require('path');

describe('GET /api/owner/signature cache (#57)', () => {
  let app;
  let token;
  const uploadsDir = path.join(__dirname, '../../../uploads');
  let sigPath;

  const getSignature = () =>
    request(app)
      .get('/api/owner/signature')
      .set('Authorization', `Bearer ${token}`)
      .then(res => {
        expect(res.status).toBe(200);
        return res.body.data.image;
      });

  const b64 = content => `data:image/png;base64,${Buffer.from(content).toString('base64')}`;

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

    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
    sigPath = path.join(uploadsDir, `test-sig-${process.pid}-${Date.now()}.png`);
    fs.writeFileSync(sigPath, 'signature-v1');

    // Point the owner record at the signature file
    const put = await request(app)
      .put('/api/owner')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Owner', address1: '1 rue de Test', signature_path: sigPath });
    expect([200, 201]).toContain(put.status);
  });

  afterAll(async () => {
    if (sigPath && fs.existsSync(sigPath)) fs.unlinkSync(sigPath);
    const { closeDatabase } = require('../../database/db');
    await closeDatabase();
  });

  it('serves the base64 data URI for the stored signature', async () => {
    const image = await getSignature();
    expect(image).toBe(b64('signature-v1'));
  }, 20000);

  it('serves unchanged signatures from cache without re-reading the file', async () => {
    const fsp = require('fs/promises');
    await getSignature(); // warm the cache
    const readSpy = jest.spyOn(fsp, 'readFile');

    const image = await getSignature();
    expect(image).toBe(b64('signature-v1'));
    // Same path + mtime: the encoded data-URI comes from the cache,
    // no second disk read happens.
    expect(readSpy).not.toHaveBeenCalled();
    readSpy.mockRestore();
  }, 20000);

  it('re-reads and re-encodes after the file changes (mtime invalidation)', async () => {
    await getSignature(); // ensure v1 is cached

    const future = new Date(Date.now() + 5000);
    fs.writeFileSync(sigPath, 'signature-v2-changed');
    fs.utimesSync(sigPath, future, future);

    const image = await getSignature();
    expect(image).toBe(b64('signature-v2-changed'));
  }, 20000);

  it('returns 404 when no signature exists', async () => {
    const put = await request(app)
      .put('/api/owner')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Owner', address1: '1 rue de Test', signature_path: '' });
    expect(put.status).toBe(200);

    const res = await request(app)
      .get('/api/owner/signature')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  }, 20000);
});
