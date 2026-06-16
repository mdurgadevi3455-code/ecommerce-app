import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, StatusBar, ActivityIndicator
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../constants/AuthContext';
import { useRouter, useFocusEffect } from 'expo-router';
import API from '../constants/api';

export default function HomeScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({ cart: 0, transactions: 0, wishlist: 0 });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchStats();
    }, [])
  );

  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const [cartRes, transRes, wishRes] = await Promise.all([
        API.get('/cart'),
        API.get('/transactions?limit=1000'),
        API.get('/recommendations/wishlist'),
      ]);
      setStats({
        cart: cartRes.data.active?.length || 0,
        transactions: transRes.data.pagination?.total || 0,
        wishlist: wishRes.data?.length || 0,
      });
    } catch (err) {
      console.log('Stats error:', err.message);
    } finally {
      setStatsLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const menuItems = [
    {
      icon: '🛍️', label: 'Products', sublabel: 'Browse all items',
      route: '/products', color: '#6C63FF',
    },
    {
      icon: '🛒', label: 'My Cart', sublabel: `${stats.cart} items`,
      route: '/cart', color: '#FF6584',
    },
    {
      icon: '✨', label: 'For You', sublabel: 'Personalized picks',
      route: '/recommendations', color: '#00C853',
    },
    {
      icon: '🕐', label: 'Recently Viewed', sublabel: 'Continue browsing',
      route: '/recently-viewed', color: '#FF9800',
    },
    {
      icon: '📄', label: 'Transactions', sublabel: `${stats.transactions} orders`,
      route: '/transactions', color: '#00BCD4',
    },
    {
      icon: '❤️', label: 'Wishlist', sublabel: `${stats.wishlist} saved`,
      route: '/wishlist', color: '#E91E63',
    },
    {
      icon: '🔔', label: 'Notifications', sublabel: 'Alerts & updates',
      route: '/notifications', color: '#9C27B0',
    },
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.avatarBox, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerMiddle}>
          <Text style={[styles.greeting, { color: colors.subtext }]}>
            {getGreeting()} 👋
          </Text>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.name}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.themeBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={toggleTheme}>
          <Text style={{ fontSize: 18 }}>{isDark ? '☀️' : '🌙'}</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={[styles.statBox, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}>
          {statsLoading
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Text style={[styles.statNum, { color: colors.primary }]}>{stats.cart}</Text>
          }
          <Text style={[styles.statLbl, { color: colors.subtext }]}>Cart Items</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.success + '15', borderColor: colors.success + '40' }]}>
          {statsLoading
            ? <ActivityIndicator size="small" color={colors.success} />
            : <Text style={[styles.statNum, { color: colors.success }]}>{stats.transactions}</Text>
          }
          <Text style={[styles.statLbl, { color: colors.subtext }]}>Orders</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#E91E6315', borderColor: '#E91E6340' }]}>
          {statsLoading
            ? <ActivityIndicator size="small" color="#E91E63" />
            : <Text style={[styles.statNum, { color: '#E91E63' }]}>{stats.wishlist}</Text>
          }
          <Text style={[styles.statLbl, { color: colors.subtext }]}>Wishlist</Text>
        </View>
      </View>

      {/* Banner */}
      <View style={[styles.banner, { backgroundColor: colors.primary }]}>
        <View style={styles.bannerContent}>
          <Text style={styles.bannerTag}>LIMITED OFFER</Text>
          <Text style={styles.bannerTitle}>Shop the Best{'\n'}Deals Today! 🔥</Text>
          <Text style={styles.bannerSubtitle}>Free delivery on orders above ₹999</Text>
          <TouchableOpacity
            style={styles.bannerBtn}
            onPress={() => router.push('/products')}>
            <Text style={styles.bannerBtnText}>Shop Now →</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.bannerEmoji}>🛍️</Text>
      </View>

      {/* Menu Grid */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Access</Text>
      <View style={styles.grid}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push(item.route)}>
            <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
              <Text style={styles.gridIcon}>{item.icon}</Text>
            </View>
            <Text style={[styles.gridLabel, { color: colors.text }]}>{item.label}</Text>
            <Text style={[styles.gridSublabel, { color: colors.subtext }]}>{item.sublabel}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout */}
      <TouchableOpacity
        style={[styles.logoutBtn, { borderColor: colors.error }]}
        onPress={logout}>
        <Text style={[styles.logoutText, { color: colors.error }]}>🚪 Logout</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 20 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 55, marginBottom: 24,
  },
  avatarBox: {
    width: 46, height: 46, borderRadius: 23,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  headerMiddle: { flex: 1 },
  greeting: { fontSize: 13, marginBottom: 2 },
  userName: { fontSize: 18, fontWeight: 'bold' },
  themeBtn: {
    width: 42, height: 42, borderRadius: 21,
    borderWidth: 1, justifyContent: 'center', alignItems: 'center',
  },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statBox: {
    flex: 1, borderWidth: 1, borderRadius: 14,
    padding: 14, alignItems: 'center',
  },
  statNum: { fontSize: 22, fontWeight: 'bold', marginBottom: 2 },
  statLbl: { fontSize: 11, fontWeight: '600' },
  banner: {
    borderRadius: 20, padding: 24,
    marginBottom: 28, flexDirection: 'row',
    alignItems: 'center', overflow: 'hidden',
  },
  bannerContent: { flex: 1 },
  bannerTag: {
    color: 'rgba(255,255,255,0.7)', fontSize: 10,
    fontWeight: '800', letterSpacing: 1.5, marginBottom: 6,
  },
  bannerTitle: {
    color: '#fff', fontSize: 22,
    fontWeight: 'bold', lineHeight: 28, marginBottom: 8,
  },
  bannerSubtitle: {
    color: 'rgba(255,255,255,0.8)', fontSize: 12, marginBottom: 16,
  },
  bannerBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 18, paddingVertical: 9,
    borderRadius: 10, alignSelf: 'flex-start',
  },
  bannerBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  bannerEmoji: { fontSize: 64, marginLeft: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 14 },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 12, marginBottom: 24,
  },
  gridCard: {
    width: '47%', borderWidth: 1,
    borderRadius: 18, padding: 16,
  },
  iconBox: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 10,
  },
  gridIcon: { fontSize: 24 },
  gridLabel: { fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  gridSublabel: { fontSize: 11 },
  logoutBtn: {
    borderWidth: 1.5, borderRadius: 14,
    padding: 14, alignItems: 'center', marginBottom: 40,
  },
  logoutText: { fontSize: 15, fontWeight: '700' },
});