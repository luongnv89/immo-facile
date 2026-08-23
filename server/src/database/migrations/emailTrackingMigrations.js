/**
 * Task 1.2.2: email tracking and email events tables with their indexes.
 * Index creation must follow its CREATE TABLE, hence the sequential awaits
 * (statements from async callbacks are not serialized by node-sqlite3).
 *
 * Any failure is fatal (rejects startup), matching the original sequence.
 */
const migrateEmailTracking = async (db, { runP: run }) => {
  await run(
    db,
    `CREATE TABLE IF NOT EXISTS email_tracking (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      receipt_id INTEGER NOT NULL,
      email_type TEXT NOT NULL CHECK(email_type IN ('receipt', 'reminder', 'notification')),
      tracking_token TEXT UNIQUE NOT NULL,
      recipient_email TEXT NOT NULL,
      subject TEXT,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      opened_at DATETIME,
      open_count INTEGER DEFAULT 0,
      last_opened_at DATETIME,
      user_agent TEXT,
      ip_address TEXT,
      device_type TEXT,
      email_client TEXT,
      is_mobile BOOLEAN DEFAULT 0,
      bounce_type TEXT CHECK(bounce_type IN ('hard', 'soft', 'none')) DEFAULT 'none',
      bounced_at DATETIME,
      unsubscribed BOOLEAN DEFAULT 0,
      unsubscribed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(receipt_id) REFERENCES receipts(id) ON DELETE CASCADE
    )`
  );
  console.log('✅ Created email_tracking table');

  // Indexes for email_tracking (must follow its CREATE TABLE)
  await run(
    db,
    `CREATE INDEX IF NOT EXISTS idx_email_tracking_receipt_id ON email_tracking(receipt_id)`
  );
  await run(
    db,
    `CREATE INDEX IF NOT EXISTS idx_email_tracking_token ON email_tracking(tracking_token)`
  );
  await run(db, `CREATE INDEX IF NOT EXISTS idx_email_tracking_sent_at ON email_tracking(sent_at)`);
  await run(
    db,
    `CREATE INDEX IF NOT EXISTS idx_email_tracking_opened_at ON email_tracking(opened_at)`
  );
  await run(
    db,
    `CREATE INDEX IF NOT EXISTS idx_email_tracking_email_type ON email_tracking(email_type)`
  );

  // Task 1.2.2: Email Events Table
  await run(
    db,
    `CREATE TABLE IF NOT EXISTS email_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tracking_id INTEGER NOT NULL,
      event_type TEXT NOT NULL CHECK(event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed')),
      event_data TEXT,
      user_agent TEXT,
      ip_address TEXT,
      occurred_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(tracking_id) REFERENCES email_tracking(id) ON DELETE CASCADE
    )`
  );
  console.log('✅ Created email_events table');

  // Indexes for email_events (must follow its CREATE TABLE)
  await run(
    db,
    `CREATE INDEX IF NOT EXISTS idx_email_events_tracking_id ON email_events(tracking_id)`
  );
  await run(db, `CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type)`);
  await run(
    db,
    `CREATE INDEX IF NOT EXISTS idx_email_events_occurred_at ON email_events(occurred_at)`
  );
};

module.exports = migrateEmailTracking;
