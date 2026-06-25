import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  StyleSheet, ActivityIndicator
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from '../constants/api';

export default function RecentlyViewedScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    syncAndLoad();
  }, []);

  const syncAndLoad = async () => {
    try {
      // Get local recently viewed
      const stored = await AsyncStorage.getItem('recentlyViewed');
      const localItems = stored ? JSON.parse(stored) : [];

      // Sync with server and get merged result
      const res = await API.post('/products/recently-viewed/sync', { localItems });
      setProducts(res.data);

      // Update local storage with merged result
      const merged = res.data.map((p) => ({
        productId: p._id,
        viewedAt: p.viewedAt,
      }));
      await AsyncStorage.setItem('recentlyViewed', JSON.stringify(merged));
    } catch (err) {
      // If server fails, load from local
      console.log('Sync error, loading local:', err.message);
      await loadLocal();
    } finally {
      setLoading(false);
    }
  };

  const loadLocal = async () => {
    try {
      const stored = await AsyncStorage.getItem('recentlyViewed');
      if (stored) {
        const items = JSON.parse(stored);
        setProducts(items);
      }
    } catch (err) {
      console.log('Load local error:', err.message);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/product/${item._id}`)}>
      <View style={[styles.imagePlaceholder, { backgroundColor: colors.surface }]}>
  {item.image ? (
    <Image
      source={{ uri: item.image }}
      style={styles.imageInner}
      resizeMode="cover"
    />
  ) : (
    <Text style={{ fontSize: 28 }}>🛍️</Text>
  )}
</View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.category, { color: colors.subtext }]}>{item.category}</Text>
        <Text style={[styles.price, { color: colors.primary }]}>₹{item.price?.toLocaleString()}</Text>
        <Text style={[styles.time, { color: colors.subtext }]}>
          Viewed: {new Date(item.viewedAt).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
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
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={{ color: colors.primary, fontSize: 16 }}>← Back</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.text }]}>🕐 Recently Viewed</Text>

      {products.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ color: colors.subtext, fontSize: 16 }}>No recently viewed products</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { marginTop: 40, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  card: {
    flexDirection: 'row', borderWidth: 1,
    borderRadius: 12, padding: 12, marginBottom: 12,
  },
  imagePlaceholder: {
    width: 70, height: 70, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  imageInner: { width: '100%', height: '100%' },
  info: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  name: { fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
  category: { fontSize: 12, marginBottom: 2 },
  price: { fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
  time: { fontSize: 11 },
});