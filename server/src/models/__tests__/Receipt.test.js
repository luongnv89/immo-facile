/**
 * Receipt model regression tests.
 * Replaces the original placeholder assertions with seeded round-trips.
 */
const Receipt = require('../Receipt');
const Tenant = require('../Tenant');

describe('Receipt Model - Payment Tracking', () => {
  let tenantId;
  let receiptId;

  const seed = async overrides => {
    if (!tenantId) {
      const t = await Tenant.create({
        firstName: 'Jean',
        lastName: 'Dupont',
        gender: 'M',
        email: `jean+${Date.now()}@example.com`,
        rentAmount: 850,
      });
      tenantId = t.id;
    }
    return Receipt.create({
      tenant_id: tenantId,
      month: 7,
      year: 2026,
      amount: 850,
      fileName: '2026_07_quittance.pdf',
      filePath: '/receipts/2026_07_quittance.pdf',
      ...overrides,
    });
  };

  beforeAll(async () => {
    const { initializeDatabase, closeDatabase } = require('../../database/db');
    await initializeDatabase();
  });

  afterAll(async () => {
    const { closeDatabase } = require('../../database/db');
    await closeDatabase();
  });

  describe('create + findByPaymentStatus round-trip', () => {
    it('seeds a pending receipt and finds it by status', async () => {
      const r = await seed();
      expect(r.id).toBeGreaterThan(0);
      receiptId = r.id;

      const pending = await Receipt.findByPaymentStatus('pending');
      expect(pending.some(x => x.id === receiptId)).toBe(true);
    });

    it('rejects an invalid status parameter', async () => {
      await expect(Receipt.findByPaymentStatus('invalid')).rejects.toThrow(
        /Invalid payment status/
      );
    });
  });

  describe('updatePaymentStatus', () => {
    it('updates status to paid and persists the change', async () => {
      await Receipt.updatePaymentStatus(receiptId, 'paid');
      const paid = await Receipt.findByPaymentStatus('paid');
      expect(paid.some(x => x.id === receiptId)).toBe(true);
    });

    it('rejects invalid statuses', async () => {
      await expect(Receipt.updatePaymentStatus(receiptId, 'bogus')).rejects.toThrow(
        /Invalid payment status/
      );
    });

    it('reports a missing receipt', async () => {
      await expect(Receipt.updatePaymentStatus(999999, 'paid')).rejects.toThrow(
        'Receipt not found'
      );
    });
  });

  describe('recordPayment', () => {
    let r;

    beforeAll(async () => {
      r = await seed({ month: 8 });
    });

    it('records a payment and flips status to paid', async () => {
      const res = await Receipt.recordPayment(r.id, {
        payment_date: new Date().toISOString(),
        payment_method: 'bank_transfer',
        notes: 'virement sept',
      });
      expect(res.payment_status).toBe('paid');
      expect(res.updated).toBe(true);

      const paid = await Receipt.findByPaymentStatus('paid');
      expect(paid.some(x => x.id === r.id)).toBe(true);
    });

    it('rejects future payment dates', async () => {
      const future = new Date(Date.now() + 86400000).toISOString();
      await expect(Receipt.recordPayment(r.id, { payment_date: future })).rejects.toThrow(/future/);
    });

    it('rejects invalid payment methods', async () => {
      await expect(Receipt.recordPayment(r.id, { payment_method: 'crypto' })).rejects.toThrow(
        /Invalid payment method/
      );
    });
  });
});
