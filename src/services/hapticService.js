import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Universal Haptic Service
 * Provides tactile feedback for mobile physical interactions.
 * Safe fallback for Web environments.
 */
export const triggerHaptic = {
  // Light tap for bottom navigation tabs and icons
  light: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {}
  },

  // Medium solid tap for motor switch ON/OFF
  medium: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (e) {}
  },

  // Heavy mechanical click for critical actions
  heavy: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (e) {}
  },

  // Soft warning buzz for cooldown active or child lock restricted
  warning: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch (e) {}
  },

  // Success double tap for completing tasks
  success: async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {}
  },
};
