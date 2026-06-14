const express = require('express');
const router = express.Router();
const {
  getRecommendations,
  getWishlist,
  toggleWishlist,
} = require('../controllers/recommendationController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', getRecommendations);
router.get('/wishlist', getWishlist);
router.post('/wishlist/toggle', toggleWishlist);

module.exports = router;