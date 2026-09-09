import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SmallWidget } from '../components/widgets/SmallWidget';
import { MediumWidget } from '../components/widgets/MediumWidget';
import { LargeWidget } from '../components/widgets/LargeWidget';

export const WidgetsScreen = ({
  percentage,
  remainingLiters,
  totalCapacity,
  depthMeters,
  depthCm,
  motorState,
  cooldownRemaining,
  onStartMotor,
  onStopMotor,
  flowStatus,
  lowThreshold,
  criticalThreshold,
  highThreshold,
  isConnected,
  userRole = 'parent',
}) => {
  const [selectedSize, setSelectedSize] = useState('all'); // 'all', 'small', 'medium', 'large'

  const handleHowToAdd = () => {
    Alert.alert(
      'How to Add Widgets to Home Screen',
      '1. Long-press on your phone\'s Home Screen.\n2. Tap "Widgets" or "+" button.\n3. Search or scroll to "HydroPulse".\n4. Select your preferred size:\n   • Small (2×2): Percentage Only\n   • Medium (4×2): Tank & Water Level\n   • Large (4×4): Full Tank + Pump Controls\n5. Tap "Add Widget" to place it!'
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleArea}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="widgets-outline" size={20} color="#0284c7" />
          </View>
          <View>
            <Text style={styles.title}>Home Screen Widgets</Text>
            <Text style={styles.subtitle}>Glanceable reservoir & pump controls</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.helpBtn} onPress={handleHowToAdd} activeOpacity={0.7}>
          <MaterialCommunityIcons name="help-circle-outline" size={16} color="#0284c7" />
          <Text style={styles.helpBtnText}>Guide</Text>
        </TouchableOpacity>
      </View>

      {/* Size Filter Selector */}
      <View style={styles.filterRow}>
        {[
          { id: 'all', label: 'All Sizes' },
          { id: 'small', label: 'Small (2×2)' },
          { id: 'medium', label: 'Medium (4×2)' },
          { id: 'large', label: 'Large (4×4)' },
        ].map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.filterBtn, selectedSize === item.id && styles.filterBtnActive]}
            onPress={() => setSelectedSize(item.id)}
          >
            <Text
              style={[
                styles.filterBtnText,
                selectedSize === item.id && styles.filterBtnTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Widgets Showcase Scroll */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Small Widget Section */}
        {(selectedSize === 'all' || selectedSize === 'small') && (
          <View style={styles.widgetCardSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.badgeWrap}>
                <Text style={styles.badgeText}>Small 2×2</Text>
              </View>
              <Text style={styles.sectionDesc}>Shows only water percentage</Text>
            </View>
            <View style={styles.widgetWrapper}>
              <SmallWidget
                percentage={percentage}
                lowThreshold={lowThreshold}
                criticalThreshold={criticalThreshold}
                highThreshold={highThreshold}
              />
            </View>
          </View>
        )}

        {/* 2. Medium Widget Section */}
        {(selectedSize === 'all' || selectedSize === 'medium') && (
          <View style={styles.widgetCardSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.badgeWrap}>
                <Text style={styles.badgeText}>Medium 4×2</Text>
              </View>
              <Text style={styles.sectionDesc}>Shows tank with water level & liters</Text>
            </View>
            <View style={styles.widgetWrapper}>
              <MediumWidget
                percentage={percentage}
                remainingLiters={remainingLiters}
                totalCapacity={totalCapacity}
                flowStatus={flowStatus}
                lowThreshold={lowThreshold}
                criticalThreshold={criticalThreshold}
                highThreshold={highThreshold}
              />
            </View>
          </View>
        )}

        {/* 3. Large Widget Section */}
        {(selectedSize === 'all' || selectedSize === 'large') && (
          <View style={styles.widgetCardSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.badgeWrap}>
                <Text style={styles.badgeText}>Large 4×4</Text>
              </View>
              <Text style={styles.sectionDesc}>Complete tank + interactive pump control buttons</Text>
            </View>
            <View style={styles.widgetWrapper}>
              <LargeWidget
                percentage={percentage}
                remainingLiters={remainingLiters}
                totalCapacity={totalCapacity}
                depthMeters={depthMeters}
                depthCm={depthCm}
                motorState={motorState}
                cooldownRemaining={cooldownRemaining}
                onStartMotor={onStartMotor}
                onStopMotor={onStopMotor}
                flowStatus={flowStatus}
                lowThreshold={lowThreshold}
                criticalThreshold={criticalThreshold}
                highThreshold={highThreshold}
                isConnected={isConnected}
                userRole={userRole}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 1,
  },
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  helpBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284c7',
  },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 6,
  },
  filterBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  filterBtnActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  filterBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  filterBtnTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 20,
    paddingBottom: 36,
  },
  widgetCardSection: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    alignItems: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  badgeWrap: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0284c7',
  },
  sectionDesc: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  widgetWrapper: {
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
