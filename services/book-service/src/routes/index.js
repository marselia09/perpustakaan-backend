const express = require('express');
const router = express.Router();
const Joi = require('joi');
const bookController = require('../controllers/book.controller');
const { authenticate, authorize } = require('../middleware/auth');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(d => ({ field: d.path.join('.'), message: d.message }));
    return res.status(400).json({ success: false, message: 'Validation error', errors });
  }
  next();
};

const bookSchema = Joi.object({
  title: Joi.string().min(1).max(200).required(),
  author: Joi.string().min(1).max(100).required(),
  isbn: Joi.string().min(10).max(20).required(),
  publisher: Joi.string().max(100).allow(''),
  year: Joi.number().integer().min(1000).max(new Date().getFullYear()),
  category: Joi.string().max(50).allow(''),
  stock: Joi.number().integer().min(0).default(1),
  description: Joi.string().allow(''),
  coverImage: Joi.string().uri().allow('')
});

router.get('/', authenticate, bookController.getAllBooks);
router.get('/categories', authenticate, bookController.getCategories);
router.get('/:id', authenticate, bookController.getBookById);
router.post('/', authenticate, authorize('admin', 'librarian'), validate(bookSchema), bookController.createBook);
router.put('/:id', authenticate, authorize('admin', 'librarian'), bookController.updateBook);
router.delete('/:id', authenticate, authorize('admin', 'librarian'), bookController.deleteBook);

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'book-service', timestamp: new Date().toISOString() });
});

module.exports = router;