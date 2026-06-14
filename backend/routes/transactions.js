const express = require('express');
const router = express.Router();
const {
  getTransactions,
  createTransaction,
  getTransactionById,
  exportCSV,
  seedTransactions,
  generatePDF,
} = require('../controllers/transactionController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', getTransactions);
router.post('/create', createTransaction);
router.get('/export/csv', exportCSV);
router.get('/seed', seedTransactions);
router.get('/:id/pdf', generatePDF);
router.get('/:id', getTransactionById);

module.exports = router;