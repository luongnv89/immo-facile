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

      // Receipt Templates table
      db.run(`CREATE TABLE IF NOT EXISTS receipt_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        template_type TEXT CHECK(template_type IN ('default', 'custom', 'uploaded')) DEFAULT 'custom',
        is_active BOOLEAN DEFAULT 1,
        is_default BOOLEAN DEFAULT 0,
        template_data TEXT, -- JSON string containing template configuration
        background_image_path TEXT,
        template_file_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) {
          console.error('Error creating receipt_templates table:', err);
          return;
        }
        
        // Check for missing columns and add them to existing templates table
        db.all("PRAGMA table_info(receipt_templates)", (err, templateColumns) => {
          if (err) {
            console.error('Error checking receipt_templates table info:', err);
            return;
          }
          
          const columnNames = templateColumns.map(col => col.name);
          
          // Add template_file_path column if missing
          if (!columnNames.includes('template_file_path')) {
            db.run(`ALTER TABLE receipt_templates ADD COLUMN template_file_path TEXT`, (err) => {
              if (err) {
                console.error('Error adding template_file_path column:', err);
              } else {
                console.log('✅ Added template_file_path column to receipt_templates table');
              }
            });
          }
        });
      });

      // Insert default template if none exists
      db.get("SELECT COUNT(*) as count FROM receipt_templates", (err, templateCount) => {
        if (err) {
          console.error('Error checking template count:', err);
          return;
        }
        
        if (templateCount.count === 0) {
          console.log('Creating default receipt template...');
          const defaultTemplateData = JSON.stringify({
            layout: {
              margin: 50,
              pageSize: 'A4'
            },
            header: {
              title: 'Quittance de loyer',
              fontSize: 18,
              fontStyle: 'bold',
              position: { x: 50, y: 70 },
              align: 'center'
            },
            landlordInfo: {
              position: { x: 70, y: 130 },
              fontSize: 10
            },
            tenantInfo: {
              position: { x: 350, y: 175 },
              fontSize: 10
            },
            propertyAddress: {
              position: { x: 70, y: 240 },
              fontSize: 11,
              fontStyle: 'bold'
            },
            mainText: {
              position: { x: 70, y: 270 },
              fontSize: 11
            },
            paymentDetails: {
              position: { x: 70, y: 350 },
              fontSize: 11
            },
            signature: {
              position: { x: 70, y: 480 }
            },
            footer: {
              position: { x: 70, y: 580 },
              fontSize: 9
            }
          });
          
          db.run(`INSERT INTO receipt_templates (name, description, template_type, is_active, is_default, template_data) 
                     VALUES (?, ?, ?, ?, ?, ?)`,
            [
              'Template par défaut',
              'Template de quittance de loyer français standard',
              'default',
              1,
              1,
              defaultTemplateData
            ],
            (insertErr) => {
              if (insertErr) {
                console.error('Error creating default template:', insertErr);
              } else {
                console.log('✅ Default receipt template created successfully');
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
        template_id INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        file_path TEXT,
        email_sent BOOLEAN DEFAULT 0,
        email_sent_at DATETIME,
        FOREIGN KEY (tenant_id) REFERENCES tenants (id),
        FOREIGN KEY (template_id) REFERENCES receipt_templates (id)
      )`, (err) => {
        if (err) {
          console.error('Error creating receipts table:', err);
          reject(err);
          return;
        }
        
        // Check for missing columns and add them to existing receipts table
        db.all("PRAGMA table_info(receipts)", (err, receiptColumns) => {
          if (err) {
            console.error('Error checking receipts table info:', err);
            return;
          }
          
          const columnNames = receiptColumns.map(col => col.name);
          
          // Add email_sent column if missing
          if (!columnNames.includes('email_sent')) {
            db.run(`ALTER TABLE receipts ADD COLUMN email_sent BOOLEAN DEFAULT 0`, (err) => {
              if (err) {
                console.error('Error adding email_sent column:', err);
              } else {
                console.log('✅ Added email_sent column to receipts table');
              }
            });
          }
          
          // Add email_sent_at column if missing
          if (!columnNames.includes('email_sent_at')) {
            db.run(`ALTER TABLE receipts ADD COLUMN email_sent_at DATETIME`, (err) => {
              if (err) {
                console.error('Error adding email_sent_at column:', err);
              } else {
                console.log('✅ Added email_sent_at column to receipts table');
              }
            });
          }
          
          // Add file_path column if missing
          if (!columnNames.includes('file_path')) {
            db.run(`ALTER TABLE receipts ADD COLUMN file_path TEXT`, (err) => {
              if (err) {
                console.error('Error adding file_path column:', err);
              } else {
                console.log('✅ Added file_path column to receipts table');
              }
            });
          }
          
          // Add fileName column if missing (for backward compatibility)
          if (!columnNames.includes('fileName')) {
            db.run(`ALTER TABLE receipts ADD COLUMN fileName TEXT`, (err) => {
              if (err) {
                console.error('Error adding fileName column:', err);
              } else {
                console.log('✅ Added fileName column to receipts table');
              }
            });
          }
          
          // Add template_id column if missing
          if (!columnNames.includes('template_id')) {
            db.run(`ALTER TABLE receipts ADD COLUMN template_id INTEGER DEFAULT 1 REFERENCES receipt_templates(id)`, (err) => {
              if (err) {
                console.error('Error adding template_id column:', err);
              } else {
                console.log('✅ Added template_id column to receipts table');
              }
            });
          }
        });
        
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
