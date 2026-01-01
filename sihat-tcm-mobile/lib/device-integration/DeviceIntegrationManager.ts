/**
 * Device Integration Manager - Refactored Version
 * 
 * Main orchestrator for device integration following clean architecture principles.
 * This replaces the monolithic MobileDeviceIntegrationManager.js with a modular approach.
 */

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
import { DeviceCapabilityChecker } from './core/DeviceCapabilityChecker';
import { ConfigurationManager } from './core/ConfigurationManager';

import { ErrorFactory, DeviceError } from '../errors/AppError';

/**
 * Enhanced Device Integration Manager with modular architecture
 */
export class DeviceIntegrationManager implements IDeviceIntegrationManager {
  private static instance: DeviceIntegrationManager;
  
  // Core components
  private readonly deviceScanner: DeviceScanner;
  private readonly deviceConnector: DeviceConnector;
  private readonly healthDataProvider: HealthDataProvider;
  private readonly sensorManager: SensorManager;
  private readonly dataAnalyzer: DataAnalyzer;
  private readonly dataSynchronizer: DataSynchronizer;
  private readonly capabilityChecker: DeviceCapabilityChecker;
  private readonly configManager: ConfigurationManager;
  
  // State
  private isInitialized = false;
  private errors: string[] = [];

  private constructor() {
    // Initialize components
    this.deviceScanner = new DeviceScanner();
    this.deviceConnector = new DeviceConnector();
    this.healthDataProvider = new HealthDataProvider();
    this.sensorManager = new SensorManager();
    this.dataAnalyzer = new DataAnalyzer();
    this.dataSynchronizer = new DataSynchronizer();
    this.capabilityChecker = new DeviceCapabilityChecker();
    this.configManager = new ConfigurationManager();

    // Set up device connector callbacks
    this.setupDeviceConnectorCallbacks();
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

      // Initialize configuration manager first
      await this.configManager.initialize();

      // Check device capabilities
      await this.capabilityChecker.checkDeviceCapabilities();

      // Initialize components with configuration
      const sensorConfig = this.configManager.getComponentConfiguration('sensors');
      const syncConfig = this.configManager.getComponentConfiguration('sync');

      // Initialize health data provider
      try {
        await this.healthDataProvider.initialize();
      } catch (error) {
        this.errors.push(`Health provider initialization failed: ${error}`);
      }

      // Initialize sensor manager
      try {
        await this.sensorManager.initialize(sensorConfig.enabledSensors);
      } catch (error) {
        this.errors.push(`Sensor manager initialization failed: ${error}`);
      }

      // Start background sync
      this.dataSynchronizer.startPeriodicSync(syncConfig.syncIntervalMinutes);

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

      const bluetoothConfig = this.configManager.getComponentConfiguration('bluetooth');
      return await this.deviceScanner.scan(bluetoothConfig.bluetoothScanDuration);
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
    const capabilities = this.capabilityChecker.getCachedCapabilities();
    
    return {
      isInitialized: this.isInitialized,
      capabilities: capabilities || {} as DeviceCapabilities,
      connectedDevicesCount: this.deviceConnector.getConnectedDevices().length,
      cacheSize: this.sensorManager.getCacheSize(),
      syncQueueSize: this.dataSynchronizer.getQueueSize(),
      isOnline: !this.configManager.getConfiguration().offlineMode,
      lastSyncTime: this.dataSynchronizer.getLastSyncTime(),
      errors: [...this.errors],
    };
  }

  /**
   * Update configuration
   */
  async updateConfiguration(config: Partial<DeviceIntegrationConfig>): Promise<void> {
    try {
      await this.configManager.updateConfiguration(config);
      
      // Apply configuration changes to components
      if (config.enabledSensors) {
        await this.sensorManager.updateEnabledSensors(config.enabledSensors);
      }
      
      if (config.syncIntervalMinutes) {
        this.dataSynchronizer.updateSyncInterval(config.syncIntervalMinutes);
      }
      
      console.log('[DeviceIntegrationManager] Configuration updated');
    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: 'DeviceIntegrationManager',
        action: 'updateConfiguration'
      });
    }
  }

  /**
   * Get current configuration
   */
  getConfiguration(): DeviceIntegrationConfig {
    return this.configManager.getConfiguration();
  }

  /**
   * Get device capabilities
   */
  async getDeviceCapabilities(): Promise<DeviceCapabilities> {
    return await this.capabilityChecker.checkDeviceCapabilities();
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
   * Set up device connector callbacks
   */
  private setupDeviceConnectorCallbacks(): void {
    // This would be implemented to set up proper callbacks
    // For now, it's a placeholder for the callback setup logic
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