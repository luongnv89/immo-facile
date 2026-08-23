const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DB_PATH || './database/rentReceipts.db';

let db = null;

const initializeDatabase = () => {
  // Idempotent: importing index.js after tests/tools have already initialized
  // must not open a second connection (a fresh :memory: would lose all data).
  if (db) return Promise.resolve();
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, err => {
      if (err) {
        console.error('Error opening database:', err.message);
        reject(err);
        return;
      }
      console.log('✅ Connected to SQLite database');
      createTables().then(resolve).catch(reject);
    });
  });
};

const createTables = () => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Apartments table
      db.run(
        `CREATE TABLE IF NOT EXISTS apartments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        postalCode TEXT NOT NULL,
        description TEXT,
        isActive BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
        err => {
          if (err) {
            console.error('Error creating apartments table:', err);
            reject(err);
            return;
          }
        }
      );

      // Tenants table
      db.run(
        `CREATE TABLE IF NOT EXISTS tenants (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        gender TEXT CHECK(gender IN ('M', 'F')) DEFAULT 'M',
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        apartment_id INTEGER,
        rentAmount REAL NOT NULL,
        depositAmount REAL DEFAULT 0,
        leaseStartDate TEXT,
        leaseEndDate TEXT,
        isActive BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(apartment_id) REFERENCES apartments(id) ON DELETE SET NULL
      )`,
        err => {
          if (err) {
            console.error('Error creating tenants table:', err);
            reject(err);
            return;
          }

          // Check for missing columns and add them
          db.all('PRAGMA table_info(tenants)', (err, columns) => {
            if (err) {
              console.error('Error checking table info:', err);
              return;
            }

            const columnNames = columns.map(col => col.name);

            // Add gender column if missing
            if (!columnNames.includes('gender')) {
              db.run(
                `ALTER TABLE tenants ADD COLUMN gender TEXT CHECK(gender IN ('M', 'F')) DEFAULT 'M'`,
                err => {
                  if (err) {
                    console.error('Error adding gender column:', err);
                  } else {
                    console.log('✅ Added gender column to existing tenants table');
                  }
                }
              );
            }

            // Add apartment_id column to tenants if it doesn't exist
            db.all('PRAGMA table_info(tenants)', (err, tenantColumns) => {
              if (err) {
                console.error('Error getting tenant columns:', err);
                return;
              }

              const hasApartmentId = tenantColumns.some(col => col.name === 'apartment_id');
              const hasCharges = tenantColumns.some(col => col.name === 'charges');

              if (!hasApartmentId) {
                console.log('Adding apartment_id column to tenants table...');
                db.run(
                  'ALTER TABLE tenants ADD COLUMN apartment_id INTEGER REFERENCES apartments(id)'
                );
              }

              if (!hasCharges) {
                console.log('Adding charges column to tenants table...');
                db.run('ALTER TABLE tenants ADD COLUMN charges REAL DEFAULT 0');
              }
            });

            // Make address column nullable if it exists (for backward compatibility)
            if (columnNames.includes('address')) {
              // Check if address column allows NULL
              const addressColumn = columns.find(col => col.name === 'address');
              if (addressColumn && addressColumn.notnull === 1) {
                // SQLite doesn't support modifying column constraints directly
                // We'll handle this in the application layer by providing a default value
                console.log(
                  'ℹ️ Address column kept for backward compatibility (NOT NULL constraint preserved)'
                );
              }
            }
          });
        }
      );

      // Owner/Landlord table
      db.run(`CREATE TABLE IF NOT EXISTS owner (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address1 TEXT NOT NULL,
        address2 TEXT,
        signature TEXT,
        signature_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      // Insert default owner if none exists
      db.get('SELECT COUNT(*) as count FROM owner', (err, ownerCount) => {
        if (err) {
          console.error('Error checking owner count:', err);
          return;
        }

        if (ownerCount.count === 0) {
          console.log('Creating default owner record...');
          db.run(
            `INSERT INTO owner (name, address1, address2, signature) 
                     VALUES (?, ?, ?, ?)`,
            [
              process.env.LANDLORD_NAME || 'NGUYEN Van Luong',
              process.env.LANDLORD_ADDRESS1 || '12 rue de la Paix',
              process.env.LANDLORD_ADDRESS2 || '78000 Versailles',
              process.env.LANDLORD_SIGNATURE || 'NGUYEN Van Luong',
            ],
            insertErr => {
              if (insertErr) {
                console.error('Error creating default owner:', insertErr);
              } else {
                console.log('✅ Default owner created successfully');
              }
            }
          );
        }
      });

      // Receipts table
      db.run(
        `CREATE TABLE IF NOT EXISTS receipts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        file_path TEXT,
        email_sent BOOLEAN DEFAULT 0,
        email_sent_at DATETIME,
        FOREIGN KEY (tenant_id) REFERENCES tenants (id)
      )`,
        err => {
          if (err) {
            console.error('Error creating receipts table:', err);
            reject(err);
            return;
          }

          // Check for missing columns and add them to existing receipts table.
          // IMPORTANT: statements issued from inside this async callback are NOT
          // serialized by node-sqlite3 — each step below must await the previous
          // one, or CREATE INDEX races ahead of CREATE TABLE (no such table).
          db.all('PRAGMA table_info(receipts)', async (err, receiptColumns) => {
            if (err) {
              console.error('Error checking receipts table info:', err);
              reject(err);
              return;
            }

            const columnNames = receiptColumns.map(col => col.name);
            const runP = (sql, params = []) =>
              new Promise((resolveStep, rejectStep) => {
                db.run(sql, params, stepErr => (stepErr ? rejectStep(stepErr) : resolveStep()));
              });

            try {
              // Add email_sent column if missing
              if (!columnNames.includes('email_sent')) {
                await runP(`ALTER TABLE receipts ADD COLUMN email_sent BOOLEAN DEFAULT 0`);
                console.log('✅ Added email_sent column to receipts table');
              }

              // Add file_path column if missing
              if (!columnNames.includes('file_path')) {
                await runP(`ALTER TABLE receipts ADD COLUMN file_path TEXT`);
                console.log('✅ Added file_path column to receipts table');
              }

              // Add fileName column if missing (for backward compatibility)
              if (!columnNames.includes('fileName')) {
                await runP(`ALTER TABLE receipts ADD COLUMN fileName TEXT`);
                console.log('✅ Added fileName column to receipts table');
              }

              // Add email tracking columns if missing
              if (!columnNames.includes('email_opened')) {
                await runP(`ALTER TABLE receipts ADD COLUMN email_opened BOOLEAN DEFAULT 0`);
                console.log('✅ Added email_opened column to receipts table');
              }

              if (!columnNames.includes('email_opened_at')) {
                await runP(`ALTER TABLE receipts ADD COLUMN email_opened_at DATETIME`);
                console.log('✅ Added email_opened_at column to receipts table');
              }

              if (!columnNames.includes('tracking_token')) {
                await runP(`ALTER TABLE receipts ADD COLUMN tracking_token TEXT`);
                console.log('✅ Added tracking_token column to receipts table');
              }

              // Add payment tracking columns for Task 1.1.1
              if (!columnNames.includes('payment_status')) {
                await runP(
                  `ALTER TABLE receipts ADD COLUMN payment_status TEXT CHECK(payment_status IN ('pending', 'paid', 'late', 'partial')) DEFAULT 'pending'`
                );
                console.log('✅ Added payment_status column to receipts table');
              }

              if (!columnNames.includes('payment_date')) {
                await runP(`ALTER TABLE receipts ADD COLUMN payment_date DATETIME`);
                console.log('✅ Added payment_date column to receipts table');
              }

              if (!columnNames.includes('payment_method')) {
                await runP(
                  `ALTER TABLE receipts ADD COLUMN payment_method TEXT CHECK(payment_method IN ('bank_transfer', 'check', 'cash', 'other'))`
                );
                console.log('✅ Added payment_method column to receipts table');
              }

              if (!columnNames.includes('reminder_sent_count')) {
                await runP(`ALTER TABLE receipts ADD COLUMN reminder_sent_count INTEGER DEFAULT 0`);
                console.log('✅ Added reminder_sent_count column to receipts table');
              }

              if (!columnNames.includes('last_reminder_sent_at')) {
                await runP(`ALTER TABLE receipts ADD COLUMN last_reminder_sent_at DATETIME`);
                console.log('✅ Added last_reminder_sent_at column to receipts table');
              }

              if (!columnNames.includes('notes')) {
                await runP(`ALTER TABLE receipts ADD COLUMN notes TEXT`);
                console.log('✅ Added notes column to receipts table');
              }

              // Task 1.2.2: Email Tracking Table
              await runP(
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
              await runP(
                `CREATE INDEX IF NOT EXISTS idx_email_tracking_receipt_id ON email_tracking(receipt_id)`
              );
              await runP(
                `CREATE INDEX IF NOT EXISTS idx_email_tracking_token ON email_tracking(tracking_token)`
              );
              await runP(
                `CREATE INDEX IF NOT EXISTS idx_email_tracking_sent_at ON email_tracking(sent_at)`
              );
              await runP(
                `CREATE INDEX IF NOT EXISTS idx_email_tracking_opened_at ON email_tracking(opened_at)`
              );
              await runP(
                `CREATE INDEX IF NOT EXISTS idx_email_tracking_email_type ON email_tracking(email_type)`
              );

              // Task 1.2.2: Email Events Table
              await runP(
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
              await runP(
                `CREATE INDEX IF NOT EXISTS idx_email_events_tracking_id ON email_events(tracking_id)`
              );
              await runP(
                `CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type)`
              );
              await runP(
                `CREATE INDEX IF NOT EXISTS idx_email_events_occurred_at ON email_events(occurred_at)`
              );

              // Task 4.2 (#38): one receipt per tenant/month/year.
              // Existing databases containing duplicates cannot take the
              // unique index — log loudly instead of failing startup.
              try {
                await runP(
                  `CREATE UNIQUE INDEX IF NOT EXISTS idx_receipts_tenant_period ON receipts(tenant_id, month, year)`
                );
              } catch (idxErr) {
                console.error('⚠ Could not enforce UNIQUE(tenant_id,month,year):', idxErr.message);
              }

              // Task 1.1: Users table for JWT authentication
              await runP(
                `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          role TEXT CHECK(role IN ('admin', 'user')) DEFAULT 'user',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`
              );
              console.log('✅ Created users table');

              // Seed the default admin account if no users exist
              const userCount = await new Promise((resolveCount, rejectCount) => {
                db.get('SELECT COUNT(*) as count FROM users', (countErr, row) =>
                  countErr ? rejectCount(countErr) : resolveCount(row.count)
                );
              });
              if (userCount === 0) {
                const username = process.env.ADMIN_USERNAME || 'admin';
                const password = process.env.ADMIN_PASSWORD || 'changeme123';
                const hash = await bcrypt.hash(password, 10);
                await runP(
                  `INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'admin')`,
                  [username, hash]
                );
                console.log(`✅ Seeded default admin user "${username}"`);
              }

              console.log('✅ Database tables created successfully');
              resolve();
            } catch (migrationErr) {
              console.error('Database migration error:', migrationErr);
              reject(migrationErr);
            }
          });
        }
      );
    });
  });
};

const getDatabase = () => {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
};

const closeDatabase = () => {
  return new Promise(resolve => {
    if (db) {
      db.close(err => {
        if (err) {
          console.error('Error closing database:', err.message);
        } else {
          console.log('Database connection closed');
        }
        resolve();
      });
    } else {
      resolve();
    }
  });
};

module.exports = {
  initializeDatabase,
  getDatabase,
  closeDatabase,
};
