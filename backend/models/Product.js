const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  image: { type: String, default: '' },
  stock: { type: Number, default: 0 },
  popularity: { type: Number, default: 0 },
}, { timestamps: true });

// Index for faster search
productSchema.index({ category: 1 });
productSchema.index({ popularity: -1 });

module.exports = mongoose.model('Product', productSchema);