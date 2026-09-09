import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const ActivityLogScreen = ({ logs = [], onClearLogs }) => {
  const handleClear = () => {
    Alert.alert(
      'Clear Telemetry Logs?',
      'Are you sure you want to erase all historical water readings?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: onClearLogs },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleArea}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons
              name="clipboard-text-clock-outline"
              size={20}
              color="#6366f1"
            />
          </View>
          <View>
            <Text style={styles.title}>Activity Log</Text>
            <Text style={styles.subtitle}>
              {logs.length} telemetry entries recorded
            </Text>
          </View>
        </View>

        {logs.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={handleClear}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={16} color="#ef4444" />
            <Text style={styles.clearBtnText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Logs List */}
      {logs.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="clipboard-clock-outline"
            size={56}
            color="#cbd5e1"
          />
          <Text style={styles.emptyTitle}>No Activity Recorded Yet</Text>
          <Text style={styles.emptyDesc}>
            Distance and water readings will automatically log here as data arrives.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.logList}
          contentContainerStyle={styles.logListContent}
          showsVerticalScrollIndicator={false}
        >
          {logs.map((item, index) => (
            <View key={item.time || index} style={styles.logCard}>
              <View style={styles.logTopRow}>
                <View style={styles.timeTag}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={12}
                    color="#64748b"
                  />
                  <Text style={styles.timeText}>
                    {item.displayTime || item.time?.slice(11, 19)}
                  </Text>
                </View>

                <View style={styles.sourcePill}>
                  <Text style={styles.sourceText}>{item.source || 'ESP32'}</Text>
                </View>
              </View>

              <View style={styles.logStatsRow}>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Water Level</Text>
                  <Text style={[styles.statValue, { color: '#0284c7' }]}>
                    {item.percentage}%
                  </Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Volume</Text>
                  <Text style={styles.statValue}>{item.volumeL} L</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Depth</Text>
                  <Text style={styles.statValue}>{item.depthCm} cm</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Distance</Text>
                  <Text style={styles.statValue}>{item.distanceCm} cm</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
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
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
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
    backgroundColor: '#e0e7ff',
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
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ef4444',
  },
  logList: {
    flex: 1,
  },
  logListContent: {
    padding: 16,
    gap: 10,
  },
  logCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  logTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  sourcePill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  logStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statCol: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#f1f5f9',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 14,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
});
