import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TelemetryCards } from '../components/TelemetryCards';
import { COLORS, FONTS } from '../constants/theme';

export const AnalyticsScreen = ({
  depthMeters,
  depthCm,
  volumeLiters,
  percentage,
  totalCapacity,
  timeEstimate,
  flowStatus,
  distanceCm,
  settings,
}) => {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Screen Title */}
      <View style={styles.headerRow}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="chart-timeline-variant-shimmer" size={18} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>Analytics</Text>
      </View>

      {/* Main Metric Cards */}
      <TelemetryCards
        depthMeters={depthMeters}
        depthCm={depthCm}
        volumeLiters={volumeLiters}
        percentage={percentage}
        totalCapacity={totalCapacity}
        timeEstimate={timeEstimate}
        flowStatus={flowStatus}
      />

      {/* Sensor & Geometric Diagnostics Card */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>Diagnostics</Text>

        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Sensor Distance</Text>
          <Text style={styles.dataValue}>{distanceCm} cm</Text>
        </View>

        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Water Depth</Text>
          <Text style={styles.dataValue}>{depthCm} cm ({depthMeters} m)</Text>
        </View>

        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Tank Height</Text>
          <Text style={styles.dataValue}>{settings?.totalHeight || 200} cm</Text>
        </View>

        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Tank Diameter</Text>
          <Text style={styles.dataValue}>{settings?.tankWidth || 100} cm</Text>
        </View>

        <View style={styles.dataRow}>
          <Text style={styles.dataLabel}>Sensor Offset</Text>
          <Text style={styles.dataValue}>{settings?.sensorOffset || 10} cm</Text>
        </View>

        <View style={[styles.dataRow, styles.dataRowLast]}>
          <Text style={styles.dataLabel}>Flow State</Text>
          <View style={styles.flowPill}>
            <MaterialCommunityIcons
              name={
                flowStatus === 'filling'
                  ? 'arrow-up-bold'
                  : flowStatus === 'dropping'
                  ? 'arrow-down-bold'
                  : 'minus'
              }
              size={12}
              color={
                flowStatus === 'filling'
                  ? COLORS.success
                  : flowStatus === 'dropping'
                  ? COLORS.danger
                  : COLORS.textMuted
              }
            />
            <Text
              style={[
                styles.flowPillText,
                flowStatus === 'filling' && { color: COLORS.successText },
                flowStatus === 'dropping' && { color: COLORS.dangerText },
              ]}
            >
              {flowStatus === 'filling'
                ? 'Filling'
                : flowStatus === 'dropping'
                ? 'Draining'
                : 'Steady'}
            </Text>
          </View>
        </View>
      </View>
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
    gap: 10,
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
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  cardSectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: COLORS.textPrimary,
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  dataRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 2,
  },
  dataLabel: {
    fontFamily: FONTS.medium,
    fontSize: 12.5,
    color: COLORS.textSecondary,
  },
  dataValue: {
    fontFamily: FONTS.semiBold,
    fontSize: 12.5,
    color: COLORS.textPrimary,
  },
  flowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  flowPillText: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: COLORS.textMuted,
  },
});
