const express = require('express');
const router = express.Router();
const Joi = require('joi');
const transactionController = require('../controllers/transaction.controller');
const { authenticate, authorize } = require('../middleware/auth');

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map(d => ({ field: d.path.join('.'), message: d.message }));
    return res.status(400).json({ success: false, message: 'Validation error', errors });
  }
  next();
};

const transactionSchema = Joi.object({
  bookId: Joi.string().uuid().required(),
  type: Joi.string().valid('borrow', 'return').required(),
  dueDate: Joi.date().iso().required()
});

router.get('/', authenticate, transactionController.getAllTransactions);
router.get('/my', authenticate, transactionController.getMyTransactions);
router.get('/:id', authenticate, transactionController.getTransactionById);
router.post('/', authenticate, validate(transactionSchema), transactionController.createTransaction);
router.put('/:id/status', authenticate, authorize('admin', 'librarian'), transactionController.updateTransactionStatus);

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'transaction-service', timestamp: new Date().toISOString() });
});

module.exports = router;