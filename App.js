import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';

// Services
import { HydroMobileMQTTClient } from './src/services/mqttService';
import {
  loadSettings,
  saveSettings,
  resetSettings,
  loadTelemetryLogs,
  appendTelemetryLog,
  clearTelemetryLogs,
  DEFAULT_SETTINGS,
} from './src/services/storageService';
import {
  requestNotificationPermissions,
  checkAndTriggerTankAlerts,
} from './src/services/notificationService';
import { saveWidgetData } from './src/services/widgetService';
import {
  initFirebase,
  loadActiveUser,
  switchUserRole,
  syncTelemetryToFirebase,
  pushMotorCommandToFirebase,
  subscribeToFirebaseTank,
  logoutActiveUser,
  PRESET_ACCOUNTS,
} from './src/services/firebaseService';

// Theme & Modals
import { COLORS, FONTS } from './src/constants/theme';
import { RoleSwitchModal } from './src/components/RoleSwitchModal';
import { AuthScreen } from './src/screens/AuthScreen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';

// Components & Screens
import { BottomNavBar } from './src/components/BottomNavBar';
import { ReservoirScreen } from './src/screens/ReservoirScreen';
import { AnalyticsScreen } from './src/screens/AnalyticsScreen';
import { PumpPowerScreen } from './src/screens/PumpPowerScreen';
import { SystemSetupScreen } from './src/screens/SystemSetupScreen';
import { CooldownModal } from './src/components/CooldownModal';
import { triggerHaptic } from './src/services/hapticService';

