const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const errorHandler = require('./middleware/errorHandler');
const { authLimiter, apiLimiter } = require('./middleware/rateLimiter');

// Route modules
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/users.routes');
const mockupRoutes = require('./modules/mockups/mockups.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const plansRoutes = require('./modules/plans/plans.routes');
const aiRoutes = require('./modules/ai/ai.routes');
const uploadRoutes = require('./modules/uploads/uploads.routes');
const exportRoutes = require('./modules/exports/exports.routes');
const catalogRoutes = require('./modules/catalog/catalog.routes');

const app = express();

/* ─── SECURITY HARDENING & HELMET CSP ─────────────────────────────── */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin images & 3D assets
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' }, // Required for Google OAuth popups
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          'https://accounts.google.com',
          'https://apis.google.com',
        ],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://res.cloudinary.com',
          'https://*.googleusercontent.com',
          'https://*.gstatic.com',
        ],
        connectSrc: [
          "'self'",
          'https://accounts.google.com',
          'https://api.cloudinary.com',
          'https://generativelanguage.googleapis.com',
          'http://localhost:*',
          'ws://localhost:*',
        ],
        frameSrc: ["'self'", 'https://accounts.google.com'],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
      },
    },
  })
);

/* ─── MULTI-DOMAIN CORS HARDENING ────────────────────────────────── */
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((url) => url.trim().replace(/\/$/, ''))
  : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, server-to-server, Postman)
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error(`CORS Policy Error: Origin '${origin}' is not permitted.`));
    },
    credentials: true, // Allow HttpOnly cookies (accessToken / refreshToken)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'x-refresh-token'],
  })
);

// Apply general API rate limiter to all /api/ endpoints
app.use('/api', apiLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

/* ─── NOSQL INJECTION SANITIZATION (EXPRESS 5 COMPATIBLE) ────────── */
// Strips '$' keys and '.' operators from req.body, req.query, and req.params in-place to prevent NoSQL injection attacks
const sanitizeInPlace = (target) => {
  if (target && typeof target === 'object') {
    for (const key of Object.keys(target)) {
      if (key.startsWith('$') || key.includes('.')) {
        delete target[key];
      } else if (typeof target[key] === 'object' && target[key] !== null) {
        sanitizeInPlace(target[key]);
      }
    }
  }
};

app.use((req, res, next) => {
  if (req.body) sanitizeInPlace(req.body);
  if (req.query) sanitizeInPlace(req.query);
  if (req.params) sanitizeInPlace(req.params);
  next();
});

const mongoose = require('mongoose');

/* ─── HEALTH CHECK & DATABASE PROBE ─────────────────────────────── */
app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatus = dbState === 1 ? 'UP' : dbState === 2 ? 'CONNECTING' : 'DOWN';
  const isHealthy = dbState === 1;

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    message: isHealthy ? '✅ KLD Backend is healthy and running' : '⚠️ KLD Backend degraded: Database disconnected',
    status: isHealthy ? 'HEALTHY' : 'DEGRADED',
    database: {
      status: dbStatus,
      host: mongoose.connection.host || 'N/A',
      name: mongoose.connection.name || 'N/A',
    },
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

/* ─── SENSITIVE AUTH RATE LIMITERS ───────────────────────────────── */
app.use('/api/auth/send-signup-otp', authLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/auth/reset-password', authLimiter);

/* ─── ROUTES ─────────────────────────────────────────────────────── */
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/mockups', mockupRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/catalog', catalogRoutes);

/* ─── 404 HANDLER ───────────────────────────────────────────────── */
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

/* ─── GLOBAL ERROR HANDLER ─────────────────────────────────────── */
app.use(errorHandler);

module.exports = app;
