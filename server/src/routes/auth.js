/**
 * Auth routes.
 * POST /api/auth/login     — obtain a JWT
 * GET  /api/auth/me        — current user from token
 * POST /api/auth/register  — create a user (admin only)
 */
const express = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth');
const authService = require('../services/authService');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const user = await authService.authenticateUser(String(username), String(password));
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = authService.signToken(user);
    return res.json({ token, user });
  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', authenticate, (req, res) => {
  return res.json({ user: { id: req.user.sub, username: req.user.username, role: req.user.role } });
});

router.post('/register', authenticate, requireAdmin, async (req, res) => {
  try {
    const { username, password, role } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    if (String(password).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    const hash = await authService.hashPassword(String(password));
    const user = await authService.createUser(
      String(username),
      hash,
      role === 'admin' ? 'admin' : 'user'
    );
    return res.status(201).json({ user });
  } catch (err) {
    if (err && String(err.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    console.error('Register error:', err.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
