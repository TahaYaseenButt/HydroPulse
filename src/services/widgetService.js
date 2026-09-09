import AsyncStorage from '@react-native-async-storage/async-storage';

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
