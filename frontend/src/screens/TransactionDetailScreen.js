import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ActivityIndicator, ScrollView, Linking
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useRouter, useLocalSearchParams } from 'expo-router';
import API from '../constants/api';

export default function TransactionDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const [transaction, setTransaction] = useState(null);
  const [loading, setLoading] = useState(true);

  const downloadPDF = async () => {
    try {
      const token = global.userToken;
      const url = `https://ecommerce-app-backend-1e9h.onrender.com/api/transactions/${id}/pdf?token=${token}`;
      Linking.openURL(url);
    } catch (err) {
      console.log('Download error:', err.message);
    }
  };

  useEffect(() => {
    fetchTransaction();
  }, [id]);

  const fetchTransaction = async () => {
    try {
      const res = await API.get(`/transactions/${id}`);
      setTransaction(res.data);
    } catch (err) {
      console.log('Fetch transaction error:', err.message);
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

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Transaction not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={{ color: colors.primary, fontSize: 16 }}>← Back</Text>
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.text }]}>Receipt 🧾</Text>

      {/* Invoice Card */}
      <View style={[styles.invoiceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>

        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: getStatusColor(transaction.status) }]}>
          <Text style={styles.statusBannerText}>
            {transaction.status.toUpperCase()}
          </Text>
        </View>

        <View style={styles.invoiceBody}>
          {/* Invoice Details */}
          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.subtext }]}>Invoice ID</Text>
            <Text style={[styles.value, { color: colors.text }]}>{transaction.invoiceId}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.subtext }]}>Order ID</Text>
            <Text style={[styles.value, { color: colors.text }]}>{transaction.orderId}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.subtext }]}>Payment Mode</Text>
            <Text style={[styles.value, { color: colors.text }]}>{transaction.paymentMode}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <Text style={[styles.label, { color: colors.subtext }]}>Date</Text>
            <Text style={[styles.value, { color: colors.text }]}>
              {new Date(transaction.createdAt).toLocaleString()}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total Amount</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              ₹{transaction.amount.toLocaleString()}
            </Text>
          </View>
        </View>
      </View>

      {/* Download PDF Button */}
<TouchableOpacity
  style={[styles.downloadBtn, { backgroundColor: colors.primary }]}
  onPress={downloadPDF}>
  <Text style={styles.downloadBtnText}>📥 Download PDF Receipt</Text>
</TouchableOpacity>

      {/* Audit Log */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>📋 Audit Log</Text>
      <View style={[styles.auditBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {transaction.auditLog.map((log, index) => (
          <View key={index}>
            <View style={styles.auditRow}>
              <View style={[styles.auditDot, { backgroundColor: colors.primary }]} />
              <View style={styles.auditContent}>
                <Text style={[styles.auditEvent, { color: colors.text }]}>
                  {log.event.charAt(0).toUpperCase() + log.event.slice(1)}
                </Text>
                <Text style={[styles.auditDetails, { color: colors.subtext }]}>
                  {log.details}
                </Text>
                <Text style={[styles.auditTime, { color: colors.subtext }]}>
                  {new Date(log.timestamp).toLocaleString()}
                </Text>
              </View>
            </View>
            {index < transaction.auditLog.length - 1 && (
              <View style={[styles.auditLine, { backgroundColor: colors.border }]} />
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { marginTop: 40, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  invoiceCard: {
    borderWidth: 1, borderRadius: 16,
    marginBottom: 24, overflow: 'hidden',
  },
  statusBanner: { padding: 12, alignItems: 'center' },
  statusBannerText: { color: '#fff', fontWeight: 'bold', fontSize: 14, letterSpacing: 2 },
  invoiceBody: { padding: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  label: { fontSize: 14 },
  value: { fontSize: 14, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  divider: { height: 1 },
  totalLabel: { fontSize: 16, fontWeight: 'bold' },
  totalValue: { fontSize: 22, fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  auditBox: {
    borderWidth: 1, borderRadius: 16,
    padding: 16, marginBottom: 32,
  },
  auditRow: { flexDirection: 'row', alignItems: 'flex-start' },
  auditDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, marginRight: 12 },
  auditContent: { flex: 1 },
  auditEvent: { fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  auditDetails: { fontSize: 12, marginBottom: 2 },
  auditTime: { fontSize: 11 },
  auditLine: { width: 2, height: 16, marginLeft: 4, marginVertical: 2 },
  downloadBtn: {
    padding: 16, borderRadius: 14,
    alignItems: 'center', marginBottom: 24,
  },
  downloadBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});