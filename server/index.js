const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const { initializeDatabase } = require('./src/database/db');
const tenantRoutes = require('./src/routes/tenants');
const receiptRoutes = require('./src/routes/receipts');
const ownerRoutes = require('./src/routes/owner');
const apartmentRoutes = require('./src/routes/apartments');
const emailTrackingRoutes = require('./src/routes/emailTracking'); // Task 1.2.2
const reminderRoutes = require('./src/routes/reminders'); // Task 1.2.3
const authRoutes = require('./src/routes/auth'); // Task 1.1 (#16)
const { authenticate } = require('./src/middleware/auth');
const { AppError, sendError } = require('./src/utils/errors');
const reminderScheduler = require('./src/services/reminderScheduler'); // Task 1.2.3

const app = express();
const PORT = process.env.PORT || 5001;

// Security middleware
// LAN http deploy: helmet defaults break http LAN usage:
// - upgrade-insecure-requests → browsers fetch https://192.168.x.x/assets/… → CORS null
// - HSTS (31536000s) → browser caches https for a year, even after fix
// - script-src 'self' → blocks Vite inline hash (sha256-ieoeW…)
// Disable CSP + HSTS + COOP/CORP for LAN; other helmet protections remain.
app.use(
  helmet({
    contentSecurityPolicy: false,
    hsts: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // limit each IP to 100 requests per windowMs (renamed from max in v7+)
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// CORS configuration
// Task 1.3 (#18): wildcard origin with credentials is a credential-leak
// vector — refuse to start in that configuration.
const { validateCorsOrigin } = require('./src/config/envValidation');
try {
  validateCorsOrigin();
} catch (err) {
  console.error(`✗ ${err.message}`);
  process.exit(1);
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // Allow all localhost origins regardless of port
      if (origin.startsWith('http://localhost:')) return callback(null, true);

      // Allow specific origins from environment or default
      const allowedOrigins = [
        process.env.CORS_ORIGIN || 'http://localhost:3000',
        'http://localhost:5173',
      ];

      if (allowedOrigins.includes(origin)) return callback(null, true);

      // LAN deploy: allow any private-network origin (192.168.x.x, 10.x.x.x,
      // 172.16-31.x.x) and Tailscale (100.x.x.x) on any port, over http
      // and https. This lets other machines on the same Wi-Fi / VPN reach
      // the server via its LAN/VPN IP without hitting "Not allowed by CORS".
      const lanOriginPattern =
        /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+|100\.\d+\.\d+\.\d+)(:\d+)?$/;
      if (lanOriginPattern.test(origin)) return callback(null, true);

      // Reject other origins
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Create necessary directories
const receiptsDir = process.env.RECEIPTS_DIR || './receipts';
const databaseDir = path.dirname(process.env.DB_PATH || './database/rentReceipts.db');

[receiptsDir, databaseDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Initialize database. Task 4.5 (#41): the app must not listen until the
// schema is ready, and a corrupt/unreachable DB must abort startup loudly.
const bootstrapPromise = (async () => {
  try {
    await initializeDatabase();
  } catch (err) {
    console.error('✗ Database initialization failed:', err.message);
    process.exit(1);
  }
})();

// Task 1.3 (#18): receipts and uploads are no longer served by anonymous
// express.static — authenticated, containment-checked routes below.
app.get(['/receipts/:filename', '/uploads/:filename'], authenticate, (req, res) => {
  const { filename } = req.params;
  // Only bare filenames — no traversal, no subdirectories
  if (!/^[A-Za-z0-9._-]+$/.test(filename) || filename.includes('..')) {
    return res.status(404).json({ error: 'Not found' });
  }
  const baseDir = req.path.startsWith('/receipts')
    ? path.join(__dirname, process.env.RECEIPTS_DIR || './receipts')
    : path.join(__dirname, './uploads');
  const filePath = path.resolve(baseDir, filename);
  if (!filePath.startsWith(path.resolve(baseDir) + path.sep)) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(filePath, err => {
    if (err) res.status(404).json({ error: 'Not found' });
  });
});

// Serve client static files in production
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '../client/dist');
  app.use(express.static(clientDistPath));
}

// API Routes
// Task 1.1 (#16): JWT auth on all /api routes except the public paths below
// (health probe, login/register, and the email-open tracking pixel).
const PUBLIC_API_PATHS = [
  /^\/api\/health$/,
  /^\/api\/auth\/login$/,
  /\/api\/email-tracking\/pixel\//,
];

app.use('/api', (req, res, next) => {
  const isPublic = PUBLIC_API_PATHS.some(pattern => pattern.test(req.originalUrl.split('?')[0]));
  if (isPublic) return next();
  return authenticate(req, res, next);
});

app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/apartments', apartmentRoutes);
app.use('/api/owner', ownerRoutes);
app.use('/api/email-tracking', emailTrackingRoutes); // Task 1.2.2
app.use('/api/reminders', reminderRoutes); // Task 1.2.3

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Centralized error handler — Task 5.5 (#47).
// Controllers throw typed AppError subclasses; everything funnels here.
// AppError -> its own status + { error: { message, code } }; anything else is
// a 500 whose internals are hidden outside development.
// CORS rejections are mapped to 403 so the browser shows a clear CORS error
// instead of a generic 500.
app.use((err, req, res, next) => {
  console.error('Error:', err);
  if (err instanceof AppError) {
    return sendError(res, err);
  }
  if (err && err.message === 'Not allowed by CORS') {
    return res.status(403).json({ error: { message: err.message, code: 'CORS_DENIED' } });
  }
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({
      error: { message: err.message || 'Internal server error', code: 'INTERNAL_ERROR' },
    });
  }
  return sendError(res, null);
});

// Serve React app for all non-API routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('/*splat', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
} else {
  // 404 handler for development
  app.use('/*splat', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

// Only start listening (and the scheduler) when run directly — importing the
// app (tests, tooling) must not bind a port.
if (require.main === module) {
  bootstrapPromise.then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT} (0.0.0.0)`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(
        `🔗 CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:3000'} (+ LAN/private ranges allowed)`
      );

      // Task 1.2.3: Start reminder scheduler
      reminderScheduler.start();
    });
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    reminderScheduler.stop();
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    reminderScheduler.stop();
    process.exit(0);
  });
}

module.exports = app;
