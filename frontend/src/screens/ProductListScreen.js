import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator, TextInput,
  StatusBar, ScrollView
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useRouter } from 'expo-router';
import API from '../constants/api';

export default function ProductListScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState(['All']);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [search, selectedCategory, products]);

  const fetchProducts = async () => {
    try {
      const res = await API.get('/products');
      setProducts(res.data);
      setFiltered(res.data);
      const cats = ['All', ...new Set(res.data.map((p) => p.category))];
      setCategories(cats);
    } catch (err) {
      console.log('Fetch products error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = () => {
    let result = products;
    if (selectedCategory !== 'All') {
      result = result.filter((p) => p.category === selectedCategory);
    }
    if (search.trim()) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category.toLowerCase().includes(search.toLowerCase())
      );
    }
    setFiltered(result);
  };

  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/product/${item._id}`)}>

      {/* Image Box */}
      <View style={[styles.imageBox, { backgroundColor: colors.surface }]}>
  {item.image ? (
    <Image
      source={{ uri: item.image }}
      style={styles.productImage}
      resizeMode="contain"
    />
  ) : (
    <Text style={styles.imageEmoji}>🛍️</Text>
  )}
  {item.stock === 0 && (
          <View style={[styles.outOfStockBadge, { backgroundColor: colors.error }]}>
            <Text style={styles.outOfStockText}>Out of Stock</Text>
          </View>
        )}
        {item.popularity > 80 && (
          <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.popularText}>🔥 Popular</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.category, { color: colors.subtext }]}>{item.category}</Text>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
        <View style={styles.bottomRow}>
          <Text style={[styles.price, { color: colors.primary }]}>
            ₹{item.price.toLocaleString()}
          </Text>
          <View style={[styles.stockBadge, {
            backgroundColor: item.stock > 0 ? colors.success + '20' : colors.error + '20'
          }]}>
            <Text style={[styles.stockText, {
              color: item.stock > 0 ? colors.success : colors.error
            }]}>
              {item.stock > 0 ? `${item.stock} left` : 'Sold Out'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.subtext }]}>
          Loading products...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.primary, fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>🛍️ Products</Text>
        <Text style={[styles.count, { color: colors.subtext }]}>
          {filtered.length} items
        </Text>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchBox, { backgroundColor: colors.surface }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search products..."
          placeholderTextColor={colors.subtext}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ color: colors.subtext, fontSize: 18 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter */}
      {/* Category Filter */}
<View style={styles.categoryRow}>
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={{ paddingHorizontal: 4, paddingVertical: 4 }}>
    {categories.map((cat) => (
      <TouchableOpacity
        key={cat}
        style={[styles.categoryChip, {
          backgroundColor: selectedCategory === cat ? colors.primary : 'transparent',
          borderColor: colors.primary,
        }]}
        onPress={() => setSelectedCategory(cat)}>
        <Text style={[styles.categoryChipText, {
          color: selectedCategory === cat ? '#fff' : colors.primary,
        }]}>
          {cat}
        </Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
</View>

      {/* Product Grid */}
      {filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🔍</Text>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            No products found
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item._id}
          renderItem={renderProduct}
          numColumns={2}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, overflow: 'visible' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 50, marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: 'bold' },
  count: { fontSize: 13 },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 0, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 12,
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, outlineStyle: 'none' },
  categoryRow: { marginBottom: 16, flexGrow: 0, overflow: 'visible' },
  categoryChip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
    marginRight: 10,
  },
  categoryChipText: { fontSize: 13, fontWeight: '700' },
  row: { justifyContent: 'space-between', marginBottom: 12 },
  card: {
    width: '48.5%', borderWidth: 1,
    borderRadius: 18, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  imageBox: {
    height: 130, justifyContent: 'center',
    alignItems: 'center', position: 'relative',
    backgroundColor: '#fff', padding: 10,
  },
  imageEmoji: { fontSize: 48 },
  productImage: { width: '100%', height: '100%', borderRadius: 12 },
  outOfStockBadge: {
    position: 'absolute', bottom: 8, left: 8,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  outOfStockText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  popularBadge: {
    position: 'absolute', top: 8, right: 8,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  popularText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  info: { padding: 14 },
  category: { fontSize: 10, textTransform: 'uppercase', marginBottom: 4, fontWeight: '600' },
  name: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, lineHeight: 19 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 15, fontWeight: 'bold' },
  stockBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  stockText: { fontSize: 10, fontWeight: '600' },
  emptyText: { fontSize: 16 },
});