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
