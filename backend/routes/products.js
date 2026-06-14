const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  getRecentlyViewed,
  syncRecentlyViewed,
  seedProducts,
} = require('../controllers/productController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.get('/', getProducts);
router.get('/seed', seedProducts);

// Protected routes
router.get('/recently-viewed', authMiddleware, getRecentlyViewed);
router.post('/recently-viewed/sync', authMiddleware, syncRecentlyViewed);
router.get('/:id', authMiddleware, getProductById);

module.exports = router;