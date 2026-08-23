const sqlite3 = require('sqlite3').verbose();
const { migrationUnits, helpers } = require('./migrations');

const DB_PATH = process.env.DB_PATH || './database/rentReceipts.db';

let db = null;

/**
 * Execute migration units strictly in order.
 *
 * IMPORTANT: statements issued from async callbacks are NOT serialized by
 * node-sqlite3 — every unit awaits the previous one and each step inside a
 * unit must await too.
 */
const runMigrations = async database => {
  for (const [name, unit] of migrationUnits) {
    try {
      await unit(database, helpers);
    } catch (err) {
      console.error(`Database migration error in "${name}":`, err);
      throw err;
    }
  }
  console.log('✅ Database tables created successfully');
};

/**
 * Open the SQLite connection (idempotent) and run all migration units.
 */
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
      runMigrations(db).then(resolve).catch(reject);
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
