const express = require('express');
const router = express.Router();
const Joi = require('joi');
const authController = require('../controllers/auth.controller');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(d => ({ field: d.path.join('.'), message: d.message }));
    return res.status(400).json({ success: false, message: 'Validation error', errors });
  }
  next();
};

const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  fullName: Joi.string().min(2).max(100).required(),
  phone: Joi.string().allow(''),
  role: Joi.string().valid('admin', 'librarian', 'member').default('member')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/profile', authController.authenticate, authController.getProfile);
router.put('/profile', authController.authenticate, authController.updateProfile);
router.get('/users', authController.authenticate, authController.authorize('admin', 'librarian'), authController.getAllUsers);

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'auth-service', timestamp: new Date().toISOString() });
});

module.exports = router;