import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Platform
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useRouter } from 'expo-router';
import API from '../constants/api';
import { scheduleCartReminder } from '../constants/notificationService';

export default function NotificationScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await API.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.log('Fetch notifications error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'order_update': return '📦';
      case 'cart_reminder': return '🛒';
      case 'promotion': return '🔥';
      default: return '🔔';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'order_update': return colors.primary;
      case 'cart_reminder': return '#FF9800';
      case 'promotion': return colors.error;
      default: return colors.subtext;
    }
  };

  const testCartReminder = async () => {
    if (Platform.OS === 'web') {
      window.alert('Push notifications work on mobile devices only. Please test on your phone using Expo Go!');
      return;
    }
    await scheduleCartReminder(3);
    Alert.alert('✅ Success', 'Cart reminder scheduled! You will see it in 5 seconds.');
  };

  const renderNotification = ({ item }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.iconBox, { backgroundColor: getTypeColor(item.type) + '20' }]}>
        <Text style={styles.icon}>{getTypeIcon(item.type)}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.body, { color: colors.subtext }]}>{item.body}</Text>
        <View style={styles.footer}>
          <View style={[styles.typeBadge, { backgroundColor: getTypeColor(item.type) + '20' }]}>
            <Text style={[styles.typeText, { color: getTypeColor(item.type) }]}>
              {item.type.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.time, { color: colors.subtext }]}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
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
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={{ color: colors.primary, fontSize: 16 }}>← Back</Text>
      </TouchableOpacity>

      <Text style={[styles.pageTitle, { color: colors.text }]}>🔔 Notifications</Text>

      {/* Test Button */}
      <TouchableOpacity
        style={[styles.testBtn, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
        onPress={testCartReminder}>
        <Text style={[styles.testBtnText, { color: colors.primary }]}>
          🧪 Test Cart Reminder Notification
        </Text>
      </TouchableOpacity>

      {notifications.length === 0 ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>🔔</Text>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            No notifications yet
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={renderNotification}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { marginTop: 40, marginBottom: 8 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  testBtn: {
    borderWidth: 1, borderRadius: 12,
    padding: 12, alignItems: 'center', marginBottom: 16,
  },
  testBtnText: { fontSize: 14, fontWeight: '600' },
  card: {
    flexDirection: 'row', borderWidth: 1,
    borderRadius: 16, padding: 14, marginBottom: 12,
  },
  iconBox: {
    width: 48, height: 48, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
    marginRight: 12,
  },
  icon: { fontSize: 22 },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  body: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  typeText: { fontSize: 10, fontWeight: '700' },
  time: { fontSize: 11 },
  emptyText: { fontSize: 16 },
});