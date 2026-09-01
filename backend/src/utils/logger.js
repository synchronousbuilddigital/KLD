const pino = require('pino');

const isProd = process.env.NODE_ENV === 'production';

const logger = pino({
  level: process.env.LOG_LEVEL || (isProd ? 'info' : 'debug'),
  base: {
    env: process.env.NODE_ENV || 'development',
    service: 'kld-backend',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

module.exports = logger;
