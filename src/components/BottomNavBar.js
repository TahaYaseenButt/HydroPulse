import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { triggerHaptic } from '../services/hapticService';
import { COLORS, FONTS } from '../constants/theme';

export const BottomNavBar = ({ activeTab, onSelectTab, userRole = 'parent' }) => {
  const insets = useSafeAreaInsets();
  const isChild = userRole === 'child';

  const tabs = [
    {
      id: 'reservoir',
      label: 'Reservoir',
      icon: 'water-circle',
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: 'chart-timeline-variant-shimmer',
    },
    {
      id: 'pump',
      label: 'Pump',
      icon: isChild ? 'lock-outline' : 'lightning-bolt-circle',
      isLockedForChild: isChild,
    },
    {
      id: 'setup',
      label: 'Settings',
      icon: 'cog-outline',
    },
  ];

  const activeIndex = Math.max(
    0,
    tabs.findIndex((t) => t.id === activeTab)
  );

  // Scale animation for each tab icon
  const scaleAnims = useRef(tabs.map(() => new Animated.Value(1))).current;
  // Shake animation for locked tab press
  const shakeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Subtle bounce for active tab
    scaleAnims[activeIndex].setValue(0.85);
    Animated.spring(scaleAnims[activeIndex], {
      toValue: 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  }, [activeIndex]);

  const handleTabPress = (tab) => {
    if (tab.isLockedForChild) {
      triggerHaptic.warning();
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: -5, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 5, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -3, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 3, duration: 40, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 30, useNativeDriver: true }),
      ]).start();

      Alert.alert(
        'Parent Access Required',
        'Child accounts have view-only access. Motor control is locked.'
      );
      return;
    }
    triggerHaptic.light();
    onSelectTab(tab.id);
  };

  // Safe bottom padding for edge screens and gesture bars
  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 16 : 8);

  return (
    <View style={[styles.navBarContainer, { paddingBottom: bottomInset }]}>
      {tabs.map((tab, idx) => {
        const isActive = activeTab === tab.id;
        const isLocked = tab.isLockedForChild;

        return (
          <TouchableOpacity
            key={tab.id}
            style={styles.tabItem}
            onPress={() => handleTabPress(tab)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={tab.label}
          >
            {/* Top Anchor Indicator for Active Tab */}
            {isActive && <View style={styles.topAnchorBar} />}

            {/* Icon Wrap with Active Pill Highlight */}
            <Animated.View
              style={[
                styles.iconWrap,
                isActive && styles.iconWrapActive,
                {
                  transform: [
                    { scale: scaleAnims[idx] },
                    ...(isLocked ? [{ translateX: shakeAnim }] : []),
                  ],
                },
              ]}
            >
              <MaterialCommunityIcons
                name={tab.icon}
                size={22}
                color={
                  isLocked
                    ? COLORS.danger
                    : isActive
                    ? COLORS.primary
                    : COLORS.textMuted
                }
              />
            </Animated.View>

            {/* Tab Label */}
            <View style={styles.labelRow}>
              <Text
                style={[
                  styles.tabLabel,
                  isActive && styles.tabLabelActive,
                  isLocked && styles.tabLabelLocked,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
              {isLocked && (
                <MaterialCommunityIcons
                  name="lock"
                  size={9}
                  color={COLORS.danger}
                  style={{ marginLeft: 2 }}
                />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  navBarContainer: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 6,
    paddingHorizontal: 4,
    // Subtle upward elevation to connect seamlessly with screen content
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    position: 'relative',
  },
  topAnchorBar: {
    position: 'absolute',
    top: -6,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  iconWrap: {
    width: 46,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  iconWrapActive: {
    backgroundColor: COLORS.primarySoft,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 0.1,
  },
  tabLabelActive: {
    fontFamily: FONTS.bold,
    color: COLORS.primary,
  },
  tabLabelLocked: {
    color: COLORS.danger,
  },
});
