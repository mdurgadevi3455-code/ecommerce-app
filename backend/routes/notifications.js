const express = require('express');
const router = express.Router();
const {
  registerToken,
  getNotifications,
  createNotification,
  removeToken,
  seedNotifications,
} = require('../controllers/notificationController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

router.post('/register-token', registerToken);
router.get('/', getNotifications);
router.post('/create', createNotification);
router.post('/remove-token', removeToken);
router.get('/seed', seedNotifications);

module.exports = router;
