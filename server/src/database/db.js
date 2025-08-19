const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = process.env.DB_PATH || './database/rentReceipts.db';

let db = null;

const initializeDatabase = () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
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
      db.run(`CREATE TABLE IF NOT EXISTS apartments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        city TEXT NOT NULL,
        postalCode TEXT NOT NULL,
        description TEXT,
        isActive BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          console.error('Error creating apartments table:', err);
          reject(err);
          return;
        }
      });

      // Tenants table
      db.run(`CREATE TABLE IF NOT EXISTS tenants (
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
      )`, (err) => {
        if (err) {
          console.error('Error creating tenants table:', err);
          reject(err);
          return;
        }
        
        // Check for missing columns and add them
        db.all("PRAGMA table_info(tenants)", (err, columns) => {
          if (err) {
            console.error('Error checking table info:', err);
            return;
          }
          
          const columnNames = columns.map(col => col.name);
          
          // Add gender column if missing
          if (!columnNames.includes('gender')) {
            db.run(`ALTER TABLE tenants ADD COLUMN gender TEXT CHECK(gender IN ('M', 'F')) DEFAULT 'M'`, (err) => {
              if (err) {
                console.error('Error adding gender column:', err);
              } else {
                console.log('✅ Added gender column to existing tenants table');
              }
            });
          }
          
          // Add apartment_id column to tenants if it doesn't exist
          db.all("PRAGMA table_info(tenants)", (err, tenantColumns) => {
            if (err) {
              console.error('Error getting tenant columns:', err);
              return;
            }
            
            const hasApartmentId = tenantColumns.some(col => col.name === 'apartment_id');
            const hasCharges = tenantColumns.some(col => col.name === 'charges');
          
            if (!hasApartmentId) {
              console.log('Adding apartment_id column to tenants table...');
              db.run('ALTER TABLE tenants ADD COLUMN apartment_id INTEGER REFERENCES apartments(id)');
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
              console.log('ℹ️ Address column kept for backward compatibility (NOT NULL constraint preserved)');
            }
          }
        });
      });

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
      db.get("SELECT COUNT(*) as count FROM owner", (err, ownerCount) => {
        if (err) {
          console.error('Error checking owner count:', err);
          return;
        }
        
        if (ownerCount.count === 0) {
          console.log('Creating default owner record...');
          db.run(`INSERT INTO owner (name, address1, address2, signature) 
                     VALUES (?, ?, ?, ?)`,
            [
              process.env.LANDLORD_NAME || 'NGUYEN Van Luong',
              process.env.LANDLORD_ADDRESS1 || '12 rue de la Paix',
              process.env.LANDLORD_ADDRESS2 || '78000 Versailles',
              process.env.LANDLORD_SIGNATURE || 'NGUYEN Van Luong'
            ],
            (insertErr) => {
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
      db.run(`CREATE TABLE IF NOT EXISTS receipts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tenant_id INTEGER NOT NULL,
        amount REAL NOT NULL,
        month INTEGER NOT NULL,
        year INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        file_path TEXT,
        FOREIGN KEY (tenant_id) REFERENCES tenants (id)
      )`, (err) => {
        if (err) {
          console.error('Error creating receipts table:', err);
          reject(err);
          return;
        }
        console.log('✅ Database tables created successfully');
        resolve();
      });
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
  return new Promise((resolve) => {
    if (db) {
      db.close((err) => {
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
  closeDatabase
};
