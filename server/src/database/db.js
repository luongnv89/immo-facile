const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || './database/rentReceipts.db';

let db = null;

const initializeDatabase = () => {
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

          // Check for missing columns and add them to existing receipts table
          db.all('PRAGMA table_info(receipts)', (err, receiptColumns) => {
            if (err) {
              console.error('Error checking receipts table info:', err);
              return;
            }

            const columnNames = receiptColumns.map(col => col.name);

            // Add email_sent column if missing
            if (!columnNames.includes('email_sent')) {
              db.run(`ALTER TABLE receipts ADD COLUMN email_sent BOOLEAN DEFAULT 0`, err => {
                if (err) {
                  console.error('Error adding email_sent column:', err);
                } else {
                  console.log('✅ Added email_sent column to receipts table');
                }
              });
            }

            // Add email_sent_at column if missing
            if (!columnNames.includes('email_sent_at')) {
              db.run(`ALTER TABLE receipts ADD COLUMN email_sent_at DATETIME`, err => {
                if (err) {
                  console.error('Error adding email_sent_at column:', err);
                } else {
                  console.log('✅ Added email_sent_at column to receipts table');
                }
              });
            }

            // Add file_path column if missing
            if (!columnNames.includes('file_path')) {
              db.run(`ALTER TABLE receipts ADD COLUMN file_path TEXT`, err => {
                if (err) {
                  console.error('Error adding file_path column:', err);
                } else {
                  console.log('✅ Added file_path column to receipts table');
                }
              });
            }

            // Add fileName column if missing (for backward compatibility)
            if (!columnNames.includes('fileName')) {
              db.run(`ALTER TABLE receipts ADD COLUMN fileName TEXT`, err => {
                if (err) {
                  console.error('Error adding fileName column:', err);
                } else {
                  console.log('✅ Added fileName column to receipts table');
                }
              });
            }

            // Add email tracking columns if missing
            if (!columnNames.includes('email_opened')) {
              db.run(`ALTER TABLE receipts ADD COLUMN email_opened BOOLEAN DEFAULT 0`, err => {
                if (err) {
                  console.error('Error adding email_opened column:', err);
                } else {
                  console.log('✅ Added email_opened column to receipts table');
                }
              });
            }

            if (!columnNames.includes('email_opened_at')) {
              db.run(`ALTER TABLE receipts ADD COLUMN email_opened_at DATETIME`, err => {
                if (err) {
                  console.error('Error adding email_opened_at column:', err);
                } else {
                  console.log('✅ Added email_opened_at column to receipts table');
                }
              });
            }

            if (!columnNames.includes('tracking_token')) {
              db.run(`ALTER TABLE receipts ADD COLUMN tracking_token TEXT`, err => {
                if (err) {
                  console.error('Error adding tracking_token column:', err);
                } else {
                  console.log('✅ Added tracking_token column to receipts table');
                }
              });
            }

            // Add payment tracking columns for Task 1.1.1
            if (!columnNames.includes('payment_status')) {
              db.run(
                `ALTER TABLE receipts ADD COLUMN payment_status TEXT CHECK(payment_status IN ('pending', 'paid', 'late', 'partial')) DEFAULT 'pending'`,
                err => {
                  if (err) {
                    console.error('Error adding payment_status column:', err);
                  } else {
                    console.log('✅ Added payment_status column to receipts table');
                  }
                }
              );
            }

            if (!columnNames.includes('payment_date')) {
              db.run(`ALTER TABLE receipts ADD COLUMN payment_date DATETIME`, err => {
                if (err) {
                  console.error('Error adding payment_date column:', err);
                } else {
                  console.log('✅ Added payment_date column to receipts table');
                }
              });
            }

            if (!columnNames.includes('payment_method')) {
              db.run(
                `ALTER TABLE receipts ADD COLUMN payment_method TEXT CHECK(payment_method IN ('bank_transfer', 'check', 'cash', 'other'))`,
                err => {
                  if (err) {
                    console.error('Error adding payment_method column:', err);
                  } else {
                    console.log('✅ Added payment_method column to receipts table');
                  }
                }
              );
            }

            if (!columnNames.includes('reminder_sent_count')) {
              db.run(
                `ALTER TABLE receipts ADD COLUMN reminder_sent_count INTEGER DEFAULT 0`,
                err => {
                  if (err) {
                    console.error('Error adding reminder_sent_count column:', err);
                  } else {
                    console.log('✅ Added reminder_sent_count column to receipts table');
                  }
                }
              );
            }

            if (!columnNames.includes('last_reminder_sent_at')) {
              db.run(`ALTER TABLE receipts ADD COLUMN last_reminder_sent_at DATETIME`, err => {
                if (err) {
                  console.error('Error adding last_reminder_sent_at column:', err);
                } else {
                  console.log('✅ Added last_reminder_sent_at column to receipts table');
                }
              });
            }

            if (!columnNames.includes('notes')) {
              db.run(`ALTER TABLE receipts ADD COLUMN notes TEXT`, err => {
                if (err) {
                  console.error('Error adding notes column:', err);
                } else {
                  console.log('✅ Added notes column to receipts table');
                }
              });
            }
          });

          // Task 1.2.2: Email Tracking Tables
          db.run(
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
        )`,
            err => {
              if (err) {
                console.error('Error creating email_tracking table:', err);
              } else {
                console.log('✅ Created email_tracking table');
              }
            }
          );

          // Create indexes for email_tracking
          db.run(
            `CREATE INDEX IF NOT EXISTS idx_email_tracking_receipt_id ON email_tracking(receipt_id)`
          );
          db.run(
            `CREATE INDEX IF NOT EXISTS idx_email_tracking_token ON email_tracking(tracking_token)`
          );
          db.run(
            `CREATE INDEX IF NOT EXISTS idx_email_tracking_sent_at ON email_tracking(sent_at)`
          );
          db.run(
            `CREATE INDEX IF NOT EXISTS idx_email_tracking_opened_at ON email_tracking(opened_at)`
          );
          db.run(
            `CREATE INDEX IF NOT EXISTS idx_email_tracking_email_type ON email_tracking(email_type)`
          );

          // Task 1.2.2: Email Events Table
          db.run(
            `CREATE TABLE IF NOT EXISTS email_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          tracking_id INTEGER NOT NULL,
          event_type TEXT NOT NULL CHECK(event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'unsubscribed')),
          event_data TEXT,
          user_agent TEXT,
          ip_address TEXT,
          occurred_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY(tracking_id) REFERENCES email_tracking(id) ON DELETE CASCADE
        )`,
            err => {
              if (err) {
                console.error('Error creating email_events table:', err);
              } else {
                console.log('✅ Created email_events table');
              }
            }
          );

          // Create indexes for email_events
          db.run(
            `CREATE INDEX IF NOT EXISTS idx_email_events_tracking_id ON email_events(tracking_id)`
          );
          db.run(`CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type)`);
          db.run(
            `CREATE INDEX IF NOT EXISTS idx_email_events_occurred_at ON email_events(occurred_at)`
          );

          console.log('✅ Database tables created successfully');
          resolve();
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
