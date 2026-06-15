import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { registerForPushNotifications } from '../constants/notificationService';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ThemeProvider } from '../theme/ThemeContext';
import { AuthProvider, useAuth } from '../constants/AuthContext';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const notificationListener = useRef(null);
  const responseListener = useRef(null);

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      router.replace('/login');
    } else if (user && inAuthGroup) {
      router.replace('/home');
    }

    // Register push notifications when user logs in
    if (user) {
      registerForPushNotifications();

      // Listen for notifications when app is open
      notificationListener.current = Notifications.addNotificationReceivedListener(
        (notification) => {
          console.log('Notification received:', notification);
        }
      );

      // Handle notification tap
      responseListener.current = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          console.log('Notification tapped:', response);
          router.push('/notifications');
        }
      );
    }

    return () => {
      try {
        if (notificationListener.current) {
          notificationListener.current.remove();
        }
        if (responseListener.current) {
          responseListener.current.remove();
        }
      } catch (err) {
        console.log('Notification cleanup error:', err);
      }
    };
  }, [user, loading]);

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}