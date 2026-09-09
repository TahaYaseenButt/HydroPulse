import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';

const TANK_WIDTH = 224;
const TANK_HEIGHT = 284;
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
  motorState = false,
}) => {
  const clampedPercent = Math.max(0, Math.min(100, percentage));
  const animatedPercent = useRef(new Animated.Value(clampedPercent)).current;

  // Horizontal wave travel animations
  const waveAnim1 = useRef(new Animated.Value(0)).current;
  const waveAnim2 = useRef(new Animated.Value(0)).current;

  // Rising micro-bubbles
  const bubble1 = useRef(new Animated.Value(0)).current;
  const bubble2 = useRef(new Animated.Value(0)).current;
  const bubble3 = useRef(new Animated.Value(0)).current;
  const bubble4 = useRef(new Animated.Value(0)).current;

  // Inlet Water Stream & Surface Splash
  const jetAnim = useRef(new Animated.Value(0)).current;
  const splashRipple = useRef(new Animated.Value(0)).current;

  // Water level height animation
  useEffect(() => {
    Animated.timing(animatedPercent, {
      toValue: clampedPercent,
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [clampedPercent]);

  // Wave speed dynamic controller (Accelerates when pump is active or water is filling)
  const isSurging = motorState || flowStatus === 'filling';
  useEffect(() => {
    const wave1Duration = isSurging ? 1300 : 3200;
    const wave2Duration = isSurging ? 950 : 2400;

    const waveLoop1 = Animated.loop(
      Animated.timing(waveAnim1, {
        toValue: 1,
        duration: wave1Duration,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );

    const waveLoop2 = Animated.loop(
      Animated.timing(waveAnim2, {
        toValue: 1,
        duration: wave2Duration,
        easing: Easing.linear,
        useNativeDriver: false,
      })
    );

    waveLoop1.start();
    waveLoop2.start();

    return () => {
      waveLoop1.stop();
      waveLoop2.stop();
    };
  }, [isSurging]);

  // Rising micro-bubbles loop
  useEffect(() => {
    const createBubbleLoop = (anim, duration, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: isSurging ? duration * 0.6 : duration,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );

    const b1Loop = createBubbleLoop(bubble1, 2400, 100);
    const b2Loop = createBubbleLoop(bubble2, 1900, 600);
    const b3Loop = createBubbleLoop(bubble3, 2800, 300);
    const b4Loop = createBubbleLoop(bubble4, 2100, 900);

    b1Loop.start();
    b2Loop.start();
    b3Loop.start();
    b4Loop.start();

    return () => {
      b1Loop.stop();
      b2Loop.stop();
      b3Loop.stop();
      b4Loop.stop();
    };
  }, [isSurging]);

  // Water jet stream & splash ripple loop when motor is active
  useEffect(() => {
    if (!motorState) return;

    const jetLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(jetAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(jetAnim, {
          toValue: 0.6,
          duration: 350,
          useNativeDriver: true,
        }),
      ])
    );

    const splashLoop = Animated.loop(
      Animated.timing(splashRipple, {
        toValue: 1,
        duration: 700,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    );

    jetLoop.start();
    splashLoop.start();

    return () => {
      jetLoop.stop();
      splashLoop.stop();
    };
  }, [motorState]);

  // Palette theme based on level thresholds
  const getTheme = () => {
    if (clampedPercent <= criticalThreshold) {
      return {
        surfaceWave: '#f87171',
        liquidTop: '#fb7185',
        liquidBottom: '#e11d48',
        crestSheen: '#fecdd3',
        backWave: 'rgba(248, 113, 113, 0.45)',
        glow: 'rgba(239, 68, 68, 0.18)',
        borderColor: 'rgba(239, 68, 68, 0.3)',
      };
    }
    if (clampedPercent <= lowThreshold) {
      return {
        surfaceWave: '#fbbf24',
        liquidTop: '#f59e0b',
        liquidBottom: '#d97706',
        crestSheen: '#fde68a',
        backWave: 'rgba(251, 191, 36, 0.45)',
        glow: 'rgba(245, 158, 11, 0.18)',
        borderColor: 'rgba(245, 158, 11, 0.3)',
      };
    }
    if (clampedPercent >= highThreshold) {
      return {
        surfaceWave: '#34d399',
        liquidTop: '#10b981',
        liquidBottom: '#059669',
        crestSheen: '#a7f3d0',
        backWave: 'rgba(52, 211, 153, 0.45)',
        glow: 'rgba(16, 185, 129, 0.18)',
        borderColor: 'rgba(16, 185, 129, 0.3)',
      };
    }
    return {
      surfaceWave: '#38bdf8',
      liquidTop: '#0ea5e9',
      liquidBottom: '#0284c7',
      crestSheen: '#bae6fd',
      backWave: 'rgba(56, 189, 248, 0.45)',
      glow: 'rgba(2, 132, 199, 0.18)',
      borderColor: 'rgba(2, 132, 199, 0.22)',
    };
  };

  const theme = getTheme();

  const liquidHeight = animatedPercent.interpolate({
    inputRange: [0, 100],
    outputRange: [18, TANK_HEIGHT],
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
      {/* Dynamic Ambient Back-Glow Halo */}
      <View style={[styles.ambientBackGlow, { backgroundColor: theme.glow }]} />

      {/* Main Glass Cylindrical Vessel */}
      <View style={[styles.glassVessel, { borderColor: theme.borderColor }]}>
        {/* Specular Curved Reflections */}
        <View style={styles.specularGlareLeft} />
        <View style={styles.specularGlareRight} />

        {/* Top Nozzle / Inlet Fitting */}
        <View style={styles.topInletFitting}>
          <View style={styles.nozzleCap} />
        </View>

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

        {/* Active Pump Inlet Water Jet Stream pouring from top */}
        {motorState && clampedPercent < 98 && (
          <View style={styles.jetStreamContainer}>
            <Animated.View
              style={[
                styles.jetStreamInner,
                {
                  opacity: jetAnim.interpolate({
                    inputRange: [0.6, 1],
                    outputRange: [0.75, 1],
                  }),
                  transform: [
                    {
                      scaleX: jetAnim.interpolate({
                        inputRange: [0.6, 1],
                        outputRange: [0.9, 1.1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Svg width={12} height={TANK_HEIGHT} viewBox="0 0 12 280">
                <Defs>
                  <LinearGradient id="streamGrad" x1="0" y1="0" x2="1" y2="0">
                    <Stop offset="0" stopColor="rgba(255, 255, 255, 0.4)" />
                    <Stop offset="0.5" stopColor="rgba(14, 165, 233, 0.9)" />
                    <Stop offset="1" stopColor="rgba(255, 255, 255, 0.4)" />
                  </LinearGradient>
                </Defs>
                <Path d="M 3 0 Q 6 140 4 280 L 8 280 Q 6 140 9 0 Z" fill="url(#streamGrad)" />
              </Svg>
            </Animated.View>
          </View>
        )}

        {/* Animated Fluid Liquid Body */}
        <Animated.View
          style={[
            styles.liquidBody,
            {
              height: liquidHeight,
            },
          ]}
        >
          {/* Back Undulating Wave */}
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

          {/* Rising Translucent Micro-Bubbles */}
          {[
            { anim: bubble1, left: '26%', size: 5 },
            { anim: bubble2, left: '46%', size: 7 },
            { anim: bubble3, left: '70%', size: 4 },
            { anim: bubble4, left: '36%', size: 6 },
          ].map((b, idx) => (
            <Animated.View
              key={idx}
              style={[
                styles.microBubble,
                {
                  left: b.left,
                  width: b.size,
                  height: b.size,
                  borderRadius: b.size / 2,
                  transform: [
                    {
                      translateY: b.anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [170, 0],
                      }),
                    },
                  ],
                  opacity: b.anim.interpolate({
                    inputRange: [0, 0.2, 0.7, 1],
                    outputRange: [0, 0.8, 0.8, 0],
                  }),
                },
              ]}
            />
          ))}

          {/* Front Fluid Mass with Gradient and Crest Sheen */}
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
                opacity="0.95"
              />
            </Svg>
          </Animated.View>

          {/* Water Surface Splash Ripple Effect when motor is pouring */}
          {motorState && clampedPercent < 98 && (
            <Animated.View
              style={[
                styles.splashRippleCircle,
                {
                  transform: [
                    {
                      scale: splashRipple.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.4, 1.8],
                      }),
                    },
                  ],
                  opacity: splashRipple.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.8, 0.5, 0],
                  }),
                },
              ]}
            />
          )}
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
    position: 'relative',
  },
  ambientBackGlow: {
    position: 'absolute',
    width: TANK_WIDTH + 50,
    height: TANK_HEIGHT + 40,
    borderRadius: 60,
    zIndex: 1,
  },
  glassVessel: {
    width: TANK_WIDTH,
    height: TANK_HEIGHT,
    borderRadius: 36,
    borderWidth: 2,
    backgroundColor: COLORS.white,
    overflow: 'hidden',
    position: 'relative',
    zIndex: 10,
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
  topInletFitting: {
    position: 'absolute',
    top: 0,
    alignSelf: 'center',
    width: 32,
    height: 6,
    backgroundColor: '#E2E8F0',
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    alignItems: 'center',
    zIndex: 25,
    borderWidth: 1,
    borderTopWidth: 0,
    borderColor: '#CBD5E1',
  },
  nozzleCap: {
    width: 14,
    height: 3,
    backgroundColor: '#94A3B8',
    borderRadius: 2,
    marginTop: 1,
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
  jetStreamContainer: {
    position: 'absolute',
    top: 6,
    alignSelf: 'center',
    width: 12,
    height: '100%',
    zIndex: 15,
    alignItems: 'center',
  },
  jetStreamInner: {
    width: 12,
    height: '100%',
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
  microBubble: {
    position: 'absolute',
    bottom: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    zIndex: 18,
  },
  splashRippleCircle: {
    position: 'absolute',
    top: 6,
    alignSelf: 'center',
    width: 28,
    height: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 19,
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
});
