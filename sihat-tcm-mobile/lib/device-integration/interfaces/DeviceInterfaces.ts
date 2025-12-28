/**
 * Device Integration Interfaces
 * 
 * Core interfaces for device integration system following clean architecture principles
 */

import { HealthDataType, HealthDataQuality } from '../../types';

// Device Types
export type DeviceType = 'fitness_tracker' | 'smartwatch' | 'health_monitor' | 'blood_pressure' | 'glucose_meter' | 'scale';
export type DeviceStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
export type SensorType = 'accelerometer' | 'gyroscope' | 'magnetometer' | 'barometer';

// Core Device Interface
export interface Device {
  id: string;
  name: string;
  type: DeviceType;
  manufacturer: string;
  model?: string;
  firmwareVersion?: string;
  services: string[];
  rssi?: number;
  isConnectable: boolean;
  status: DeviceStatus;
  connectedAt?: number;
  lastDataSync?: number;
  batteryLevel?: number;
}

// Health Data Interface
export interface HealthDataPoint {
  id: string;
  deviceId?: string;
  type: HealthDataType;
  value: number | Record<string, number>;
  unit: string;
  timestamp: number;
  quality: HealthDataQuality;
  metadata?: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
}

// Sensor Data Interface
export interface SensorData {
  type: SensorType;
  x: number;
  y: number;
  z: number;
  timestamp: number;
  accuracy?: number;
}

// Device Capabilities Interface
export interface DeviceCapabilities {
  platform: 'ios' | 'android';
  deviceType: number;
  hasHealthApp: boolean;
  hasBluetooth: boolean;
  hasNFC: boolean;
  sensors: Record<SensorType, boolean>;
  permissions: Record<string, 'granted' | 'denied' | 'undetermined'>;
  apiLevel?: number;
  systemVersion: string;
}

// Health App Integration Interface
export interface HealthAppIntegration {
  platform: 'ios' | 'android';
  permissions: Record<string, string>;
  availableDataTypes: string[];
  isAuthorized: boolean;
}

// Device Connection Result
export interface DeviceConnectionResult {
  success: boolean;
  device?: Device;
  error?: string;
}

// Health Data Query Options
export interface HealthDataQueryOptions {
  dataType: HealthDataType;
  startDate: Date;
  endDate: Date;
  limit?: number;
  deviceId?: string;
}

// Aggregated Health Data
export interface AggregatedHealthData {
  heartRate: HealthDataPoint[];
  steps: HealthDataPoint[];
  sleep: HealthDataPoint[];
  weight: HealthDataPoint[];
  sensorData: SensorData[];
  wearableData: HealthDataPoint[];
  summary: HealthSummary;
}

// Health Summary
export interface HealthSummary {
  averageHeartRate: number;
  dailyStepsAverage: number;
  sleepQuality: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
  activityLevel: 'active' | 'moderate' | 'sedentary' | 'unknown';
  trends: Record<string, unknown>;
}

// Sync Queue Item
export interface SyncQueueItem {
  id: string;
  type: 'healthMetric' | 'wearableData' | 'sensorData';
  data: unknown;
  timestamp: number;
  retryCount?: number;
}

// Device Integration Configuration
export interface DeviceIntegrationConfig {
  healthDataRetentionDays: number;
  syncIntervalMinutes: number;
  maxCacheSize: number;
  enabledSensors: SensorType[];
  bluetoothScanDuration: number;
  maxRetryAttempts: number;
  offlineMode: boolean;
}

// Device Scanner Interface
export interface DeviceScanner {
  scan(duration?: number): Promise<Device[]>;
  stopScan(): Promise<void>;
  isScanning(): boolean;
}

// Device Connector Interface
export interface DeviceConnector {
  connect(deviceId: string): Promise<DeviceConnectionResult>;
  disconnect(deviceId: string): Promise<boolean>;
  isConnected(deviceId: string): boolean;
  getConnectedDevices(): Device[];
}

