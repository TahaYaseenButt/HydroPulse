import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const NotificationBanner = ({
  alert,
  onDismiss,
  onAction,
}) => {
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (alert) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss success toast after 4 seconds
      if (alert.type === 'toast') {
        const timer = setTimeout(() => {
          handleDismiss();
        }, 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [alert]);

  if (!alert) return null;

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -80,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const getAlertStyle = () => {
    switch (alert.type) {
      case 'critical':
        return {
          bg: '#fef2f2',
          border: '#f87171',
          icon: 'alert-decagram',
          iconColor: '#dc2626',
          titleColor: '#991b1b',
          btnBg: '#dc2626',
          btnText: '#ffffff',
        };
      case 'warning':
        return {
          bg: '#fffbeb',
          border: '#fbbf24',
          icon: 'alert-circle',
          iconColor: '#d97706',
          titleColor: '#92400e',
          btnBg: '#d97706',
          btnText: '#ffffff',
        };
      case 'success':
        return {
          bg: '#f0fdf4',
          border: '#4ade80',
          icon: 'check-circle',
          iconColor: '#16a34a',
          titleColor: '#166534',
          btnBg: '#16a34a',
          btnText: '#ffffff',
        };
      case 'toast':
      default:
        return {
          bg: '#f0fdf4',
          border: '#86efac',
          icon: 'checkbox-marked-circle-outline',
          iconColor: '#059669',
          titleColor: '#065f46',
          btnBg: '#059669',
          btnText: '#ffffff',
        };
    }
  };

  const styleConfig = getAlertStyle();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
          backgroundColor: styleConfig.bg,
          borderColor: styleConfig.border,
        },
      ]}
    >
      <View style={styles.leftRow}>
        <MaterialCommunityIcons
          name={styleConfig.icon}
          size={24}
          color={styleConfig.iconColor}
        />
        <View style={styles.textWrap}>
          <Text style={[styles.title, { color: styleConfig.titleColor }]}>
            {alert.title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {alert.message}
          </Text>
        </View>
      </View>

      <View style={styles.actionRow}>
        {alert.actionText && onAction && (
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: styleConfig.btnBg }]}
            onPress={() => {
              onAction(alert.actionType);
              handleDismiss();
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.actionBtnText, { color: styleConfig.btnText }]}>
              {alert.actionText}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
          <MaterialCommunityIcons name="close" size={18} color="#64748b" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 12 : 8,
    left: 14,
    right: 14,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    lineHeight: 15,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
});
