const createTables = require('./createTables');
const receiptsMigrations = require('./receiptsMigrations');
const emailTrackingMigrations = require('./emailTrackingMigrations');
const usersMigrations = require('./usersMigrations');

const helpers = require('./helpers');

/**
 * Ordered migration units executed sequentially by the runner in db.js.
 * Each unit is an async function (db, helpers). Order matters: the initial
 * schema must exist before per-feature upgrades run.
 */
const migrationUnits = [
  ['initial-schema', createTables],
  ['receipts-columns', receiptsMigrations],
  ['email-tracking', emailTrackingMigrations],
  ['users-auth', usersMigrations],
];

module.exports = { migrationUnits, helpers };
