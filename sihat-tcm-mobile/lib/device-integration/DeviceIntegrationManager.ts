/**
 * Device Integration Manager - Refactored Version
 * 
 * Main orchestrator for device integration following clean architecture principles.
 * This replaces the monolithic MobileDeviceIntegrationManager.js with a modular approach.
 */

import { Platform } from 'react-native';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DeviceIntegrationManager as IDeviceIntegrationManager,
  Device as IDevice,
  DeviceConnectionResult,
  HealthDataQueryOptions,
  HealthDataPoint,
  AggregatedHealthData,
  DeviceIntegrationStatus,
  DeviceIntegrationConfig,
  SensorType,
  DeviceCapabilities,
} from './interfaces/DeviceInterfaces';

import { DeviceScanner } from './core/DeviceScanner';
import { DeviceConnector } from './core/DeviceConnector';
import { HealthDataProvider } from './providers/HealthDataProvider';
import { SensorManager } from './sensors/SensorManager';
import { DataAnalyzer } from './analysis/DataAnalyzer';
import { DataSynchronizer } from './sync/DataSynchronizer';

import { HEALTH_DEVICE_CONFIG } from '../../constants';
import { ErrorFactory, DeviceError } from '../errors/AppError';

/**
 * Enhanced Device Integration Manager with modular architecture
 */
export class DeviceIntegrationManager implements IDeviceIntegrationManager {
  private static instance: DeviceIntegrationManager;
  
  // Core components
  private deviceScanner: DeviceScanner;
  private deviceConnector: DeviceConnector;
  private healthDataProvider: HealthDataProvider;
  private sensorManager: SensorManager;
  private dataAnalyzer: DataAnalyzer;
  private dataSynchronizer: DataSynchronizer;
  
  // State
  private isInitialized = false;
  private capabilities?: DeviceCapabilities;
  private config: DeviceIntegrationConfig;
  private errors: string[] = [];

  private constructor() {
    // Initialize components
    this.deviceScanner = new DeviceScanner();
    this.deviceConnector = new DeviceConnector();
    this.healthDataProvider = new HealthDataProvider();
    this.sensorManager = new SensorManager();
    this.dataAnalyzer = new DataAnalyzer();
    this.dataSynchronizer = new DataSynchronizer();

    // Default configuration
    this.config = {
      healthDataRetentionDays: HEALTH_DEVICE_CONFIG.DATA_SYNC_INTERVAL / (1000 * 60 * 60 * 24),
      syncIntervalMinutes: HEALTH_DEVICE_CONFIG.DATA_SYNC_INTERVAL / (1000 * 60),
      maxCacheSize: 1000,
      enabledSensors: ['accelerometer', 'gyroscope'],
      bluetoothScanDuration: HEALTH_DEVICE_CONFIG.SCAN_TIMEOUT,
      maxRetryAttempts: HEALTH_DEVICE_CONFIG.MAX_RETRY_ATTEMPTS,
      offlineMode: false,
    };

    // Set up device connector callbacks
    this.deviceConnector.setDataCallback = (deviceId: string, callback) => {
      this.deviceConnector.setDataCallback(deviceId, (data: HealthDataPoint) => {
        // Process received data
        this.handleDeviceData(data);
        callback(data);
      });
    };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): DeviceIntegrationManager {
    if (!DeviceIntegrationManager.instance) {
      DeviceIntegrationManager.instance = new DeviceIntegrationManager();
    }
    return DeviceIntegrationManager.instance;
  }

