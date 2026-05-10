require('dotenv').config();

module.exports = {
  port: process.env.AUTH_SERVICE_PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    name: process.env.DB_NAME || 'perpustakaan',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root123'
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'perpustakaan_secret_key_2024',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  },

  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
    queue: process.env.RABBITMQ_QUEUE || 'library_events'
  }
};