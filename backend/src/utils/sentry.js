const logger = require('./logger');

let isSentryInitialized = false;

/**
 * initSentry
 * Initializes Sentry error tracking if SENTRY_DSN is provided.
 */
const initSentry = () => {
  if (process.env.SENTRY_DSN) {
    try {
      const Sentry = require('@sentry/node');
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',
        tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.2'),
      });
      isSentryInitialized = true;
      logger.info('🚀 Sentry Error Tracking initialized successfully.');
    } catch (err) {
      logger.warn({ err: err.message }, '⚠️ Failed to initialize Sentry SDK.');
    }
  } else {
    logger.info('ℹ️ SENTRY_DSN not specified. Sentry error tracking disabled.');
  }
};

/**
 * captureException
 * Captures an error and reports to Sentry & structured logger.
 */
const captureException = (err, context = {}) => {
  logger.error({ err, context }, err.message || 'Unhandled Exception');
  if (isSentryInitialized && process.env.SENTRY_DSN) {
    try {
      const Sentry = require('@sentry/node');
      Sentry.captureException(err, { extra: context });
    } catch (sentryErr) {
      // Ignore Sentry dispatch failure
    }
  }
};

module.exports = {
  initSentry,
  captureException,
};
