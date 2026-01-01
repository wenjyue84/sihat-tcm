/**
 * Health Device Integration Interfaces
 * 
 * Type definitions for health device integration UI components
 */

export interface HealthDeviceIntegrationProps {
  onDataReceived: (data: HealthDataSummary) => void;
  onClose: () => void;
  theme?: any;
  style?: any;
}

export interface HealthDeviceState {
  isInitialized: boolean;
  isLoading: boolean;
  capabilities: DeviceCapabilities | null;
  connectedDevices: ConnectedDevice[];
  availableDevices: AvailableDevice[];
  isScanning: boolean;
  healthData: HealthDataSummary | null;
  integrationStatus: IntegrationStatus;
}

export interface HealthDeviceSettings {
  enableHealthApp: boolean;
  enableSensors: boolean;
  enableWearables: boolean;
  autoSync: boolean;
  syncInterval: number;
}

export interface ConnectedDevice {
  id: string;
  name: string;
  type: 'health_app' | 'wearable' | 'sensor';
  status: 'connected' | 'connecting' | 'disconnected' | 'error';
  lastSync: Date | null;
  batteryLevel?: number;
  signalStrength?: number;
}

export interface AvailableDevice {
  id: string;
  name: string;
  type: 'health_app' | 'wearable' | 'sensor';
  manufacturer?: string;
  model?: string;
  isSupported: boolean;
  requiresPermission: boolean;
}

export interface DeviceCapabilities {
  platform: 'ios' | 'android';
  hasHealthApp: boolean;
  hasBluetooth: boolean;
  hasNFC: boolean;
  sensors: {
    accelerometer: boolean;
    gyroscope: boolean;
    magnetometer: boolean;
    barometer: boolean;
  };
  permissions: {
    [key: string]: boolean;
  };
}

export interface IntegrationStatus {
  healthApp: 'connected' | 'disconnected' | 'permission_required' | 'not_available';
  bluetooth: 'enabled' | 'disabled' | 'not_available';
  sensors: 'active' | 'inactive' | 'not_available';
  lastUpdate: Date | null;
  errors: string[];
}

export interface HealthDataSummary {
  heartRate?: {
    current: number;
    average: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  steps?: {
    today: number;
    weekly: number;
    goal: number;
  };
  sleep?: {
    lastNight: number;
    quality: 'poor' | 'fair' | 'good' | 'excellent';
    trend: 'improving' | 'declining' | 'stable';
  };
  weight?: {
    current: number;
    change: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  };
  bloodPressure?: {
    systolic: number;
    diastolic: number;
    category: 'normal' | 'elevated' | 'high';
  };
  sensorData?: {
    activity: 'sedentary' | 'light' | 'moderate' | 'vigorous';
    posture: 'sitting' | 'standing' | 'walking' | 'lying';
    stress: 'low' | 'moderate' | 'high';
  };
  timestamp: Date;
  source: string[];
}

export interface HealthDeviceCallbacks {
  onDeviceConnected: (device: ConnectedDevice) => void;
  onDeviceDisconnected: (deviceId: string) => void;
  onDataReceived: (data: HealthDataSummary) => void;
  onError: (error: string) => void;
  onStatusChange: (status: IntegrationStatus) => void;
}

export interface DeviceConnectionResult {
  success: boolean;
  device?: ConnectedDevice;
  error?: string;
}

export interface SyncResult {
  success: boolean;
  dataPoints: number;
  lastSync: Date;
  error?: string;
}

export type DeviceType = 'health_app' | 'wearable' | 'sensor';
export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';
export type HealthMetricTrend = 'increasing' | 'decreasing' | 'stable';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'vigorous';