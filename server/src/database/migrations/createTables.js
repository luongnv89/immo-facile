const { runP, allP, getP } = require('./helpers');
const { getLandlordIdentity } = require('../../config/appConfig');

/**
 * Legacy column fix-ups for the tenants table. Mirrors the original inline
 * sequence: every failure here is logged and swallowed — never fatal.
 */
const migrateTenantColumns = async db => {
  let columns;
  try {
    columns = await allP(db, 'PRAGMA table_info(tenants)');
  } catch (err) {
    console.error('Error checking table info:', err);
    return;
  }

  const columnNames = columns.map(col => col.name);

  // Add gender column if missing
  if (!columnNames.includes('gender')) {
    try {
      await runP(
        db,
        `ALTER TABLE tenants ADD COLUMN gender TEXT CHECK(gender IN ('M', 'F')) DEFAULT 'M'`
      );
      console.log('✅ Added gender column to existing tenants table');
    } catch (err) {
      console.error('Error adding gender column:', err);
    }
  }

  let tenantColumns;
  try {
    tenantColumns = await allP(db, 'PRAGMA table_info(tenants)');
  } catch (err) {
    console.error('Error getting tenant columns:', err);
    return;
  }

  if (!tenantColumns.some(col => col.name === 'apartment_id')) {
    console.log('Adding apartment_id column to tenants table...');
    try {
      await runP(
        db,
        'ALTER TABLE tenants ADD COLUMN apartment_id INTEGER REFERENCES apartments(id)'
      );
    } catch (err) {
      console.error('Error adding apartment_id column:', err);
    }
  }

  if (!tenantColumns.some(col => col.name === 'charges')) {
    console.log('Adding charges column to tenants table...');
    try {
      await runP(db, 'ALTER TABLE tenants ADD COLUMN charges REAL DEFAULT 0');
    } catch (err) {
      console.error('Error adding charges column:', err);
    }
  }

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
};

/**
 * Insert default owner record if none exists. Non-fatal on failure.
 */
const seedDefaultOwner = async db => {
  let ownerCount;
  try {
    ownerCount = await getP(db, 'SELECT COUNT(*) as count FROM owner');
  } catch (err) {
    console.error('Error checking owner count:', err);
    return;
  }

  if (ownerCount.count === 0) {
    console.log('Creating default owner record...');
    try {
      const identity = getLandlordIdentity();
      await runP(
        db,
        `INSERT INTO owner (name, address1, address2, signature)
         VALUES (?, ?, ?, ?)`,
        [identity.name, identity.address1, identity.address2, identity.signature]
      );
      console.log('✅ Default owner created successfully');
    } catch (insertErr) {
      console.error('Error creating default owner:', insertErr);
    }
  }
};

/**
 * Initial schema: apartments, tenants (+ legacy column backfill), owner
 * (+ default owner seeding) and the base receipts table.
 *
 * The three CREATE TABLE statements are fatal on error, exactly like the
 * original inline sequence; the legacy fix-ups stay non-fatal.
 */
const createTables = async (db, { runP: run }) => {
  // Apartments table
  await run(
    db,
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
    )`
  );

  // Tenants table
  await run(
    db,
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
    )`
  );
  await migrateTenantColumns(db);

  // Owner/Landlord table
  try {
    await run(
      db,
      `CREATE TABLE IF NOT EXISTS owner (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        address1 TEXT NOT NULL,
        address2 TEXT,
        signature TEXT,
        signature_path TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    );
  } catch (err) {
    console.error('Error creating owner table:', err);
  }
  await seedDefaultOwner(db);

  // Receipts table
  await run(
    db,
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
    )`
  );
};

module.exports = createTables;
