const { allP } = require('./helpers');

// Column additions applied to receipts tables created before these columns
// existed. Each entry: [columnName, ALTER statement].
const COLUMN_ADDITIONS = [
  ['email_sent', `ALTER TABLE receipts ADD COLUMN email_sent BOOLEAN DEFAULT 0`],
  ['file_path', `ALTER TABLE receipts ADD COLUMN file_path TEXT`],
  // fileName kept for backward compatibility
  ['fileName', `ALTER TABLE receipts ADD COLUMN fileName TEXT`],
  // Email tracking columns
  ['email_opened', `ALTER TABLE receipts ADD COLUMN email_opened BOOLEAN DEFAULT 0`],
  ['email_opened_at', `ALTER TABLE receipts ADD COLUMN email_opened_at DATETIME`],
  ['tracking_token', `ALTER TABLE receipts ADD COLUMN tracking_token TEXT`],
  // Payment tracking columns (Task 1.1.1)
  [
    'payment_status',
    `ALTER TABLE receipts ADD COLUMN payment_status TEXT CHECK(payment_status IN ('pending', 'paid', 'late', 'partial')) DEFAULT 'pending'`,
  ],
  ['payment_date', `ALTER TABLE receipts ADD COLUMN payment_date DATETIME`],
  [
    'payment_method',
    `ALTER TABLE receipts ADD COLUMN payment_method TEXT CHECK(payment_method IN ('bank_transfer', 'check', 'cash', 'other'))`,
  ],
  ['reminder_sent_count', `ALTER TABLE receipts ADD COLUMN reminder_sent_count INTEGER DEFAULT 0`],
  ['last_reminder_sent_at', `ALTER TABLE receipts ADD COLUMN last_reminder_sent_at DATETIME`],
  ['notes', `ALTER TABLE receipts ADD COLUMN notes TEXT`],
];

/**
 * Receipts table upgrades: add missing columns, then enforce
 * UNIQUE(tenant_id, month, year) (Task 4.2 / #38).
 *
 * IMPORTANT: statements issued from this async context are NOT serialized by
 * node-sqlite3 — each step must await the previous one.
 *
 * Any failure except the unique-index creation is fatal (rejects startup),
 * matching the original inline migration sequence.
 */
const migrateReceipts = async (db, { runP: run }) => {
  const receiptColumns = await allP(db, 'PRAGMA table_info(receipts)');
  const columnNames = receiptColumns.map(col => col.name);

  for (const [name, ddl] of COLUMN_ADDITIONS) {
    if (columnNames.includes(name)) continue;
    await run(db, ddl);
    console.log(`✅ Added ${name} column to receipts table`);
  }

  // Task 4.2 (#38): one receipt per tenant/month/year.
  // Existing databases containing duplicates cannot take the
  // unique index — log loudly instead of failing startup.
  try {
    await run(
      db,
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_receipts_tenant_period ON receipts(tenant_id, month, year)`
    );
  } catch (idxErr) {
    console.error('⚠ Could not enforce UNIQUE(tenant_id,month,year):', idxErr.message);
  }
};

module.exports = migrateReceipts;
