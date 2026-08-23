/**
 * Data-integrity regression tests.
 */
const Receipt = require('../Receipt');
const Tenant = require('../Tenant');
const PDFGenerator = require('../../utils/pdfGenerator');

describe('receipt period dates (#38)', () => {
  it.each([
    [7, 2026, '31'],
    [2, 2028, '29'], // leap year
    [2, 2027, '28'],
    [12, 2026, '31'],
    [4, 2026, '30'],
  ])('month %i/%i ends on day %s', (month, year, expected) => {
    expect(PDFGenerator.getLastDayOfCoveredMonth(month, year)).toBe(expected);
  });

  it('period starts on day 01', () => {
    expect(PDFGenerator.getFirstDayOfCoveredMonth()).toBe('01');
  });
});

describe('UNIQUE(tenant_id, month, year) constraint (#38)', () => {
  let tenantId;

  beforeAll(async () => {
    const { initializeDatabase, closeDatabase } = require('../../database/db');
    await initializeDatabase();
    const t = await Tenant.create({
      firstName: 'Léa',
      lastName: 'Bernard',
      gender: 'F',
      email: `lea+${Date.now()}@example.com`,
      rentAmount: 800,
    });
    tenantId = t.id;
  });

  afterAll(async () => {
    const { closeDatabase } = require('../../database/db');
    await closeDatabase();
  });

  const createForPeriod = () =>
    Receipt.create({
      tenant_id: tenantId,
      month: 5,
      year: 2026,
      amount: 800,
      fileName: 'q.pdf',
      filePath: '/receipts/q.pdf',
    });

  it('allows the first receipt then rejects the duplicate', async () => {
    const first = await createForPeriod();
    expect(first.id).toBeGreaterThan(0);
    await expect(createForPeriod()).rejects.toThrow(/UNIQUE constraint/);
  });
});
