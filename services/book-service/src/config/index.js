require('dotenv').config();

module.exports = {
  port: process.env.BOOK_SERVICE_PORT || 3002,
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    name: process.env.DB_NAME || 'perpustakaan',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root123'
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'perpustakaan_secret_key_2024'
  }
};