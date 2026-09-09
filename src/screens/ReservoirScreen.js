import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { WaterTankView } from '../components/WaterTankView';
import { CooldownModal } from '../components/CooldownModal';
import { triggerHaptic } from '../services/hapticService';
import { COLORS, FONTS } from '../constants/theme';

export const ReservoirScreen = ({
  percentage = 50,
  remainingLiters = 500,
  totalCapacity = 1000,
  flowStatus = 'stable',
  lowThreshold = 20,
  criticalThreshold = 10,
  highThreshold = 90,
  motorState = false,
  cooldownRemaining = 0,
  onStartMotor,
  onStopMotor,
  isConnected = true,
  isDeviceOnline = false,
  lastSeenText = 'Never',
  userRole = 'parent',
  deviceId = 'TANK-01',
  onOpenRoleModal,
}) => {
  const isParent = userRole === 'parent';
  const [showCooldownModal, setShowCooldownModal] = useState(false);
  const [showDiag, setShowDiag] = useState(false);

  useEffect(() => {
    if (cooldownRemaining <= 0 && showCooldownModal) {
      setShowCooldownModal(false);
    }
  }, [cooldownRemaining, showCooldownModal]);

  const handleMotorPress = () => {
    if (!isParent) {
      triggerHaptic.warning();
      Alert.alert('Access Restricted', 'Child accounts cannot operate the motor.');
      return;
    }

    if (!isDeviceOnline) {
      triggerHaptic.warning();
      Alert.alert(
        'Controller Not Responding',
        'ESP32 hardware controller is currently offline. Motor commands cannot be executed.'
      );
      return;
    }

    if (!isConnected) {
      triggerHaptic.warning();
      Alert.alert('Offline', 'App is not connected to cloud broker.');
      return;
    }

    if (cooldownRemaining > 0) {
      triggerHaptic.warning();
      setShowCooldownModal(true);
      return;
    }

    triggerHaptic.medium();
    if (motorState) {
      onStopMotor?.();
    } else {
      onStartMotor?.();
    }
  };

  return (
    <View style={styles.container}>

      {/* ── Inline Status Bar (replaces global header) ── */}
      <View style={styles.statusBar}>
        {/* Brand mark */}
        <View style={styles.brand}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.brandLogo}
            resizeMode="contain"
          />
          <Text style={styles.brandName}>
            Hydro <Text style={styles.brandAccent}>Pulse</Text>
          </Text>
        </View>

        {/* Right: connection + device + role */}
        <View style={styles.statusCluster}>
          <View style={styles.connRow}>
            <View style={[styles.connDot, isDeviceOnline ? styles.dotGreen : styles.dotRed]} />
            <Text style={[styles.deviceLabel, !isDeviceOnline && styles.deviceLabelOffline]}>
              {deviceId} • {isDeviceOnline ? 'Live' : 'Offline'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.roleChip, isParent ? styles.roleChipParent : styles.roleChipChild]}
            onPress={onOpenRoleModal}
            activeOpacity={0.75}
          >
            <MaterialCommunityIcons
              name={isParent ? 'crown' : 'account-child'}
              size={12}
              color={isParent ? COLORS.primary : COLORS.warningText}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Prominent Offline Banner when ESP32 is not responding ── */}
      {!isDeviceOnline && (
        <View style={styles.offlineBanner}>
          <View style={styles.offlineIconCircle}>
            <MaterialCommunityIcons name="cloud-off-outline" size={16} color="#DC2626" />
          </View>
          <View style={styles.offlineTextCol}>
            <Text style={styles.offlineTitle}>Controller Not Responding</Text>
            <Text style={styles.offlineSub}>
              ESP32 is offline ({lastSeenText}). Check power supply & WiFi.
            </Text>
          </View>
        </View>
      )}

      {/* ── Water Tank ── */}
      <View style={styles.tankWrapper}>
        <WaterTankView
          percentage={percentage}
          remainingLiters={remainingLiters}
          totalCapacity={totalCapacity}
          flowStatus={isDeviceOnline ? flowStatus : 'offline'}
          lowThreshold={lowThreshold}
          criticalThreshold={criticalThreshold}
          highThreshold={highThreshold}
          motorState={motorState}
        />
      </View>

      {/* ── Motor Toggle Button ── */}
      <TouchableOpacity
        style={[
          styles.motorBtn,
          motorState ? styles.motorBtnStop : styles.motorBtnStart,
          cooldownRemaining > 0 && styles.motorBtnCooldown,
          !isDeviceOnline && styles.motorBtnOffline,
        ]}
        onPress={handleMotorPress}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons
          name={!isDeviceOnline ? 'cloud-off-outline' : cooldownRemaining > 0 ? 'timer-sand' : 'power'}
          size={18}
          color={COLORS.white}
          style={{ marginRight: 8 }}
        />
        <Text style={styles.motorBtnText}>
          {!isDeviceOnline
            ? 'Controller Offline'
            : motorState
            ? `Turn Off Motor${cooldownRemaining > 0 ? ` (${cooldownRemaining}s)` : ''}`
            : `Turn On Motor${cooldownRemaining > 0 ? ` (${cooldownRemaining}s)` : ''}`}
        </Text>
      </TouchableOpacity>

      {/* ── Live Animation & Telemetry Diagnostics Strip ── */}
      <TouchableOpacity
        style={styles.diagStrip}
        onPress={() => setShowDiag((prev) => !prev)}
        activeOpacity={0.75}
      >
        <View style={[styles.diagDot, isDeviceOnline ? styles.dotGreen : styles.dotRed]} />
        <Text style={styles.diagText}>
          {isDeviceOnline ? `ESP32 Live (${lastSeenText})` : 'ESP32 Offline'} • Flow: {flowStatus} • Motor: {motorState ? 'ON' : 'OFF'}
        </Text>
        <MaterialCommunityIcons
          name={showDiag ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={COLORS.textMuted}
        />
      </TouchableOpacity>

      {showDiag && (
        <View style={styles.diagDetailBox}>
          <Text style={styles.diagRow}>
            • <Text style={styles.diagBold}>Water Level:</Text> {percentage}% ({remainingLiters} L)
          </Text>
          <Text style={styles.diagRow}>
            • <Text style={styles.diagBold}>Flow State:</Text>{' '}
            {flowStatus === 'filling'
              ? 'Filling (Water Rising)'
              : flowStatus === 'dropping'
              ? 'Draining (Water Receding)'
              : 'Stable (No Change)'}
          </Text>
          <Text style={styles.diagRow}>
            • <Text style={styles.diagBold}>Inlet Water Stream:</Text>{' '}
            {(motorState || flowStatus === 'filling') && flowStatus !== 'dropping' && percentage < 99
              ? 'ACTIVE (Pouring Into Tank)'
              : 'STOPPED'}
          </Text>
          <Text style={styles.diagRow}>
            • <Text style={styles.diagBold}>Motor Relay:</Text> {motorState ? 'Closed (Active)' : 'Open (Standby)'}
          </Text>
        </View>
      )}

      <CooldownModal
        visible={showCooldownModal && cooldownRemaining > 0}
        cooldownRemaining={cooldownRemaining}
        totalCooldown={20}
        onClose={() => setShowCooldownModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  /* ── Inline Status Bar ── */
  statusBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    paddingBottom: 10,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  brandLogo: {
    width: 22,
    height: 22,
    borderRadius: 6,
  },
  brandName: {
    fontFamily: FONTS.extraBold,
    fontSize: 16,
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  brandAccent: {
    color: COLORS.primary,
  },
  statusCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  connRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  connDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotGreen: {
    backgroundColor: COLORS.success,
  },
  dotRed: {
    backgroundColor: COLORS.danger,
  },
  deviceLabel: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: COLORS.textSecondary,
    letterSpacing: 0.1,
  },
  roleChip: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  roleChipParent: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.borderBlue,
  },
  roleChipChild: {
    backgroundColor: COLORS.warningBg,
    borderColor: '#fcd34d',
  },

  /* ── Tank ── */
  tankWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* ── Motor Button ── */
  motorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '84%',
    maxWidth: 320,
    height: 50,
    borderRadius: 14,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 6,
  },
  motorBtnStart: {
    backgroundColor: COLORS.primary,
  },
  motorBtnStop: {
    backgroundColor: COLORS.danger,
  },
  motorBtnCooldown: {
    opacity: 0.9,
  },
  motorBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 15,
    color: COLORS.white,
    letterSpacing: 0.2,
  },
  deviceLabelOffline: {
    color: '#EF4444',
  },
  offlineBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 6,
    gap: 10,
  },
  offlineIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineTextCol: {
    flex: 1,
  },
  offlineTitle: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: '#DC2626',
    letterSpacing: 0.1,
  },
  offlineSub: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: '#991B1B',
    marginTop: 1,
  },
  motorBtnOffline: {
    backgroundColor: '#94A3B8',
  },
  diagStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 10,
  },
  diagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  diagText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.textSecondary,
    flex: 1,
  },
  diagDetailBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 10,
    marginTop: 6,
    gap: 3,
  },
  diagRow: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  diagBold: {
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
});