// Health Data Provider Interface
export interface HealthDataProvider {
  initialize(): Promise<HealthAppIntegration>;
  requestPermissions(dataTypes: string[]): Promise<Record<string, string>>;
  queryData(options: HealthDataQueryOptions): Promise<HealthDataPoint[]>;
  subscribeToUpdates(dataType: HealthDataType, callback: (data: HealthDataPoint) => void): Promise<string>;
  unsubscribe(subscriptionId: string): Promise<void>;
}

// Sensor Manager Interface
export interface SensorManager {
  initialize(enabledSensors: SensorType[]): Promise<void>;
  startMonitoring(sensorType: SensorType): Promise<boolean>;
  stopMonitoring(sensorType: SensorType): Promise<boolean>;
  isMonitoring(sensorType: SensorType): boolean;
  getAvailableSensors(): SensorType[];
}

// Data Analyzer Interface
export interface DataAnalyzer {
  analyzeSensorData(sensorType: SensorType, data: SensorData): Promise<Record<string, unknown>>;
  analyzeHealthData(dataType: HealthDataType, data: HealthDataPoint): Promise<Record<string, unknown>>;
  generateHealthSummary(data: AggregatedHealthData): Promise<HealthSummary>;
}

// Data Synchronizer Interface
export interface DataSynchronizer {
  addToQueue(item: Omit<SyncQueueItem, 'id'>): Promise<void>;
  sync(): Promise<{ success: boolean; syncedCount: number; errors: string[] }>;
  getQueueSize(): number;
  clearQueue(): Promise<void>;
}

// Device Integration Manager Interface
export interface DeviceIntegrationManager {
  // Initialization
  initialize(): Promise<{ success: boolean; error?: string }>;
  isInitialized(): boolean;
  
  // Device Management
  scanForDevices(): Promise<Device[]>;
  connectToDevice(deviceId: string): Promise<DeviceConnectionResult>;
  disconnectFromDevice(deviceId: string): Promise<boolean>;
  getConnectedDevices(): Device[];
  
  // Health Data
  getHealthData(options: HealthDataQueryOptions): Promise<HealthDataPoint[]>;
  getAggregatedHealthData(days?: number): Promise<AggregatedHealthData>;
  
  // Sensor Management
  startSensorMonitoring(sensorType: SensorType): Promise<boolean>;
  stopSensorMonitoring(sensorType: SensorType): Promise<boolean>;
  
  // Status and Configuration
  getStatus(): DeviceIntegrationStatus;
  updateConfiguration(config: Partial<DeviceIntegrationConfig>): Promise<void>;
  
  // Cleanup
  cleanup(): Promise<void>;
}

// Device Integration Status
export interface DeviceIntegrationStatus {
  isInitialized: boolean;
  capabilities: DeviceCapabilities;
  connectedDevicesCount: number;
  cacheSize: number;
  syncQueueSize: number;
  isOnline: boolean;
  lastSyncTime?: number;
  errors: string[];
}

// Event Types for Device Integration
export interface DeviceConnectedEvent {
  type: 'device:connected';
  deviceId: string;
  device: Device;
  timestamp: Date;
}

export interface DeviceDisconnectedEvent {
  type: 'device:disconnected';
  deviceId: string;
  reason?: string;
  timestamp: Date;
}

export interface HealthDataReceivedEvent {
  type: 'health:data:received';
  data: HealthDataPoint;
  source: 'sensor' | 'wearable' | 'health_app';
  timestamp: Date;
}

export interface SensorDataReceivedEvent {
  type: 'sensor:data:received';
  sensorType: SensorType;
  data: SensorData;
  timestamp: Date;
}

export type DeviceIntegrationEvent = 
  | DeviceConnectedEvent 
  | DeviceDisconnectedEvent 
  | HealthDataReceivedEvent 
  | SensorDataReceivedEvent;