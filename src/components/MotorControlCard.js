import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';

export const MotorControlCard = ({
  motorState = false,
  cooldownRemaining = 0,
  onStartMotor,
  onStopMotor,
  isConnected = false,
  userRole = 'parent',
  onOpenRoleModal,
  onShowCooldown,
}) => {
  const isParent = userRole === 'parent';
  const isCooldown = cooldownRemaining > 0;

  const handleStartPress = () => {
    if (!isParent) {
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

    if (!isConnected) {
      Alert.alert('Offline', 'Controller is not connected.');
      return;
    }

    if (isCooldown) {
      if (onShowCooldown) {
        onShowCooldown();
      } else {
        onStartMotor?.();
      }
      return;
    }

    Alert.alert('Start Pump?', 'Turn on the water pump.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Start', onPress: onStartMotor },
    ]);
  };

  const handleStopPress = () => {
    if (!isParent) {
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

    if (!isConnected) {
      Alert.alert('Offline', 'Controller is not connected.');
      return;
    }

    if (isCooldown) {
      if (onShowCooldown) {
        onShowCooldown();
      } else {
        onStopMotor?.();
      }
      return;
    }

    onStopMotor();
  };

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
            <Text style={styles.cardSubtitle}>Pump Controller</Text>
          </View>
        </View>

        {/* Status Badge */}
        <View
          style={[
            styles.badge,
            motorState && styles.badgeRunning,
            isCooldown && styles.badgeCooldown,
          ]}
        >
          <View
            style={[
              styles.dot,
              motorState && styles.dotRunning,
              isCooldown && styles.dotCooldown,
            ]}
          />
          <Text
            style={[
              styles.badgeText,
              motorState && styles.badgeTextRunning,
              isCooldown && styles.badgeTextCooldown,
            ]}
          >
            {motorState ? 'RUNNING' : isCooldown ? `${cooldownRemaining}s` : 'IDLE'}
          </Text>
        </View>
      </View>

      {/* Child Lock Alert */}
      {!isParent && (
        <TouchableOpacity
          style={styles.childLockBanner}
          onPress={onOpenRoleModal}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="lock" size={14} color={COLORS.danger} />
          <Text style={styles.childLockText}>View-only mode active</Text>
          <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.danger} />
        </TouchableOpacity>
      )}

      {/* Action Buttons */}
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={[
            styles.btnStart,
            (!isParent || motorState || isCooldown || !isConnected) && styles.btnDisabled,
          ]}
          onPress={handleStartPress}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={!isParent ? 'lock-outline' : 'power'}
            size={16}
            color={
              !isParent || motorState || isCooldown || !isConnected
                ? '#94a3b8'
                : COLORS.white
            }
          />
          <Text
            style={[
              styles.btnStartText,
              (!isParent || motorState || isCooldown || !isConnected) && styles.btnTextDisabled,
            ]}
          >
            {!isParent ? 'Locked' : 'Start Pump'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.btnStop,
            (!isParent || !motorState || !isConnected) && styles.btnDisabled,
          ]}
          onPress={handleStopPress}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={!isParent ? 'lock-outline' : 'stop'}
            size={16}
            color={!isParent || !motorState || !isConnected ? '#94a3b8' : COLORS.white}
          />
          <Text
            style={[
              styles.btnStopText,
              (!isParent || !motorState || !isConnected) && styles.btnTextDisabled,
            ]}
          >
            {!isParent ? 'Locked' : 'Stop Pump'}
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
    backgroundColor: '#f0fdf4',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
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
    fontSize: 10.5,
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
