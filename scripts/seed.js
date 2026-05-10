require('dotenv').config();
const bcrypt = require('bcryptjs');

const mysql = require('mysql2/promise');

const generateId = () => require('crypto').randomUUID();

const seedData = async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root123',
    database: process.env.DB_NAME || 'perpustakaan'
  });

  console.log('Seeding data...');

  // Users data
  const users = [
    {
      id: generateId(),
      username: 'admin',
      email: 'admin@perpustakaan.com',
      password: bcrypt.hashSync('admin123', 10),
      role: 'admin',
      fullName: 'Admin Perpustakaan',
      phone: '081234567890',
      isActive: true
    },
    {
      id: generateId(),
      username: 'librarian',
      email: 'librarian@perpustakaan.com',
      password: bcrypt.hashSync('librarian123', 10),
      role: 'librarian',
      fullName: 'Pustakawan Utama',
      phone: '081234567891',
      isActive: true
    },
    {
      id: generateId(),
      username: 'member1',
      email: 'member@perpustakaan.com',
      password: bcrypt.hashSync('member123', 10),
      role: 'member',
      fullName: 'anggota Pertama',
      phone: '081234567892',
      isActive: true
    }
  ];

  // Insert users
  for (const user of users) {
    try {
      await connection.query(
        `INSERT INTO users (id, username, email, password, role, fullName, phone, isActive) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.id, user.username, user.email, user.password, user.role, user.fullName, user.phone, user.isActive]
      );
      console.log(`User created: ${user.username}`);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log(`User already exists: ${user.username}`);
      } else {
        console.error(`Error creating user ${user.username}:`, error.message);
      }
    }
  }

  // Books data
  const books = [
    {
      id: generateId(),
      title: 'Belajar Node.js Pemula',
      author: 'John Doe',
      isbn: '978-3-16-148410-0',
      publisher: 'Gramedia',
      year: 2024,
      category: 'Programming',
      stock: 5,
      available: 5,
      description: 'Buku panduan Node.js untuk pemula sampai mahir'
    },
    {
      id: generateId(),
      title: 'JavaScript Modern',
      author: 'Jane Smith',
      isbn: '978-3-16-148410-1',
      publisher: 'Erlangga',
      year: 2023,
      category: 'Programming',
      stock: 3,
      available: 3,
      description: 'Panduan JavaScript modern ES6+'
    },
    {
      id: generateId(),
      title: 'Dasar Database MySQL',
      author: 'Budi Santoso',
      isbn: '978-3-16-148410-2',
      publisher: 'PT Elex Media',
      year: 2022,
      category: 'Database',
      stock: 4,
      available: 4,
      description: 'Belajar MySQL dari dasar sampai lanjut'
    },
    {
      id: generateId(),
      title: 'Express.js Framework',
      author: 'Ahmad Wijaya',
      isbn: '978-3-16-148410-3',
      publisher: 'Gramedia',
      year: 2024,
      category: 'Programming',
      stock: 2,
      available: 2,
      description: 'Membangun REST API dengan Express.js'
    },
    {
      id: generateId(),
      title: 'Algoritma Pemrograman',
      author: 'Siti Aminah',
      isbn: '978-3-16-148410-4',
      publisher: 'Andi Publisher',
      year: 2021,
      category: 'Computer Science',
      stock: 6,
      available: 6,
      description: 'Dasar-dasar algoritma pemrograman'
    }
  ];

  // Insert books
  for (const book of books) {
    try {
      await connection.query(
        `INSERT INTO books (id, title, author, isbn, publisher, year, category, stock, available, description) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [book.id, book.title, book.author, book.isbn, book.publisher, book.year, book.category, book.stock, book.available, book.description]
      );
      console.log(`Book created: ${book.title}`);
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        console.log(`Book already exists: ${book.isbn}`);
      } else {
        console.error(`Error creating book:`, error.message);
      }
    }
  }

  await connection.end();
  console.log('Seed completed!');
};

seedData().catch(console.error);