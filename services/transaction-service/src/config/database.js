const mysql = require('mysql2/promise');
const config = require('./index');

let pool;
let connectRetry = 0;
const maxRetries = 10;

const createPool = () => {
  return mysql.createPool({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name,
    waitForConnections: true,
    connectionLimit: 10,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
  });
};

const connectDB = async () => {
  try {
    if (!pool) {
      pool = createPool();
    }
    const connection = await pool.getConnection();
    console.log('Transaction Service - Database connected');
    connection.release();
    connectRetry = 0;
    return true;
  } catch (error) {
    console.error('Transaction Service - Database connection failed:', error.message);
    connectRetry++;
    if (connectRetry < maxRetries) {
      console.log(`Retrying connection... (${connectRetry}/${maxRetries})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return connectDB();
    }
    return false;
  }
};

const query = async (sql, params) => {
  try {
    if (!pool) {
      await connectDB();
    }
    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (error) {
    console.error('Query error:', error.message);
    pool = null;
    await connectDB();
    const [rows] = await pool.query(sql, params);
    return rows;
  }
};

module.exports = { pool: () => pool, connectDB, query };