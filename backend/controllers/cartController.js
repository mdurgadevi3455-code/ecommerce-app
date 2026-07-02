const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Get cart
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id })
      .populate('items.productId');

    if (!cart) {
      return res.json({ active: [], savedForLater: [], total: 0 });
    }

    // Check for price changes and discontinued products
    const activeItems = [];
    const savedItems = [];

    for (const item of cart.items) {
      if (!item.productId) continue;

      const product = item.productId;
      const priceChanged = product.price !== item.priceAtAdd;
      const outOfStock = product.stock < item.quantity;

      const itemData = {
        _id: item._id,
        productId: product._id,
        name: product.name,
        category: product.category,
        currentPrice: product.price,
        priceAtAdd: item.priceAtAdd,
        priceChanged,
        outOfStock,
        stock: product.stock,
        image: product.image,
        quantity: item.quantity,
        addedAt: item.addedAt,
      };

      if (item.savedForLater) {
        savedItems.push(itemData);
      } else {
        activeItems.push(itemData);
      }
    }

    // Calculate total from active items only
    const total = activeItems.reduce((sum, item) => {
      return sum + (item.currentPrice * item.quantity);
    }, 0);

    res.json({ active: activeItems, savedForLater: savedItems, total });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Add to cart
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    // Validate product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    if (product.stock < quantity) {
      return res.status(400).json({ message: `Only ${product.stock} items in stock` });
    }

    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) {
      cart = new Cart({ userId: req.user.id, items: [] });
    }

    // Check if already in cart
    const existingIndex = cart.items.findIndex(
      (i) => i.productId.toString() === productId && !i.savedForLater
    );

    if (existingIndex > -1) {
      // Update quantity
      const newQty = cart.items[existingIndex].quantity + quantity;
      if (newQty > product.stock) {
        return res.status(400).json({ message: `Only ${product.stock} items in stock` });
      }
      cart.items[existingIndex].quantity = newQty;
    } else {
      // Add new item
      cart.items.push({
        productId,
        quantity,
        priceAtAdd: product.price,
        savedForLater: false,
      });
    }

    // Increment version for optimistic locking
    cart.version += 1;
    await cart.save();

    res.json({ message: 'Added to cart ✅' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Update quantity
exports.updateQuantity = async (req, res) => {
  try {
    const { itemId, quantity } = req.body;

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Validate stock
    const product = await Product.findById(item.productId);
    if (product.stock < quantity) {
      return res.status(400).json({ message: `Only ${product.stock} items in stock` });
    }

    item.quantity = quantity;
    cart.version += 1;
    await cart.save();

    res.json({ message: 'Quantity updated ✅' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Remove from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter((i) => i._id.toString() !== itemId);
    cart.version += 1;
    await cart.save();

    res.json({ message: 'Item removed ✅' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Save for later
exports.saveForLater = async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    item.savedForLater = true;
    cart.version += 1;
    await cart.save();

    res.json({ message: 'Saved for later ✅' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Move to cart
exports.moveToCart = async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ message: 'Item not found' });

    // Validate stock
    const product = await Product.findById(item.productId);
    if (product.stock < item.quantity) {
      return res.status(400).json({ message: `Only ${product.stock} items in stock` });
    }

    item.savedForLater = false;
    cart.version += 1;
    await cart.save();

    res.json({ message: 'Moved to cart ✅' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};