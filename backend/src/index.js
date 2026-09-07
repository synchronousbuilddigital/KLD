const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // fallback if system restricts custom DNS
}
require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const connectDB = require('./config/database');
const { startCleanupScheduler, stopCleanupScheduler } = require('./utils/cleanupJob');

const PORT = process.env.PORT || 5000;
let server;

// Connect to MongoDB first, then start server
connectDB().then(() => {
  server = app.listen(PORT, () => {
    console.log(`🚀 KLD Backend running on http://localhost:${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);

    // Start background cleanup job schedule
    startCleanupScheduler();
  });
});

/* ─── GRACEFUL SHUTDOWN HANDLERS (SIGTERM / SIGINT) ─────────────── */
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 ${signal} received. Initiating graceful shutdown...`);

  // Stop background schedulers
  stopCleanupScheduler();

  if (server) {
    server.close(async () => {
      console.log('📦 Closed HTTP server connection pool.');
      try {
        await mongoose.connection.close(false);
        console.log('✅ MongoDB connection closed gracefully.');
        process.exit(0);
      } catch (err) {
        console.error('❌ Error closing MongoDB connection:', err);
        process.exit(1);
      }
    });

    // Force shutdown after 10 seconds if connections fail to close cleanly
    setTimeout(() => {
      console.error('⚠️ Forcefully terminating server process after 10s timeout.');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Trigger nodemon restart
