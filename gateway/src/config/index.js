require('dotenv').config();

module.exports = {
  port: process.env.GATEWAY_PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
    book: process.env.BOOK_SERVICE_URL || 'http://localhost:3002',
    transaction: process.env.TRANSACTION_SERVICE_URL || 'http://localhost:3003'
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '15') * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX || '100')
  },

  logLevel: process.env.LOG_LEVEL || 'info'
};