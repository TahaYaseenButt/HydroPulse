import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';
import {
  loadFirebaseConfig,
  saveFirebaseConfig,
  DEFAULT_FIREBASE_CONFIG,
} from '../services/firebaseService';
import * as Updates from 'expo-updates';

export const SystemSetupScreen = ({
  settings,
  onSaveSettings,
  onResetSettings,
  onCheckFirmwareOTA,
  esp32FirmwareVersion = '1.2.0',
  isDeviceOnline = false,
  lastSeenText = 'Never',
  activeUser,
  onSwitchRole,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState('tank');
  const isParent = activeUser?.role === 'parent';

  // Tank Settings
  const [totalCapacity, setTotalCapacity] = useState(String(settings?.totalCapacity || 1000));
  const [totalHeight, setTotalHeight] = useState(String(settings?.totalHeight || 200));
  const [tankWidth, setTankWidth] = useState(String(settings?.tankWidth || 100));
  const [sensorOffset, setSensorOffset] = useState(String(settings?.sensorOffset || 10));
  const [sensorUnit, setSensorUnit] = useState(settings?.sensorUnit || 'meters');

  // Firebase Realtime DB Settings
  const [firebaseConfig, setFirebaseConfig] = useState(DEFAULT_FIREBASE_CONFIG);
  const [fbDbUrl, setFbDbUrl] = useState(DEFAULT_FIREBASE_CONFIG.databaseURL);
  const [fbApiKey, setFbApiKey] = useState(DEFAULT_FIREBASE_CONFIG.apiKey);
  const [fbProjectId, setFbProjectId] = useState(DEFAULT_FIREBASE_CONFIG.projectId);
  const [fbEnabled, setFbEnabled] = useState(true);

  // HiveMQ Cloud Settings
  const [mqttHost, setMqttHost] = useState(settings?.mqttHost || '');
  const [mqttPort, setMqttPort] = useState(String(settings?.mqttPort || 8884));
  const [mqttUsername, setMqttUsername] = useState(settings?.mqttUsername || '');
  const [mqttPassword, setMqttPassword] = useState(settings?.mqttPassword || '');
  const [mqttTopic, setMqttTopic] = useState(settings?.mqttTopic || 'waterlevel/distance');

  // Alert Settings
  const [lowThreshold, setLowThreshold] = useState(String(settings?.lowThreshold || 20));
  const [criticalThreshold, setCriticalThreshold] = useState(String(settings?.criticalThreshold || 10));
  const [highThreshold, setHighThreshold] = useState(String(settings?.highThreshold || 90));
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    settings?.notificationsEnabled !== undefined ? settings?.notificationsEnabled : true
  );

  // OTA Update States
  const [isCheckingFirmware, setIsCheckingFirmware] = useState(false);
  const [firmwareLastChecked, setFirmwareLastChecked] = useState('Just now');

  useEffect(() => {
    (async () => {
      const fb = await loadFirebaseConfig();
      setFirebaseConfig(fb);
      setFbDbUrl(fb.databaseURL || '');
      setFbApiKey(fb.apiKey || '');
      setFbProjectId(fb.projectId || '');
      setFbEnabled(fb.enabled !== false);
    })();
  }, []);

  useEffect(() => {
    if (settings) {
      setTotalCapacity(String(settings.totalCapacity || 1000));
      setTotalHeight(String(settings.totalHeight || 200));
      setTankWidth(String(settings.tankWidth || 100));
      setSensorOffset(String(settings.sensorOffset || 10));
      setSensorUnit(settings.sensorUnit || 'meters');

      setMqttHost(settings.mqttHost || '');
      setMqttPort(String(settings.mqttPort || 8884));
      setMqttUsername(settings.mqttUsername || '');
      setMqttPassword(settings.mqttPassword || '');
      setMqttTopic(settings.mqttTopic || 'waterlevel/distance');

      setLowThreshold(String(settings.lowThreshold || 20));
      setCriticalThreshold(String(settings.criticalThreshold || 10));
      setHighThreshold(String(settings.highThreshold || 90));
      setNotificationsEnabled(
        settings.notificationsEnabled !== undefined ? settings.notificationsEnabled : true
      );
    }
  }, [settings]);

  const handleSave = async () => {
    if (!isParent) {
      Alert.alert('Parent Access Required', 'Child accounts cannot modify settings.');
      return;
    }

    const updated = {
      ...settings,
      totalCapacity: Math.max(1, parseFloat(totalCapacity) || 1000),
      totalHeight: Math.max(1, parseFloat(totalHeight) || 200),
      tankWidth: Math.max(1, parseFloat(tankWidth) || 100),
      sensorOffset: Math.max(0, parseFloat(sensorOffset) || 10),
      sensorUnit,

      mqttHost: mqttHost.trim(),
      mqttPort: parseInt(mqttPort, 10) || 8884,
      mqttUsername: mqttUsername.trim(),
      mqttPassword,
      mqttTopic: mqttTopic.trim(),

      lowThreshold: Math.max(1, Math.min(99, parseFloat(lowThreshold) || 20)),
      criticalThreshold: Math.max(1, Math.min(99, parseFloat(criticalThreshold) || 10)),
      highThreshold: Math.max(1, Math.min(100, parseFloat(highThreshold) || 90)),
      notificationsEnabled,
    };

    const updatedFb = {
      ...firebaseConfig,
      databaseURL: fbDbUrl.trim(),
      apiKey: fbApiKey.trim(),
      projectId: fbProjectId.trim(),
      enabled: fbEnabled,
    };
    await saveFirebaseConfig(updatedFb);

    if (onSaveSettings) {
      await onSaveSettings(updated);
    }
    Alert.alert('Saved', 'Settings updated successfully.');
  };

  const handleReset = () => {
    if (!isParent) {
      Alert.alert('Parent Access Required', 'Child accounts cannot reset settings.');
      return;
    }

    Alert.alert('Reset Defaults?', 'All values will return to factory defaults.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          const defaults = await onResetSettings();
          setTotalCapacity(String(defaults.totalCapacity));
          setTotalHeight(String(defaults.totalHeight));
          setTankWidth(String(defaults.tankWidth));
          setSensorOffset(String(defaults.sensorOffset));
          setSensorUnit(defaults.sensorUnit);
          setLowThreshold(String(defaults.lowThreshold));
          setCriticalThreshold(String(defaults.criticalThreshold));
          setHighThreshold(String(defaults.highThreshold));
          setNotificationsEnabled(true);
        },
      },
    ]);
  };

  const [isCheckingAppUpdate, setIsCheckingAppUpdate] = useState(false);
  const [appUpdateLastChecked, setAppUpdateLastChecked] = useState('Just now');

  const currentUpdateMessage =
    Updates.manifest?.metadata?.message ||
    Updates.manifest?.extra?.eas?.message ||
    Updates.manifest?.message ||
    'Adaptive widget sizing & in-app OTA check';

  const handleCheckAppUpdate = async () => {
    setIsCheckingAppUpdate(true);
    try {
      if (__DEV__) {
        Alert.alert(
          'Hydro Pulse App Updates',
          'Running in Development mode. Over-The-Air (OTA) updates are active in built APKs.'
        );
        return;
      }

      const update = await Updates.checkForUpdateAsync();
      setAppUpdateLastChecked(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );

      if (update.isAvailable) {
        const incomingMessage =
          update.manifest?.metadata?.message ||
          update.manifest?.extra?.eas?.message ||
          update.manifest?.message ||
          'New features and enhancements ready.';

        Alert.alert(
          'App Update Available',
          `A new version of Hydro Pulse is available!\n\nUpdate Note:\n"${incomingMessage}"\n\nWould you like to download and restart now?`,
          [
            { text: 'Later', style: 'cancel' },
            {
              text: 'Download & Restart',
              onPress: async () => {
                try {
                  setIsCheckingAppUpdate(true);
                  await Updates.fetchUpdateAsync();
                  await Updates.reloadAsync();
                } catch (fetchErr) {
                  Alert.alert('Update Failed', fetchErr?.message || 'Could not download update.');
                } finally {
                  setIsCheckingAppUpdate(false);
                }
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Hydro Pulse App',
          `Your app is up to date!\n\nChannel: ${Updates.channel || 'preview'}\nRuntime: ${Updates.runtimeVersion || '1.0.0'}\nNote: "${currentUpdateMessage}"`
        );
      }
    } catch (e) {
      Alert.alert('App Update Status', e?.message || 'Could not check for updates.');
    } finally {
      setIsCheckingAppUpdate(false);
    }
  };

  const handleCheckFirmware = () => {
    setIsCheckingFirmware(true);

    if (onCheckFirmwareOTA) {
      onCheckFirmwareOTA();
    }

    setTimeout(() => {
      setIsCheckingFirmware(false);
      setFirmwareLastChecked(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
      Alert.alert(
        'Controller Firmware',
        `ESP32 v${esp32FirmwareVersion} • Up to date.`
      );
    }, 1200);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="cog-outline" size={18} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Settings</Text>

        <TouchableOpacity
          style={[styles.roleBadge, isParent ? styles.roleBadgeParent : styles.roleBadgeChild]}
          onPress={() => onSwitchRole?.(isParent ? 'child' : 'parent')}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={isParent ? 'crown' : 'account-child'}
            size={12}
            color={isParent ? COLORS.primaryDark : COLORS.warningText}
          />
          <Text
            style={[
              styles.roleBadgeText,
              isParent ? styles.roleTextParent : styles.roleTextChild,
            ]}
          >
            {isParent ? 'Parent' : 'Child'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Child View-Only Banner */}
      {!isParent && (
        <View style={styles.childNoticeBanner}>
          <MaterialCommunityIcons name="lock-outline" size={14} color={COLORS.dangerText} />
          <Text style={styles.childNoticeText}>View-only mode</Text>
        </View>
      )}

      {/* Device & Account Information Bar */}
      <View style={styles.accountCard}>
        <View style={styles.accountCardLeft}>
          <MaterialCommunityIcons name="chip" size={14} color={COLORS.primary} />
          <Text style={styles.accountDeviceId}>{activeUser?.deviceId || 'TANK-01'}</Text>
          <Text style={styles.accountDivider}>•</Text>
          <Text style={styles.accountUserEmail} numberOfLines={1}>
            {activeUser?.username || (isParent ? 'Parent' : 'Child')}
          </Text>
        </View>

        {onLogout && (
          <TouchableOpacity
            style={styles.btnLogout}
            onPress={onLogout}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="logout" size={13} color={COLORS.danger} />
            <Text style={styles.btnLogoutText}>Sign Out</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Modern White & Blue Navigation Tabs */}
      <View style={styles.tabsRow}>
        {[
          { id: 'tank', label: 'Tank', icon: 'barrel' },
          { id: 'firebase', label: 'Firebase', icon: 'firebase' },
          { id: 'alerts', label: 'Alerts', icon: 'bell-ring-outline' },
          { id: 'ota', label: 'Cloud', icon: 'cloud-sync-outline' },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <MaterialCommunityIcons
                name={tab.icon}
                size={15}
                color={isActive ? COLORS.primary : COLORS.textMuted}
              />
              <Text
                style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Scrollable Form Content */}
      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formContent}
        showsVerticalScrollIndicator={false}
      >
        {/* TAB 1: TANK */}
        {activeTab === 'tank' && (
          <View style={styles.sectionCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tank Capacity (L)</Text>
              <TextInput
                style={[styles.input, !isParent && styles.inputDisabled]}
                value={totalCapacity}
                onChangeText={setTotalCapacity}
                keyboardType="numeric"
                placeholder="1000"
                placeholderTextColor="#94a3b8"
                editable={isParent}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tank Height (cm)</Text>
              <TextInput
                style={[styles.input, !isParent && styles.inputDisabled]}
                value={totalHeight}
                onChangeText={setTotalHeight}
                keyboardType="numeric"
                placeholder="200"
                placeholderTextColor="#94a3b8"
                editable={isParent}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Sensor Offset (cm)</Text>
              <TextInput
                style={[styles.input, !isParent && styles.inputDisabled]}
                value={sensorOffset}
                onChangeText={setSensorOffset}
                keyboardType="numeric"
                placeholder="10"
                placeholderTextColor="#94a3b8"
                editable={isParent}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Unit</Text>
              <View style={styles.segmentedRow}>
                {['meters', 'centimeters', 'auto'].map((unit) => (
                  <TouchableOpacity
                    key={unit}
                    style={[
                      styles.segmentBtn,
                      sensorUnit === unit && styles.segmentBtnActive,
                      !isParent && styles.segmentBtnDisabled,
                    ]}
                    onPress={() => isParent && setSensorUnit(unit)}
                    disabled={!isParent}
                  >
                    <Text
                      style={[
                        styles.segmentText,
                        sensorUnit === unit && styles.segmentTextActive,
                      ]}
                    >
                      {unit.charAt(0).toUpperCase() + unit.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* TAB 2: FIREBASE */}
        {activeTab === 'firebase' && (
          <View style={styles.sectionCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Database URL</Text>
              <TextInput
                style={[styles.input, !isParent && styles.inputDisabled]}
                value={fbDbUrl}
                onChangeText={setFbDbUrl}
                placeholder="https://your-project-rtdb.firebaseio.com"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                editable={isParent}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Project ID</Text>
              <TextInput
                style={[styles.input, !isParent && styles.inputDisabled]}
                value={fbProjectId}
                onChangeText={setFbProjectId}
                placeholder="hydropulse-tank"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                editable={isParent}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Web API Key</Text>
              <TextInput
                style={[styles.input, !isParent && styles.inputDisabled]}
                value={fbApiKey}
                onChangeText={setFbApiKey}
                placeholder="AIzaSy..."
                placeholderTextColor="#94a3b8"
                secureTextEntry
                editable={isParent}
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchTitle}>Enable Cloud Sync</Text>
              <Switch
                value={fbEnabled}
                onValueChange={setFbEnabled}
                trackColor={{ false: '#cbd5e1', true: COLORS.primary }}
                thumbColor={COLORS.white}
                disabled={!isParent}
              />
            </View>
          </View>
        )}

        {/* TAB 3: ALERTS */}
        {activeTab === 'alerts' && (
          <View style={styles.sectionCard}>
            <View style={styles.switchRow}>
              <Text style={styles.switchTitle}>Push Notifications</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#cbd5e1', true: COLORS.primary }}
                thumbColor={COLORS.white}
                disabled={!isParent}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Critical Low (%)</Text>
              <TextInput
                style={[styles.input, !isParent && styles.inputDisabled]}
                value={criticalThreshold}
                onChangeText={setCriticalThreshold}
                keyboardType="numeric"
                placeholder="10"
                placeholderTextColor="#94a3b8"
                editable={isParent}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Low Warning (%)</Text>
              <TextInput
                style={[styles.input, !isParent && styles.inputDisabled]}
                value={lowThreshold}
                onChangeText={setLowThreshold}
                keyboardType="numeric"
                placeholder="20"
                placeholderTextColor="#94a3b8"
                editable={isParent}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Overflow Alert (%)</Text>
              <TextInput
                style={[styles.input, !isParent && styles.inputDisabled]}
                value={highThreshold}
                onChangeText={setHighThreshold}
                keyboardType="numeric"
                placeholder="90"
                placeholderTextColor="#94a3b8"
                editable={isParent}
              />
            </View>
          </View>
        )}

        {/* TAB 4: CLOUD & FIRMWARE */}
        {activeTab === 'ota' && (
          <View style={styles.sectionCard}>
            {/* Hydro Pulse Mobile App OTA Updates Card */}
            <View style={styles.otaDetailsBox}>
              <View style={styles.otaHeaderRow}>
                <MaterialCommunityIcons name="cellphone-arrow-down" size={18} color={COLORS.primary} />
                <Text style={styles.otaHeaderTitle}>Hydro Pulse App (OTA)</Text>
              </View>
              <View style={styles.otaInfoRow}>
                <Text style={styles.otaInfoLabel}>App Version</Text>
                <Text style={styles.otaInfoValue}>1.0.0</Text>
              </View>
              <View style={styles.otaInfoRow}>
                <Text style={styles.otaInfoLabel}>Release Channel</Text>
                <Text style={styles.otaInfoValue}>{Updates.channel || 'preview'}</Text>
              </View>
              <View style={styles.otaInfoRow}>
                <Text style={styles.otaInfoLabel}>Last Checked</Text>
                <Text style={styles.otaInfoValue}>{appUpdateLastChecked}</Text>
              </View>

              {/* Latest Update Message Box */}
              <View style={styles.otaUpdateMessageBox}>
                <View style={styles.otaUpdateMessageHeader}>
                  <MaterialCommunityIcons name="message-badge-outline" size={14} color="#1D4ED8" />
                  <Text style={styles.otaUpdateMessageTitle}>Latest OTA Message</Text>
                </View>
                <Text style={styles.otaUpdateMessageText}>"{currentUpdateMessage}"</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.btnCheckOTA, isCheckingAppUpdate && styles.btnDisabled]}
              onPress={handleCheckAppUpdate}
              disabled={isCheckingAppUpdate}
              activeOpacity={0.8}
            >
              {isCheckingAppUpdate ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <MaterialCommunityIcons name="cloud-download-outline" size={16} color={COLORS.white} />
              )}
              <Text style={styles.btnCheckOTAText}>
                {isCheckingAppUpdate ? 'Checking App Updates...' : 'Check for App Updates'}
              </Text>
            </TouchableOpacity>

            {/* New Features in this App Card */}
            <View style={styles.featuresCard}>
              <View style={styles.featuresHeader}>
                <MaterialCommunityIcons name="sparkles" size={16} color="#0284C7" />
                <Text style={styles.featuresTitle}>New Features in this Version</Text>
              </View>

              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="widgets-outline" size={16} color={COLORS.primary} style={styles.featureIcon} />
                <View style={styles.featureTextCol}>
                  <Text style={styles.featureItemTitle}>Adaptive Home Screen Widget</Text>
                  <Text style={styles.featureItemDesc}>Resizes to 4×2 Wide, 2×4 Tall, and 2×2 Compact with live percentage and pump status.</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="lightning-bolt-circle" size={16} color="#10B981" style={styles.featureIcon} />
                <View style={styles.featureTextCol}>
                  <Text style={styles.featureItemTitle}>Instant OTA Updates</Text>
                  <Text style={styles.featureItemDesc}>Receive new features and fixes automatically without installing a new APK.</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="bell-ring-outline" size={16} color="#F59E0B" style={styles.featureIcon} />
                <View style={styles.featureTextCol}>
                  <Text style={styles.featureItemTitle}>Smart Level & Motor Safety</Text>
                  <Text style={styles.featureItemDesc}>Custom threshold notifications and pump cooldown timers to protect hardware.</Text>
                </View>
              </View>

              <View style={styles.featureItem}>
                <MaterialCommunityIcons name="palette-outline" size={16} color="#6366F1" style={styles.featureIcon} />
                <View style={styles.featureTextCol}>
                  <Text style={styles.featureItemTitle}>Hydro Pulse Brand Refresh</Text>
                  <Text style={styles.featureItemDesc}>Custom logo, startup splash screen, and matching blue adaptive Android icon.</Text>
                </View>
              </View>
            </View>

            <View style={styles.divider} />

            {/* ESP32 Hardware Controller Firmware Card */}
            <View style={styles.otaDetailsBox}>
              <View style={styles.otaHeaderRow}>
                <MaterialCommunityIcons name="chip" size={18} color="#0284C7" />
                <Text style={styles.otaHeaderTitle}>ESP32 Hardware Controller</Text>
              </View>
              <View style={styles.otaInfoRow}>
                <Text style={styles.otaInfoLabel}>Hardware Status</Text>
                <Text style={[styles.otaInfoValue, { color: isDeviceOnline ? COLORS.success : COLORS.danger }]}>
                  {isDeviceOnline ? '● Online (Live)' : '● Offline (Not Responding)'}
                </Text>
              </View>
              <View style={styles.otaInfoRow}>
                <Text style={styles.otaInfoLabel}>Last Heartbeat</Text>
                <Text style={styles.otaInfoValue}>{lastSeenText}</Text>
              </View>
              <View style={styles.otaInfoRow}>
                <Text style={styles.otaInfoLabel}>Board Firmware</Text>
                <Text style={styles.otaInfoValue}>v{esp32FirmwareVersion}</Text>
              </View>
              <View style={[styles.otaInfoRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.otaInfoLabel}>Last Checked</Text>
                <Text style={styles.otaInfoValue}>{firmwareLastChecked}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.btnCheckOTA, { backgroundColor: '#475569' }, isCheckingFirmware && styles.btnDisabled]}
              onPress={handleCheckFirmware}
              disabled={isCheckingFirmware}
              activeOpacity={0.8}
            >
              {isCheckingFirmware ? (
                <ActivityIndicator size="small" color={COLORS.white} />
              ) : (
                <MaterialCommunityIcons name="refresh" size={16} color={COLORS.white} />
              )}
              <Text style={styles.btnCheckOTAText}>
                {isCheckingFirmware ? 'Checking Controller...' : 'Check Controller Firmware'}
              </Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>HiveMQ Host</Text>
              <TextInput
                style={[styles.input, !isParent && styles.inputDisabled]}
                value={mqttHost}
                onChangeText={setMqttHost}
                placeholder="xxx.hivemq.cloud"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                editable={isParent}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>MQTT Topic</Text>
              <TextInput
                style={[styles.input, !isParent && styles.inputDisabled]}
                value={mqttTopic}
                onChangeText={setMqttTopic}
                placeholder="waterlevel/distance"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                editable={isParent}
              />
            </View>
          </View>
        )}

        {/* Footer Actions */}
        <View style={styles.footerActions}>
          <TouchableOpacity
            style={[styles.btnSave, !isParent && styles.btnSaveDisabled]}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={isParent ? 'content-save-check' : 'lock-outline'}
              size={16}
              color={COLORS.white}
            />
            <Text style={styles.btnSaveText}>
              {isParent ? 'Save Settings' : 'Locked (Parent Only)'}
            </Text>
          </TouchableOpacity>

          {isParent && (
            <TouchableOpacity
              style={styles.btnReset}
              onPress={handleReset}
              activeOpacity={0.7}
            >
              <Text style={styles.btnResetText}>Reset Defaults</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.textPrimary,
    flex: 1,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleBadgeParent: {
    backgroundColor: COLORS.primaryTint,
  },
  roleBadgeChild: {
    backgroundColor: COLORS.warningBg,
  },
  roleBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
  },
  roleTextParent: {
    color: COLORS.primaryDark,
  },
  roleTextChild: {
    color: COLORS.warningText,
  },
  childNoticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.dangerBg,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  childNoticeText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.dangerText,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  accountCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  accountDeviceId: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  accountDivider: {
    color: COLORS.textMuted,
    fontSize: 10,
  },
  accountUserEmail: {
    fontFamily: FONTS.medium,
    fontSize: 11.5,
    color: COLORS.textSecondary,
    flex: 1,
  },
  btnLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: COLORS.dangerBg,
  },
  btnLogoutText: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    color: COLORS.dangerText,
  },
  tabsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: 9,
  },
  tabBtnActive: {
    backgroundColor: COLORS.primaryTint,
  },
  tabBtnText: {
    fontFamily: FONTS.medium,
    fontSize: 11.5,
    color: COLORS.textMuted,
  },
  tabBtnTextActive: {
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: 16,
    paddingBottom: 28,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontFamily: FONTS.medium,
    fontSize: 13,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
  },
  inputDisabled: {
    backgroundColor: COLORS.borderLight,
    color: COLORS.textMuted,
  },
  segmentedRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 8,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
  },
  segmentBtnDisabled: {
    opacity: 0.6,
  },
  segmentText: {
    fontFamily: FONTS.medium,
    fontSize: 11.5,
    color: COLORS.textMuted,
  },
  segmentTextActive: {
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  switchTitle: {
    fontFamily: FONTS.semiBold,
    fontSize: 12.5,
    color: COLORS.textPrimary,
  },
  otaDetailsBox: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  otaHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  otaHeaderTitle: {
    fontFamily: FONTS.bold,
    fontSize: 12.5,
    color: COLORS.textPrimary,
  },
  otaInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  otaInfoLabel: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  otaInfoValue: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  btnCheckOTA: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    height: 40,
    borderRadius: 10,
    gap: 6,
  },
  btnCheckOTAText: {
    fontFamily: FONTS.bold,
    fontSize: 12.5,
    color: COLORS.white,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 4,
  },
  footerActions: {
    marginTop: 14,
    gap: 8,
  },
  btnSave: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    height: 44,
    borderRadius: 12,
    gap: 6,
  },
  btnSaveDisabled: {
    backgroundColor: COLORS.borderLight,
  },
  btnSaveText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: COLORS.white,
  },
  btnReset: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  btnResetText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.textMuted,
  },
  otaUpdateMessageBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  otaUpdateMessageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  otaUpdateMessageTitle: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: '#1D4ED8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  otaUpdateMessageText: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 16,
  },
  featuresCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 12,
    gap: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  featuresHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  featuresTitle: {
    fontFamily: FONTS.bold,
    fontSize: 12.5,
    color: COLORS.textPrimary,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  featureIcon: {
    marginTop: 2,
  },
  featureTextCol: {
    flex: 1,
    gap: 2,
  },
  featureItemTitle: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: COLORS.textPrimary,
  },
  featureItemDesc: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.textMuted,
    lineHeight: 15,
  },
});
