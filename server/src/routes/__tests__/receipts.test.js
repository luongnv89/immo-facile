/**
 * Receipts API integration tests — Task 5.6 (#48).
 * Full quittance lifecycle against the real app: PDF generation on disk,
 * validation errors, conflicts, payment status management, download,
 * email error paths, tracking pixel and deletion.
 */
const request = require('supertest');
const fs = require('fs');

describe('Receipts API', () => {
  let app;
  let token;

  let tenantA; // has an email
  let tenantB; // no email
  let receiptA1; // June 2026 — used for download / payment flows
  const createdFiles = [];

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    const { initializeDatabase, closeDatabase } = require('../../database/db');
    await initializeDatabase();
    app = require('../../../index');
    const login = await request(app)
      .post('/api/auth/login')
      .send({
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'changeme123',
      });
    token = login.body.token;

    const Tenant = require('../../models/Tenant');
    tenantA = await Tenant.create({
      firstName: 'Alice',
      lastName: 'Martin',
      gender: 'F',
      email: `alice.martin+${Date.now()}@example.com`,
      rentAmount: 820,
      address: 'N/A',
    });
    tenantB = await Tenant.create({
      firstName: 'Basile',
      lastName: 'Nowak',
      gender: 'M',
      email: '',
      rentAmount: 650,
      address: 'N/A',
    });
  });

  afterAll(async () => {
    createdFiles.forEach(f => {
      if (fs.existsSync(f)) fs.unlinkSync(f);
    });
    const { closeDatabase } = require('../../database/db');
    await closeDatabase();
  });

  const authed = r => r.set('Authorization', `Bearer ${token}`);
  const generate = body => authed(request(app).post('/api/receipts/generate')).send(body);

  it('blocks unauthenticated access', async () => {
    const res = await request(app).get('/api/receipts');
    expect(res.status).toBe(401);
  });

  it('validates required fields, period ranges, amount and unknown tenant', async () => {
    const missing = await generate({ tenantId: tenantA.id });
    expect(missing.status).toBe(400);
    expect(missing.body.error.code).toBe('VALIDATION_ERROR');

    const cases = [
      [{ month: 13, year: 2026, amount: 100 }, 400], // month out of range
      [{ month: 0, year: 2026, amount: 100 }, 400],
      [{ month: 6, year: 1999, amount: 100 }, 400], // implausible year
      [{ month: 6, year: 2026, amount: -5 }, 400], // non-positive amount
      [{ month: 6, year: 2026, amount: 'abc' }, 400],
      [{ month: 6, year: 2026, amount: 100, charges: -1 }, 400], // negative charges
    ];
    for (const [extra, expected] of cases) {
      const res = await generate({ tenantId: tenantA.id, ...extra });
      expect(res.status).toBe(expected);
    }

    const unknownTenant = await generate({
      tenantId: 999999,
      month: 6,
      year: 2026,
      amount: 100,
    });
    expect(unknownTenant.status).toBe(404);
  });

  it('generates a real PDF quittance on disk (201)', async () => {
    const res = await generate({
      tenantId: tenantA.id,
      month: 6,
      year: 2026,
      amount: 820,
      charges: 55,
      paymentDate: '2026-06-28',
    });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    receiptA1 = res.body.data;
    expect(receiptA1.tracking_token).toHaveLength(64);

    expect(receiptA1.fileName).toBe('2026_06_quittance_de_loyer_MARTIN_Alice.pdf');
    createdFiles.push(receiptA1.filePath);
    expect(fs.existsSync(receiptA1.filePath)).toBe(true);
    const header = fs.readFileSync(receiptA1.filePath).subarray(0, 5).toString();
    expect(header).toBe('%PDF-');
  }, 20000);

  it('rejects a duplicate period with 409', async () => {
    const res = await generate({
      tenantId: tenantA.id,
      month: 6,
      year: 2026,
      amount: 820,
    });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });

  it('reports email failure when the SMTP service is unconfigured (still 201)', async () => {
    const res = await generate({
      tenantId: tenantA.id,
      month: 7,
      year: 2026,
      amount: 820,
      sendEmail: true,
    });
    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/email sending failed/i);
    expect(res.body.emailSent.success).toBe(false);
    createdFiles.push(res.body.data.filePath);
  });

  it('notes the missing tenant email without failing generation', async () => {
    const res = await generate({
      tenantId: tenantB.id,
      month: 7,
      year: 2026,
      amount: 650,
      sendEmail: true,
    });
    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/no email address/i);
    expect(res.body.emailSent.error).toMatch(/no email/i);
    createdFiles.push(res.body.data.filePath);
  });

  it('lists all receipts and filters by tenant', async () => {
    const all = await authed(request(app).get('/api/receipts')).send();
    expect(all.status).toBe(200);
    expect(all.body.count).toBeGreaterThanOrEqual(3);
    expect(all.body.data[0]).toHaveProperty('filePath');

    const forTenant = await authed(request(app).get(`/api/receipts/tenant/${tenantB.id}`)).send();
    expect(forTenant.status).toBe(200);
    expect(forTenant.body.count).toBe(1);
    expect(forTenant.body.data[0].tenant_id).toBe(tenantB.id);
  });

  it('downloads an existing PDF; unknown ids are 404', async () => {
    const res = await authed(request(app).get(`/api/receipts/download/${receiptA1.id}`)).send();
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toContain(receiptA1.fileName);
    expect(res.body.subarray(0, 5).toString()).toBe('%PDF-');

    const missing = await authed(request(app).get('/api/receipts/download/999999')).send();
    expect(missing.status).toBe(404);
  });

  describe('payment status management', () => {
    it('updates status; invalid values are rejected', async () => {
      const ok = await authed(
        request(app).patch(`/api/receipts/${receiptA1.id}/payment-status`)
      ).send({ status: 'late' });
      expect(ok.status).toBe(200);
      expect(ok.body.data.payment_status).toBe('late');

      const bad = await authed(
        request(app).patch(`/api/receipts/${receiptA1.id}/payment-status`)
      ).send({ status: 'bogus' });
      expect(bad.status).toBe(400);

      const none = await authed(
        request(app).patch(`/api/receipts/${receiptA1.id}/payment-status`)
      ).send({});
      expect(none.status).toBe(400);

      const missing = await authed(request(app).patch('/api/receipts/999999/payment-status')).send({
        status: 'paid',
      });
      expect(missing.status).toBe(404);
    });

    it('records a payment; invalid method or future date are rejected', async () => {
      const ok = await authed(
        request(app).post(`/api/receipts/${receiptA1.id}/record-payment`)
      ).send({
        payment_date: '2026-07-02',
        payment_method: 'bank_transfer',
        notes: 'Virement mensuel',
      });
      expect(ok.status).toBe(200);
      expect(ok.body.data.payment_status).toBe('paid');

      const badMethod = await authed(
        request(app).post(`/api/receipts/${receiptA1.id}/record-payment`)
      ).send({ payment_method: 'crypto' });
      expect(badMethod.status).toBe(400);

      const futureDate = await authed(
        request(app).post(`/api/receipts/${receiptA1.id}/record-payment`)
      ).send({ payment_date: '2999-01-01', payment_method: 'cash' });
      expect(futureDate.status).toBe(400);

      const missing = await authed(request(app).post('/api/receipts/999999/record-payment')).send({
        payment_method: 'cash',
      });
      expect(missing.status).toBe(404);
    });

    it('filters by payment status; unknown statuses are 400', async () => {
      const paid = await authed(request(app).get('/api/receipts/payment-status/paid')).send();
      expect(paid.status).toBe(200);
      expect(paid.body.data.some(r => r.id === receiptA1.id)).toBe(true);

      const pending = await authed(request(app).get('/api/receipts/payment-status/pending')).send();
      expect(pending.status).toBe(200);
      expect(pending.status === 200).toBe(true);

      const bad = await authed(request(app).get('/api/receipts/payment-status/bogus')).send();
      expect(bad.status).toBe(400);
    });

    it('exposes payment history; unknown ids are 404', async () => {
      const history = await authed(
        request(app).get(`/api/receipts/${receiptA1.id}/payment-history`)
      ).send();
      expect(history.status).toBe(200);
      expect(history.body.data.payment_status).toBe('paid');

      const missing = await authed(request(app).get('/api/receipts/999999/payment-history')).send();
      expect(missing.status).toBe(404);
    });
  });

  describe('email sending', () => {
    it('returns 404 for an unknown receipt', async () => {
      const res = await authed(request(app).post('/api/receipts/email/999999')).send();
      expect(res.status).toBe(404);
    });

    it('returns 400 when the tenant has no email address', async () => {
      const list = await authed(request(app).get(`/api/receipts/tenant/${tenantB.id}`)).send();
      const receiptB = list.body.data[0];
      const res = await authed(request(app).post(`/api/receipts/email/${receiptB.id}`)).send();
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 404 when the stored PDF file has vanished', async () => {
      fs.unlinkSync(receiptA1.filePath);
      const res = await authed(request(app).post(`/api/receipts/email/${receiptA1.id}`)).send();
      expect(res.status).toBe(404);
    });
  });

  describe('email-open tracking pixel', () => {
    it('records an open for a known token and always answers with the GIF', async () => {
      const res = await authed(
        request(app).get(`/api/receipts/track/${receiptA1.tracking_token}`)
      ).send();
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('image/gif');
      expect(res.headers['cache-control']).toContain('no-store');

      const stats = await authed(
        request(app).get(`/api/email-tracking/receipt/${receiptA1.id}`)
      ).send();
      expect(stats.status).toBe(200);
      expect(stats.body.success).toBe(true);
    });

    it('answers with the pixel even for unknown tokens', async () => {
      const res = await authed(request(app).get('/api/receipts/track/not-a-token')).send();
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toBe('image/gif');
    });
  });

  it('deletes a receipt together with its file; second delete is 404', async () => {
    // receiptA1's file was removed above, so exercise deletion on a fresh one
    const gen = await generate({
      tenantId: tenantA.id,
      month: 5,
      year: 2026,
      amount: 820,
    });
    const target = gen.body.data;
    createdFiles.push(target.filePath);
    expect(fs.existsSync(target.filePath)).toBe(true);

    const del = await authed(request(app).delete(`/api/receipts/${target.id}`)).send();
    expect(del.status).toBe(200);
    expect(fs.existsSync(target.filePath)).toBe(false);

    const again = await authed(request(app).delete(`/api/receipts/${target.id}`)).send();
    expect(again.status).toBe(404);
  });
});
