import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const LargeWidget = ({
  percentage = 50,
  remainingLiters = 500,
  totalCapacity = 1000,
  depthMeters = '1.00',
  depthCm = 100,
  motorState = false,
  cooldownRemaining = 0,
  onStartMotor,
  onStopMotor,
  flowStatus = 'stable',
  lowThreshold = 20,
  criticalThreshold = 10,
  highThreshold = 90,
  isConnected = true,
  userRole = 'parent',
}) => {
  const isParent = userRole === 'parent';
  const clampedPercent = Math.max(0, Math.min(100, Math.round(percentage)));
  const isCooldown = cooldownRemaining > 0;

  const getTheme = () => {
    if (clampedPercent <= criticalThreshold) {
      return {
        liquidTop: '#fb7185',
        liquidBottom: '#e11d48',
        accent: '#e11d48',
        status: 'Critical Low',
      };
    }
    if (clampedPercent <= lowThreshold) {
      return {
        liquidTop: '#fbbf24',
        liquidBottom: '#d97706',
        accent: '#d97706',
        status: 'Low Water',
      };
    }
    if (clampedPercent >= highThreshold) {
      return {
        liquidTop: '#2dd4bf',
        liquidBottom: '#0284c7',
        accent: '#0d9488',
        status: 'Tank Full',
      };
    }
    return {
      liquidTop: '#38bdf8',
      liquidBottom: '#0284c7',
      accent: '#0284c7',
      status: 'Normal Water',
    };
  };

  const theme = getTheme();

  const TANK_HEIGHT = 130;
  const liquidHeightPx = Math.max(10, Math.min(TANK_HEIGHT, (clampedPercent / 100) * TANK_HEIGHT));

  return (
    <View style={styles.widgetContainer}>
      {/* 1. Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.brandRow}>
          <MaterialCommunityIcons name="water" size={17} color={theme.accent} />
          <Text style={styles.brandTitle}>Hydro Pulse Smart Tank</Text>
        </View>
        <View style={styles.badgeRow}>
          <View
            style={[
              styles.motorStatePill,
              motorState ? styles.motorRunningPill : styles.motorIdlePill,
            ]}
          >
            <View
              style={[
                styles.motorDot,
                motorState ? styles.motorDotRunning : styles.motorDotIdle,
              ]}
            />
            <Text
              style={[
                styles.motorText,
                motorState ? styles.motorTextRunning : styles.motorTextIdle,
              ]}
            >
              {motorState ? 'PUMP ON' : isCooldown ? `COOLDOWN ${cooldownRemaining}s` : 'PUMP OFF'}
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Main Middle Section: Tank Cylinder + Telemetry Metrics */}
      <View style={styles.mainMiddleRow}>
        {/* Left: Capsule Cylinder Tank */}
        <View style={styles.tankContainer}>
          <View style={styles.tankCap} />
          <View style={styles.tankCollar} />
          <View style={styles.tankVessel}>
            <View style={styles.tankSpecular} />

            {/* Liquid Mass with Top Wave */}
            <View
              style={[
                styles.liquidMass,
                {
                  height: liquidHeightPx,
                  backgroundColor: theme.liquidBottom,
                },
              ]}
            >
              <View style={styles.waveBox}>
                <Svg width={76} height={16} viewBox="0 0 76 16">
                  <Defs>
                    <LinearGradient id="largeWaveGrad" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor={theme.liquidTop} stopOpacity="1" />
                      <Stop offset="1" stopColor={theme.liquidBottom} stopOpacity="1" />
                    </LinearGradient>
                  </Defs>
                  <Path
                    d="M 0 6 Q 19 0, 38 6 T 76 6 L 76 16 L 0 16 Z"
                    fill="url(#largeWaveGrad)"
                  />
                </Svg>
              </View>
            </View>
          </View>
          <View style={styles.tankBase} />
        </View>

        {/* Right: Comprehensive Telemetry Stats */}
        <View style={styles.metricsColumn}>
          <View style={styles.primaryPercentRow}>
            <Text style={styles.percentBig}>{clampedPercent}%</Text>
            <View style={styles.statusWrap}>
              <Text style={[styles.statusLabel, { color: theme.accent }]}>{theme.status}</Text>
              <Text style={styles.capacitySub}>of {totalCapacity.toLocaleString()} L</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statItemLabel}>Remaining</Text>
              <Text style={styles.statItemVal}>{remainingLiters.toLocaleString()} L</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statItemLabel}>Water Depth</Text>
              <Text style={styles.statItemVal}>{depthMeters} m</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 3. Interactive Pump Control Buttons (Turn ON and OFF Motor) */}
      <View style={styles.controlsSection}>
        <View style={styles.controlsBtnRow}>
          {/* Start Motor Button */}
          <TouchableOpacity
            style={[
              styles.btnStartMotor,
              (!isParent || motorState || isCooldown) && styles.btnDisabled,
            ]}
            onPress={isParent ? onStartMotor : null}
            disabled={!isParent || motorState || isCooldown}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={!isParent ? 'lock-outline' : 'power'}
              size={18}
              color={!isParent || motorState || isCooldown ? '#94a3b8' : '#ffffff'}
            />
            <Text
              style={[
                styles.btnStartText,
                (!isParent || motorState || isCooldown) && styles.btnTextDisabled,
              ]}
            >
              {!isParent ? 'Locked' : 'Turn Pump ON'}
            </Text>
          </TouchableOpacity>

          {/* Stop Motor Button */}
          <TouchableOpacity
            style={[styles.btnStopMotor, (!isParent || !motorState) && styles.btnDisabled]}
            onPress={isParent ? onStopMotor : null}
            disabled={!isParent || !motorState}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={!isParent ? 'lock-outline' : 'power-off'}
              size={18}
              color={!isParent || !motorState ? '#94a3b8' : '#ffffff'}
            />
            <Text
              style={[
                styles.btnStopText,
                (!isParent || !motorState) && styles.btnTextDisabled,
              ]}
            >
              {!isParent ? 'Locked' : 'Turn Pump OFF'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer Tag */}
        <View style={styles.footerRow}>
          <Text style={styles.safetyTag}>
            {!isParent
              ? '🔒 Child Safe: Motor control locked'
              : isCooldown
              ? `Surge lockout: wait ${cooldownRemaining}s`
              : 'Parent Authorized: Interlock Armed'}
          </Text>
          <Text style={styles.widgetSizeTag}>4×4 Large Widget</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  widgetContainer: {
    width: 320,
    height: 330,
    borderRadius: 28,
    backgroundColor: '#ffffff',
    padding: 16,
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  motorStatePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  motorRunningPill: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  motorIdlePill: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  motorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  motorDotRunning: {
    backgroundColor: '#10b981',
  },
  motorDotIdle: {
    backgroundColor: '#94a3b8',
  },
  motorText: {
    fontSize: 10,
    fontWeight: '800',
  },
  motorTextRunning: {
    color: '#059669',
  },
  motorTextIdle: {
    color: '#64748b',
  },
  mainMiddleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tankContainer: {
    width: 86,
    alignItems: 'center',
  },
  tankCap: {
    width: 26,
    height: 4,
    backgroundColor: '#64748b',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  tankCollar: {
    width: 58,
    height: 6,
    backgroundColor: '#94a3b8',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  tankVessel: {
    width: 76,
    height: 130,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#94a3b8',
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  tankSpecular: {
    position: 'absolute',
    top: 8,
    left: 4,
    width: 3.5,
    height: '72%',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 2,
    zIndex: 10,
  },
  liquidMass: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  waveBox: {
    position: 'absolute',
    top: -6,
    left: 0,
    width: 76,
    height: 16,
  },
  tankBase: {
    width: 70,
    height: 8,
    backgroundColor: '#94a3b8',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  metricsColumn: {
    flex: 1,
    paddingLeft: 16,
    justifyContent: 'center',
    gap: 10,
  },
  primaryPercentRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 10,
  },
  percentBig: {
    fontSize: 44,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -1.5,
    lineHeight: 48,
  },
  statusWrap: {
    justifyContent: 'center',
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  capacitySub: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statItemLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  statItemVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#cbd5e1',
  },
  controlsSection: {
    paddingTop: 6,
    gap: 8,
  },
  controlsBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btnStartMotor: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingVertical: 11,
    borderRadius: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  btnStartText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  btnStopMotor: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ef4444',
    paddingVertical: 11,
    borderRadius: 12,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  btnStopText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  btnDisabled: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowOpacity: 0,
    elevation: 0,
  },
  btnTextDisabled: {
    color: '#94a3b8',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  safetyTag: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
  },
  widgetSizeTag: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
  },
});
