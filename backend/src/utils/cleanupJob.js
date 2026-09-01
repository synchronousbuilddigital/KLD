const EmailOTP = require('../models/EmailOTP');

let intervalId = null;

/**
 * runCleanupTask
 * Cleans up expired OTPs and orphaned temporary artifacts from database.
 */
const runCleanupTask = async () => {
  try {
    const now = new Date();
    
    // 1. Delete expired Email OTP records
    const otpResult = await EmailOTP.deleteMany({ expiresAt: { $lt: now } });
    if (otpResult.deletedCount > 0) {
      console.log(`🧹 [Cron Cleanup] Removed ${otpResult.deletedCount} expired Email OTP records.`);
    }
  } catch (err) {
    console.error('❌ [Cron Cleanup Error]:', err.message);
  }
};

/**
 * startCleanupScheduler
 * Schedules background cleanup task to run periodically (every 6 hours).
 */
const startCleanupScheduler = () => {
  // Run initial cleanup 10 seconds after server boot
  setTimeout(runCleanupTask, 10000);

  // Run periodic cleanup every 6 hours (6 * 60 * 60 * 1000 ms)
  const SIX_HOURS = 6 * 60 * 60 * 1000;
  intervalId = setInterval(runCleanupTask, SIX_HOURS);
  console.log('⏰ Scheduled background cleanup job (runs every 6 hours).');
};

/**
 * stopCleanupScheduler
 * Clears background cleanup interval on graceful server shutdown.
 */
const stopCleanupScheduler = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

module.exports = {
  runCleanupTask,
  startCleanupScheduler,
  stopCleanupScheduler,
};
