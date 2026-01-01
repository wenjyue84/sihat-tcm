/**
 * Device List Component
 * 
 * Displays connected and available health devices
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  ConnectedDevice,
  AvailableDevice,
  DeviceType,
  ConnectionStatus,
} from '../interfaces/HealthDeviceInterfaces';

import { HapticTouchButton } from '../../../ui/touch';

interface DeviceListProps {
  connectedDevices: ConnectedDevice[];
  availableDevices: AvailableDevice[];
  isScanning: boolean;
  onConnect: (device: AvailableDevice) => void;
  onDisconnect: (deviceId: string) => void;
  onScan: () => void;
  theme?: any;
}

export const DeviceList: React.FC<DeviceListProps> = ({
  connectedDevices,
  availableDevices,
  isScanning,
  onConnect,
  onDisconnect,
  onScan,
  theme,
}) => {
  /**
   * Get device type icon
   */
  const getDeviceIcon = (type: DeviceType): string => {
    switch (type) {
      case 'health_app':
        return 'fitness';
      case 'wearable':
        return 'watch';
      case 'sensor':
        return 'hardware-chip';
      default:
        return 'bluetooth';
    }
  };

  /**
   * Get connection status color
   */
  const getStatusColor = (status: ConnectionStatus): string => {
    switch (status) {
      case 'connected':
        return '#4CAF50';
      case 'connecting':
        return '#FF9800';
      case 'disconnected':
        return '#9E9E9E';
      case 'error':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  /**
   * Format last sync time
   */
  const formatLastSync = (lastSync: Date | null): string => {
    if (!lastSync) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - lastSync.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  /**
   * Render connected device
   */
  const renderConnectedDevice = (device: ConnectedDevice) => (
    <View key={device.id} style={[styles.deviceItem, { backgroundColor: theme?.surface?.elevated }]}>
      <View style={styles.deviceInfo}>
        <View style={styles.deviceHeader}>
          <Ionicons
            name={getDeviceIcon(device.type) as any}
            size={24}
            color={theme?.text?.primary}
          />
          <Text style={[styles.deviceName, { color: theme?.text?.primary }]}>
            {device.name}
          </Text>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(device.status) }]} />
        </View>
        
        <View style={styles.deviceDetails}>
          <Text style={[styles.deviceDetail, { color: theme?.text?.secondary }]}>
            Last sync: {formatLastSync(device.lastSync)}
          </Text>
          
          {device.batteryLevel !== undefined && (
            <Text style={[styles.deviceDetail, { color: theme?.text?.secondary }]}>
              Battery: {device.batteryLevel}%
            </Text>
          )}
          
          {device.signalStrength !== undefined && (
            <Text style={[styles.deviceDetail, { color: theme?.text?.secondary }]}>
              Signal: {device.signalStrength}%
            </Text>
          )}
        </View>
      </View>
      
      <HapticTouchButton
        onPress={() => onDisconnect(device.id)}
        style={[styles.actionButton, { backgroundColor: theme?.accent?.secondary }]}
        disabled={device.status === 'connecting'}
      >
        {device.status === 'connecting' ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <Ionicons name="close" size={20} color="#ffffff" />
        )}
      </HapticTouchButton>
    </View>
  );

  /**
   * Render available device
   */
  const renderAvailableDevice = (device: AvailableDevice) => (
    <View key={device.id} style={[styles.deviceItem, { backgroundColor: theme?.surface?.elevated }]}>
      <View style={styles.deviceInfo}>
        <View style={styles.deviceHeader}>
          <Ionicons
            name={getDeviceIcon(device.type) as any}
            size={24}
            color={theme?.text?.primary}
          />
          <Text style={[styles.deviceName, { color: theme?.text?.primary }]}>
            {device.name}
          </Text>
          {!device.isSupported && (
            <Text style={[styles.unsupportedLabel, { color: theme?.accent?.warning }]}>
              Unsupported
            </Text>
          )}
        </View>
        
        {device.manufacturer && (
          <Text style={[styles.deviceDetail, { color: theme?.text?.secondary }]}>
            {device.manufacturer} {device.model}
          </Text>
        )}
        
        {device.requiresPermission && (
          <Text style={[styles.permissionLabel, { color: theme?.accent?.warning }]}>
            Permission required
          </Text>
        )}
      </View>
      
      <HapticTouchButton
        onPress={() => onConnect(device)}
        style={[
          styles.actionButton,
          {
            backgroundColor: device.isSupported ? theme?.accent?.primary : theme?.surface?.disabled,
          },
        ]}
        disabled={!device.isSupported}
      >
        <Ionicons name="add" size={20} color="#ffffff" />
      </HapticTouchButton>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Connected Devices Section */}
      {connectedDevices.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme?.text?.primary }]}>
            Connected Devices
          </Text>
          {connectedDevices.map(renderConnectedDevice)}
        </View>
      )}

      {/* Available Devices Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme?.text?.primary }]}>
            Available Devices
          </Text>
          
          <HapticTouchButton
            onPress={onScan}
            style={[styles.scanButton, { backgroundColor: theme?.accent?.primary }]}
            disabled={isScanning}
          >
            {isScanning ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons name="refresh" size={20} color="#ffffff" />
            )}
          </HapticTouchButton>
        </View>
        
        {availableDevices.length > 0 ? (
          availableDevices.map(renderAvailableDevice)
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="bluetooth-outline"
              size={48}
              color={theme?.text?.secondary}
            />
            <Text style={[styles.emptyText, { color: theme?.text?.secondary }]}>
              {isScanning ? 'Scanning for devices...' : 'No devices found'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  scanButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deviceDetails: {
    marginLeft: 36,
  },
  deviceDetail: {
    fontSize: 12,
    marginBottom: 2,
  },
  unsupportedLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  permissionLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
});

export default DeviceList;