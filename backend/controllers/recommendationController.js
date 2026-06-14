const Product = require('../models/Product');
const RecentlyViewed = require('../models/RecentlyViewed');
const Wishlist = require('../models/Wishlist');

exports.getRecommendations = async (req, res) => {
  const startTime = Date.now();
  try {
    const userId = req.user.id;
    let recommendedProductIds = new Set();
    let categoriesOfInterest = new Set();

    // Step 1 — Get user's browsing history (last 50)
    const recentlyViewed = await RecentlyViewed.findOne({ userId })
      .populate('products.productId', 'category _id')
      .lean();

    if (recentlyViewed?.products) {
      recentlyViewed.products.slice(0, 50).forEach((p) => {
        if (p.productId) {
          recommendedProductIds.add(p.productId._id.toString());
          categoriesOfInterest.add(p.productId.category);
        }
      });
    }

    // Step 2 — Get user's wishlist categories
    const wishlist = await Wishlist.findOne({ userId })
      .populate('products', 'category _id')
      .lean();

    if (wishlist?.products) {
      wishlist.products.forEach((p) => {
        recommendedProductIds.add(p._id.toString());
        categoriesOfInterest.add(p.category);
      });
    }

    // Step 3 — Find similar products by category
    let recommendations = [];

    if (categoriesOfInterest.size > 0) {
      recommendations = await Product.find({
        category: { $in: Array.from(categoriesOfInterest) },
        _id: { $nin: Array.from(recommendedProductIds) },
        stock: { $gt: 0 },
      })
        .sort({ popularity: -1 })
        .limit(10)
        .lean();
    }

    // Step 4 — Cold start fallback (new user with no history)
    if (recommendations.length < 5) {
      const fallback = await Product.find({
        _id: { $nin: Array.from(recommendedProductIds) },
        stock: { $gt: 0 },
      })
        .sort({ popularity: -1 })
        .limit(10 - recommendations.length)
        .lean();

      recommendations = [...recommendations, ...fallback];
    }

    // Remove duplicates
    const seen = new Set();
    recommendations = recommendations.filter((p) => {
      if (seen.has(p._id.toString())) return false;
      seen.add(p._id.toString());
      return true;
    });

    const responseTime = Date.now() - startTime;

    res.json({
      recommendations,
      meta: {
        count: recommendations.length,
        responseTimeMs: responseTime,
        basedOn: {
          browsingHistory: recentlyViewed?.products?.length || 0,
          wishlistItems: wishlist?.products?.length || 0,
          categories: Array.from(categoriesOfInterest),
        },
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get wishlist
exports.getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user.id })
      .populate('products');
    res.json(wishlist?.products || []);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Toggle wishlist
exports.toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    let wishlist = await Wishlist.findOne({ userId: req.user.id });
    if (!wishlist) {
      wishlist = new Wishlist({ userId: req.user.id, products: [] });
    }

    const exists = wishlist.products.includes(productId);
    if (exists) {
      wishlist.products = wishlist.products.filter(
        (p) => p.toString() !== productId
      );
    } else {
      wishlist.products.push(productId);
    }

    await wishlist.save();
    res.json({
      wishlisted: !exists,
      message: exists ? 'Removed from wishlist' : 'Added to wishlist ❤️',
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};