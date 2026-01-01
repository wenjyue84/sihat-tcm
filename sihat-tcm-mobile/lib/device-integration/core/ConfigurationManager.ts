/**
 * Configuration Manager
 * 
 * Manages device integration configuration with validation and persistence.
 * Handles configuration updates and applies changes to system components.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DeviceIntegrationConfig,
  SensorType,
} from '../interfaces/DeviceInterfaces';

import { HEALTH_DEVICE_CONFIG } from '../../constants';
import { ErrorFactory } from '../../errors/AppError';

/**
 * Configuration manager for device integration
 */
export class ConfigurationManager {
  private readonly context: string;
  private config: DeviceIntegrationConfig;
  private readonly configKey = 'deviceIntegrationConfig';

  constructor(context: string = 'ConfigurationManager') {
    this.context = context;
    
    // Initialize with default configuration
    this.config = this.getDefaultConfiguration();
  }

  /**
   * Initialize configuration manager
   */
  public async initialize(): Promise<void> {
    try {
      console.log(`[${this.context}] Initializing configuration manager...`);

      // Load saved configuration
      const savedConfig = await this.loadConfiguration();
      if (savedConfig) {
        this.config = { ...this.config, ...savedConfig };
      }

      console.log(`[${this.context}] Configuration manager initialized`);
    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: this.context,
        action: 'initialize',
      });
    }
  }

  /**
   * Get current configuration
   */
  public getConfiguration(): DeviceIntegrationConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public async updateConfiguration(
    updates: Partial<DeviceIntegrationConfig>
  ): Promise<void> {
    try {
      console.log(`[${this.context}] Updating configuration...`);

      // Validate updates
      const validatedUpdates = this.validateConfiguration(updates);

      // Apply updates
      this.config = { ...this.config, ...validatedUpdates };

      // Save to storage
      await this.saveConfiguration();

      console.log(`[${this.context}] Configuration updated successfully`);
    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: this.context,
        action: 'updateConfiguration',
        metadata: { updates },
      });
    }
  }

  /**
   * Reset to default configuration
   */
  public async resetToDefaults(): Promise<void> {
    try {
      console.log(`[${this.context}] Resetting to default configuration...`);

      this.config = this.getDefaultConfiguration();
      await this.saveConfiguration();

      console.log(`[${this.context}] Configuration reset to defaults`);
    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: this.context,
        action: 'resetToDefaults',
      });
    }
  }

  /**
   * Update enabled sensors
   */
  public async updateEnabledSensors(sensors: SensorType[]): Promise<void> {
    try {
      await this.updateConfiguration({ enabledSensors: sensors });
      console.log(`[${this.context}] Updated enabled sensors:`, sensors);
    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: this.context,
        action: 'updateEnabledSensors',
        metadata: { sensors },
      });
    }
  }

  /**
   * Update sync interval
   */
  public async updateSyncInterval(intervalMinutes: number): Promise<void> {
    try {
      if (intervalMinutes < 1 || intervalMinutes > 1440) {
        throw new Error('Sync interval must be between 1 and 1440 minutes');
      }

      await this.updateConfiguration({ syncIntervalMinutes: intervalMinutes });
      console.log(`[${this.context}] Updated sync interval to ${intervalMinutes} minutes`);
    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: this.context,
        action: 'updateSyncInterval',
        metadata: { intervalMinutes },
      });
    }
  }

  /**
   * Toggle offline mode
   */
  public async toggleOfflineMode(enabled: boolean): Promise<void> {
    try {
      await this.updateConfiguration({ offlineMode: enabled });
      console.log(`[${this.context}] Offline mode ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: this.context,
        action: 'toggleOfflineMode',
        metadata: { enabled },
      });
    }
  }

  /**
   * Get configuration for specific component
   */
  public getComponentConfiguration(component: string): any {
    switch (component) {
      case 'sensors':
        return {
          enabledSensors: this.config.enabledSensors,
          maxCacheSize: this.config.maxCacheSize,
        };
      case 'sync':
        return {
          syncIntervalMinutes: this.config.syncIntervalMinutes,
          maxRetryAttempts: this.config.maxRetryAttempts,
          offlineMode: this.config.offlineMode,
        };
      case 'bluetooth':
        return {
          bluetoothScanDuration: this.config.bluetoothScanDuration,
          maxRetryAttempts: this.config.maxRetryAttempts,
        };
      case 'health':
        return {
          healthDataRetentionDays: this.config.healthDataRetentionDays,
          maxCacheSize: this.config.maxCacheSize,
        };
      default:
        return this.config;
    }
  }

  /**
   * Validate configuration updates
   */
  private validateConfiguration(
    updates: Partial<DeviceIntegrationConfig>
  ): Partial<DeviceIntegrationConfig> {
    const validated: Partial<DeviceIntegrationConfig> = {};

    // Validate health data retention days
    if (updates.healthDataRetentionDays !== undefined) {
      if (updates.healthDataRetentionDays < 1 || updates.healthDataRetentionDays > 365) {
        throw new Error('Health data retention must be between 1 and 365 days');
      }
      validated.healthDataRetentionDays = updates.healthDataRetentionDays;
    }

    // Validate sync interval
    if (updates.syncIntervalMinutes !== undefined) {
      if (updates.syncIntervalMinutes < 1 || updates.syncIntervalMinutes > 1440) {
        throw new Error('Sync interval must be between 1 and 1440 minutes');
      }
      validated.syncIntervalMinutes = updates.syncIntervalMinutes;
    }

    // Validate max cache size
    if (updates.maxCacheSize !== undefined) {
      if (updates.maxCacheSize < 100 || updates.maxCacheSize > 10000) {
        throw new Error('Max cache size must be between 100 and 10000');
      }
      validated.maxCacheSize = updates.maxCacheSize;
    }

    // Validate enabled sensors
    if (updates.enabledSensors !== undefined) {
      const validSensors: SensorType[] = ['accelerometer', 'gyroscope', 'magnetometer', 'barometer'];
      const invalidSensors = updates.enabledSensors.filter(
        sensor => !validSensors.includes(sensor)
      );
      if (invalidSensors.length > 0) {
        throw new Error(`Invalid sensors: ${invalidSensors.join(', ')}`);
      }
      validated.enabledSensors = updates.enabledSensors;
    }

    // Validate Bluetooth scan duration
    if (updates.bluetoothScanDuration !== undefined) {
      if (updates.bluetoothScanDuration < 1000 || updates.bluetoothScanDuration > 60000) {
        throw new Error('Bluetooth scan duration must be between 1000 and 60000 ms');
      }
      validated.bluetoothScanDuration = updates.bluetoothScanDuration;
    }

    // Validate max retry attempts
    if (updates.maxRetryAttempts !== undefined) {
      if (updates.maxRetryAttempts < 1 || updates.maxRetryAttempts > 10) {
        throw new Error('Max retry attempts must be between 1 and 10');
      }
      validated.maxRetryAttempts = updates.maxRetryAttempts;
    }

    // Validate offline mode
    if (updates.offlineMode !== undefined) {
      validated.offlineMode = Boolean(updates.offlineMode);
    }

    return validated;
  }

  /**
   * Get default configuration
   */
  private getDefaultConfiguration(): DeviceIntegrationConfig {
    return {
      healthDataRetentionDays: HEALTH_DEVICE_CONFIG.DATA_SYNC_INTERVAL / (1000 * 60 * 60 * 24),
      syncIntervalMinutes: HEALTH_DEVICE_CONFIG.DATA_SYNC_INTERVAL / (1000 * 60),
      maxCacheSize: 1000,
      enabledSensors: ['accelerometer', 'gyroscope'],
      bluetoothScanDuration: HEALTH_DEVICE_CONFIG.SCAN_TIMEOUT,
      maxRetryAttempts: HEALTH_DEVICE_CONFIG.MAX_RETRY_ATTEMPTS,
      offlineMode: false,
    };
  }

  /**
   * Save configuration to storage
   */
  private async saveConfiguration(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.configKey, JSON.stringify(this.config));
    } catch (error) {
      console.warn(`[${this.context}] Could not save configuration:`, error);
      throw new Error('Failed to save configuration');
    }
  }

  /**
   * Load configuration from storage
   */
  private async loadConfiguration(): Promise<DeviceIntegrationConfig | null> {
    try {
      const stored = await AsyncStorage.getItem(this.configKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.warn(`[${this.context}] Could not load configuration:`, error);
      return null;
    }
  }

  /**
   * Export configuration
   */
  public exportConfiguration(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration
   */
  public async importConfiguration(configJson: string): Promise<void> {
    try {
      const importedConfig = JSON.parse(configJson);
      const validatedConfig = this.validateConfiguration(importedConfig);
      
      await this.updateConfiguration(validatedConfig);
      console.log(`[${this.context}] Configuration imported successfully`);
    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: this.context,
        action: 'importConfiguration',
      });
    }
  }

  /**
   * Get configuration statistics
   */
  public getConfigurationStatistics(): {
    enabledSensorsCount: number;
    syncIntervalHours: number;
    retentionWeeks: number;
    cacheUtilization: string;
    offlineMode: boolean;
  } {
    return {
      enabledSensorsCount: this.config.enabledSensors.length,
      syncIntervalHours: this.config.syncIntervalMinutes / 60,
      retentionWeeks: this.config.healthDataRetentionDays / 7,
      cacheUtilization: `${this.config.maxCacheSize} items`,
      offlineMode: this.config.offlineMode,
    };
  }
}

/**
 * Factory function for creating configuration manager
 */
export function createConfigurationManager(context?: string): ConfigurationManager {
  return new ConfigurationManager(context);
}

/**
 * Default configuration manager instance
 */
export const defaultConfigurationManager = new ConfigurationManager();