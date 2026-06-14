const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  event: {
    type: String,
    enum: ['created', 'failed', 'refunded', 'completed'],
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
  details: { type: String },
});

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  orderId: {
    type: String,
    required: true,
    unique: true,
  },
  invoiceId: {
    type: String,
    unique: true,
  },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: { type: String },
    price: { type: Number },
    quantity: { type: Number },
  }],
  amount: { type: Number, required: true },
  paymentMode: {
    type: String,
    enum: ['UPI', 'Card', 'NetBanking', 'COD', 'Wallet'],
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  auditLog: [auditLogSchema],
}, { timestamps: true });

// Indexes for fast filtering/sorting/pagination
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ orderId: 1 });
transactionSchema.index({ status: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);