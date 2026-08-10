const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorHandler = require('./middleware/errorHandler');

// Route modules
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/users.routes');
const mockupRoutes = require('./modules/mockups/mockups.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const plansRoutes = require('./modules/plans/plans.routes');

const app = express();

/* ─── MIDDLEWARE ─────────────────────────────────────────────────── */
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true, // Allow cookies (refresh token)
}));

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

/* ─── ROUTES ─────────────────────────────────────────────────────── */
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/mockups', mockupRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/plans', plansRoutes);

/* ─── 404 HANDLER ───────────────────────────────────────────────── */
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

/* ─── GLOBAL ERROR HANDLER ─────────────────────────────────────── */
app.use(errorHandler);

module.exports = app;
