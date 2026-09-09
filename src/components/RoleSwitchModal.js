import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';

export const RoleSwitchModal = ({
  visible,
  onClose,
  activeUser,
  onSelectRole,
  onSignOut,
}) => {
  const isParent = activeUser?.role === 'parent';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalCard}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Account Role</Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialCommunityIcons name="close" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Role Option 1: PARENT */}
              <TouchableOpacity
                style={[
                  styles.roleCard,
                  isParent && styles.roleCardActive,
                ]}
                onPress={() => {
                  onSelectRole('parent');
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <View style={styles.roleCardHeader}>
                  <View style={[styles.badgeIcon, isParent && styles.badgeIconActive]}>
                    <MaterialCommunityIcons
                      name="crown-outline"
                      size={18}
                      color={isParent ? COLORS.white : COLORS.primary}
                    />
                  </View>
                  <View style={styles.roleInfo}>
                    <Text style={styles.roleName}>Parent</Text>
                    <Text style={styles.roleDesc}>Full pump & system access</Text>
                  </View>
                  <View style={[styles.radioCircle, isParent && styles.radioCircleActive]}>
                    {isParent && <View style={styles.radioDot} />}
                  </View>
                </View>
              </TouchableOpacity>

              {/* Role Option 2: CHILD */}
              <TouchableOpacity
                style={[
                  styles.roleCard,
                  !isParent && styles.roleCardActive,
                ]}
                onPress={() => {
                  onSelectRole('child');
                  onClose();
                }}
                activeOpacity={0.8}
              >
                <View style={styles.roleCardHeader}>
                  <View style={[styles.badgeIcon, !isParent && styles.badgeIconActive]}>
                    <MaterialCommunityIcons
                      name="account-child-outline"
                      size={18}
                      color={!isParent ? COLORS.white : COLORS.primary}
                    />
                  </View>
                  <View style={styles.roleInfo}>
                    <Text style={styles.roleName}>Child</Text>
                    <Text style={styles.roleDesc}>View-only monitor access</Text>
                  </View>
                  <View style={[styles.radioCircle, !isParent && styles.radioCircleActive]}>
                    {!isParent && <View style={styles.radioDot} />}
                  </View>
                </View>
              </TouchableOpacity>

              {/* Footer Sign Out */}
              {onSignOut && (
                <TouchableOpacity
                  style={styles.signOutBtn}
                  onPress={() => {
                    onClose();
                    onSignOut();
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="logout" size={15} color={COLORS.dangerText} />
                  <Text style={styles.signOutText}>Sign Out of Device</Text>
                </TouchableOpacity>
              )}
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
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    gap: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: COLORS.textPrimary,
  },
  closeBtn: {
    padding: 4,
  },
  roleCard: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  roleCardActive: {
    backgroundColor: COLORS.primarySoft,
    borderColor: COLORS.primary,
  },
  roleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  badgeIconActive: {
    backgroundColor: COLORS.primary,
  },
  roleInfo: {
    flex: 1,
  },
  roleName: {
    fontFamily: FONTS.bold,
    fontSize: 14,
    color: COLORS.textPrimary,
  },
  roleDesc: {
    fontFamily: FONTS.medium,
    fontSize: 11.5,
    color: COLORS.textMuted,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: COLORS.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: COLORS.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 4,
    borderRadius: 10,
    backgroundColor: COLORS.dangerBg,
  },
  signOutText: {
    fontFamily: FONTS.bold,
    fontSize: 12.5,
    color: COLORS.dangerText,
  },
});
