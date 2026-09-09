import React, { useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { triggerHaptic } from '../services/hapticService';
import { COLORS, FONTS } from '../constants/theme';

export const CooldownModal = ({
  visible = false,
  cooldownRemaining = 0,
  totalCooldown = 20,
  onClose,
}) => {
  // Trigger tactile warning when modal appears
  useEffect(() => {
    if (visible) {
      triggerHaptic.warning();
    }
  }, [visible]);

  // Auto-dismiss as soon as countdown completes
  useEffect(() => {
    if (visible && cooldownRemaining <= 0) {
      triggerHaptic.success();
      onClose?.();
    }
  }, [visible, cooldownRemaining, onClose]);

  if (!visible) return null;

  // Calculate live progress percentage (0 to 100%)
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((totalCooldown - cooldownRemaining) / totalCooldown) * 100))
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation?.()}>
            <View style={styles.card}>
              {/* Header Icon & Close Button */}
              <View style={styles.headerRow}>
                <View style={styles.iconBadge}>
                  <MaterialCommunityIcons
                    name="timer-sand"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => {
                    triggerHaptic.light();
                    onClose?.();
                  }}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={18}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {/* Title & Short Reason */}
              <Text style={styles.title}>Motor Cooldown Active</Text>
              <Text style={styles.subtitle}>
                Wait before switching motor to protect pump from damage.
              </Text>

              {/* Real-Time Live Ticking Counter */}
              <View style={styles.timerContainer}>
                <Text style={styles.timerNumber}>{cooldownRemaining}</Text>
                <Text style={styles.timerUnit}>seconds left</Text>
              </View>

              {/* Real-Time Progress Bar */}
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${progressPercent}%` },
                  ]}
                />
              </View>

              {/* Simple Got It / Dismiss Button */}
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  triggerHaptic.light();
                  onClose?.();
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.actionBtnText}>Got It</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primaryTint,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    padding: 4,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: FONTS.medium,
    fontSize: 12.5,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
    paddingHorizontal: 6,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    backgroundColor: COLORS.canvasAlt,
    borderWidth: 1,
    borderColor: COLORS.borderBlue,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 14,
    width: '100%',
  },
  timerNumber: {
    fontFamily: FONTS.extraBold,
    fontSize: 32,
    color: COLORS.primary,
    marginRight: 6,
    lineHeight: 36,
  },
  timerUnit: {
    fontFamily: FONTS.semiBold,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  progressBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: COLORS.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 18,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  actionBtn: {
    width: '100%',
    height: 42,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.white,
    letterSpacing: 0.2,
  },
});
