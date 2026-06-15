import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, Platform
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useRouter } from 'expo-router';
import API from '../constants/api';

export default function CheckoutScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [cart, setCart] = useState({ active: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState('UPI');

  const paymentModes = [
    { id: 'UPI', icon: '📱', label: 'UPI' },
    { id: 'Card', icon: '💳', label: 'Card' },
    { id: 'NetBanking', icon: '🏦', label: 'Net Banking' },
    { id: 'COD', icon: '💵', label: 'Cash on Delivery' },
    { id: 'Wallet', icon: '👛', label: 'Wallet' },
  ];

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await API.get('/cart');
      setCart(res.data);
    } catch (err) {
      console.log('Fetch cart error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const placeOrder = async () => {
    if (cart.active.length === 0) {
      Alert.alert('Error', 'Your cart is empty!');
      return;
    }

    setPlacing(true);
    try {
      const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const items = cart.active.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.currentPrice,
        quantity: item.quantity,
      }));

      const res = await API.post('/transactions/create', {
        orderId,
        items,
        amount: cart.total,
        paymentMode: selectedPayment,
      });

      // Clear cart after order
      for (const item of cart.active) {
        await API.delete(`/cart/remove/${item._id}`);
      }

      if (Platform.OS === 'web') {
        const choice = window.confirm(
          `🎉 Order Placed Successfully!\n\nInvoice: ${res.data.invoiceId}\nAmount: ₹${cart.total.toLocaleString()}\nPayment: ${selectedPayment}\n\nClick OK to view receipt or Cancel to continue shopping.`
        );
        if (choice) {
          router.replace(`/transaction/${res.data._id}`);
        } else {
          router.replace('/products');
        }
      } else {
        Alert.alert(
          '🎉 Order Placed!',
          `Your order has been placed successfully!\n\nInvoice: ${res.data.invoiceId}\nAmount: ₹${cart.total.toLocaleString()}\nPayment: ${selectedPayment}`,
          [
            {
              text: '📄 View Receipt',
              onPress: () => router.replace(`/transaction/${res.data._id}`),
            },
            {
              text: '🛍️ Continue Shopping',
              onPress: () => router.replace('/products'),
            },
          ]
        );
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

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

      <Text style={[styles.title, { color: colors.text }]}>🛒 Checkout</Text>

      {/* Order Summary */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Summary</Text>
        {cart.active.map((item) => (
          <View key={item._id} style={[styles.itemRow, { borderBottomColor: colors.border }]}>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
              <Text style={[styles.itemQty, { color: colors.subtext }]}>Qty: {item.quantity}</Text>
            </View>
            <Text style={[styles.itemPrice, { color: colors.primary }]}>
              ₹{(item.currentPrice * item.quantity).toLocaleString()}
            </Text>
          </View>
        ))}

        {/* Total */}
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
          <Text style={[styles.totalValue, { color: colors.primary }]}>
            ₹{cart.total.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Payment Mode */}
      <Text style={[styles.sectionTitle2, { color: colors.text }]}>Select Payment Mode</Text>
      <View style={styles.paymentGrid}>
        {paymentModes.map((mode) => (
          <TouchableOpacity
            key={mode.id}
            style={[styles.paymentCard, {
              backgroundColor: selectedPayment === mode.id ? colors.primary : colors.card,
              borderColor: selectedPayment === mode.id ? colors.primary : colors.border,
            }]}
            onPress={() => setSelectedPayment(mode.id)}>
            <Text style={styles.paymentIcon}>{mode.icon}</Text>
            <Text style={[styles.paymentLabel, {
              color: selectedPayment === mode.id ? '#fff' : colors.text,
            }]}>
              {mode.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Place Order Button */}
      <TouchableOpacity
        style={[styles.orderBtn, { backgroundColor: colors.primary }]}
        onPress={placeOrder}
        disabled={placing}>
        {placing
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.orderBtnText}>
              Place Order • ₹{cart.total.toLocaleString()}
            </Text>
        }
      </TouchableOpacity>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { marginTop: 40, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  section: {
    borderWidth: 1, borderRadius: 16,
    padding: 16, marginBottom: 24,
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  sectionTitle2: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  itemRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  itemQty: { fontSize: 12 },
  itemPrice: { fontSize: 15, fontWeight: 'bold' },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 12,
  },
  totalLabel: { fontSize: 18, fontWeight: 'bold' },
  totalValue: { fontSize: 22, fontWeight: 'bold' },
  paymentGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: 10, marginBottom: 24,
  },
  paymentCard: {
    width: '47%', borderWidth: 1,
    borderRadius: 14, padding: 14,
    alignItems: 'center',
  },
  paymentIcon: { fontSize: 28, marginBottom: 6 },
  paymentLabel: { fontSize: 13, fontWeight: '600' },
  orderBtn: {
    padding: 18, borderRadius: 14,
    alignItems: 'center', marginBottom: 40,
  },
  orderBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});