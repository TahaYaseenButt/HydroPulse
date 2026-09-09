import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MotorControlCard } from '../components/MotorControlCard';
import { COLORS, FONTS } from '../constants/theme';

export const PumpPowerScreen = ({
  motorState,
  cooldownRemaining,
  onStartMotor,
  onStopMotor,
  isConnected,
  isDeviceOnline = false,
  lastSeenText = 'Never',
  userRole = 'parent',
  onOpenRoleModal,
  onShowCooldown,
}) => {
  const isParent = userRole === 'parent';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Screen Title & Role Badge */}
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="lightning-bolt-circle" size={20} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Pump Control</Text>

        <TouchableOpacity
          style={[styles.rolePill, isParent ? styles.rolePillParent : styles.rolePillChild]}
          onPress={onOpenRoleModal}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={isParent ? 'crown' : 'account-child'}
            size={12}
            color={isParent ? COLORS.primaryDark : COLORS.warningText}
          />
          <Text style={[styles.rolePillText, isParent ? styles.roleTextParent : styles.roleTextChild]}>
            {isParent ? 'Parent' : 'Child'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Motor Control Card */}
      <MotorControlCard
        motorState={motorState}
        cooldownRemaining={cooldownRemaining}
        onStartMotor={onStartMotor}
        onStopMotor={onStopMotor}
        isConnected={isConnected}
        isDeviceOnline={isDeviceOnline}
        lastSeenText={lastSeenText}
        userRole={userRole}
        onOpenRoleModal={onOpenRoleModal}
        onShowCooldown={onShowCooldown}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingVertical: 14,
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 12,
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
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  rolePillParent: {
    backgroundColor: COLORS.primaryTint,
  },
  rolePillChild: {
    backgroundColor: COLORS.warningBg,
  },
  rolePillText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
  },
  roleTextParent: {
    color: COLORS.primaryDark,
  },
  roleTextChild: {
    color: COLORS.warningText,
  },
});