export default function App() {
  // Load Inter clean, modern mobile typography
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  // Navigation State
  const [activeTab, setActiveTab] = useState('reservoir'); // 'reservoir', 'analytics', 'pump', 'setup'

  // App Settings
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [isSettingsReady, setIsSettingsReady] = useState(false);

  // Authentication & Role Management (Parent vs Child RBAC)
  const [activeUser, setActiveUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isRoleModalVisible, setIsRoleModalVisible] = useState(false);

  // Connection & Telemetry State
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatusText, setConnectionStatusText] = useState('Connecting...');

  // ESP32 Hardware Heartbeat & Online Watchdog
  const [isDeviceOnline, setIsDeviceOnline] = useState(false);
  const [lastEsp32MessageTime, setLastEsp32MessageTime] = useState(null);
  const lastEsp32MessageTimeRef = useRef(null);

  const markEsp32Active = () => {
    const now = Date.now();
    lastEsp32MessageTimeRef.current = now;
    setLastEsp32MessageTime(now);
    setIsDeviceOnline(true);
  };

  // Watchdog: checks every 2s if ESP32 missed its 2s telemetry cycle
  useEffect(() => {
    const watchdog = setInterval(() => {
      if (isSimulating) {
        setIsDeviceOnline(true);
        return;
      }
      const lastMsg = lastEsp32MessageTimeRef.current;
      if (!lastMsg) {
        setIsDeviceOnline((prev) => {
          if (prev) saveWidgetData({ flowStatus: 'offline' });
          return false;
        });
      } else if (Date.now() - lastMsg > 15000) {
        setIsDeviceOnline((prev) => {
          if (prev) saveWidgetData({ flowStatus: 'offline' });
          return false;
        });
      } else {
        setIsDeviceOnline(true);
      }
    }, 2000);

    return () => clearInterval(watchdog);
  }, [isSimulating]);

  const getEsp32LastSeenText = () => {
    if (isSimulating) return 'Simulation Mode';
    if (!lastEsp32MessageTime) return 'Never';
    const elapsedSec = Math.floor((Date.now() - lastEsp32MessageTime) / 1000);
    if (elapsedSec < 4) return 'Just now';
    if (elapsedSec < 60) return `${elapsedSec}s ago`;
    const mins = Math.floor(elapsedSec / 60);
    return `${mins}m ago`;
  };

  // Live Tank Telemetry
  const [distanceCm, setDistanceCm] = useState(100);
  const [waterDepthMeters, setWaterDepthMeters] = useState('1.00');
  const [waterDepthCm, setWaterDepthCm] = useState(100);
  const [remainingLiters, setRemainingLiters] = useState(500);
  const [percentage, setPercentage] = useState(50);
  const [flowStatus, setFlowStatus] = useState('stable'); // 'stable', 'dropping', 'filling'
  const [timeEstimate, setTimeEstimate] = useState('Stable');

  // Motor State & Anti-Burnout Cooldown
  const [motorState, setMotorState] = useState(false);
  const motorStateRef = useRef(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const cooldownEndRef = useRef(0);
  const [isCooldownModalVisible, setIsCooldownModalVisible] = useState(false);
  const [isMotorLoading, setIsMotorLoading] = useState(false);

  const updateMotorState = (val) => {
    motorStateRef.current = val;
    setMotorState(val);
  };

  // Dedicated real-time ticking 20s anti-burnout cooldown timer
  useEffect(() => {
    if (cooldownRemaining <= 0) return;

    const interval = setInterval(() => {
      const remainingMs = cooldownEndRef.current - Date.now();
      const secs = Math.max(0, Math.ceil(remainingMs / 1000));
      setCooldownRemaining(secs);
      if (secs <= 0) {
        clearInterval(interval);
        saveWidgetData({ motorState: motorStateRef.current, cooldownRemaining: 0 });
      }
    }, 250);

    return () => clearInterval(interval);
  }, [cooldownRemaining > 0, motorState]);

  // ESP32 Firmware OTA State
  const [esp32FirmwareVersion, setEsp32FirmwareVersion] = useState('1.2.0');

  // Simulation Mode
  const [isSimulating, setIsSimulating] = useState(false);
  const simIntervalRef = useRef(null);
  const simDirectionRef = useRef('drain'); // 'drain' or 'fill'

  // Persistent Logs
  const [telemetryLogs, setTelemetryLogs] = useState([]);

  // Reading history for rate calculations
  const readingHistoryRef = useRef([]);

  // MQTT Client Reference
  const mqttClientRef = useRef(null);

  // 1. Initialize Settings, Firebase & Permissions
  useEffect(() => {
    (async () => {
      const stored = await loadSettings();
      const logs = await loadTelemetryLogs();
      setSettings(stored);
      setTelemetryLogs(logs);
      setIsSettingsReady(true);
      await requestNotificationPermissions();

      // Firebase & Role-Based Access Control Setup
      await initFirebase();
      const user = await loadActiveUser();
      // If user is already authenticated with a registered Device ID, retain session
      if (user && user.deviceId) {
        setActiveUser(user);
      } else {
        // Clear any old mock session so user sees the Login / Register screen
        await logoutActiveUser();
        setActiveUser(null);
      }
      setIsAuthChecking(false);

      // Listen to remote changes on Firebase Realtime Database
      // The animation start/stop and motor button are confirmed from server data
      subscribeToFirebaseTank((remoteData) => {
        if (remoteData && remoteData.motorState !== undefined) {
          const remoteState = !!remoteData.motorState;
          if (motorStateRef.current !== remoteState) {
            motorStateRef.current = remoteState;
            setMotorState(remoteState);
            if (remoteState) {
              readingHistoryRef.current = [];
              setFlowStatus('filling');
            } else {
              readingHistoryRef.current = [];
              setFlowStatus('stable');
            }
            saveWidgetData({ motorState: remoteState, cooldownRemaining: cooldownEndRef.current > Date.now() ? Math.ceil((cooldownEndRef.current - Date.now()) / 1000) : 0 });
          }
        }
      });
    })();
  }, []);

  // 2. Connect MQTT when settings are ready
  useEffect(() => {
    if (!isSettingsReady) return;

    initMqtt(settings);

    return () => {
      if (mqttClientRef.current) {
        mqttClientRef.current.disconnect(true);
      }
      clearInterval(simIntervalRef.current);
    };
  }, [isSettingsReady, settings]);

  const initMqtt = (activeSettings) => {
    if (mqttClientRef.current) {
      mqttClientRef.current.disconnect(true);
    }

    setConnectionStatusText('Connecting...');

    const client = new HydroMobileMQTTClient({
      host: activeSettings.mqttHost,
      port: activeSettings.mqttPort,
      path: activeSettings.mqttPath,
      username: activeSettings.mqttUsername,
      password: activeSettings.mqttPassword,
      onConnect: () => {
        setIsConnected(true);
        setConnectionStatusText('Live Connected');
        client.subscribe(activeSettings.mqttTopic, 0);
        client.subscribe(activeSettings.mqttTopicMotorStatus, 0);
        client.subscribe(activeSettings.mqttTopicSystem, 0);
        client.subscribe('waterlevel/ota/status', 0);
      },
      onMessage: (topic, payload) => {
        markEsp32Active();
        if (topic === activeSettings.mqttTopicMotorStatus) {
          handleMotorStatusMessage(payload);
        } else if (topic === 'waterlevel/ota/status') {
          try {
            const data = JSON.parse(payload);
            if (data.version) {
              setEsp32FirmwareVersion(data.version);
            }
          } catch (e) {}
        } else if (topic === activeSettings.mqttTopicSystem) {
          try {
            const data = JSON.parse(payload);
            if (data.version) {
              setEsp32FirmwareVersion(data.version);
            }
          } catch (e) {}
        } else if (topic === activeSettings.mqttTopic || topic === 'waterlevel/distance') {
          handleDistancePayload(payload, 'ESP32');
        } else {
          console.log(`[MQTT] Handled message on ${topic}`);
        }
      },
      onError: () => {
        setIsConnected(false);
        setConnectionStatusText('Connection Error');
      },
      onClose: () => {
        setIsConnected(false);
        setConnectionStatusText('Reconnecting...');
      },
    });

    mqttClientRef.current = client;
    client.connect();
  };

  // 3. Process Distance & Tank Math
  const handleDistancePayload = (payloadStr, source = 'ESP32') => {
    let rawVal = NaN;
    try {
      const trimmed = payloadStr.trim();
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        const parsed = JSON.parse(trimmed);
        rawVal = Number(parsed.distance ?? parsed.value ?? parsed.cm ?? parsed.m);
      } else {
        rawVal = parseFloat(trimmed);
      }
    } catch (e) {
      rawVal = parseFloat(payloadStr);
    }

    if (isNaN(rawVal) || !isFinite(rawVal)) return;

    // Convert raw reading to cm based on configured unit
    let calcDistanceCm = rawVal;
    const unit = settings.sensorUnit || 'meters';

    if (unit === 'meters') {
      calcDistanceCm = rawVal * 100.0;
    } else if (unit === 'auto') {
      if (rawVal < 15.0) {
        calcDistanceCm = rawVal * 100.0;
      } else {
        calcDistanceCm = rawVal;
      }
    }

    applyDistanceMeasurement(calcDistanceCm, source);
  };

  const applyDistanceMeasurement = (calcDistanceCm, source = 'ESP32') => {
    const clampedDistance = Math.max(0, calcDistanceCm);
    const totalH = settings.totalHeight || 200;
    const offset = settings.sensorOffset || 10;

    let calcWaterHeight = 0;
    if (settings.sensorMount === 'top') {
      const effectiveEmpty = Math.max(0, clampedDistance - offset);
      calcWaterHeight = Math.max(0, Math.min(totalH, totalH - effectiveEmpty));
    } else {
      calcWaterHeight = Math.max(0, Math.min(totalH, clampedDistance));
    }

    const calcPercentage = Math.max(0, Math.min(100, (calcWaterHeight / totalH) * 100));
    const calcLiters = Math.round((calcPercentage / 100) * (settings.totalCapacity || 1000));
    const roundedPercent = Math.round(calcPercentage);

    // Flow Rate calculation
    const now = new Date();
    const history = readingHistoryRef.current;
    history.push({ time: now, height: calcWaterHeight });
    if (history.length > 20) history.shift();

    let rateStatus = 'stable';
    let estTime = 'Stable';

    if (history.length >= 3) {
      const first = history[0];
      const last = history[history.length - 1];
      const timeDiffMinutes = (last.time - first.time) / (1000 * 60);

      if (timeDiffMinutes > 0.05) {
        const heightDiff = last.height - first.height;
        const rateCmMin = heightDiff / timeDiffMinutes;

        if (rateCmMin < -0.3) {
          rateStatus = 'dropping';
          const mins = Math.abs(last.height / rateCmMin);
          estTime = mins < 60 ? `~${Math.round(mins)} min` : `~${(mins / 60).toFixed(1)} hrs`;
        } else if (rateCmMin > 0.3) {
          rateStatus = 'filling';
          const remaining = totalH - last.height;
          const mins = remaining / rateCmMin;
          estTime = mins < 60 ? `~${Math.round(mins)} min` : `~${(mins / 60).toFixed(1)} hrs`;
        }
      }
    }

    // Update UI state
    setDistanceCm(Math.round(clampedDistance));
    setWaterDepthCm(Math.round(calcWaterHeight));
    setWaterDepthMeters((calcWaterHeight / 100.0).toFixed(2));
    setRemainingLiters(calcLiters);
    setPercentage(roundedPercent);
    setFlowStatus(rateStatus);
    setTimeEstimate(estTime);

    // Real System/Device Notifications (Lock screen & notification drawer)
    if (settings.notificationsEnabled !== false) {
      checkAndTriggerTankAlerts({
        percentage: roundedPercent,
        remainingLiters: calcLiters,
        lowThreshold: settings.lowThreshold || 20,
        criticalThreshold: settings.criticalThreshold || 10,
        highThreshold: settings.highThreshold || 90,
      });
    }

    // Save to Persistent Widget Storage (Small, Medium, Large Widgets)
    saveWidgetData({
      percentage: roundedPercent,
      remainingLiters: calcLiters,
      totalCapacity: settings.totalCapacity || 1000,
      depthMeters: (calcWaterHeight / 100.0).toFixed(2),
      depthCm: Math.round(calcWaterHeight),
      motorState: motorStateRef.current,
      cooldownRemaining,
      flowStatus: rateStatus,
    });

    // Sync Live Telemetry to Firebase Realtime Database
    syncTelemetryToFirebase(
      {
        percentage: roundedPercent,
        remainingLiters: calcLiters,
        depthMeters: (calcWaterHeight / 100.0).toFixed(2),
        depthCm: Math.round(calcWaterHeight),
        motorState: motorStateRef.current,
        flowStatus: rateStatus,
      },
      activeUser
    );

    // Save to persistent logs
    const logItem = {
      time: now.toISOString(),
      displayTime: now.toLocaleTimeString([], { hour12: false }),
      distanceM: (clampedDistance / 100.0).toFixed(2),
      distanceCm: Math.round(clampedDistance),
      depthCm: Math.round(calcWaterHeight),
      volumeL: calcLiters,
      percentage: roundedPercent,
      source,
    };

    appendTelemetryLog(logItem).then((updated) => setTelemetryLogs(updated));
  };

  // 4. Motor State & Anti-Burnout Cooldown Handling (20s safety cooldown)
  const handleMotorStatusMessage = (statusStr) => {
    const isNowOn = statusStr === 'ON';
    if (motorStateRef.current !== isNowOn) {
      updateMotorState(isNowOn);
      if (isNowOn) {
        readingHistoryRef.current = [];
        setFlowStatus('filling');
      } else {
        readingHistoryRef.current = [];
        setFlowStatus('stable');
      }
      startCooldown(20);
      saveWidgetData({ motorState: isNowOn, cooldownRemaining: 20 });
    }
  };

  const startCooldown = (seconds = 20) => {
    cooldownEndRef.current = Date.now() + seconds * 1000;
    setCooldownRemaining(seconds);
    saveWidgetData({ motorState: motorStateRef.current, cooldownRemaining: seconds });
  };

  // 5. Protected Motor Controls (Parent Role Authorized Only!)
  // Animation and motor activation strictly depend on server save confirmation
  const handleStartMotor = async () => {
    if (isMotorLoading) return;

    if (cooldownRemaining > 0) {
      triggerHaptic.warning();
      setIsCooldownModalVisible(true);
      return;
    }

    if (activeUser?.role !== 'parent') {
      triggerHaptic.warning();
      Alert.alert(
        'Parent Access Required',
        'Child account cannot turn on the motor. Please switch to a Parent account.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Switch Account', onPress: () => setIsRoleModalVisible(true) },
        ]
      );
      return;
    }

    triggerHaptic.medium();
    setIsMotorLoading(true);

    // 1. Dispatch command to hardware controller via MQTT
    if (mqttClientRef.current) {
      mqttClientRef.current.publish(settings.mqttTopicMotorSet, 'ON');
      mqttClientRef.current.publish(settings.mqttTopicMotorStatus, 'ON', true);
    }

    // 2. Persist motor state + user id in Cloud Database
    const res = await pushMotorCommandToFirebase('ON', activeUser);
    setIsMotorLoading(false);

    if (res && res.success) {
      // 3. Trigger state and water animation ONLY upon confirmed server save!
      updateMotorState(true);
      startCooldown(20);
      readingHistoryRef.current = [];
      setFlowStatus('filling');
      saveWidgetData({ motorState: true, cooldownRemaining: 20 });
    } else if (res && res.blocked) {
      triggerHaptic.warning();
      Alert.alert('Access Denied', res.error || 'Only Parent can turn on the motor.');
    } else {
      triggerHaptic.warning();
      Alert.alert('Notice', 'Command dispatched. Syncing status with server...');
    }
  };

  const handleStopMotor = async () => {
    if (isMotorLoading) return;

    if (cooldownRemaining > 0) {
      triggerHaptic.warning();
      setIsCooldownModalVisible(true);
      return;
    }

    if (activeUser?.role !== 'parent') {
      triggerHaptic.warning();
      Alert.alert(
        'Parent Access Required',
        'Child account cannot turn off the motor. Please switch to a Parent account.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Switch Account', onPress: () => setIsRoleModalVisible(true) },
        ]
      );
      return;
    }

    triggerHaptic.medium();
    setIsMotorLoading(true);

    // 1. Dispatch command to hardware controller via MQTT
    if (mqttClientRef.current) {
      mqttClientRef.current.publish(settings.mqttTopicMotorSet, 'OFF');
      mqttClientRef.current.publish(settings.mqttTopicMotorStatus, 'OFF', true);
    }

    // 2. Persist motor state + user id in Cloud Database
    const res = await pushMotorCommandToFirebase('OFF', activeUser);
    setIsMotorLoading(false);

    if (res && res.success) {
      // 3. Immediately stop water animation and reset state upon confirmed server save!
      updateMotorState(false);
      startCooldown(20);
      readingHistoryRef.current = [];
      setFlowStatus('stable');
      saveWidgetData({ motorState: false, cooldownRemaining: 20 });
    } else if (res && res.blocked) {
      triggerHaptic.warning();
      Alert.alert('Access Denied', res.error || 'Only Parent can turn off the motor.');
    } else {
      triggerHaptic.warning();
      Alert.alert('Notice', 'Command dispatched. Syncing status with server...');
    }
  };

  // 6. Role Selection Handler
  const handleSelectRole = async (role) => {
    const updatedUser = await switchUserRole(role);
    setActiveUser(updatedUser);
  };

  // 7. OTA Handlers
  const handleCheckFirmwareOTA = () => {
    if (mqttClientRef.current && isConnected) {
      mqttClientRef.current.publish('waterlevel/ota/cmd', 'CHECK');
    }
  };

  // 8. Demo / Simulation Mode
  const toggleSimulation = () => {
    if (isSimulating) {
      setIsSimulating(false);
      clearInterval(simIntervalRef.current);
    } else {
      setIsSimulating(true);
      startSimulation();
    }
  };

  const startSimulation = () => {
    clearInterval(simIntervalRef.current);
    let currentDistance = distanceCm;

    simIntervalRef.current = setInterval(() => {
      const minDistance = settings.sensorOffset || 10;
      const maxDistance = (settings.totalHeight || 200) + minDistance;

      if (simDirectionRef.current === 'drain') {
        currentDistance += 3;
        if (currentDistance >= maxDistance) {
          currentDistance = maxDistance;
          simDirectionRef.current = 'fill';
        }
      } else {
        currentDistance -= 4;
        if (currentDistance <= minDistance) {
          currentDistance = minDistance;
          simDirectionRef.current = 'drain';
        }
      }

      applyDistanceMeasurement(currentDistance, 'Sim');
    }, 600);
  };

  // 9. Settings Handlers
  const handleSaveSettings = async (newSettings) => {
    setSettings(newSettings);
    await saveSettings(newSettings);
    Alert.alert(
      'Settings Saved',
      `Tank configured: ${newSettings.totalCapacity} L capacity, ${newSettings.totalHeight} cm height. Settings applied.`
    );
  };

  const handleResetSettings = async () => {
    const defaults = await resetSettings();
    setSettings(defaults);
    Alert.alert('Settings Restored', 'All tank parameters restored to default values.');
    return defaults;
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out?',
      `Are you sure you want to sign out of ${activeUser?.displayName || 'this session'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logoutActiveUser();
            setActiveUser(null);
          },
        },
      ]
    );
  };

  // Loading state while checking authentication and loading fonts
  if (isAuthChecking || !fontsLoaded) {
    return (
      <SafeAreaProvider>
        <SafeAreaView
          style={[styles.safeArea, styles.splashContainer]}
          edges={['top', 'left', 'right', 'bottom']}
        >
          <ExpoStatusBar style="dark" />
          {/* App Custom Logo */}
          <View style={styles.splashLogoContainer}>
            <Image
              source={require('./assets/logo.png')}
              style={styles.splashLogoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.splashTitle}>
            Hydro <Text style={styles.splashTitleAccent}>Pulse</Text>
          </Text>
          <Text style={styles.splashSubtitle}>Smart Water Management System</Text>
          
          <View style={styles.splashLoaderWrapper}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.splashStatusText}>Starting app...</Text>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  // If not authenticated, display Login / Register Screen directly
  if (!activeUser) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <ExpoStatusBar style="dark" />
          <AuthScreen onLoginSuccess={(user) => setActiveUser(user)} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  const isParent = activeUser?.role === 'parent';

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <ExpoStatusBar style="dark" />

        {/* Main Application Screens — no separate header bar */}
        <View style={styles.mainContent}>
          {/* TAB 1: RESERVOIR (Smart Home Command Dashboard) */}
          {activeTab === 'reservoir' && (
            <ReservoirScreen
              percentage={percentage}
              remainingLiters={remainingLiters}
              totalCapacity={settings.totalCapacity}
              flowStatus={flowStatus}
              lowThreshold={settings.lowThreshold}
              criticalThreshold={settings.criticalThreshold}
              highThreshold={settings.highThreshold}
              depthMeters={waterDepthMeters}
              depthCm={waterDepthCm}
              timeEstimate={timeEstimate}
              motorState={motorState}
              cooldownRemaining={cooldownRemaining}
              isMotorLoading={isMotorLoading}
              onStartMotor={handleStartMotor}
              onStopMotor={handleStopMotor}
              isConnected={isConnected}
              isDeviceOnline={isDeviceOnline}
              lastSeenText={getEsp32LastSeenText()}
              userRole={activeUser?.role}
              deviceId={activeUser?.deviceId || 'TANK-01'}
              onOpenRoleModal={() => setIsRoleModalVisible(true)}
              onShowCooldown={() => setIsCooldownModalVisible(true)}
            />
          )}

          {/* TAB 2: ANALYTICS (Telemetry Diagnostics, Depth, Volume, Flow Rate) */}
          {activeTab === 'analytics' && (
            <AnalyticsScreen
              depthMeters={waterDepthMeters}
              depthCm={waterDepthCm}
              volumeLiters={remainingLiters}
              percentage={percentage}
              totalCapacity={settings.totalCapacity}
              timeEstimate={timeEstimate}
              flowStatus={flowStatus}
              distanceCm={distanceCm}
              settings={settings}
            />
          )}

          {/* TAB 3: PUMP POWER (Motor Pump Control) */}
          {activeTab === 'pump' && (
            <PumpPowerScreen
              motorState={motorState}
              cooldownRemaining={cooldownRemaining}
              isMotorLoading={isMotorLoading}
              onStartMotor={handleStartMotor}
              onStopMotor={handleStopMotor}
              isConnected={isConnected}
              isDeviceOnline={isDeviceOnline}
              lastSeenText={getEsp32LastSeenText()}
              userRole={activeUser?.role}
              onOpenRoleModal={() => setIsRoleModalVisible(true)}
              onShowCooldown={() => setIsCooldownModalVisible(true)}
            />
          )}

          {/* TAB 4: SETTINGS (Tank, Firebase Realtime DB, Alerts, Cloud) */}
          {activeTab === 'setup' && (
            <SystemSetupScreen
              settings={settings}
              onSaveSettings={handleSaveSettings}
              onResetSettings={handleResetSettings}
              onCheckFirmwareOTA={handleCheckFirmwareOTA}
              esp32FirmwareVersion={esp32FirmwareVersion}
              isDeviceOnline={isDeviceOnline}
              lastSeenText={getEsp32LastSeenText()}
              activeUser={activeUser}
              onSwitchRole={handleSelectRole}
              onLogout={handleLogout}
            />
          )}
        </View>

        {/* Bottom Navigation Bar with Child permission restriction */}
        <BottomNavBar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          userRole={activeUser?.role}
        />

        {/* Role Selection & Permission Modal */}
        <RoleSwitchModal
          visible={isRoleModalVisible}
          onClose={() => setIsRoleModalVisible(false)}
          activeUser={activeUser}
          onSelectRole={handleSelectRole}
          onSignOut={handleLogout}
        />

        {/* Real-Time UI-Friendly Cooldown Modal */}
        <CooldownModal
          visible={isCooldownModalVisible && cooldownRemaining > 0}
          cooldownRemaining={cooldownRemaining}
          totalCooldown={20}
          onClose={() => setIsCooldownModalVisible(false)}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 2,
  },
  brandTitle: {
    fontFamily: FONTS.extraBold,
    color: COLORS.textPrimary,
    fontSize: 16,
    letterSpacing: -0.4,
    lineHeight: 19,
  },
  brandAccent: {
    color: COLORS.primary,
  },
  brandSubtitle: {
    fontFamily: FONTS.medium,
    color: COLORS.textMuted,
    fontSize: 10,
    letterSpacing: 0.1,
    lineHeight: 13,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  dotOnline: {
    backgroundColor: COLORS.success,
  },
  dotOffline: {
    backgroundColor: COLORS.danger,
  },
  deviceIdText: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: COLORS.textSecondary,
    letterSpacing: 0.1,
  },
  headerDivider: {
    width: 1,
    height: 18,
    backgroundColor: COLORS.border,
    borderRadius: 1,
  },
  avatarBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  avatarBtnParent: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.borderBlue,
  },
  avatarBtnChild: {
    backgroundColor: COLORS.warningBg,
    borderColor: '#fcd34d',
  },
  simBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9,
    backgroundColor: COLORS.canvasAlt,
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
  },
  simBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  simBtnText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  simBtnTextActive: {
    color: COLORS.white,
  },
  mainContent: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  splashContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  splashLogoContainer: {
    width: 110,
    height: 110,
    borderRadius: 26,
    shadowColor: '#0276FF',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 10,
    marginBottom: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  splashLogoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
  },
  splashTitle: {
    fontSize: 28,
    fontFamily: FONTS.bold,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.6,
  },
  splashTitleAccent: {
    color: COLORS.primary,
  },
  splashSubtitle: {
    fontSize: 13,
    fontFamily: FONTS.medium,
    fontWeight: '500',
    color: COLORS.textMuted,
    marginTop: 6,
    marginBottom: 32,
  },
  splashLoaderWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  splashStatusText: {
    fontSize: 12,
    fontFamily: FONTS.semiBold,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
});
