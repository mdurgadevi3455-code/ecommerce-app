const Notification = require('../models/Notification');
const User = require('../models/User');

// Register device token
exports.registerToken = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user.id);

    // Avoid duplicate tokens
    if (!user.deviceTokens.includes(token)) {
      user.deviceTokens.push(token);
      await user.save();
    }

    res.json({ message: 'Token registered ✅' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get user notifications
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Create notification
exports.createNotification = async (req, res) => {
  try {
    const { title, body, type, scheduledAt } = req.body;

    const notification = new Notification({
      userId: req.user.id,
      title,
      body,
      type,
      scheduledAt: scheduledAt || Date.now(),
    });

    await notification.save();

    // Simulate sending with retry mechanism
    await processNotification(notification);

    res.status(201).json(notification);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Process notification with retry
const processNotification = async (notification) => {
  try {
    // Simulate sending (in production use Expo Push API)
    notification.status = 'sent';
    notification.sentAt = new Date();
    await notification.save();
  } catch (err) {
    // Retry mechanism
    if (notification.retryCount < notification.maxRetries) {
      notification.retryCount += 1;
      notification.status = 'pending';
      await notification.save();
      // Retry after delay
      setTimeout(() => processNotification(notification), 5000);
    } else {
      notification.status = 'failed';
      await notification.save();
    }
  }
};

// Remove invalid device token
exports.removeToken = async (req, res) => {
  try {
    const { token } = req.body;
    const user = await User.findById(req.user.id);
    user.deviceTokens = user.deviceTokens.filter((t) => t !== token);
    await user.save();
    res.json({ message: 'Token removed ✅' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Seed sample notifications
exports.seedNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user.id });

    const notifications = [
      { userId: req.user.id, title: '🎉 Order Confirmed!', body: 'Your order #ORD-001 has been confirmed.', type: 'order_update', status: 'sent' },
      { userId: req.user.id, title: '🚚 Order Shipped!', body: 'Your order is on its way!', type: 'order_update', status: 'sent' },
      { userId: req.user.id, title: '🛒 Cart Reminder', body: 'You left 3 items in your cart!', type: 'cart_reminder', status: 'sent' },
      { userId: req.user.id, title: '🔥 Flash Sale!', body: 'Up to 50% off on Electronics today only!', type: 'promotion', status: 'sent' },
      { userId: req.user.id, title: '✅ Payment Success', body: 'Payment of ₹12,999 received successfully.', type: 'order_update', status: 'sent' },
    ];

    await Notification.insertMany(notifications);
    res.json({ message: 'Notifications seeded ✅', count: notifications.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};