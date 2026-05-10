const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../config');
const { query, connectDB } = require('../config/database');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Access token required' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);
    
    const users = await query('SELECT * FROM users WHERE id = ?', [decoded.id]);
    if (!users.length || !users[0].isActive) {
      return res.status(401).json({ success: false, message: 'User not found or inactive' });
    }
    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired' });
    }
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Insufficient permissions' });
    }
    next();
  };
};

const register = async (req, res) => {
  try {
    const { username, email, password, fullName, phone, role } = req.body;
    
    const existing = await query('SELECT id FROM users WHERE email = ? OR username = ?', [email, username]);
    if (existing.length) {
      return res.status(400).json({ success: false, message: 'Email or username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const id = require('crypto').randomUUID();
    
    await query(
      'INSERT INTO users (id, username, email, password, fullName, phone, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, username, email, hashedPassword, fullName, phone || null, role || 'member']
    );

    const users = await query('SELECT id, username, email, role, fullName, phone, isActive, createdAt FROM users WHERE id = ?', [id]);
    const user = users[0];
    const token = generateToken(user);

    res.status(201).json({ success: true, message: 'User registered successfully', data: { user, token } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const users = await query('SELECT * FROM users WHERE email = ?', [email]);
    if (!users.length || !users[0].isActive) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    delete user.password;
    const token = generateToken(user);

    res.json({ success: true, message: 'Login successful', data: { user, token } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getProfile = async (req, res) => {
  const { password, ...user } = req.user;
  res.json({ success: true, data: { user } });
};

const updateProfile = async (req, res) => {
  try {
    const { fullName, phone } = req.body;
    await query('UPDATE users SET fullName = ?, phone = ? WHERE id = ?', [fullName, phone, req.user.id]);
    
    const users = await query('SELECT id, username, email, role, fullName, phone, isActive FROM users WHERE id = ?', [req.user.id]);
    res.json({ success: true, message: 'Profile updated successfully', data: { user: users[0] } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await query('SELECT id, username, email, role, fullName, phone, isActive, createdAt FROM users');
    res.json({ success: true, data: { users } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = { register, login, getProfile, updateProfile, getAllUsers, authenticate, authorize, generateToken };