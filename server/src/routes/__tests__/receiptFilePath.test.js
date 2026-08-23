/**
 * file_path/filePath alias regression — Task 4.3 (#39).
 */
const request = require('supertest');
const fs = require('fs');
const path = require('path');

describe('receipt filePath flows (#39)', () => {
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

  it('findById exposes filePath (aliased from file_path)', async () => {
    const Receipt = require('../../models/Receipt');
    const Tenant = require('../../models/Tenant');
    const t = await Tenant.create({
      firstName: 'Bob',
      lastName: 'Travers',
      gender: 'M',
      email: `bob+${Date.now()}@example.com`,
      rentAmount: 700,
    });
    const r = await Receipt.create({
      tenant_id: t.id,
      month: 6,
      year: 2026,
      amount: 700,
      fileName: 'q39.pdf',
      filePath: '/receipts/q39.pdf',
    });
    const row = await Receipt.findById(r.id);
    expect(row.filePath).toBe('/receipts/q39.pdf');
  });

  it('deleting a receipt removes its PDF from disk', async () => {
    const token = await adminToken();
    expect(token).toBeTruthy();

    // Create a real temp "PDF" inside the receipts dir
    const receiptsDir = path.join(__dirname, '../../../receipts');
    if (!fs.existsSync(receiptsDir)) fs.mkdirSync(receiptsDir, { recursive: true });
    const fileName = `test-delete-${Date.now()}.pdf`;
    const absPath = path.join(receiptsDir, fileName);
    fs.writeFileSync(absPath, '%PDF-1.4 delete-me');

    // Seed matching DB rows directly
    const { getDatabase } = require('../../database/db');
    const db = getDatabase();
    const tenantId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO tenants (firstName, lastName, email, rentAmount) VALUES ('Al','Coe',?,1)`,
        [`al+${Date.now()}@example.com`],
        function (e) {
          e ? reject(e) : resolve(this.lastID);
        }
      );
    });
    const receiptId = await new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO receipts (tenant_id, month, year, amount, fileName, file_path) VALUES (?, 5, 2026, 1, ?, ?)`,
        [tenantId, fileName, absPath],
        function (e) {
          e ? reject(e) : resolve(this.lastID);
        }
      );
    });

    const res = await request(app)
      .delete(`/api/receipts/${receiptId}`)
      .set('Authorization', `Bearer ${token}`);
    expect([200, 204]).toContain(res.status);
    expect(fs.existsSync(absPath)).toBe(false);
  });
});
