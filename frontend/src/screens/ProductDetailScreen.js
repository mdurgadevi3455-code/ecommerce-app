import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView, Alert
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import API from '../constants/api';

export default function ProductDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const res = await API.get(`/products/${id}`);
      setProduct(res.data);
      // Save to local recently viewed
      await saveLocalRecentlyViewed(res.data);
    } catch (err) {
      console.log('Fetch product error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveLocalRecentlyViewed = async (product) => {
    try {
      const stored = await AsyncStorage.getItem('recentlyViewed');
      let items = stored ? JSON.parse(stored) : [];

      // Remove duplicate
      items = items.filter((p) => p.productId !== product._id);

      // Add to beginning
      items.unshift({ productId: product._id, viewedAt: new Date().toISOString() });

      // Keep max 20
      if (items.length > 20) items = items.slice(0, 20);

      await AsyncStorage.setItem('recentlyViewed', JSON.stringify(items));
    } catch (err) {
      console.log('Save local recently viewed error:', err.message);
    }
  };

  const toggleWishlist = async () => {
    setWishlistLoading(true);
    try {
      const res = await API.post('/recommendations/wishlist/toggle', {
        productId: product._id,
      });
      setWishlisted(res.data.wishlisted);
    } catch (err) {
      console.log('Wishlist error:', err.message);
    } finally {
      setWishlistLoading(false);
    }
  };

  const addToCart = async () => {
    try {
      await API.post('/cart/add', { productId: product._id, quantity: 1 });
      if (Platform.OS === 'web') {
        window.alert(`✅ ${product.name} added to cart successfully!`);
      } else {
        Alert.alert('Added to Cart ✅', `${product.name} has been added to your cart!`, [
          { text: 'Continue Shopping', style: 'cancel' },
          { text: 'View Cart 🛒', onPress: () => router.push('/cart') },
        ]);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Product not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topRow}>
  <TouchableOpacity onPress={() => router.back()}>
    <Text style={{ color: colors.primary, fontSize: 16 }}>← Back</Text>
  </TouchableOpacity>
  <TouchableOpacity
    onPress={toggleWishlist}
    disabled={wishlistLoading}
    style={[styles.wishBtn, { backgroundColor: colors.surface }]}>
    {wishlistLoading
      ? <ActivityIndicator size="small" color={colors.error} />
      : <Text style={{ fontSize: 22 }}>{wishlisted ? '❤️' : '🤍'}</Text>
    }
  </TouchableOpacity>
</View>

      <View style={[styles.imagePlaceholder, { backgroundColor: colors.surface }]}>
        <Text style={{ fontSize: 80 }}>🛍️</Text>
      </View>

      <View style={styles.details}>
        <Text style={[styles.category, { color: colors.subtext }]}>{product.category}</Text>
        <Text style={[styles.name, { color: colors.text }]}>{product.name}</Text>
        <Text style={[styles.price, { color: colors.primary }]}>₹{product.price.toLocaleString()}</Text>
        <Text style={[styles.description, { color: colors.subtext }]}>{product.description}</Text>

        <View style={[styles.statsRow]}>
          <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{product.stock}</Text>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>In Stock</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
            <Text style={[styles.statValue, { color: colors.text }]}>{product.popularity}</Text>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>Views</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={addToCart}>
          <Text style={styles.buttonText}>Add to Cart 🛒</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { padding: 16, marginTop: 40 },
  imagePlaceholder: {
    height: 250, justifyContent: 'center',
    alignItems: 'center', marginHorizontal: 16, borderRadius: 16,
  },
  details: { padding: 16 },
  category: { fontSize: 14, marginBottom: 4, textTransform: 'uppercase' },
  name: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  price: { fontSize: 28, fontWeight: 'bold', marginBottom: 12 },
  description: { fontSize: 16, lineHeight: 24, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statBox: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold' },
  statLabel: { fontSize: 12, marginTop: 4 },
  button: { padding: 16, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  topRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16, marginTop: 40,
  },
  wishBtn: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
});