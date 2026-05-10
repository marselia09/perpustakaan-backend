const jwt = require('jsonwebtoken');
const config = require('../config');
const { query } = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = { id: decoded.id, username: decoded.username, role: decoded.role };
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permissions' });
  }
  next();
};

const createBook = async (req, res) => {
  try {
    const { title, author, isbn, publisher, year, category, stock, description, coverImage } = req.body;
    const id = require('crypto').randomUUID();
    const available = stock || 1;
    
    await query(
      'INSERT INTO books (id, title, author, isbn, publisher, year, category, stock, available, description, coverImage) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, title, author, isbn, publisher, year, category, stock || 1, available, description || null, coverImage || null]
    );

    const books = await query('SELECT * FROM books WHERE id = ?', [id]);
    res.status(201).json({ success: true, message: 'Book created successfully', data: { book: books[0] } });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'ISBN already exists' });
    }
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getAllBooks = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    let sql = 'SELECT * FROM books WHERE 1=1';
    const params = [];

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (search) {
      sql += ' AND (title LIKE ? OR author LIKE ? OR isbn LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const offset = (page - 1) * limit;
    sql += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const books = await query(sql, params);
    const countResult = await query('SELECT COUNT(*) as total FROM books WHERE 1=1' + (category ? ' AND category = ?' : ''), category ? [category] : []);
    const total = countResult[0].total;

    res.json({ success: true, data: { books, pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / limit) } } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getBookById = async (req, res) => {
  try {
    const books = await query('SELECT * FROM books WHERE id = ?', [req.params.id]);
    if (!books.length) return res.status(404).json({ success: false, message: 'Book not found' });
    res.json({ success: true, data: { book: books[0] } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateBook = async (req, res) => {
  try {
    const { title, author, isbn, publisher, year, category, stock, description, coverImage } = req.body;
    await query(
      'UPDATE books SET title=?, author=?, isbn=?, publisher=?, year=?, category=?, stock=?, description=?, coverImage=? WHERE id=?',
      [title, author, isbn, publisher, year, category, stock, description, coverImage, req.params.id]
    );

    const books = await query('SELECT * FROM books WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Book updated successfully', data: { book: books[0] } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const deleteBook = async (req, res) => {
  try {
    const result = await query('DELETE FROM books WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Book not found' });
    res.json({ success: true, message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getCategories = async (req, res) => {
  try {
    const categories = await query('SELECT DISTINCT category FROM books WHERE category IS NOT NULL');
    res.json({ success: true, data: { categories: categories.map(c => c.category) } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { createBook, getAllBooks, getBookById, updateBook, deleteBook, getCategories, authenticate, authorize };