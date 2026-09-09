import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';

const TANK_WIDTH = 220;
const TANK_HEIGHT = 280;
const WAVELENGTH = 220;
const TOTAL_WAVE_WIDTH = WAVELENGTH * 3;

export const WaterTankView = ({
  percentage = 50,
  remainingLiters = 500,
  totalCapacity = 1000,
  flowStatus = 'stable',
  lowThreshold = 20,
  criticalThreshold = 10,
  highThreshold = 90,
}) => {
  const clampedPercent = Math.max(0, Math.min(100, percentage));
  const animatedPercent = useRef(new Animated.Value(clampedPercent)).current;

  // Horizontal wave travel animation
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animatedPercent, {
      toValue: clampedPercent,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [clampedPercent]);

  useEffect(() => {
    const waveLoop1 = Animated.loop(
      Animated.timing(waveAnim1, {
        toValue: 1,
        duration: 3400,
        useNativeDriver: false,
      })
    );

    const waveLoop2 = Animated.loop(
      Animated.timing(waveAnim2, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: false,
      })
    );

    waveLoop1.start();
    waveLoop2.start();

    return () => {
      waveLoop1.stop();
      waveLoop2.stop();
    };
  }, []);

  const getTheme = () => {
    if (clampedPercent <= criticalThreshold) {
      return {
        surfaceWave: '#f87171',
        liquidTop: '#fb7185',
        liquidBottom: '#e11d48',
        crestSheen: '#fecdd3',
        backWave: 'rgba(248, 113, 113, 0.45)',
        glow: 'rgba(225, 29, 72, 0.25)',
      };
    }
    if (clampedPercent <= lowThreshold) {
      return {
        surfaceWave: '#fbbf24',
        liquidTop: '#f59e0b',
        liquidBottom: '#d97706',
        crestSheen: '#fde68a',
        backWave: 'rgba(251, 191, 36, 0.45)',
        glow: 'rgba(217, 119, 6, 0.25)',
      };
    }
    return {
      surfaceWave: '#38bdf8',
      liquidTop: '#0ea5e9',
      liquidBottom: '#0284c7',
      crestSheen: '#bae6fd',
      backWave: 'rgba(56, 189, 248, 0.45)',
      glow: 'rgba(2, 132, 199, 0.25)',
    };
  };

  const theme = getTheme();

  const liquidHeight = animatedPercent.interpolate({
    inputRange: [0, 100],
    outputRange: [16, TANK_HEIGHT],
  });

  const wave1TranslateX = waveAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -WAVELENGTH],
  });

  const wave2TranslateX = waveAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [-WAVELENGTH, 0],
  });

  const frontWavePathD = `
    M 0 14
    Q 55 4, 110 14
    T 220 14
    T 330 14
    T 440 14
    T 550 14
    T 660 14
    L 660 350
    L 0 350
    Z
  `;

  const backWavePathD = `
    M 0 10
    Q 55 2, 110 10
    T 220 10
    T 330 10
    T 440 10
    T 550 10
    T 660 10
    L 660 350
    L 0 350
    Z
  `;

  const crestHighlightD = `
    M 0 14
    Q 55 4, 110 14
    T 220 14
    T 330 14
    T 440 14
    T 550 14
    T 660 14
  `;

  const isCovered = clampedPercent >= 45;

  return (
    <View style={styles.container}>
      {/* Main Glass Cylindrical Reservoir */}
      <View style={styles.glassVessel}>
        {/* Specular curved reflections */}
        <View style={styles.specularGlareLeft} />
        <View style={styles.specularGlareRight} />

        {/* Level Ruler Scale (100%, 75%, 50%, 25%, 0%) */}
        <View style={styles.rulerContainer}>
          {[100, 75, 50, 25, 0].map((val) => {
            const inWater = clampedPercent >= val;
            return (
              <View key={val} style={styles.rulerRow}>
                <Text
                  style={[
                    styles.rulerText,
                    inWater && styles.rulerTextInWater,
                  ]}
                >
                  {val}%
                </Text>
                <View
                  style={[
                    styles.rulerDash,
                    inWater && styles.rulerDashInWater,
                  ]}
                />
              </View>
            );
          })}
        </View>

        {/* Animated Fluid Liquid Body */}
        <Animated.View
          style={[
            styles.liquidBody,
            {
              height: liquidHeight,
            },
          ]}
        >
          {/* Back undulating wave */}
          <Animated.View
            style={[
              styles.waveAbsoluteLayer,
              {
                transform: [{ translateX: wave2TranslateX }],
              },
            ]}
          >
            <Svg width={TOTAL_WAVE_WIDTH} height={350} viewBox="0 0 660 350">
              <Path d={backWavePathD} fill={theme.backWave} />
            </Svg>
          </Animated.View>

          {/* Front fluid mass with gradient and crest sheen */}
          <Animated.View
            style={[
              styles.waveAbsoluteLayer,
              {
                transform: [{ translateX: wave1TranslateX }],
              },
            ]}
          >
            <Svg width={TOTAL_WAVE_WIDTH} height={350} viewBox="0 0 660 350">
              <Defs>
                <LinearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={theme.surfaceWave} stopOpacity="1" />
                  <Stop offset="0.12" stopColor={theme.liquidTop} stopOpacity="1" />
                  <Stop offset="0.8" stopColor={theme.liquidBottom} stopOpacity="1" />
                </LinearGradient>
              </Defs>
              <Path d={frontWavePathD} fill="url(#waterGrad)" />
              <Path
                d={crestHighlightD}
                stroke={theme.crestSheen}
                strokeWidth="2"
                fill="none"
                opacity="0.9"
              />
            </Svg>
          </Animated.View>
        </Animated.View>

        {/* Center Percentage & Liters Display */}
        <View style={styles.waterTextCenter}>
          <Text
            style={[
              styles.percentText,
              !isCovered && styles.percentTextDark,
            ]}
          >
            {Math.round(clampedPercent)}%
          </Text>
          <View style={styles.litersRow}>
            <MaterialCommunityIcons
              name="water"
              size={15}
              color={isCovered ? COLORS.white : COLORS.primary}
            />
            <Text
              style={[
                styles.litersText,
                !isCovered && styles.litersTextDark,
              ]}
            >
              {remainingLiters.toLocaleString()} L
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  topSensorNode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sensorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  sensorText: {
    fontFamily: FONTS.bold,
    fontSize: 9.5,
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  glassVessel: {
    width: TANK_WIDTH,
    height: TANK_HEIGHT,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'rgba(2, 132, 199, 0.22)',
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  specularGlareLeft: {
    position: 'absolute',
    top: 14,
    left: 8,
    width: 5,
    height: '75%',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderRadius: 3,
    zIndex: 20,
  },
  specularGlareRight: {
    position: 'absolute',
    top: 24,
    right: 24,
    width: 2.5,
    height: '60%',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 2,
    zIndex: 20,
  },
  rulerContainer: {
    position: 'absolute',
    right: 8,
    top: 20,
    bottom: 20,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 25,
  },
  rulerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rulerText: {
    fontFamily: FONTS.semiBold,
    fontSize: 9.5,
    color: COLORS.textMuted,
  },
  rulerTextInWater: {
    color: 'rgba(255, 255, 255, 0.95)',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  rulerDash: {
    width: 10,
    height: 2,
    backgroundColor: COLORS.borderStrong,
    borderRadius: 1,
  },
  rulerDashInWater: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  liquidBody: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
    zIndex: 10,
  },
  waveAbsoluteLayer: {
    position: 'absolute',
    top: -10,
    left: 0,
    width: TOTAL_WAVE_WIDTH,
    height: 350,
  },
  waterTextCenter: {
    position: 'absolute',
    top: '46%',
    alignSelf: 'center',
    alignItems: 'center',
    zIndex: 30,
  },
  percentText: {
    fontFamily: FONTS.extraBold,
    fontSize: 46,
    color: COLORS.white,
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  percentTextDark: {
    color: COLORS.textPrimary,
    textShadowColor: 'transparent',
  },
  litersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: -2,
  },
  litersText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.white,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  litersTextDark: {
    color: COLORS.primary,
    textShadowColor: 'transparent',
  },
  ambientGlowPool: {
    width: 160,
    height: 10,
    borderRadius: 80,
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
});
