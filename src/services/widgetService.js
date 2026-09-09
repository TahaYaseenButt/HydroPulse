import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const WIDGET_DATA_KEY = '@hydropulse_widget_data_v1';

export const saveWidgetData = async ({
  percentage = 50,
  remainingLiters = 500,
  totalCapacity = 1000,
  depthMeters = '1.00',
  depthCm = 100,
  motorState = false,
  cooldownRemaining = 0,
  flowStatus = 'stable',
}) => {
  try {
    const payload = {
      percentage: Math.round(percentage),
      remainingLiters,
      totalCapacity,
      depthMeters,
      depthCm,
      motorState,
      cooldownRemaining,
      flowStatus,
      updatedAt: new Date().toISOString(),
      updatedDisplay: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    await AsyncStorage.setItem(WIDGET_DATA_KEY, JSON.stringify(payload));

    // Request native Android widget update if on Android
    if (Platform.OS === 'android') {
      try {
        const { requestWidgetUpdate } = require('react-native-android-widget');
        const { HydroPulseNativeWidget } = require('../widgets/HydroPulseNativeWidget');
        requestWidgetUpdate({
          widgetName: 'HydroPulseWidget',
          renderWidget: () => (
            <HydroPulseNativeWidget
              percentage={payload.percentage}
              remainingLiters={payload.remainingLiters}
              depthMeters={payload.depthMeters}
              motorState={payload.motorState}
              flowStatus={payload.flowStatus}
              updatedDisplay={payload.updatedDisplay}
            />
          ),
        });
      } catch (widgetErr) {
        // Silent fallback in environments without native widget support
      }
    }

    return true;
  } catch (err) {
    console.warn('[WidgetService] Error saving widget state:', err);
    return false;
  }
};

export const loadWidgetData = async () => {
  try {
    const raw = await AsyncStorage.getItem(WIDGET_DATA_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[WidgetService] Error loading widget state:', err);
  }
  return null;
};
