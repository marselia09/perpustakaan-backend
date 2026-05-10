require('dotenv').config();

const mysql = require('mysql2/promise');

const createDatabase = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root123'
  });

  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'perpustakaan'}`);
    console.log('Database created or already exists');
  } catch (error) {
    console.error('Error creating database:', error.message);
  } finally {
    await connection.end();
  }
};

const createTables = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root123',
    database: process.env.DB_NAME || 'perpustakaan'
  });

  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      username VARCHAR(50) NOT NULL UNIQUE,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'librarian', 'member') DEFAULT 'member',
      fullName VARCHAR(100) NOT NULL,
      phone VARCHAR(20),
      isActive BOOLEAN DEFAULT TRUE,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS books (
      id VARCHAR(36) PRIMARY KEY,
      title VARCHAR(200) NOT NULL,
      author VARCHAR(100) NOT NULL,
      isbn VARCHAR(20) NOT NULL UNIQUE,
      publisher VARCHAR(100),
      year INT,
      category VARCHAR(50),
      stock INT DEFAULT 1,
      available INT DEFAULT 1,
      description TEXT,
      coverImage VARCHAR(255),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS transactions (
      id VARCHAR(36) PRIMARY KEY,
      bookId VARCHAR(36) NOT NULL,
      userId VARCHAR(36) NOT NULL,
      type ENUM('borrow', 'return') NOT NULL,
      status ENUM('pending', 'approved', 'rejected', 'returned', 'overdue') DEFAULT 'pending',
      borrowDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      dueDate DATE NOT NULL,
      returnDate DATE,
      notes TEXT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (bookId) REFERENCES books(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )`,
    
    `CREATE INDEX idx_users_email ON users(email)`,
    `CREATE INDEX idx_users_username ON users(username)`,
    `CREATE INDEX idx_books_isbn ON books(isbn)`,
    `CREATE INDEX idx_books_category ON books(category)`,
    `CREATE INDEX idx_transactions_bookId ON transactions(bookId)`,
    `CREATE INDEX idx_transactions_userId ON transactions(userId)`,
    `CREATE INDEX idx_transactions_status ON transactions(status)`
  ];

  for (const query of queries) {
    try {
      await connection.query(query);
      console.log('Table created successfully');
    } catch (error) {
      if (error.code !== 'ER_TABLE_EXISTS_ERROR') {
        console.error('Error:', error.message);
      }
    }
  }

  await connection.end();
  console.log('Migration completed!');
};

const runMigration = async () => {
  console.log('Starting migration...');
  await createDatabase();
  await createTables();
};

runMigration().catch(console.error);