/**
 * Index existence tests — Task 5.4 (#46).
 *
 * Asserts the indexes relied upon by hot queries exist after
 * initializeDatabase, by querying sqlite_master / PRAGMA metadata.
 */
const { initializeDatabase, closeDatabase, getDatabase } = require('../../db');
const { allP } = require('../helpers');

describe('database indexes (#46)', () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  const indexRows = async table =>
    allP(
      getDatabase(),
      `SELECT name, tbl_name, sql FROM sqlite_master WHERE type = 'index' AND tbl_name = ?`,
      [table]
    );

  it('creates idx_receipts_payment_status on receipts(payment_status)', async () => {
    const rows = await indexRows('receipts');
    const idx = rows.find(r => r.name === 'idx_receipts_payment_status');
    expect(idx).toBeDefined();
    expect(idx.sql).toMatch(/CREATE INDEX idx_receipts_payment_status/i);
    expect(idx.sql).toMatch(/ON receipts\s*\(\s*payment_status\s*\)/i);
  });

  it('covers tenant_id lookups via the leftmost column of the unique period index', async () => {
    const rows = await indexRows('receipts');
    const idx = rows.find(r => r.name === 'idx_receipts_tenant_period');
    expect(idx).toBeDefined();

    const cols = await allP(getDatabase(), 'PRAGMA index_info(idx_receipts_tenant_period)');
    expect(cols.map(c => c.name)[0]).toBe('tenant_id');
  });

  it('relies on the UNIQUE constraint auto-index for tenants(email)', async () => {
    const indexList = await allP(getDatabase(), 'PRAGMA index_list(tenants)');
    const uniqueAutoIndex = indexList.find(i => i.unique === 1 && i.origin === 'u');
    expect(uniqueAutoIndex).toBeDefined();

    const cols = await allP(getDatabase(), `PRAGMA index_info(${uniqueAutoIndex.name})`);
    expect(cols.map(c => c.name)).toEqual(['email']);
  });
});
