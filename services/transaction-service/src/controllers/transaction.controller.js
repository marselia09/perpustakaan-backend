const jwt = require('jsonwebtoken');
const config = require('../config');
const { query } = require('../config/database');
const messageQueueService = require('../services/messageQueue.service');

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

const createTransaction = async (req, res) => {
  try {
    const { bookId, type, dueDate } = req.body;
    const userId = req.user.id;

    const books = await query('SELECT * FROM books WHERE id = ?', [bookId]);
    if (!books.length) return res.status(404).json({ success: false, message: 'Book not found' });

    const book = books[0];

    if (type === 'borrow') {
      if (book.available <= 0) return res.status(400).json({ success: false, message: 'Book not available' });

      await query('UPDATE books SET available = available - 1 WHERE id = ?', [bookId]);

      const id = require('crypto').randomUUID();
      await query(
        'INSERT INTO transactions (id, bookId, userId, type, status, dueDate) VALUES (?, ?, ?, ?, ?, ?)',
        [id, bookId, userId, type, 'approved', dueDate]
      );

      await messageQueueService.publishEvent('transaction.created', { transactionId: id, bookId, userId, type });

      const transactions = await query('SELECT * FROM transactions WHERE id = ?', [id]);
      res.status(201).json({ success: true, message: 'Book borrowed successfully', data: { transaction: transactions[0] } });

    } else if (type === 'return') {
      const transactions = await query(
        'SELECT * FROM transactions WHERE bookId = ? AND userId = ? AND type = "borrow" AND status = "approved" ORDER BY createdAt DESC LIMIT 1',
        [bookId, userId]
      );
      if (!transactions.length) return res.status(400).json({ success: false, message: 'No active borrow transaction found' });

      await query('UPDATE books SET available = available + 1 WHERE id = ?', [bookId]);

      await query(
        'UPDATE transactions SET type = "return", status = "returned", returnDate = NOW() WHERE id = ?',
        [transactions[0].id]
      );

      await messageQueueService.publishEvent('transaction.returned', { transactionId: transactions[0].id, bookId, userId });

      res.status(201).json({ success: true, message: 'Book returned successfully', data: { transaction: transactions[0] } });
    }
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getAllTransactions = async (req, res) => {
  try {
    const where = req.user.role === 'member' ? 'WHERE userId = ?' : '';
    const params = req.user.role === 'member' ? [req.user.id] : [];
    const transactions = await query('SELECT * FROM transactions ' + where + ' ORDER BY createdAt DESC', params);
    res.json({ success: true, data: { transactions } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getTransactionById = async (req, res) => {
  try {
    const transactions = await query('SELECT * FROM transactions WHERE id = ?', [req.params.id]);
    if (!transactions.length) return res.status(404).json({ success: false, message: 'Transaction not found' });
    if (req.user.role === 'member' && transactions[0].userId !== req.user.id) return res.status(403).json({ success: false, message: 'Access denied' });
    res.json({ success: true, data: { transaction: transactions[0] } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const updateTransactionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    await query('UPDATE transactions SET status = ? WHERE id = ?', [status, req.params.id]);
    await messageQueueService.publishEvent('transaction.status.updated', { transactionId: req.params.id, status, updatedBy: req.user.id });
    res.json({ success: true, message: 'Transaction status updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getMyTransactions = async (req, res) => {
  try {
    const transactions = await query('SELECT * FROM transactions WHERE userId = ? ORDER BY createdAt DESC', [req.user.id]);
    res.json({ success: true, data: { transactions } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { createTransaction, getAllTransactions, getTransactionById, updateTransactionStatus, getMyTransactions, authenticate, authorize };