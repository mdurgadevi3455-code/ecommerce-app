import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useRouter } from 'expo-router';
import API from '../constants/api';

export default function CartScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [active, setActive] = useState([]);
  const [savedForLater, setSavedForLater] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await API.get('/cart');
      setActive(res.data.active);
      setSavedForLater(res.data.savedForLater);
      setTotal(res.data.total);
    } catch (err) {
      console.log('Fetch cart error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (itemId) => {
    if (window.confirm('Are you sure you want to remove this item?')) {
      setActionLoading(itemId);
      try {
        await API.delete(`/cart/remove/${itemId}`);
        await fetchCart();
      } catch (err) {
        Alert.alert('Error', err.response?.data?.message || 'Failed to remove');
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleSaveForLater = async (itemId) => {
    setActionLoading(itemId);
    try {
      await API.put(`/cart/save-for-later/${itemId}`);
      await fetchCart();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleMoveToCart = async (itemId) => {
    setActionLoading(itemId);
    try {
      await API.put(`/cart/move-to-cart/${itemId}`);
      await fetchCart();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleQuantity = async (itemId, quantity) => {
    if (quantity < 1) return;
    setActionLoading(itemId);
    try {
      await API.put('/cart/quantity', { itemId, quantity });
      await fetchCart();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed');
    } finally {
      setActionLoading(null);
    }
  };

  const renderActiveItem = ({ item }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Price change warning */}
      {item.priceChanged && (
        <View style={[styles.warningBanner, { backgroundColor: colors.error + '20' }]}>
          <Text style={[styles.warningText, { color: colors.error }]}>
            ⚠️ Price changed from ₹{item.priceAtAdd.toLocaleString()} to ₹{item.currentPrice.toLocaleString()}
          </Text>
        </View>
      )}

      {/* Out of stock warning */}
      {item.outOfStock && (
        <View style={[styles.warningBanner, { backgroundColor: colors.error + '20' }]}>
          <Text style={[styles.warningText, { color: colors.error }]}>
            ❌ Not enough stock available
          </Text>
        </View>
      )}

      <View style={styles.cardContent}>
        <View style={[styles.productImage, { backgroundColor: colors.surface }]}>
          <Text style={{ fontSize: 28 }}>🛍️</Text>
        </View>

        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.productCategory, { color: colors.subtext }]}>{item.category}</Text>
          <Text style={[styles.productPrice, { color: colors.primary }]}>
            ₹{item.currentPrice.toLocaleString()}
          </Text>

          {/* Quantity controls */}
          <View style={styles.quantityRow}>
            <TouchableOpacity
              style={[styles.qtyBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => handleQuantity(item._id, item.quantity - 1)}>
              <Text style={[styles.qtyBtnText, { color: colors.text }]}>−</Text>
            </TouchableOpacity>
            <Text style={[styles.qtyText, { color: colors.text }]}>{item.quantity}</Text>
            <TouchableOpacity
              style={[styles.qtyBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => handleQuantity(item._id, item.quantity + 1)}>
              <Text style={[styles.qtyBtnText, { color: colors.text }]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Action buttons */}
      <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleSaveForLater(item._id)}
          disabled={actionLoading === item._id}>
          {actionLoading === item._id
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Text style={[styles.actionBtnText, { color: colors.primary }]}>Save for Later</Text>
          }
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleRemove(item._id)}
          disabled={actionLoading === item._id}>
          <Text style={[styles.actionBtnText, { color: colors.error }]}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSavedItem = ({ item }) => (
    <View style={[styles.savedCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardContent}>
        <View style={[styles.savedImage, { backgroundColor: colors.card }]}>
          <Text style={{ fontSize: 22 }}>🛍️</Text>
        </View>
        <View style={styles.productInfo}>
          <Text style={[styles.productName, { color: colors.text }]}>{item.name}</Text>
          <Text style={[styles.productPrice, { color: colors.primary }]}>
            ₹{item.currentPrice.toLocaleString()}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.moveBtn, { backgroundColor: colors.primary }]}
          onPress={() => handleMoveToCart(item._id)}
          disabled={actionLoading === item._id}>
          {actionLoading === item._id
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.moveBtnText}>Move to Cart</Text>
          }
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={{ color: colors.primary, fontSize: 16 }}>← Back</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.text }]}>🛒 My Cart</Text>

      {/* Active Cart Items */}
      {active.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🛒</Text>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>Your cart is empty</Text>
          <TouchableOpacity
            style={[styles.shopBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/products')}>
            <Text style={styles.shopBtnText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={active}
            keyExtractor={(item) => item._id}
            renderItem={renderActiveItem}
            scrollEnabled={false}
          />

          {/* Order Summary */}
          <View style={[styles.summaryBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>Order Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.subtext }]}>
                Items ({active.length})
              </Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>
                ₹{total.toLocaleString()}
              </Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>
                ₹{total.toLocaleString()}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.checkoutBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/checkout')}>
              <Text style={styles.checkoutBtnText}>Proceed to Checkout →</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Save for Later Section */}
      {savedForLater.length > 0 && (
        <View style={styles.savedSection}>
          <Text style={[styles.savedTitle, { color: colors.text }]}>
            🔖 Saved for Later ({savedForLater.length})
          </Text>
          <FlatList
            data={savedForLater}
            keyExtractor={(item) => item._id}
            renderItem={renderSavedItem}
            scrollEnabled={false}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { marginTop: 40, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  card: {
    borderWidth: 1, borderRadius: 16,
    marginBottom: 16, overflow: 'hidden',
  },
  warningBanner: { padding: 8, paddingHorizontal: 12 },
  warningText: { fontSize: 12, fontWeight: '600' },
  cardContent: { flexDirection: 'row', padding: 12, alignItems: 'center' },
  productImage: {
    width: 80, height: 80, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  productInfo: { flex: 1, marginLeft: 12 },
  productName: { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  productCategory: { fontSize: 12, marginBottom: 4 },
  productPrice: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  quantityRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  qtyBtn: {
    width: 32, height: 32, borderRadius: 8, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  qtyBtnText: { fontSize: 18, fontWeight: 'bold' },
  qtyText: { fontSize: 16, fontWeight: 'bold', minWidth: 20, textAlign: 'center' },
  actionRow: {
    flexDirection: 'row', borderTopWidth: 1,
    paddingVertical: 8,
  },
  actionBtn: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  actionBtnText: { fontSize: 13, fontWeight: '600' },
  divider: { width: 1, marginVertical: 4 },
  savedCard: {
    borderWidth: 1, borderRadius: 12,
    marginBottom: 10, overflow: 'hidden',
  },
  savedImage: {
    width: 60, height: 60, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  moveBtn: {
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 8,
  },
  moveBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  emptyBox: {
    borderWidth: 1, borderRadius: 16, padding: 32,
    alignItems: 'center', marginBottom: 16,
  },
  emptyText: { fontSize: 16, marginBottom: 16 },
  shopBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  shopBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  summaryBox: {
    borderWidth: 1, borderRadius: 16,
    padding: 16, marginBottom: 16,
  },
  summaryTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 14, fontWeight: '600' },
  summaryDivider: { height: 1, marginVertical: 8 },
  totalLabel: { fontSize: 16, fontWeight: 'bold' },
  totalValue: { fontSize: 20, fontWeight: 'bold' },
  checkoutBtn: {
    padding: 16, borderRadius: 10,
    alignItems: 'center', marginTop: 12,
  },
  checkoutBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  savedSection: { marginBottom: 32 },
  savedTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
});