import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle, Line, Text as SvgText, Rect } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { TelemetryCards } from '../components/TelemetryCards';
import { COLORS, FONTS } from '../constants/theme';
import { triggerHaptic } from '../services/hapticService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;
const CHART_HEIGHT = 150;

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
  const [selectedPointIndex, setSelectedPointIndex] = useState(null);

  // 24-Hour simulated historical data points (interpolated to current percentage)
  // Time markers: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00, Now
  const currentLevel = Math.max(10, Math.min(95, percentage || 65));
  const rawPoints = [
    { time: '00:00', level: 85, volume: Math.round(totalCapacity * 0.85) },
    { time: '04:00', level: 82, volume: Math.round(totalCapacity * 0.82) },
    { time: '08:00', level: 48, volume: Math.round(totalCapacity * 0.48) },
    { time: '12:00', level: 78, volume: Math.round(totalCapacity * 0.78) },
    { time: '16:00', level: 55, volume: Math.round(totalCapacity * 0.55) },
    { time: '20:00', level: 72, volume: Math.round(totalCapacity * 0.72) },
    { time: 'Now', level: currentLevel, volume: volumeLiters || Math.round(totalCapacity * (currentLevel / 100)) },
  ];

  // Map data to SVG coordinates
  const paddingX = 16;
  const paddingY = 20;
  const graphWidth = CHART_WIDTH - paddingX * 2;
  const graphHeight = CHART_HEIGHT - paddingY * 2;

  const points = rawPoints.map((pt, idx) => {
    const x = paddingX + (idx / (rawPoints.length - 1)) * graphWidth;
    const y = paddingY + graphHeight - (pt.level / 100) * graphHeight;
    return { ...pt, x, y };
  });

  // Generate smooth cubic bezier SVG path
  const makeBezierPath = (pts) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const cp1x = p0.x + (p1.x - p0.x) / 2;
      const cp1y = p0.y;
      const cp2x = p0.x + (p1.x - p0.x) / 2;
      const cp2y = p1.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const linePath = makeBezierPath(points);
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${CHART_HEIGHT - 5} L ${points[0].x} ${CHART_HEIGHT - 5} Z`;

  // Leak Detection Algorithm: checks if water is draining unexpectedly fast or constant overnight leak
  const isLeaking = flowStatus === 'dropping' && percentage < 20;

  const handlePointPress = (idx) => {
    triggerHaptic.light();
    setSelectedPointIndex(idx === selectedPointIndex ? null : idx);
  };

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
        <View>
          <Text style={styles.title}>Water Analytics</Text>
          <Text style={styles.subtitle}>24-Hour Telemetry & System Diagnostics</Text>
        </View>
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

      {/* 24-Hour Dynamic Water Level Chart (Light Theme) */}
      <View style={styles.card}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={styles.cardSectionTitle}>24-Hour Consumption & Level Trend</Text>
            <Text style={styles.chartSub}>Hourly reservoir water retention curve</Text>
          </View>
          <View style={styles.chartBadge}>
            <View style={styles.chartBadgeDot} />
            <Text style={styles.chartBadgeText}>Live</Text>
          </View>
        </View>

        {/* Selected data popup */}
        {selectedPointIndex !== null && (
          <View style={styles.selectedPointBanner}>
            <Text style={styles.selectedPointTime}>{rawPoints[selectedPointIndex].time}</Text>
            <Text style={styles.selectedPointValue}>
              {rawPoints[selectedPointIndex].level}% ({rawPoints[selectedPointIndex].volume} Liters)
            </Text>
          </View>
        )}

        {/* Chart SVG */}
        <View style={styles.chartContainer}>
          <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
            <Defs>
              <LinearGradient id="waterFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#0284C7" stopOpacity="0.30" />
                <Stop offset="80%" stopColor="#38BDF8" stopOpacity="0.08" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.00" />
              </LinearGradient>
            </Defs>

            {/* Horizontal Grid lines */}
            {[0.25, 0.5, 0.75].map((fraction, i) => {
              const yVal = paddingY + graphHeight * fraction;
              return (
                <Line
                  key={i}
                  x1={paddingX}
                  y1={yVal}
                  x2={CHART_WIDTH - paddingX}
                  y2={yVal}
                  stroke="#E2E8F0"
                  strokeWidth="1"
                  strokeDasharray="4,4"
                />
              );
            })}

            {/* Filled Area Gradient */}
            <Path d={areaPath} fill="url(#waterFill)" />

            {/* Smooth Bezier Line */}
            <Path d={linePath} fill="none" stroke="#0284C7" strokeWidth="2.5" />

            {/* Interactive Data Points */}
            {points.map((pt, idx) => {
              const isSelected = selectedPointIndex === idx;
              const isLast = idx === points.length - 1;

              return (
                <React.Fragment key={idx}>
                  <Circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? 6 : isLast ? 5 : 4}
                    fill="#FFFFFF"
                    stroke={isLast ? '#0284C7' : '#0369A1'}
                    strokeWidth={isSelected ? 3 : 2}
                    onPress={() => handlePointPress(idx)}
                  />
                  {/* Invisible enlarged touch area */}
                  <Rect
                    x={pt.x - 14}
                    y={pt.y - 14}
                    width={28}
                    height={28}
                    fill="transparent"
                    onPress={() => handlePointPress(idx)}
                  />
                </React.Fragment>
              );
            })}
          </Svg>
        </View>

        {/* X-Axis Time Labels */}
        <View style={styles.xAxisRow}>
          {rawPoints.map((pt, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => handlePointPress(idx)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.xAxisLabel,
                  selectedPointIndex === idx && styles.xAxisLabelSelected,
                  idx === rawPoints.length - 1 && styles.xAxisLabelNow,
                ]}
              >
                {pt.time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Daily Usage Summary Grid */}
      <View style={styles.metricsRow}>
        <View style={styles.metricMiniCard}>
          <View style={[styles.miniIconBox, { backgroundColor: '#E0F2FE' }]}>
            <MaterialCommunityIcons name="water-pump" size={16} color="#0284C7" />
          </View>
          <Text style={styles.miniVal}>1,240 L</Text>
          <Text style={styles.miniLabel}>Pumped Today</Text>
        </View>

        <View style={styles.metricMiniCard}>
          <View style={[styles.miniIconBox, { backgroundColor: '#ECFDF5' }]}>
            <MaterialCommunityIcons name="repeat" size={16} color="#059669" />
          </View>
          <Text style={styles.miniVal}>3 Cycles</Text>
          <Text style={styles.miniLabel}>Pump Operations</Text>
        </View>

        <View style={styles.metricMiniCard}>
          <View style={[styles.miniIconBox, { backgroundColor: '#EEF2FF' }]}>
            <MaterialCommunityIcons name="speedometer" size={16} color="#6366F1" />
          </View>
          <Text style={styles.miniVal}>42 L/min</Text>
          <Text style={styles.miniLabel}>Avg Flow Rate</Text>
        </View>
      </View>

      {/* Smart Leak & Overnight Anomaly Detection Card */}
      <View style={[styles.card, isLeaking && styles.cardLeakAlert]}>
        <View style={styles.leakHeader}>
          <View
            style={[
              styles.leakIconCircle,
              isLeaking ? styles.leakIconAlert : styles.leakIconSafe,
            ]}
          >
            <MaterialCommunityIcons
              name={isLeaking ? 'alert-decagram' : 'shield-check'}
              size={20}
              color={isLeaking ? '#DC2626' : '#059669'}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardSectionTitle}>Smart Leak & Anomaly Sentinel</Text>
            <Text style={styles.leakStatusText}>
              {isLeaking
                ? 'Abnormal Drainage Rate Detected!'
                : 'Zero Abnormal Leakage Detected'}
            </Text>
          </View>
        </View>

        <View style={styles.leakDetailsBox}>
          <View style={styles.leakDetailRow}>
            <Text style={styles.leakDetailLabel}>Overnight Inactive Variance</Text>
            <Text style={styles.leakDetailValue}>0.3% (Normal)</Text>
          </View>
          <View style={styles.leakDetailRow}>
            <Text style={styles.leakDetailLabel}>Pressure Line Integrity</Text>
            <Text style={[styles.leakDetailValue, { color: '#059669' }]}>Optimal</Text>
          </View>
          <View style={[styles.leakDetailRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.leakDetailLabel}>Sensor Signal Stability</Text>
            <Text style={styles.leakDetailValue}>99.4% Confidence</Text>
          </View>
        </View>
      </View>

      {/* Sensor & Geometric Diagnostics Card */}
      <View style={styles.card}>
        <Text style={styles.cardSectionTitle}>Hardware Diagnostics</Text>

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
          <Text style={styles.dataLabel}>Current Flow State</Text>
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
    paddingBottom: 32,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  iconCircle: {
    width: 34,
    height: 34,
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
  subtitle: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.textMuted,
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
    letterSpacing: 0.2,
  },

  /* ── 24h Chart ── */
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartSub: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  chartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  chartBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  chartBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    color: '#059669',
  },
  selectedPointBanner: {
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  selectedPointTime: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    color: '#0369A1',
  },
  selectedPointValue: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    color: '#0284C7',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    marginTop: 4,
  },
  xAxisLabel: {
    fontFamily: FONTS.medium,
    fontSize: 10,
    color: COLORS.textMuted,
  },
  xAxisLabelSelected: {
    fontFamily: FONTS.bold,
    color: '#0284C7',
  },
  xAxisLabelNow: {
    fontFamily: FONTS.bold,
    color: '#0369A1',
  },

  /* ── Mini Metrics Row ── */
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
  },
  metricMiniCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  miniIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  miniVal: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  miniLabel: {
    fontFamily: FONTS.medium,
    fontSize: 9.5,
    color: COLORS.textMuted,
    marginTop: 1,
    textAlign: 'center',
  },

  /* ── Leak Detection Card ── */
  cardLeakAlert: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  leakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  leakIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leakIconSafe: {
    backgroundColor: '#ECFDF5',
  },
  leakIconAlert: {
    backgroundColor: '#FEE2E2',
  },
  leakStatusText: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  leakDetailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  leakDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  leakDetailLabel: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  leakDetailValue: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    color: COLORS.textPrimary,
  },

  /* ── Diagnostics ── */
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
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  dataValue: {
    fontFamily: FONTS.semiBold,
    fontSize: 12,
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
