const Product = require('../models/Product');
const RecentlyViewed = require('../models/RecentlyViewed');

// Get all products
exports.getProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get single product + track view
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Increment popularity
    product.popularity += 1;
    await product.save();

    // Track recently viewed if user is logged in
    if (req.user) {
      await trackRecentlyViewed(req.user.id, product._id);
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Track recently viewed helper
const trackRecentlyViewed = async (userId, productId) => {
  try {
    let record = await RecentlyViewed.findOne({ userId });

    if (!record) {
      record = new RecentlyViewed({ userId, products: [] });
    }

    // Remove if already exists (prevent duplicate)
    record.products = record.products.filter(
      (p) => p.productId.toString() !== productId.toString()
    );

    // Add to beginning
    record.products.unshift({ productId, viewedAt: new Date() });

    // Keep max 20 items
    if (record.products.length > 20) {
      record.products = record.products.slice(0, 20);
    }

    await record.save();
  } catch (err) {
    console.log('Track recently viewed error:', err.message);
  }
};

// Get recently viewed
exports.getRecentlyViewed = async (req, res) => {
  try {
    const record = await RecentlyViewed.findOne({ userId: req.user.id })
      .populate('products.productId');

    if (!record) {
      return res.json([]);
    }

    const products = record.products
      .filter((p) => p.productId)
      .map((p) => ({
        ...p.productId.toObject(),
        viewedAt: p.viewedAt,
      }));

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Sync local recently viewed with server
exports.syncRecentlyViewed = async (req, res) => {
  try {
    const { localItems } = req.body;

    let record = await RecentlyViewed.findOne({ userId: req.user.id });
    if (!record) {
      record = new RecentlyViewed({ userId: req.user.id, products: [] });
    }

    // Merge local items with server items
    for (const item of localItems) {
      const exists = record.products.find(
        (p) => p.productId.toString() === item.productId
      );
      if (!exists) {
        record.products.push({
          productId: item.productId,
          viewedAt: new Date(item.viewedAt),
        });
      }
    }

    // Sort by viewedAt descending
    record.products.sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt));

    // Keep max 20
    if (record.products.length > 20) {
      record.products = record.products.slice(0, 20);
    }

    await record.save();

    const updated = await RecentlyViewed.findOne({ userId: req.user.id })
      .populate('products.productId');

    const products = updated.products
      .filter((p) => p.productId)
      .map((p) => ({
        ...p.productId.toObject(),
        viewedAt: p.viewedAt,
      }));

    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Seed sample products
exports.seedProducts = async (req, res) => {
  try {
    await Product.deleteMany();

    const products = [
      { name: 'iPhone 15 Pro', description: 'Latest Apple smartphone', price: 99999, category: 'Electronics', stock: 50, popularity: 100 },
      { name: 'Samsung Galaxy S24', description: 'Latest Samsung smartphone', price: 79999, category: 'Electronics', stock: 40, popularity: 90 },
      { name: 'Nike Air Max', description: 'Comfortable running shoes', price: 8999, category: 'Footwear', stock: 100, popularity: 80 },
      { name: 'Adidas Ultraboost', description: 'Premium running shoes', price: 12999, category: 'Footwear', stock: 80, popularity: 75 },
      { name: 'Sony WH-1000XM5', description: 'Noise cancelling headphones', price: 29999, category: 'Electronics', stock: 30, popularity: 85 },
      { name: 'MacBook Air M2', description: 'Thin and powerful laptop', price: 114999, category: 'Electronics', stock: 20, popularity: 95 },
      { name: 'Levi\'s 501 Jeans', description: 'Classic straight fit jeans', price: 3999, category: 'Clothing', stock: 200, popularity: 70 },
      { name: 'Instant Pot', description: 'Multi-use pressure cooker', price: 6999, category: 'Kitchen', stock: 60, popularity: 65 },
    ];

    await Product.insertMany(products);
    res.json({ message: 'Products seeded successfully ✅', count: products.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};