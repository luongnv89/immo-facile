const bcrypt = require('bcryptjs');
const { getP } = require('./helpers');

/**
 * Task 1.1: users table for JWT authentication, plus default admin seeding.
 * Any failure is fatal (rejects startup), matching the original sequence.
 */
const migrateUsers = async (db, { runP: run }) => {
  await run(
    db,
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
  const row = await getP(db, 'SELECT COUNT(*) as count FROM users');
  if (row.count === 0) {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'changeme123';
    const hash = await bcrypt.hash(password, 10);
    await run(db, `INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'admin')`, [
      username,
      hash,
    ]);
    console.log(`✅ Seeded default admin user "${username}"`);
  }
};

module.exports = migrateUsers;
