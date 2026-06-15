import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Platform
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useRouter } from 'expo-router';
import API from '../constants/api';

export default function TransactionScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({ status: '', paymentMode: '' });
  const [sortOrder, setSortOrder] = useState('desc');
  const [stats, setStats] = useState({
    total: 0, completed: 0, failed: 0, refunded: 0, totalAmount: 0
  });

  useEffect(() => {
    fetchTransactions();
  }, [page, filter, sortOrder]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page, limit: 10, sortBy: 'createdAt', sortOrder,
        ...(filter.status && { status: filter.status }),
      });

      const [res, allRes] = await Promise.all([
        API.get(`/transactions?${params}`),
        API.get(`/transactions?limit=1000`),
      ]);

      setTransactions(res.data.transactions);
      setPagination(res.data.pagination);

      const all = allRes.data.transactions;
      const totalAmount = all
        .filter((t) => t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);

      setStats({
        total: all.length,
        completed: all.filter((t) => t.status === 'completed').length,
        failed: all.filter((t) => t.status === 'failed').length,
        refunded: all.filter((t) => t.status === 'refunded').length,
        totalAmount,
      });
    } catch (err) {
      console.log('Fetch transactions error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return colors.success;
      case 'failed': return colors.error;
      case 'refunded': return '#FF9800';
      default: return colors.subtext;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return '✅';
      case 'failed': return '❌';
      case 'refunded': return '↩️';
      default: return '⏳';
    }
  };

  const getPaymentIcon = (mode) => {
    switch (mode) {
      case 'UPI': return '📱';
      case 'Card': return '💳';
      case 'NetBanking': return '🏦';
      case 'COD': return '💵';
      case 'Wallet': return '👛';
      default: return '💰';
    }
  };

  const renderTransaction = ({ item }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/transaction/${item._id}`)}>
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <Text style={[styles.invoiceId, { color: colors.primary }]}>{item.invoiceId}</Text>
          <Text style={[styles.orderId, { color: colors.subtext }]}>{item.orderId}</Text>
        </View>
        <Text style={[styles.amount, { color: colors.text }]}>
          ₹{item.amount.toLocaleString()}
        </Text>
      </View>
      <View style={[styles.cardBottom, { borderTopColor: colors.border }]}>
        <View style={styles.badge}>
          <Text style={styles.badgeIcon}>{getPaymentIcon(item.paymentMode)}</Text>
          <Text style={[styles.badgeText, { color: colors.subtext }]}>{item.paymentMode}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
          <Text style={styles.statusIcon}>{getStatusIcon(item.status)}</Text>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
          </Text>
        </View>
        <Text style={[styles.date, { color: colors.subtext }]}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Fixed Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.primary, fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>📄 My Transactions</Text>
        <TouchableOpacity
          onPress={() => {
            if (Platform.OS === 'web') {
              window.alert('CSV export available via API:\nGET /api/transactions/export/csv');
            } else {
              Alert.alert('Export', 'CSV export available via API');
            }
          }}>
          <Text style={[styles.exportText, { color: colors.success }]}>📥 CSV</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        {[
          { label: 'Total', value: stats.total, color: colors.primary },
          { label: 'Done', value: stats.completed, color: colors.success },
          { label: 'Failed', value: stats.failed, color: colors.error },
          { label: 'Refund', value: stats.refunded, color: '#FF9800' },
        ].map((stat) => (
          <View key={stat.label} style={[styles.statCard, {
            backgroundColor: stat.color + '15',
            borderColor: stat.color + '40',
          }]}>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: colors.subtext }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Total Spent */}
      <View style={[styles.totalSpentBox, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}>
        <Text style={[styles.totalSpentLabel, { color: colors.subtext }]}>Total Spent</Text>
        <Text style={[styles.totalSpentValue, { color: colors.primary }]}>
          ₹{stats.totalAmount.toLocaleString()}
        </Text>
      </View>

      {/* Filter Row */}
      <View style={styles.filterRow}>
        {['', 'completed', 'failed', 'refunded'].map((s) => (
          <TouchableOpacity
            key={s}
            style={[styles.filterChip, {
              backgroundColor: filter.status === s ? colors.primary : 'transparent',
              borderColor: colors.primary,
            }]}
            onPress={() => { setFilter({ ...filter, status: s }); setPage(1); }}>
            <Text style={[styles.filterChipText, {
              color: filter.status === s ? '#fff' : colors.primary,
            }]}>
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[styles.filterChip, { backgroundColor: 'transparent', borderColor: colors.secondary }]}
          onPress={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}>
          <Text style={[styles.filterChipText, { color: colors.secondary }]}>
            {sortOrder === 'desc' ? '↓ New' : '↑ Old'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Transactions List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : transactions.length === 0 ? (
        <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>📄</Text>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Transactions Found</Text>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            Try changing the filter or make your first purchase!
          </Text>
          <TouchableOpacity
            style={[styles.shopNowBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/products')}>
            <Text style={styles.shopNowText}>🛍️ Shop Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item._id}
          renderItem={renderTransaction}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
          ListFooterComponent={() => (
            pagination && pagination.totalPages > 1 && (
              <View style={styles.paginationRow}>
                <TouchableOpacity
                  style={[styles.pageBtn, {
                    backgroundColor: page === 1 ? colors.surface : colors.primary,
                    opacity: page === 1 ? 0.5 : 1,
                  }]}
                  onPress={() => setPage(page - 1)}
                  disabled={page === 1}>
                  <Text style={[styles.pageBtnText, {
                    color: page === 1 ? colors.subtext : '#fff'
                  }]}>← Prev</Text>
                </TouchableOpacity>
                <Text style={[styles.pageInfo, { color: colors.text }]}>
                  {page} / {pagination.totalPages}
                </Text>
                <TouchableOpacity
                  style={[styles.pageBtn, {
                    backgroundColor: page === pagination.totalPages ? colors.surface : colors.primary,
                    opacity: page === pagination.totalPages ? 0.5 : 1,
                  }]}
                  onPress={() => setPage(page + 1)}
                  disabled={page === pagination.totalPages}>
                  <Text style={[styles.pageBtnText, {
                    color: page === pagination.totalPages ? colors.subtext : '#fff'
                  }]}>Next →</Text>
                </TouchableOpacity>
              </View>
            )
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16, paddingTop: 50,
    paddingBottom: 12,
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  exportText: { fontSize: 13, fontWeight: '700' },
  statsRow: {
    flexDirection: 'row', paddingHorizontal: 16,
    gap: 8, marginBottom: 8,
  },
  statCard: {
    flex: 1, borderWidth: 1, borderRadius: 12,
    padding: 10, alignItems: 'center',
  },
  statValue: { fontSize: 18, fontWeight: 'bold' },
  statLabel: { fontSize: 10, fontWeight: '600', marginTop: 2 },
  totalSpentBox: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginHorizontal: 16,
    borderWidth: 1, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 10,
    marginBottom: 12,
  },
  totalSpentLabel: { fontSize: 13, fontWeight: '600' },
  totalSpentValue: { fontSize: 18, fontWeight: 'bold' },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16,
    gap: 8, marginBottom: 12, flexWrap: 'nowrap',
  },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5,
  },
  filterChipText: { fontSize: 12, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    borderWidth: 1, borderRadius: 16,
    marginBottom: 12, overflow: 'hidden',
    marginHorizontal: 16,
  },
  cardTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-start', padding: 14,
  },
  cardLeft: { flex: 1, marginRight: 8 },
  invoiceId: { fontSize: 13, fontWeight: 'bold', marginBottom: 2 },
  orderId: { fontSize: 11 },
  amount: { fontSize: 18, fontWeight: 'bold' },
  cardBottom: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 10,
    paddingHorizontal: 14, borderTopWidth: 1,
  },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  badgeIcon: { fontSize: 14 },
  badgeText: { fontSize: 12 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 10, gap: 3,
  },
  statusIcon: { fontSize: 11 },
  statusText: { fontSize: 11, fontWeight: '700' },
  date: { fontSize: 11 },
  paginationRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginHorizontal: 16,
    marginTop: 8, marginBottom: 20,
  },
  pageBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  pageBtnText: { fontSize: 14, fontWeight: '600' },
  pageInfo: { fontSize: 14, fontWeight: '600' },
  emptyBox: {
    borderWidth: 1, borderRadius: 16,
    padding: 32, alignItems: 'center',
    marginTop: 20, marginHorizontal: 16,
  },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptyText: { fontSize: 14, textAlign: 'center', marginBottom: 16 },
  shopNowBtn: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  shopNowText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
});