/**
 * Jest setup — runs before any module is loaded (setupFiles).
 * Isolates the suite from local data: tests never touch
 * server/database/rentReceipts.db or server/receipts/.
 */
process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';
process.env.RECEIPTS_DIR = require('path').join(
  require('os').tmpdir(),
  'immo-facile-test-receipts'
);
process.env.UPLOADS_DIR = require('path').join(require('os').tmpdir(), 'immo-facile-test-uploads');
// Pin the seeded admin credentials: suites call initializeDatabase() before
// index.js runs dotenv.config(), and dotenv never overrides already-set
// vars — without this a local .env defining ADMIN_* would seed one account
// while the tests log in with another (401 on every authed request).
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'changeme123';
