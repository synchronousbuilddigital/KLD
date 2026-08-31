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

/* ─── SECURITY HARDENING & MIDDLEWARE ────────────────────────────── */
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin images & assets
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true, // Allow cookies (refresh token)
}));

// Apply general API rate limiter to all /api/ endpoints
app.use('/api', apiLimiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

/* ─── HEALTH CHECK ──────────────────────────────────────────────── */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: '✅ KLD Backend is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
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