  /**
   * Initialize the device integration system
   */
  async initialize(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[DeviceIntegrationManager] Initializing...');
      this.errors = [];

      // Check device capabilities
      this.capabilities = await this.checkDeviceCapabilities();

      // Initialize health data provider
      try {
        await this.healthDataProvider.initialize();
      } catch (error) {
        this.errors.push(`Health provider initialization failed: ${error}`);
      }

      // Initialize sensor manager
      try {
        await this.sensorManager.initialize(this.config.enabledSensors);
      } catch (error) {
        this.errors.push(`Sensor manager initialization failed: ${error}`);
      }

      // Start background sync
      this.dataSynchronizer.startPeriodicSync(this.config.syncIntervalMinutes);

      this.isInitialized = true;
      console.log('[DeviceIntegrationManager] Initialization complete');

      return { success: true };
    } catch (error) {
      const appError = ErrorFactory.fromUnknownError(error, {
        component: 'DeviceIntegrationManager',
        action: 'initialize'
      });
      
      this.errors.push(appError.message);
      
      return { 
        success: false, 
        error: appError.getUserMessage()
      };
    }
  }

  /**
   * Check if manager is initialized
   */
  isInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Scan for available devices
   */
  async scanForDevices(): Promise<IDevice[]> {
    try {
      if (!this.isInitialized) {
        throw new DeviceError('Manager not initialized');
      }

      return await this.deviceScanner.scan(this.config.bluetoothScanDuration);
    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: 'DeviceIntegrationManager',
        action: 'scanForDevices'
      });
    }
  }

  /**
   * Connect to a device
   */
  async connectToDevice(deviceId: string): Promise<DeviceConnectionResult> {
    try {
      if (!this.isInitialized) {
        throw new DeviceError('Manager not initialized');
      }

      const result = await this.deviceConnector.connect(deviceId);
      
      if (result.success && result.device) {
        // Set up data callback for this device
        this.deviceConnector.setDataCallback(deviceId, (data: HealthDataPoint) => {
          this.handleDeviceData(data);
        });
      }

      return result;
    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: 'DeviceIntegrationManager',
        action: 'connectToDevice',
        metadata: { deviceId }
      });
    }
  }

  /**
   * Disconnect from a device
   */
  async disconnectFromDevice(deviceId: string): Promise<boolean> {
    try {
      return await this.deviceConnector.disconnect(deviceId);
    } catch (error) {
      console.error(`[DeviceIntegrationManager] Failed to disconnect from ${deviceId}:`, error);
      return false;
    }
  }

  /**
   * Get connected devices
   */
  getConnectedDevices(): IDevice[] {
    return this.deviceConnector.getConnectedDevices();
  }

  /**
   * Get health data
   */
  async getHealthData(options: HealthDataQueryOptions): Promise<HealthDataPoint[]> {
    try {
      return await this.healthDataProvider.queryData(options);
    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: 'DeviceIntegrationManager',
        action: 'getHealthData',
        metadata: { options }
      });
    }
  }

  /**
   * Get aggregated health data for TCM analysis
   */
  async getAggregatedHealthData(days: number = 7): Promise<AggregatedHealthData> {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);

      // Query different types of health data
      const [heartRate, steps, sleep, weight] = await Promise.all([
        this.getHealthData({ dataType: 'heart_rate', startDate, endDate }),
        this.getHealthData({ dataType: 'steps', startDate, endDate }),
        this.getHealthData({ dataType: 'sleep', startDate, endDate }),
        this.getHealthData({ dataType: 'weight', startDate, endDate }),
      ]);

      // Get sensor and wearable data
      const sensorData = await this.sensorManager.getCachedData(startDate, endDate);
      const wearableData = this.getWearableDataFromCache(startDate, endDate);

      const aggregatedData: AggregatedHealthData = {
        heartRate,
        steps,
        sleep,
        weight,
        sensorData,
        wearableData,
        summary: {
          averageHeartRate: 0,
          dailyStepsAverage: 0,
          sleepQuality: 'unknown',
          activityLevel: 'unknown',
          trends: {},
        },
      };

      // Generate summary using data analyzer
      aggregatedData.summary = await this.dataAnalyzer.generateHealthSummary(aggregatedData);

      return aggregatedData;
    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: 'DeviceIntegrationManager',
        action: 'getAggregatedHealthData',
        metadata: { days }
      });
    }
  }

  /**
   * Start sensor monitoring
   */
  async startSensorMonitoring(sensorType: SensorType): Promise<boolean> {
    try {
      return await this.sensorManager.startMonitoring(sensorType);
    } catch (error) {
      console.error(`[DeviceIntegrationManager] Failed to start ${sensorType} monitoring:`, error);
      return false;
    }
  }

  /**
   * Stop sensor monitoring
   */
  async stopSensorMonitoring(sensorType: SensorType): Promise<boolean> {
    try {
      return await this.sensorManager.stopMonitoring(sensorType);
    } catch (error) {
      console.error(`[DeviceIntegrationManager] Failed to stop ${sensorType} monitoring:`, error);
      return false;
    }
  }

  /**
   * Get system status
   */
  getStatus(): DeviceIntegrationStatus {
    return {
      isInitialized: this.isInitialized,
      capabilities: this.capabilities || {} as DeviceCapabilities,
      connectedDevicesCount: this.deviceConnector.getConnectedDevices().length,
      cacheSize: this.sensorManager.getCacheSize(),
      syncQueueSize: this.dataSynchronizer.getQueueSize(),
      isOnline: !this.config.offlineMode,
      lastSyncTime: this.dataSynchronizer.getLastSyncTime(),
      errors: [...this.errors],
    };
  }

  /**
   * Update configuration
   */
  async updateConfiguration(config: Partial<DeviceIntegrationConfig>): Promise<void> {
    try {
      this.config = { ...this.config, ...config };
      
      // Apply configuration changes
      if (config.enabledSensors) {
        await this.sensorManager.updateEnabledSensors(config.enabledSensors);
      }
      
      if (config.syncIntervalMinutes) {
        this.dataSynchronizer.updateSyncInterval(config.syncIntervalMinutes);
      }

      // Save configuration
      await AsyncStorage.setItem('deviceIntegrationConfig', JSON.stringify(this.config));
      
      console.log('[DeviceIntegrationManager] Configuration updated');
    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: 'DeviceIntegrationManager',
        action: 'updateConfiguration'
      });
    }
  }

  /**
   * Cleanup all resources
   */
  async cleanup(): Promise<void> {
    try {
      console.log('[DeviceIntegrationManager] Cleaning up...');

      // Cleanup all components
      await Promise.all([
        this.deviceConnector.cleanup(),
        this.healthDataProvider.cleanup(),
        this.sensorManager.cleanup(),
        this.dataSynchronizer.cleanup(),
      ]);

      this.isInitialized = false;
      this.errors = [];

      console.log('[DeviceIntegrationManager] Cleanup complete');
    } catch (error) {
      console.error('[DeviceIntegrationManager] Cleanup failed:', error);
    }
  }

  // Private helper methods

  /**
   * Check device capabilities
   */
  private async checkDeviceCapabilities(): Promise<DeviceCapabilities> {
    const capabilities: DeviceCapabilities = {
      platform: Platform.OS as 'ios' | 'android',
      deviceType: Device.deviceType || 0,
      hasHealthApp: Platform.OS === 'ios' || Platform.OS === 'android',
      hasBluetooth: true, // Assume Bluetooth is available
      hasNFC: false, // Would need to check actual NFC availability
      sensors: {
        accelerometer: await this.sensorManager.isSensorAvailable('accelerometer'),
        gyroscope: await this.sensorManager.isSensorAvailable('gyroscope'),
        magnetometer: await this.sensorManager.isSensorAvailable('magnetometer'),
        barometer: await this.sensorManager.isSensorAvailable('barometer'),
      },
      permissions: {}, // Will be populated by permission requests
      systemVersion: Device.osVersion || 'unknown',
    };

    // Store capabilities
    await AsyncStorage.setItem('deviceCapabilities', JSON.stringify(capabilities));
    
    return capabilities;
  }

  /**
   * Handle data received from devices
   */
  private async handleDeviceData(data: HealthDataPoint): Promise<void> {
    try {
      // Analyze the data
      const analysis = await this.dataAnalyzer.analyzeHealthData(data.type, data);
      
      // Add to sync queue
      await this.dataSynchronizer.addToQueue({
        type: 'wearableData',
        data: { ...data, analysis },
        timestamp: Date.now(),
      });

      console.log(`[DeviceIntegrationManager] Processed data from device ${data.deviceId}`);
    } catch (error) {
      console.error('[DeviceIntegrationManager] Failed to handle device data:', error);
    }
  }

  /**
   * Get wearable data from cache
   */
  private getWearableDataFromCache(startDate: Date, endDate: Date): HealthDataPoint[] {
    // This would retrieve cached wearable data within the date range
    // For now, return empty array as this would be implemented based on caching strategy
    return [];
  }
}

// Export singleton instance
export default DeviceIntegrationManager.getInstance();