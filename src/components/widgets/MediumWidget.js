import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const MediumWidget = ({
  percentage = 50,
  remainingLiters = 500,
  totalCapacity = 1000,
  flowStatus = 'stable',
  lowThreshold = 20,
  criticalThreshold = 10,
  highThreshold = 90,
}) => {
  const clampedPercent = Math.max(0, Math.min(100, Math.round(percentage)));

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

  // Mini tank dimensions
  const MINI_TANK_HEIGHT = 110;
  const liquidHeightPx = Math.max(8, Math.min(MINI_TANK_HEIGHT, (clampedPercent / 100) * MINI_TANK_HEIGHT));

  return (
    <View style={styles.widgetContainer}>
      {/* Left: Mini Capsule Cylinder Tank with Fluid Water Level */}
      <View style={styles.leftTankColumn}>
        {/* Top mini plug & collar */}
        <View style={styles.miniCapPlug} />
        <View style={styles.miniCollar} />

        {/* Glass Vessel */}
        <View style={styles.miniGlassVessel}>
          {/* Specular glare */}
          <View style={styles.miniSpecularGlare} />

          {/* Liquid Mass */}
          <View
            style={[
              styles.miniLiquidMass,
              {
                height: liquidHeightPx,
                backgroundColor: theme.liquidBottom,
              },
            ]}
          >
            {/* Wave curve at liquid top surface */}
            <View style={styles.miniWaveBox}>
              <Svg width={72} height={14} viewBox="0 0 72 14">
                <Defs>
                  <LinearGradient id="medWaveGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={theme.liquidTop} stopOpacity="1" />
                    <Stop offset="1" stopColor={theme.liquidBottom} stopOpacity="1" />
                  </LinearGradient>
                </Defs>
                <Path
                  d="M 0 5 Q 18 0, 36 5 T 72 5 L 72 14 L 0 14 Z"
                  fill="url(#medWaveGrad)"
                />
              </Svg>
            </View>
          </View>
        </View>

        {/* Bottom pedestal */}
        <View style={styles.miniPedestal} />
      </View>

      {/* Right: Rich Glanceable Metrics */}
      <View style={styles.rightInfoColumn}>
        <View style={styles.topMetaRow}>
          <View style={styles.brandRow}>
            <MaterialCommunityIcons name="water" size={15} color={theme.accent} />
            <Text style={styles.brandText}>Hydro Pulse</Text>
          </View>
          <View style={styles.statusPill}>
            <View style={[styles.statusDot, { backgroundColor: theme.accent }]} />
            <Text style={[styles.statusText, { color: theme.accent }]}>{theme.status}</Text>
          </View>
        </View>

        {/* Center: Large Percentage */}
        <View style={styles.percentageRow}>
          <Text style={styles.percentageText}>{clampedPercent}%</Text>
          <Text style={styles.volumeSubText}>
            {remainingLiters.toLocaleString()} / {totalCapacity.toLocaleString()} L
          </Text>
        </View>

        {/* Bottom info row */}
        <View style={styles.bottomMetaRow}>
          <View style={styles.flowRow}>
            <MaterialCommunityIcons
              name={
                flowStatus === 'filling'
                  ? 'arrow-up-bold'
                  : flowStatus === 'dropping'
                  ? 'arrow-down-bold'
                  : 'minus'
              }
              size={13}
              color="#64748b"
            />
            <Text style={styles.flowText}>
              {flowStatus === 'filling'
                ? 'Filling'
                : flowStatus === 'dropping'
                ? 'Draining'
                : 'Steady'}
            </Text>
          </View>
          <Text style={styles.widgetSizeTag}>4×2 Medium</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  widgetContainer: {
    width: 320,
    height: 155,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  leftTankColumn: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniCapPlug: {
    width: 24,
    height: 4,
    backgroundColor: '#64748b',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  miniCollar: {
    width: 52,
    height: 6,
    backgroundColor: '#94a3b8',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  miniGlassVessel: {
    width: 68,
    height: 110,
    borderRadius: 18,
    borderWidth: 2.5,
    borderColor: '#94a3b8',
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  miniSpecularGlare: {
    position: 'absolute',
    top: 6,
    left: 4,
    width: 3,
    height: '70%',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 2,
    zIndex: 10,
  },
  miniLiquidMass: {
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  miniWaveBox: {
    position: 'absolute',
    top: -5,
    left: 0,
    width: 72,
    height: 14,
  },
  miniPedestal: {
    width: 64,
    height: 7,
    backgroundColor: '#94a3b8',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  rightInfoColumn: {
    flex: 1,
    paddingLeft: 16,
    justifyContent: 'space-between',
    height: '100%',
  },
  topMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  brandText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  percentageRow: {
    paddingVertical: 2,
  },
  percentageText: {
    fontSize: 38,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -1,
    lineHeight: 42,
  },
  volumeSubText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 1,
  },
  bottomMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 6,
  },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flowText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  widgetSizeTag: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94a3b8',
  },
});
