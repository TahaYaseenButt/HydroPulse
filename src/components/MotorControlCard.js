import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated, Easing } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';
import { triggerHaptic } from '../services/hapticService';

export const MotorControlCard = ({
  motorState = false,
  cooldownRemaining = 0,
  onStartMotor,
  onStopMotor,
  isConnected = false,
  isDeviceOnline = false,
  lastSeenText = 'Never',
  userRole = 'parent',
  onOpenRoleModal,
  onShowCooldown,
}) => {
  const isParent = userRole === 'parent';
  const isCooldown = cooldownRemaining > 0;

  // Turbine Impeller Rotation Animation
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinLoopRef = useRef(null);

  // Motor Run Session Stopwatch
  const [sessionSeconds, setSessionSeconds] = useState(0);

  useEffect(() => {
    let timer = null;
    if (motorState) {
      // Start session stopwatch
      timer = setInterval(() => {
        setSessionSeconds((prev) => prev + 1);
      }, 1000);

      // Start continuous turbine rotation
      spinAnim.setValue(0);
      spinLoopRef.current = Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spinLoopRef.current.start();
    } else {
      if (spinLoopRef.current) {
        spinLoopRef.current.stop();
      }
      spinAnim.setValue(0);
      setSessionSeconds(0);
    }

    return () => {
      if (timer) clearInterval(timer);
      if (spinLoopRef.current) spinLoopRef.current.stop();
    };
  }, [motorState]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const formatSessionTime = (totalSec) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartPress = () => {
    if (!isParent) {
      triggerHaptic.warning();
      Alert.alert(
        'Parent Access Required',
        'Child accounts cannot operate the water pump.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Switch Role', onPress: onOpenRoleModal },
        ]
      );
      return;
    }

    if (!isDeviceOnline) {
      triggerHaptic.warning();
      Alert.alert(
        'Controller Not Responding',
        'The ESP32 controller is not responding. Please check that the ESP32 is powered on and connected to WiFi.'
      );
      return;
    }

    if (!isConnected) {
      triggerHaptic.warning();
      Alert.alert('Offline', 'App is not connected to cloud broker.');
      return;
    }

    if (isCooldown) {
      triggerHaptic.warning();
      if (onShowCooldown) {
        onShowCooldown();
      } else {
        onStartMotor?.();
      }
      return;
    }

    Alert.alert('Start Pump?', 'Turn on the high-flow water pump.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start',
        onPress: () => {
          triggerHaptic.medium();
          onStartMotor?.();
        },
      },
    ]);
  };

  const handleStopPress = () => {
    if (!isParent) {
      triggerHaptic.warning();
      Alert.alert(
        'Parent Access Required',
        'Child accounts cannot operate the water pump.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Switch Role', onPress: onOpenRoleModal },
        ]
      );
      return;
    }

    if (!isDeviceOnline) {
      triggerHaptic.warning();
      Alert.alert(
        'Controller Not Responding',
        'The ESP32 controller is not responding. Please check that the ESP32 is powered on and connected to WiFi.'
      );
      return;
    }

    if (!isConnected) {
      triggerHaptic.warning();
      Alert.alert('Offline', 'App is not connected to cloud broker.');
      return;
    }

    if (isCooldown) {
      triggerHaptic.warning();
      if (onShowCooldown) {
        onShowCooldown();
      } else {
        onStopMotor?.();
      }
      return;
    }

    triggerHaptic.medium();
    onStopMotor();
  };

  // Cooldown circle stroke calculations
  const radius = 22;
  const strokeWidth = 3;
  const circumference = 2 * Math.PI * radius;
  const cooldownFraction = isCooldown ? (20 - cooldownRemaining) / 20 : 1;
  const strokeDashoffset = circumference * (1 - cooldownFraction);

  return (
    <View style={[styles.card, motorState && styles.cardRunning]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View
            style={[
              styles.iconCircle,
              motorState ? styles.iconCircleRunning : styles.iconCircleIdle,
            ]}
          >
            <MaterialCommunityIcons
              name={motorState ? 'water-pump' : 'pump'}
              size={18}
              color={motorState ? COLORS.success : COLORS.primary}
            />
          </View>
          <View>
            <Text style={styles.cardTitle}>Water Pump</Text>
            <Text style={styles.cardSubtitle}>Main Induction Booster</Text>
          </View>
        </View>

        {/* Status Badge */}
        <View
          style={[
            styles.badge,
            motorState && styles.badgeRunning,
            isCooldown && styles.badgeCooldown,
            !isDeviceOnline && styles.badgeOffline,
          ]}
        >
          <View
            style={[
              styles.dot,
              motorState && styles.dotRunning,
              isCooldown && styles.dotCooldown,
              !isDeviceOnline && styles.dotOffline,
            ]}
          />
          <Text
            style={[
              styles.badgeText,
              motorState && styles.badgeTextRunning,
              isCooldown && styles.badgeTextCooldown,
              !isDeviceOnline && styles.badgeTextOffline,
            ]}
          >
            {!isDeviceOnline ? 'OFFLINE' : motorState ? 'RUNNING' : isCooldown ? `${cooldownRemaining}s COOLDOWN` : 'STANDBY'}
          </Text>
        </View>
      </View>

      {/* Controller Offline Alert Bar */}
      {!isDeviceOnline && (
        <View style={styles.offlineNoticeBar}>
          <MaterialCommunityIcons name="cloud-off-outline" size={14} color="#DC2626" />
          <Text style={styles.offlineNoticeText}>
            Controller offline ({lastSeenText}). Relay controls locked.
          </Text>
        </View>
      )}

      {/* Child Lock Alert */}
      {!isParent && isDeviceOnline && (
        <TouchableOpacity
          style={styles.childLockBanner}
          onPress={onOpenRoleModal}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="lock" size={14} color={COLORS.danger} />
          <Text style={styles.childLockText}>Child profile: View-only mode active</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.danger} />
        </TouchableOpacity>
      )}

      {/* Interactive Turbine Visualizer & Session Timer */}
      <View style={styles.visualizerContainer}>
        {/* Animated Impeller Chamber */}
        <View style={[styles.turbineHousing, motorState && styles.turbineHousingActive]}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Svg width={54} height={54} viewBox="0 0 54 54">
              {/* Outer Impeller Ring */}
              <Circle
                cx={27}
                cy={27}
                r={24}
                fill={motorState ? '#E0F2FE' : '#F1F5F9'}
                stroke={motorState ? '#38BDF8' : '#CBD5E1'}
                strokeWidth={1.8}
              />
              {/* Impeller Blades */}
              <G fill={motorState ? '#0284C7' : '#94A3B8'}>
                {/* Top blade */}
                <Path d="M27 27 C25 20, 24 10, 27 6 C30 10, 29 20, 27 27 Z" />
                {/* Bottom blade */}
                <Path d="M27 27 C29 34, 30 44, 27 48 C24 44, 25 34, 27 27 Z" />
                {/* Right blade */}
                <Path d="M27 27 C34 25, 44 24, 48 27 C44 30, 34 29, 27 27 Z" />
                {/* Left blade */}
                <Path d="M27 27 C20 29, 10 30, 6 27 C10 24, 20 25, 27 27 Z" />
              </G>
              {/* Center Hub */}
              <Circle
                cx={27}
                cy={27}
                r={5.5}
                fill="#FFFFFF"
                stroke={motorState ? '#0369A1' : '#64748B'}
                strokeWidth={2}
              />
              <Circle cx={27} cy={27} r={2} fill={motorState ? '#0369A1' : '#64748B'} />
            </Svg>
          </Animated.View>
        </View>

        {/* Runtime & Flow Details */}
        <View style={styles.timerBlock}>
          <Text style={styles.timerLabel}>
            {motorState ? 'ACTIVE SESSION RUNTIME' : isCooldown ? 'ANTI-BURNOUT COOLDOWN' : 'PUMP STATUS'}
          </Text>
          <Text style={[styles.timerValue, motorState && styles.timerValueRunning]}>
            {motorState
              ? formatSessionTime(sessionSeconds)
              : isCooldown
              ? `${cooldownRemaining}s remaining`
              : 'Ready to Pump'}
          </Text>
          <Text style={styles.timerSub}>
            {motorState
              ? 'Active pumping delivery in progress'
              : isCooldown
              ? 'Relay protection lock active'
              : 'Automatic Pump Controller • Standby'}
          </Text>
        </View>

        {/* Cooldown Ring if Active */}
        {isCooldown && (
          <View style={styles.cooldownRingWrapper}>
            <Svg width={54} height={54} viewBox="0 0 54 54">
              <Circle
                cx={27}
                cy={27}
                r={radius}
                stroke="#FDE68A"
                strokeWidth={strokeWidth}
                fill="none"
              />
              <Circle
                cx={27}
                cy={27}
                r={radius}
                stroke="#F59E0B"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                transform="rotate(-90 27 27)"
              />
            </Svg>
            <Text style={styles.cooldownRingText}>{cooldownRemaining}</Text>
          </View>
        )}
      </View>

      {/* Live Operational Telemetry Bar (Generic for all pump sizes, Light Theme) */}
      <View style={styles.telemetryGrid}>
        <View style={styles.telemetryItem}>
          <View style={styles.telemetryIconRow}>
            <MaterialCommunityIcons name="power" size={13} color={COLORS.primary} />
            <Text style={styles.telemetryLabel}>STATE</Text>
          </View>
          <Text style={styles.telemetryValue}>{motorState ? 'ACTIVE' : 'STANDBY'}</Text>
        </View>

        <View style={styles.telemetryDivider} />

        <View style={styles.telemetryItem}>
          <View style={styles.telemetryIconRow}>
            <MaterialCommunityIcons name="toggle-switch-outline" size={13} color="#0D9488" />
            <Text style={styles.telemetryLabel}>RELAY</Text>
          </View>
          <Text style={styles.telemetryValue}>{motorState ? 'CLOSED' : 'OPEN'}</Text>
        </View>

        <View style={styles.telemetryDivider} />

        <View style={styles.telemetryItem}>
          <View style={styles.telemetryIconRow}>
            <MaterialCommunityIcons name="waves" size={13} color="#6366F1" />
            <Text style={styles.telemetryLabel}>FLOW</Text>
          </View>
          <Text style={styles.telemetryValue}>{motorState ? 'Flowing' : 'Idle'}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[
            styles.btnStart,
            (!isParent || motorState || isCooldown || !isConnected || !isDeviceOnline) && styles.btnDisabled,
          ]}
          onPress={handleStartPress}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={!isParent ? 'lock-outline' : !isDeviceOnline ? 'cloud-off-outline' : 'power'}
            size={16}
            color={
              !isParent || motorState || isCooldown || !isConnected || !isDeviceOnline
                ? '#94a3b8'
                : COLORS.white
            }
          />
          <Text
            style={[
              styles.btnStartText,
              (!isParent || motorState || isCooldown || !isConnected || !isDeviceOnline) && styles.btnTextDisabled,
            ]}
          >
            {!isDeviceOnline ? 'Offline' : !isParent ? 'Locked' : 'Start Pump'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.btnStop,
            (!isParent || !motorState || !isConnected || !isDeviceOnline) && styles.btnDisabled,
          ]}
          onPress={handleStopPress}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={!isParent ? 'lock-outline' : !isDeviceOnline ? 'cloud-off-outline' : 'power'}
            size={16}
            color={
              !isParent || !motorState || !isConnected || !isDeviceOnline
                ? '#94a3b8'
                : COLORS.white
            }
          />
          <Text
            style={[
              styles.btnStopText,
              (!isParent || !motorState || !isConnected || !isDeviceOnline) && styles.btnTextDisabled,
            ]}
          >
            {!isDeviceOnline ? 'Offline' : !isParent ? 'Locked' : 'Stop Pump'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardRunning: {
    borderColor: '#86efac',
    backgroundColor: '#F8FDF9',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleIdle: {
    backgroundColor: COLORS.primaryTint,
  },
  iconCircleRunning: {
    backgroundColor: '#dcfce7',
  },
  cardTitle: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  cardSubtitle: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.textMuted,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgeRunning: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  badgeCooldown: {
    backgroundColor: COLORS.warningBg,
    borderColor: '#fde68a',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.textMuted,
  },
  dotRunning: {
    backgroundColor: COLORS.success,
  },
  dotCooldown: {
    backgroundColor: COLORS.warning,
  },
  badgeText: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 0.4,
  },
  badgeTextRunning: {
    color: COLORS.successText,
  },
  badgeTextCooldown: {
    color: COLORS.warningText,
  },
  childLockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.dangerBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  childLockText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.dangerText,
    flex: 1,
  },
  offlineNoticeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    marginBottom: 12,
    gap: 6,
  },
  offlineNoticeText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: '#991B1B',
    flex: 1,
  },

  /* ── Visualizer & Impeller Chamber ── */
  visualizerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  turbineHousing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  turbineHousingActive: {
    borderColor: '#38BDF8',
    shadowColor: '#0284C7',
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  timerBlock: {
    flex: 1,
    marginLeft: 12,
  },
  timerLabel: {
    fontFamily: FONTS.bold,
    fontSize: 9.5,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  timerValue: {
    fontFamily: FONTS.extraBold,
    fontSize: 16,
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  timerValueRunning: {
    color: '#0284C7',
  },
  timerSub: {
    fontFamily: FONTS.medium,
    fontSize: 10.5,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  cooldownRingWrapper: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cooldownRingText: {
    position: 'absolute',
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: '#D97706',
  },

  /* ── Telemetry Grid ── */
  telemetryGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  telemetryItem: {
    flex: 1,
    alignItems: 'center',
  },
  telemetryIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 2,
  },
  telemetryLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 9,
    color: COLORS.textMuted,
    letterSpacing: 0.4,
  },
  telemetryValue: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  telemetryDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#E2E8F0',
  },

  /* ── Buttons ── */
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnStart: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    height: 44,
    borderRadius: 12,
    gap: 6,
  },
  btnStartText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: COLORS.white,
  },
  btnStop: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.danger,
    height: 44,
    borderRadius: 12,
    gap: 6,
  },
  btnStopText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: COLORS.white,
  },
  btnDisabled: {
    backgroundColor: COLORS.borderLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnTextDisabled: {
    color: COLORS.textMuted,
  },
});
