import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';

export const TelemetryCards = ({
  depthMeters = '1.000',
  depthCm = 100,
  volumeLiters = 500,
  percentage = 50,
  totalCapacity = 1000,
  timeEstimate = 'Stable',
  flowStatus = 'stable',
}) => {
  return (
    <View style={styles.grid}>
      {/* Metric 1: Water Level Percentage */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.label}>Level</Text>
          <View style={[styles.iconWrap, { backgroundColor: COLORS.primaryTint }]}>
            <MaterialCommunityIcons name="water-percent" size={16} color={COLORS.primary} />
          </View>
        </View>
        <View style={styles.valueRow}>
          <Text style={styles.value}>{percentage}</Text>
          <Text style={styles.unit}>%</Text>
        </View>
        <Text
          style={[
            styles.sub,
            percentage <= 10 && { color: COLORS.dangerText, fontFamily: FONTS.bold },
            percentage <= 20 && percentage > 10 && { color: COLORS.warningText, fontFamily: FONTS.bold },
          ]}
        >
          {percentage <= 10 ? 'Critical' : percentage <= 20 ? 'Low' : 'Normal'}
        </Text>
      </View>

      {/* Metric 2: Remaining Volume */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.label}>Volume</Text>
          <View style={[styles.iconWrap, { backgroundColor: COLORS.primarySoft }]}>
            <MaterialCommunityIcons name="barrel" size={16} color={COLORS.primaryDark} />
          </View>
        </View>
        <View style={styles.valueRow}>
          <Text style={styles.value}>{volumeLiters.toLocaleString()}</Text>
          <Text style={styles.unit}>L</Text>
        </View>
        <Text style={styles.sub}>Total {totalCapacity.toLocaleString()} L</Text>
      </View>

      {/* Metric 3: Water Depth */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.label}>Depth</Text>
          <View style={[styles.iconWrap, { backgroundColor: COLORS.primaryTint }]}>
            <MaterialCommunityIcons name="arrow-up-down" size={15} color={COLORS.primary} />
          </View>
        </View>
        <View style={styles.valueRow}>
          <Text style={styles.value}>{depthMeters}</Text>
          <Text style={styles.unit}>m</Text>
        </View>
        <Text style={styles.sub}>{depthCm} cm</Text>
      </View>

      {/* Metric 4: Flow Rate Trend */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.label}>Flow</Text>
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor:
                  flowStatus === 'filling'
                    ? COLORS.primaryTint
                    : flowStatus === 'dropping'
                    ? COLORS.dangerBg
                    : COLORS.primarySoft,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={
                flowStatus === 'filling'
                  ? 'arrow-up-bold'
                  : flowStatus === 'dropping'
                  ? 'arrow-down-bold'
                  : 'minus'
              }
              size={15}
              color={
                flowStatus === 'filling'
                  ? COLORS.primary
                  : flowStatus === 'dropping'
                  ? COLORS.danger
                  : COLORS.primaryDark
              }
            />
          </View>
        </View>
        <View style={styles.valueRow}>
          <Text
            style={[
              styles.valueText,
              flowStatus === 'filling' && { color: COLORS.primary },
              flowStatus === 'dropping' && { color: COLORS.danger },
            ]}
          >
            {flowStatus === 'filling'
              ? 'Filling'
              : flowStatus === 'dropping'
              ? 'Draining'
              : 'Steady'}
          </Text>
        </View>
        <Text style={styles.sub}>
          {flowStatus === 'filling' || flowStatus === 'dropping'
            ? timeEstimate
            : 'Constant'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },
  card: {
    width: '48.3%',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    marginBottom: 4,
  },
  value: {
    fontFamily: FONTS.bold,
    fontSize: 22,
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  valueText: {
    fontFamily: FONTS.bold,
    fontSize: 18,
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  unit: {
    fontFamily: FONTS.medium,
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  sub: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
