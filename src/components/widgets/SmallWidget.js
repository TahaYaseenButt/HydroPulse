import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const SmallWidget = ({
  percentage = 50,
  lowThreshold = 20,
  criticalThreshold = 10,
  highThreshold = 90,
}) => {
  const clampedPercent = Math.max(0, Math.min(100, Math.round(percentage)));

  const getTheme = () => {
    if (clampedPercent <= criticalThreshold) {
      return {
        accent: '#ef4444',
        bg: '#ffffff',
        dot: '#ef4444',
        status: 'Critical Low',
        iconColor: '#ef4444',
      };
    }
    if (clampedPercent <= lowThreshold) {
      return {
        accent: '#f59e0b',
        bg: '#ffffff',
        dot: '#f59e0b',
        status: 'Low Water',
        iconColor: '#f59e0b',
      };
    }
    if (clampedPercent >= highThreshold) {
      return {
        accent: '#06b6d4',
        bg: '#ffffff',
        dot: '#06b6d4',
        status: 'Tank Full',
        iconColor: '#06b6d4',
      };
    }
    return {
      accent: '#0284c7',
      bg: '#ffffff',
      dot: '#0284c7',
      status: 'Normal Level',
      iconColor: '#0284c7',
    };
  };

  const theme = getTheme();

  return (
    <View style={[styles.widgetContainer, { backgroundColor: theme.bg }]}>
      {/* Top Header Row */}
      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          <MaterialCommunityIcons name="water" size={16} color={theme.iconColor} />
          <Text style={styles.brandText}>Hydro Pulse</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: theme.dot }]} />
      </View>

      {/* Center Main Percentage (As requested: only water percentage for small size) */}
      <View style={styles.centerArea}>
        <Text style={[styles.percentNumber, { color: theme.accent }]}>
          {clampedPercent}
          <Text style={styles.percentSymbol}>%</Text>
        </Text>
      </View>

      {/* Bottom Subtitle Status */}
      <View style={styles.bottomRow}>
        <Text style={[styles.statusText, { color: theme.accent }]}>{theme.status}</Text>
        <Text style={styles.widgetSizeTag}>2×2 Small</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  widgetContainer: {
    width: 155,
    height: 155,
    borderRadius: 24,
    padding: 14,
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  topRow: {
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
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  centerArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  percentNumber: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1.5,
    lineHeight: 52,
  },
  percentSymbol: {
    fontSize: 24,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  widgetSizeTag: {
    fontSize: 9,
    fontWeight: '600',
    color: '#94a3b8',
  },
});
