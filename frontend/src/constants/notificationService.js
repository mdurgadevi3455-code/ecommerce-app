import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import API from './api';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register device and get push token
export const registerForPushNotifications = async () => {
  try {
    if (!Device.isDevice) {
      console.log('Push notifications only work on physical devices');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Ask for permission if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    // Get push token
    const token = await Notifications.getExpoPushTokenAsync();

    // Android specific channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6C63FF',
      });
    }

    // Save token to backend
    try {
      await API.post('/notifications/register-token', { token: token.data });
      console.log('Push token registered ✅');
    } catch (err) {
      console.log('Token registration error:', err.message);
    }

    return token.data;
  } catch (err) {
    console.log('Push notification setup error:', err.message);
    return null;
  }
};

// Schedule a local notification
export const scheduleLocalNotification = async (title, body, seconds = 1) => {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: { type: 'timeInterval', seconds, repeats: false },
  });
};

// Send cart abandonment reminder
export const scheduleCartReminder = async (itemCount) => {
  await scheduleLocalNotification(
    '🛒 You left something behind!',
    `You have ${itemCount} item(s) in your cart. Complete your purchase now!`,
    5 // 5 seconds for testing (would be hours in production)
  );
};

// Cancel all scheduled notifications
export const cancelAllNotifications = async () => {
  await Notifications.cancelAllScheduledNotificationsAsync();
};