/**
 * Authentication service.
 * Password hashing (bcrypt) and JWT signing/verification.
 */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../database/db');

const TOKEN_TTL = '24h';

/**
 * Resolve the JWT secret. In production it MUST be provided via env;
 * in development a permissive default keeps local runs working.
 */
const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set in production');
  }
  return secret || 'dev-only-insecure-secret';
};

const hashPassword = plain => bcrypt.hash(plain, 10);

const findUserByUsername = username =>
  new Promise((resolve, reject) => {
    getDatabase().get('SELECT * FROM users WHERE username = ?', [username], (err, row) =>
      err ? reject(err) : resolve(row)
    );
  });

const createUser = (username, passwordHash, role = 'user') =>
  new Promise((resolve, reject) => {
    getDatabase().run(
      'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
      [username, passwordHash, role],
      function (err) {
        err ? reject(err) : resolve({ id: this.lastID, username, role });
      }
    );
  });

/**
 * Validate credentials; returns the safe user object or null.
 */
const authenticateUser = async (username, password) => {
  const user = await findUserByUsername(username);
  if (!user) {
    // Constant-ish time: still run a compare to blunt timing probes
    await bcrypt.compare(password, '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva');
    return null;
  }
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return null;
  return { id: user.id, username: user.username, role: user.role };
};

const signToken = user =>
  jwt.sign({ sub: user.id, username: user.username, role: user.role }, getSecret(), {
    expiresIn: TOKEN_TTL,
  });

const verifyToken = token => jwt.verify(token, getSecret());

module.exports = {
  TOKEN_TTL,
  getSecret,
  hashPassword,
  findUserByUsername,
  createUser,
  authenticateUser,
  signToken,
  verifyToken,
};
