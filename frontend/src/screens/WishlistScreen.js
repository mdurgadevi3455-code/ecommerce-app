import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useRouter } from 'expo-router';
import API from '../constants/api';

export default function WishlistScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const res = await API.get('/recommendations/wishlist');
      setWishlist(res.data);
    } catch (err) {
      console.log('Fetch wishlist error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      await API.post('/recommendations/wishlist/toggle', { productId });
      setWishlist(wishlist.filter((p) => p._id !== productId));
    } catch (err) {
      console.log('Remove wishlist error:', err.message);
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => router.push(`/product/${item._id}`)}>
        <View style={[styles.imageBox, { backgroundColor: colors.surface }]}>
          <Text style={styles.imageEmoji}>🛍️</Text>
        </View>
        <View style={styles.info}>
          <Text style={[styles.category, { color: colors.subtext }]}>{item.category}</Text>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
          <Text style={[styles.price, { color: colors.primary }]}>
            ₹{item.price.toLocaleString()}
          </Text>
          <View style={[styles.stockBadge, {
            backgroundColor: item.stock > 0 ? colors.success + '20' : colors.error + '20'
          }]}>
            <Text style={[styles.stockText, {
              color: item.stock > 0 ? colors.success : colors.error
            }]}>
              {item.stock > 0 ? `${item.stock} in stock` : 'Out of Stock'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Action Buttons */}
      <View style={[styles.actionRow, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push(`/product/${item._id}`)}>
          <Text style={styles.actionBtnText}>🛒 Add to Cart</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.removeBtn, { backgroundColor: colors.error + '20', borderColor: colors.error }]}
          onPress={() => removeFromWishlist(item._id)}>
          <Text style={[styles.removeBtnText, { color: colors.error }]}>❤️ Remove</Text>
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.primary, fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>❤️ Wishlist</Text>
        <Text style={[styles.count, { color: colors.subtext }]}>
          {wishlist.length} items
        </Text>
      </View>

      {wishlist.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: colors.surface }]}>
          <Text style={{ fontSize: 60, marginBottom: 16 }}>❤️</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            Your Wishlist is Empty
          </Text>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            Save your favourite products here!
          </Text>
          <TouchableOpacity
            style={[styles.shopBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/products')}>
            <Text style={styles.shopBtnText}>🛍️ Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={wishlist}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16, paddingTop: 50,
  },
  title: { fontSize: 20, fontWeight: 'bold' },
  count: { fontSize: 13 },
  card: {
    borderWidth: 1, borderRadius: 16,
    marginHorizontal: 16, marginBottom: 12,
    overflow: 'hidden',
  },
  cardContent: { flexDirection: 'row', padding: 12 },
  imageBox: {
    width: 90, height: 90, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  imageEmoji: { fontSize: 40 },
  info: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  category: { fontSize: 10, textTransform: 'uppercase', fontWeight: '600', marginBottom: 4 },
  name: { fontSize: 14, fontWeight: 'bold', marginBottom: 6 },
  price: { fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  stockBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, alignSelf: 'flex-start' },
  stockText: { fontSize: 11, fontWeight: '600' },
  actionRow: {
    flexDirection: 'row', borderTopWidth: 1,
    padding: 10, gap: 8,
  },
  actionBtn: {
    flex: 1, padding: 10, borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  removeBtn: {
    flex: 1, padding: 10, borderRadius: 10,
    alignItems: 'center', borderWidth: 1,
  },
  removeBtnText: { fontSize: 13, fontWeight: 'bold' },
  emptyBox: {
    margin: 16, borderRadius: 20, padding: 40,
    alignItems: 'center',
  },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: 'center', marginBottom: 24 },
  shopBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  shopBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});