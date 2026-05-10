const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  bookId: { type: DataTypes.UUID, allowNull: false },
  userId: { type: DataTypes.UUID, allowNull: false },
  type: { type: DataTypes.ENUM('borrow', 'return'), allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'approved', 'rejected', 'returned', 'overdue'), defaultValue: 'pending' },
  borrowDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  dueDate: { type: DataTypes.DATE, allowNull: false },
  returnDate: { type: DataTypes.DATE },
  notes: { type: DataTypes.TEXT }
}, { tableName: 'transactions', timestamps: true });

module.exports = Transaction;