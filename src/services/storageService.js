import AsyncStorage from '@react-native-async-storage/async-storage';

export const DEFAULT_SETTINGS = {
  // Tank Dimensions
  totalCapacity: 1000,    // Liters
  totalHeight: 200,       // cm
  tankWidth: 100,         // cm
  sensorOffset: 10,       // cm
  sensorMount: 'top',     // 'top' or 'bottom'
  sensorUnit: 'meters',   // 'meters' (matches ESP32 %.3f), 'centimeters', 'auto'
  
  // HiveMQ Cloud MQTT
  mqttHost: 'efbe2b7780d0454b828febbb5bd6a302.s1.eu.hivemq.cloud',
  mqttPort: 8884,         // WSS port
  mqttPath: '/mqtt',
  mqttUsername: 'waterlevel',
  mqttPassword: 'Yegpob%620',
  mqttTopic: 'waterlevel/distance',
  mqttTopicMotorSet: 'waterlevel/motor/set',
  mqttTopicMotorStatus: 'waterlevel/motor/status',
  mqttTopicSystem: 'waterlevel/system',
  
  // Thresholds
  lowThreshold: 20,       // %
  criticalThreshold: 10,  // %
  highThreshold: 90       // %
};

const SETTINGS_STORAGE_KEY = '@hydropulse_settings_v1';
const LOGS_STORAGE_KEY = '@hydropulse_telemetry_logs_v1';
const MAX_LOGS = 300;

export const loadSettings = async () => {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (err) {
    console.warn('[Storage] Error reading settings:', err);
  }
  return { ...DEFAULT_SETTINGS };
};

export const saveSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch (err) {
    console.error('[Storage] Error saving settings:', err);
    return false;
  }
};

export const resetSettings = async () => {
  try {
    await AsyncStorage.removeItem(SETTINGS_STORAGE_KEY);
    return { ...DEFAULT_SETTINGS };
  } catch (err) {
    console.error('[Storage] Error resetting settings:', err);
    return { ...DEFAULT_SETTINGS };
  }
};

export const loadTelemetryLogs = async () => {
  try {
    const raw = await AsyncStorage.getItem(LOGS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('[Storage] Error reading logs:', err);
  }
  return [];
};

export const appendTelemetryLog = async (logEntry) => {
  try {
    const existing = await loadTelemetryLogs();
    const updated = [logEntry, ...existing].slice(0, MAX_LOGS);
    await AsyncStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('[Storage] Error appending log:', err);
    return [];
  }
};

export const clearTelemetryLogs = async () => {
  try {
    await AsyncStorage.removeItem(LOGS_STORAGE_KEY);
    return [];
  } catch (err) {
    console.error('[Storage] Error clearing logs:', err);
    return [];
  }
};
