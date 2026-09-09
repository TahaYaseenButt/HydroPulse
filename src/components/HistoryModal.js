import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const HistoryModal = ({
  visible,
  logs = [],
  onClose,
  onClearLogs,
}) => {
  const handleClear = () => {
    Alert.alert(
      'Clear Stored History?',
      'This will delete all saved water level readings from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: onClearLogs },
      ]
    );
  };

  const renderLogItem = ({ item }) => (
    <View style={styles.logRow}>
      <View style={styles.logTimeCol}>
        <Text style={styles.logTime}>{item.displayTime || item.time}</Text>
        <Text style={styles.logSource}>{item.source === 'Sim' ? 'Simulation' : 'ESP32 Device'}</Text>
      </View>
      <View style={styles.logDataCol}>
        <Text style={styles.logDepth}>Water Depth: {item.depthCm} cm</Text>
        <Text style={styles.logDistance}>Distance: {item.distanceM} m</Text>
      </View>
      <View style={styles.logLevelCol}>
        <Text style={styles.logPercent}>{item.percentage}%</Text>
        <Text style={styles.logVolume}>{item.volumeL} L</Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="history" size={18} color="#0284c7" />
              </View>
              <Text style={styles.headerTitle}>Water Level History ({logs.length})</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Logs List */}
          {logs.length === 0 ? (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="inbox-outline" size={44} color="#94a3b8" />
              <Text style={styles.emptyText}>No reading history saved yet.</Text>
              <Text style={styles.emptySub}>
                Your water level updates are stored here automatically in real time.
              </Text>
            </View>
          ) : (
            <FlatList
              data={logs}
              keyExtractor={(_, index) => String(index)}
              renderItem={renderLogItem}
              contentContainerStyle={styles.listContent}
            />
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.btnClear, logs.length === 0 && styles.btnClearDisabled]}
              onPress={handleClear}
              disabled={logs.length === 0}
            >
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={16}
                color={logs.length === 0 ? '#94a3b8' : '#ef4444'}
              />
              <Text style={[styles.btnClearText, logs.length === 0 && { color: '#94a3b8' }]}>
                Clear History
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnClose} onPress={onClose}>
              <Text style={styles.btnCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    width: '100%',
    height: '75%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  listContent: {
    padding: 14,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  logTimeCol: {
    width: '32%',
  },
  logTime: {
    color: '#0f172a',
    fontSize: 12,
    fontFamily: 'monospace',
    fontWeight: '700',
  },
  logSource: {
    color: '#0284c7',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  logDataCol: {
    width: '44%',
  },
  logDepth: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  logDistance: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 1,
  },
  logLevelCol: {
    width: '24%',
    alignItems: 'flex-end',
  },
  logPercent: {
    color: '#0284c7',
    fontSize: 15,
    fontWeight: '800',
  },
  logVolume: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySub: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  btnClear: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fff',
  },
  btnClearDisabled: {
    borderColor: '#e2e8f0',
  },
  btnClearText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },
  btnClose: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnCloseText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },
});
