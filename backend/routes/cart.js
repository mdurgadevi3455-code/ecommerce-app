const express = require('express');
const router = express.Router();
const {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  saveForLater,
  moveToCart,
} = require('../controllers/cartController');
const authMiddleware = require('../middleware/auth');

// All cart routes are protected
router.use(authMiddleware);

router.get('/', getCart);
router.post('/add', addToCart);
router.put('/quantity', updateQuantity);
router.delete('/remove/:itemId', removeFromCart);
router.put('/save-for-later/:itemId', saveForLater);
router.put('/move-to-cart/:itemId', moveToCart);

module.exports = router;