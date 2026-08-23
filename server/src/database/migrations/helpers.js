/**
 * Small promise wrappers over node-sqlite3's callback API.
 *
 * Statements issued from async callbacks are NOT serialized by node-sqlite3,
 * so migration steps must await these wrappers sequentially to keep a strict
 * execution order.
 */

const runP = (db, sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, err => (err ? reject(err) : resolve()));
  });

const allP = (db, sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
  });

const getP = (db, sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
  });

module.exports = { runP, allP, getP };
