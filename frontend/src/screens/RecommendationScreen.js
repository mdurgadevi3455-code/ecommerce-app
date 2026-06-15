import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useRouter } from 'expo-router';
import API from '../constants/api';

export default function RecommendationScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [recommendations, setRecommendations] = useState([]);
  const [wishlist, setWishlist] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wishlistLoading, setWishlistLoading] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [recRes, wishRes] = await Promise.all([
        API.get('/recommendations'),
        API.get('/recommendations/wishlist'),
      ]);
      setRecommendations(recRes.data.recommendations);
      setMeta(recRes.data.meta);
      setWishlist(wishRes.data.map((p) => p._id));
    } catch (err) {
      console.log('Fetch recommendations error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleWishlist = async (productId) => {
    setWishlistLoading(productId);
    try {
      const res = await API.post('/recommendations/wishlist/toggle', { productId });
      if (res.data.wishlisted) {
        setWishlist([...wishlist, productId]);
      } else {
        setWishlist(wishlist.filter((id) => id !== productId));
      }
    } catch (err) {
      console.log('Wishlist toggle error:', err.message);
    } finally {
      setWishlistLoading(null);
    }
  };

  const renderProduct = ({ item }) => {
    const isWishlisted = wishlist.includes(item._id);

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push(`/product/${item._id}`)}>

        {/* Product Image */}
        <View style={[styles.imageBox, { backgroundColor: colors.surface }]}>
          <Text style={{ fontSize: 36 }}>🛍️</Text>
          {/* Wishlist button */}
          <TouchableOpacity
            style={[styles.wishlistBtn, { backgroundColor: colors.card }]}
            onPress={() => toggleWishlist(item._id)}
            disabled={wishlistLoading === item._id}>
            {wishlistLoading === item._id
              ? <ActivityIndicator size="small" color={colors.error} />
              : <Text style={{ fontSize: 18 }}>{isWishlisted ? '❤️' : '🤍'}</Text>
            }
          </TouchableOpacity>
        </View>

        {/* Product Info */}
        <View style={styles.info}>
          <Text style={[styles.category, { color: colors.subtext }]}>
            {item.category}
          </Text>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={[styles.price, { color: colors.primary }]}>
            ₹{item.price.toLocaleString()}
          </Text>

          {/* Popularity bar */}
          <View style={styles.popularityRow}>
            <Text style={[styles.popularityLabel, { color: colors.subtext }]}>
              🔥 {item.popularity} views
            </Text>
            <View style={[styles.stockBadge, {
              backgroundColor: item.stock > 0 ? colors.success + '20' : colors.error + '20'
            }]}>
              <Text style={[styles.stockText, {
                color: item.stock > 0 ? colors.success : colors.error
              }]}>
                {item.stock > 0 ? 'In Stock' : 'Out of Stock'}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.subtext }]}>
          Finding products for you...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={{ color: colors.primary, fontSize: 16 }}>← Back</Text>
      </TouchableOpacity>

      {/* Header */}
      <Text style={[styles.title, { color: colors.text }]}>✨ For You</Text>
      <Text style={[styles.subtitle, { color: colors.subtext }]}>
        Personalized recommendations based on your activity
      </Text>

      {/* Meta Info */}
      {meta && (
        <View style={[styles.metaBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={[styles.metaValue, { color: colors.primary }]}>
                {meta.count}
              </Text>
              <Text style={[styles.metaLabel, { color: colors.subtext }]}>
                Recommendations
              </Text>
            </View>
            <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
            <View style={styles.metaItem}>
              <Text style={[styles.metaValue, { color: colors.primary }]}>
                {meta.responseTimeMs}ms
              </Text>
              <Text style={[styles.metaLabel, { color: colors.subtext }]}>
                Response Time
              </Text>
            </View>
            <View style={[styles.metaDivider, { backgroundColor: colors.border }]} />
            <View style={styles.metaItem}>
              <Text style={[styles.metaValue, { color: colors.primary }]}>
                {meta.basedOn.browsingHistory}
              </Text>
              <Text style={[styles.metaLabel, { color: colors.subtext }]}>
                Items Analysed
              </Text>
            </View>
          </View>

          {meta.basedOn.categories.length > 0 && (
            <View style={styles.categoriesRow}>
              {meta.basedOn.categories.map((cat) => (
                <View
                  key={cat}
                  style={[styles.categoryChip, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.categoryChipText, { color: colors.primary }]}>
                    {cat}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Recommendations Grid */}
      {recommendations.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: colors.surface }]}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🔍</Text>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            Browse some products first to get personalized recommendations!
          </Text>
          <TouchableOpacity
            style={[styles.browseBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/products')}>
            <Text style={styles.browseBtnText}>Browse Products</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={recommendations}
          keyExtractor={(item) => item._id}
          renderItem={renderProduct}
          numColumns={2}
          columnWrapperStyle={styles.row}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText: { marginTop: 12, fontSize: 14 },
  backBtn: { marginTop: 40, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14, marginBottom: 16 },
  metaBox: {
    borderWidth: 1, borderRadius: 16,
    padding: 16, marginBottom: 20,
  },
  metaRow: { flexDirection: 'row', justifyContent: 'space-around' },
  metaItem: { alignItems: 'center' },
  metaValue: { fontSize: 20, fontWeight: 'bold' },
  metaLabel: { fontSize: 11, marginTop: 2, textAlign: 'center' },
  metaDivider: { width: 1, marginVertical: 4 },
  categoriesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  categoryChip: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  categoryChipText: { fontSize: 12, fontWeight: '600' },
  row: { justifyContent: 'space-between', marginBottom: 12 },
  card: {
    width: '48%', borderWidth: 1,
    borderRadius: 16, overflow: 'hidden',
  },
  imageBox: {
    height: 120, justifyContent: 'center',
    alignItems: 'center', position: 'relative',
  },
  wishlistBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
  },
  info: { padding: 10 },
  category: { fontSize: 10, textTransform: 'uppercase', marginBottom: 2 },
  name: { fontSize: 13, fontWeight: 'bold', marginBottom: 4 },
  price: { fontSize: 15, fontWeight: 'bold', marginBottom: 6 },
  popularityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  popularityLabel: { fontSize: 10 },
  stockBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  stockText: { fontSize: 10, fontWeight: '600' },
  emptyBox: {
    borderRadius: 16, padding: 32,
    alignItems: 'center', marginBottom: 16,
  },
  emptyText: { fontSize: 14, textAlign: 'center', marginBottom: 16, lineHeight: 22 },
  browseBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  browseBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});