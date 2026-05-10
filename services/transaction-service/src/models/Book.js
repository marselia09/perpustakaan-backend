const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Book = sequelize.define('Book', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING(200), allowNull: false },
  author: { type: DataTypes.STRING(100), allowNull: false },
  isbn: { type: DataTypes.STRING(20), allowNull: false, unique: true },
  publisher: { type: DataTypes.STRING(100) },
  year: { type: DataTypes.INTEGER },
  category: { type: DataTypes.STRING(50) },
  stock: { type: DataTypes.INTEGER, defaultValue: 1 },
  available: { type: DataTypes.INTEGER, defaultValue: 1 },
  description: { type: DataTypes.TEXT }
}, { tableName: 'books', timestamps: true });

module.exports = Book;