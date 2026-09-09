import { Platform, Alert } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Detect if running inside Expo Go client on Android
const isExpoGo =
  Constants?.appOwnership === 'expo' ||
  Constants?.executionEnvironment === ExecutionEnvironment?.StoreClient;

let Notifications = null;

// Only load native expo-notifications when NOT running in Expo Go client on Android
// (Expo SDK 53+ removed push/remote notification functionality from Expo Go)
if (!isExpoGo && Platform.OS !== 'web') {
  try {
    Notifications = require('expo-notifications');

    // Configure notification behavior for device notifications
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Setup Android Notification Channel for High-Priority Lock Screen Alerts
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('water-tank-alerts', {
        name: 'Water Tank Alerts',
        description: 'Critical and low water level alerts for your tank',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 300, 200, 300],
        lightColor: '#0284c7',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        bypassDnd: false,
        sound: 'default',
        enableVibrate: true,
      });
    }
  } catch (e) {
    console.warn('[Notification] Native notifications initialization fallback:', e.message);
  }
}

let lastNotificationTime = {
  critical: 0,
  low: 0,
  full: 0,
};

// Cooldown between repeated system notifications (3 minutes)
const NOTIFICATION_COOLDOWN_MS = 3 * 60 * 1000;

export const requestNotificationPermissions = async () => {
  // If running in Expo Go or Web, gracefully succeed without triggering the SDK 53 error
  if (isExpoGo || Platform.OS === 'web') {
    return true;
  }

  if (!Notifications) {
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }
    return finalStatus === 'granted';
  } catch (err) {
    return false;
  }
};

// Sends real device/system notification (Lock screen, shade, sound)
export const triggerSystemNotification = async ({ title, body }) => {
  // 1. Web Browser System Notification
  if (Platform.OS === 'web') {
    try {
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(title, { body, icon: '/favicon.ico' });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
              new Notification(title, { body, icon: '/favicon.ico' });
            }
          });
        }
      }
    } catch (e) {}
    return;
  }

  // 2. If in Expo Go, avoid native push call to prevent SDK 53 error
  if (isExpoGo || !Notifications) {
    console.log(`[Tank Notification] ${title}: ${body}`);
    return;
  }

  // 3. Standalone Android APK & Development Build: Full Lock Screen Notification
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        channelId: 'water-tank-alerts',
        vibrate: [0, 300, 200, 300],
      },
      trigger: null, // fires immediately to device system drawer
    });
  } catch (err) {
    console.warn('[Notification] Error delivering system notification:', err);
  }
};

export const checkAndTriggerTankAlerts = ({
  percentage,
  remainingLiters,
  lowThreshold = 20,
  criticalThreshold = 10,
  highThreshold = 90,
}) => {
  const now = Date.now();

  // 1. Critical Low Alert (<= criticalThreshold)
  if (percentage <= criticalThreshold) {
    if (now - lastNotificationTime.critical > NOTIFICATION_COOLDOWN_MS) {
      lastNotificationTime.critical = now;
      triggerSystemNotification({
        title: '🚨 Critical Water Tank Alert',
        body: `Water level is critical at ${percentage}% (${remainingLiters} L remaining). Risk of dry-run!`,
      });
    }
    return;
  }

  // 2. Low Water Warning (<= lowThreshold)
  if (percentage <= lowThreshold) {
    if (now - lastNotificationTime.low > NOTIFICATION_COOLDOWN_MS) {
      lastNotificationTime.low = now;
      triggerSystemNotification({
        title: '⚠️ Low Water Level Alert',
        body: `Water level dropped to ${percentage}% (${remainingLiters} L remaining). Start pump soon.`,
      });
    }
    return;
  }

  // 3. Tank Full Notification (>= highThreshold)
  if (percentage >= highThreshold) {
    if (now - lastNotificationTime.full > NOTIFICATION_COOLDOWN_MS) {
      lastNotificationTime.full = now;
      triggerSystemNotification({
        title: '✅ Water Tank Full',
        body: `Water level reached ${percentage}% (${remainingLiters} L). Turn off pump to avoid overflow.`,
      });
    }
    return;
  }
};
