import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
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
  userRole = 'parent',
  deviceId = 'TANK-01',
  onOpenRoleModal,
}) => {
  const isParent = userRole === 'parent';
  const [showCooldownModal, setShowCooldownModal] = useState(false);

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

    if (!isConnected) {
      triggerHaptic.warning();
      Alert.alert('Offline', 'Controller is not connected.');
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
          <View style={styles.brandDot} />
          <Text style={styles.brandName}>
            Hydro<Text style={styles.brandAccent}>Pulse</Text>
          </Text>
        </View>

        {/* Right: connection + device + role */}
        <View style={styles.statusCluster}>
          <View style={styles.connRow}>
            <View style={[styles.connDot, isConnected ? styles.dotGreen : styles.dotRed]} />
            <Text style={styles.deviceLabel}>{deviceId}</Text>
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

      {/* ── Water Tank ── */}
      <View style={styles.tankWrapper}>
        <WaterTankView
          percentage={percentage}
          remainingLiters={remainingLiters}
          totalCapacity={totalCapacity}
          flowStatus={flowStatus}
          lowThreshold={lowThreshold}
          criticalThreshold={criticalThreshold}
          highThreshold={highThreshold}
        />
      </View>

      {/* ── Motor Toggle Button ── */}
      <TouchableOpacity
        style={[
          styles.motorBtn,
          motorState ? styles.motorBtnStop : styles.motorBtnStart,
          cooldownRemaining > 0 && styles.motorBtnCooldown,
        ]}
        onPress={handleMotorPress}
        activeOpacity={0.85}
      >
        <MaterialCommunityIcons
          name={cooldownRemaining > 0 ? 'timer-sand' : 'power'}
          size={18}
          color={COLORS.white}
          style={{ marginRight: 8 }}
        />
        <Text style={styles.motorBtnText}>
          {motorState
            ? `Turn Off Motor${cooldownRemaining > 0 ? ` (${cooldownRemaining}s)` : ''}`
            : `Turn On Motor${cooldownRemaining > 0 ? ` (${cooldownRemaining}s)` : ''}`}
        </Text>
      </TouchableOpacity>

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
  brandDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
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
});
