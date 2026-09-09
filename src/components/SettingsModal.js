import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const SettingsModal = ({
  visible,
  settings,
  onClose,
  onSaveSettings,
  onResetSettings,
}) => {
  const [activeTab, setActiveTab] = useState('tank'); // 'tank', 'alerts', 'mqtt'

  // Form State
  const [totalCapacity, setTotalCapacity] = useState(String(settings.totalCapacity || 1000));
  const [totalHeight, setTotalHeight] = useState(String(settings.totalHeight || 200));
  const [tankWidth, setTankWidth] = useState(String(settings.tankWidth || 100));
  const [sensorOffset, setSensorOffset] = useState(String(settings.sensorOffset || 10));
  const [sensorUnit, setSensorUnit] = useState(settings.sensorUnit || 'meters');

  const [mqttHost, setMqttHost] = useState(settings.mqttHost || '');
  const [mqttPort, setMqttPort] = useState(String(settings.mqttPort || 8884));
  const [mqttUsername, setMqttUsername] = useState(settings.mqttUsername || '');
  const [mqttPassword, setMqttPassword] = useState(settings.mqttPassword || '');
  const [mqttTopic, setMqttTopic] = useState(settings.mqttTopic || 'waterlevel/distance');

  const [lowThreshold, setLowThreshold] = useState(String(settings.lowThreshold || 20));
  const [criticalThreshold, setCriticalThreshold] = useState(String(settings.criticalThreshold || 10));
  const [highThreshold, setHighThreshold] = useState(String(settings.highThreshold || 90));
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    settings.notificationsEnabled !== undefined ? settings.notificationsEnabled : true
  );

  // Sync state whenever modal is opened or settings change
  useEffect(() => {
    if (visible && settings) {
      setTotalCapacity(String(settings.totalCapacity || 1000));
      setTotalHeight(String(settings.totalHeight || 200));
      setTankWidth(String(settings.tankWidth || 100));
      setSensorOffset(String(settings.sensorOffset || 10));
      setSensorUnit(settings.sensorUnit || 'meters');

      setMqttHost(settings.mqttHost || '');
      setMqttPort(String(settings.mqttPort || 8884));
      setMqttUsername(settings.mqttUsername || '');
      setMqttPassword(settings.mqttPassword || '');
      setMqttTopic(settings.mqttTopic || 'waterlevel/distance');

      setLowThreshold(String(settings.lowThreshold || 20));
      setCriticalThreshold(String(settings.criticalThreshold || 10));
      setHighThreshold(String(settings.highThreshold || 90));
      setNotificationsEnabled(
        settings.notificationsEnabled !== undefined ? settings.notificationsEnabled : true
      );
    }
  }, [visible, settings]);

  const handleSave = () => {
    const updated = {
      ...settings,
      totalCapacity: Math.max(1, parseFloat(totalCapacity) || 1000),
      totalHeight: Math.max(1, parseFloat(totalHeight) || 200),
      tankWidth: Math.max(1, parseFloat(tankWidth) || 100),
      sensorOffset: Math.max(0, parseFloat(sensorOffset) || 10),
      sensorUnit,

      mqttHost: mqttHost.trim(),
      mqttPort: parseInt(mqttPort, 10) || 8884,
      mqttUsername: mqttUsername.trim(),
      mqttPassword,
      mqttTopic: mqttTopic.trim(),

      lowThreshold: Math.max(1, Math.min(99, parseFloat(lowThreshold) || 20)),
      criticalThreshold: Math.max(1, Math.min(99, parseFloat(criticalThreshold) || 10)),
      highThreshold: Math.max(1, Math.min(100, parseFloat(highThreshold) || 90)),
      notificationsEnabled,
    };

    onSaveSettings(updated);
    onClose();
  };

  const handleReset = () => {
    Alert.alert(
      'Reset All Settings?',
      'Are you sure you want to restore tank dimensions and connection defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset to Defaults',
          style: 'destructive',
          onPress: async () => {
            const defaults = await onResetSettings();
            setTotalCapacity(String(defaults.totalCapacity));
            setTotalHeight(String(defaults.totalHeight));
            setTankWidth(String(defaults.tankWidth));
            setSensorOffset(String(defaults.sensorOffset));
            setSensorUnit(defaults.sensorUnit);
            setMqttHost(defaults.mqttHost);
            setMqttPort(String(defaults.mqttPort));
            setMqttUsername(defaults.mqttUsername);
            setMqttPassword(defaults.mqttPassword);
            setMqttTopic(defaults.mqttTopic);
            setLowThreshold(String(defaults.lowThreshold));
            setCriticalThreshold(String(defaults.criticalThreshold));
            setHighThreshold(String(defaults.highThreshold));
            setNotificationsEnabled(true);
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="cog" size={18} color="#0284c7" />
              </View>
              <View>
                <Text style={styles.headerTitle}>System Settings</Text>
                <Text style={styles.headerSubtitle}>Customize tank geometry & alerts</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <MaterialCommunityIcons name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'tank' && styles.tabBtnActive]}
              onPress={() => setActiveTab('tank')}
            >
              <MaterialCommunityIcons
                name="barrel"
                size={16}
                color={activeTab === 'tank' ? '#0284c7' : '#64748b'}
              />
              <Text style={[styles.tabBtnText, activeTab === 'tank' && styles.tabBtnTextActive]}>
                Tank Size
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'alerts' && styles.tabBtnActive]}
              onPress={() => setActiveTab('alerts')}
            >
              <MaterialCommunityIcons
                name="bell-ring-outline"
                size={16}
                color={activeTab === 'alerts' ? '#0284c7' : '#64748b'}
              />
              <Text style={[styles.tabBtnText, activeTab === 'alerts' && styles.tabBtnTextActive]}>
                Alerts & Notifs
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'mqtt' && styles.tabBtnActive]}
              onPress={() => setActiveTab('mqtt')}
            >
              <MaterialCommunityIcons
                name="cloud-sync"
                size={16}
                color={activeTab === 'mqtt' ? '#0284c7' : '#64748b'}
              />
              <Text style={[styles.tabBtnText, activeTab === 'mqtt' && styles.tabBtnTextActive]}>
                HiveMQ MQTT
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content Body */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
          >
            {/* TAB 1: TANK CONFIGURATION */}
            {activeTab === 'tank' && (
              <View style={styles.formSection}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Total Tank Capacity (Liters)</Text>
                  <TextInput
                    style={styles.input}
                    value={totalCapacity}
                    onChangeText={setTotalCapacity}
                    keyboardType="numeric"
                    placeholder="1000"
                    placeholderTextColor="#94a3b8"
                  />
                  <Text style={styles.hint}>Total rated water storage of your tank (e.g. 1000 L, 2000 L)</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Tank Height (cm)</Text>
                  <TextInput
                    style={styles.input}
                    value={totalHeight}
                    onChangeText={setTotalHeight}
                    keyboardType="numeric"
                    placeholder="200"
                    placeholderTextColor="#94a3b8"
                  />
                  <Text style={styles.hint}>Height from tank bottom to maximum water level (e.g. 200 cm = 2 m)</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Tank Width / Diameter (cm)</Text>
                  <TextInput
                    style={styles.input}
                    value={tankWidth}
                    onChangeText={setTankWidth}
                    keyboardType="numeric"
                    placeholder="100"
                    placeholderTextColor="#94a3b8"
                  />
                  <Text style={styles.hint}>Horizontal width or diameter of the tank</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Sensor Clearance Offset (cm)</Text>
                  <TextInput
                    style={styles.input}
                    value={sensorOffset}
                    onChangeText={setSensorOffset}
                    keyboardType="numeric"
                    placeholder="10"
                    placeholderTextColor="#94a3b8"
                  />
                  <Text style={styles.hint}>Distance from ultrasonic sensor to 100% full water line (dead zone)</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Sensor Measurement Unit</Text>
                  <View style={styles.unitSelector}>
                    {['meters', 'centimeters', 'auto'].map((unit) => (
                      <TouchableOpacity
                        key={unit}
                        style={[styles.unitBtn, sensorUnit === unit && styles.unitBtnActive]}
                        onPress={() => setSensorUnit(unit)}
                      >
                        <Text style={[styles.unitBtnText, sensorUnit === unit && styles.unitBtnTextActive]}>
                          {unit === 'meters'
                            ? 'Meters (m)'
                            : unit === 'centimeters'
                            ? 'Centimeters'
                            : 'Auto Detect'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Text style={styles.hint}>Standard unit for tank depth measurement (meters)</Text>
                </View>
              </View>
            )}

            {/* TAB 2: ALERTS & NOTIFICATIONS */}
            {activeTab === 'alerts' && (
              <View style={styles.formSection}>
                <View style={styles.switchRow}>
                  <View style={styles.switchTextWrap}>
                    <Text style={styles.switchTitle}>Enable Notifications</Text>
                    <Text style={styles.switchSub}>Receive alerts when tank is low or full</Text>
                  </View>
                  <Switch
                    value={notificationsEnabled}
                    onValueChange={setNotificationsEnabled}
                    trackColor={{ false: '#cbd5e1', true: '#0284c7' }}
                    thumbColor="#ffffff"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Low Water Warning (%)</Text>
                  <TextInput
                    style={styles.input}
                    value={lowThreshold}
                    onChangeText={setLowThreshold}
                    keyboardType="numeric"
                    placeholder="20"
                    placeholderTextColor="#94a3b8"
                  />
                  <Text style={styles.hint}>Sends warning when water drops below this % (default 20%)</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Critical Empty Alert (%)</Text>
                  <TextInput
                    style={styles.input}
                    value={criticalThreshold}
                    onChangeText={setCriticalThreshold}
                    keyboardType="numeric"
                    placeholder="10"
                    placeholderTextColor="#94a3b8"
                  />
                  <Text style={styles.hint}>Urgent emergency alert before tank runs completely dry (default 10%)</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Tank Full Notification (%)</Text>
                  <TextInput
                    style={styles.input}
                    value={highThreshold}
                    onChangeText={setHighThreshold}
                    keyboardType="numeric"
                    placeholder="90"
                    placeholderTextColor="#94a3b8"
                  />
                  <Text style={styles.hint}>Alerts when tank is full so you can shut off pump (default 90%)</Text>
                </View>
              </View>
            )}

            {/* TAB 3: HIVEMQ MQTT CLOUD */}
            {activeTab === 'mqtt' && (
              <View style={styles.formSection}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>HiveMQ Cloud Host</Text>
                  <TextInput
                    style={styles.input}
                    value={mqttHost}
                    onChangeText={setMqttHost}
                    autoCapitalize="none"
                    placeholder="efbe2b7780d0454b828febbb5bd6a302.s1.eu.hivemq.cloud"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>WebSocket TLS Port</Text>
                  <TextInput
                    style={styles.input}
                    value={mqttPort}
                    onChangeText={setMqttPort}
                    keyboardType="numeric"
                    placeholder="8884"
                    placeholderTextColor="#94a3b8"
                  />
                  <Text style={styles.hint}>HiveMQ Cloud WSS port is 8884</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>MQTT Username</Text>
                  <TextInput
                    style={styles.input}
                    value={mqttUsername}
                    onChangeText={setMqttUsername}
                    autoCapitalize="none"
                    placeholder="waterlevel"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>MQTT Password</Text>
                  <TextInput
                    style={styles.input}
                    value={mqttPassword}
                    onChangeText={setMqttPassword}
                    secureTextEntry
                    placeholder="••••••••"
                    placeholderTextColor="#94a3b8"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Distance Sensor Topic</Text>
                  <TextInput
                    style={styles.input}
                    value={mqttTopic}
                    onChangeText={setMqttTopic}
                    autoCapitalize="none"
                    placeholder="waterlevel/distance"
                    placeholderTextColor="#94a3b8"
                  />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.btnReset} onPress={handleReset} activeOpacity={0.7}>
              <Text style={styles.btnResetText}>Reset Defaults</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnSave} onPress={handleSave} activeOpacity={0.8}>
              <MaterialCommunityIcons name="check-bold" size={16} color="#ffffff" />
              <Text style={styles.btnSaveText}>Save Settings</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    width: '100%',
    maxHeight: '88%',
    backgroundColor: '#ffffff',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#0284c7',
    backgroundColor: '#ffffff',
  },
  tabBtnText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: '#0284c7',
    fontWeight: '700',
  },
  body: {
    maxHeight: 390,
  },
  bodyContent: {
    padding: 18,
  },
  formSection: {
    gap: 14,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 4,
  },
  switchTextWrap: {
    flex: 1,
  },
  switchTitle: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },
  switchSub: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  inputGroup: {
    gap: 5,
  },
  inputLabel: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    borderRadius: 12,
    color: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '500',
  },
  hint: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 15,
  },
  unitSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  unitBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  unitBtnActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0284c7',
  },
  unitBtnText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  unitBtnTextActive: {
    color: '#0284c7',
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  btnReset: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  btnResetText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '600',
  },
  btnSave: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0284c7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  btnSaveText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
