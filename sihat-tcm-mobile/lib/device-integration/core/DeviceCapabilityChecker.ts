/**
 * Device Capability Checker
 * 
 * Checks and manages device capabilities for health data integration.
 * Handles platform-specific capability detection and validation.
 */

import { Platform } from 'react-native';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DeviceCapabilities,
  SensorType,
} from '../interfaces/DeviceInterfaces';

import { ErrorFactory } from '../../errors/AppError';

/**
 * Device capability checker for health integration
 */
export class DeviceCapabilityChecker {
  private readonly context: string;
  private cachedCapabilities?: DeviceCapabilities;

  constructor(context: string = 'DeviceCapabilityChecker') {
    this.context = context;
  }

  /**
   * Check comprehensive device capabilities
   */
  public async checkDeviceCapabilities(): Promise<DeviceCapabilities> {
    try {
      // Return cached capabilities if available
      if (this.cachedCapabilities) {
        return this.cachedCapabilities;
      }

      console.log(`[${this.context}] Checking device capabilities...`);

      const capabilities: DeviceCapabilities = {
        platform: Platform.OS as 'ios' | 'android',
        deviceType: Device.deviceType || 0,
        hasHealthApp: this.checkHealthAppAvailability(),
        hasBluetooth: await this.checkBluetoothAvailability(),
        hasNFC: await this.checkNFCAvailability(),
        sensors: await this.checkSensorAvailability(),
        permissions: {}, // Will be populated by permission requests
        systemVersion: Device.osVersion || 'unknown',
      };

      // Cache capabilities
      this.cachedCapabilities = capabilities;
      await this.saveCapabilities(capabilities);

      console.log(`[${this.context}] Device capabilities checked successfully`);
      return capabilities;

    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: this.context,
        action: 'checkDeviceCapabilities',
      });
    }
  }

  /**
   * Check if health app is available
   */
  private checkHealthAppAvailability(): boolean {
    // iOS has HealthKit, Android has Google Fit/Health Connect
    return Platform.OS === 'ios' || Platform.OS === 'android';
  }

  /**
   * Check Bluetooth availability
   */
  private async checkBluetoothAvailability(): Promise<boolean> {
    try {
      // Most modern devices have Bluetooth
      // In a real implementation, you'd check actual Bluetooth status
      return true;
    } catch (error) {
      console.warn(`[${this.context}] Could not check Bluetooth availability:`, error);
      return false;
    }
  }

  /**
   * Check NFC availability
   */
  private async checkNFCAvailability(): Promise<boolean> {
    try {
      // NFC availability varies by device
      // In a real implementation, you'd use a library like react-native-nfc-manager
      return false; // Conservative default
    } catch (error) {
      console.warn(`[${this.context}] Could not check NFC availability:`, error);
      return false;
    }
  }

  /**
   * Check sensor availability
   */
  private async checkSensorAvailability(): Promise<DeviceCapabilities['sensors']> {
    try {
      // In a real implementation, you'd check each sensor individually
      // For now, assume common sensors are available on mobile devices
      return {
        accelerometer: true,
        gyroscope: true,
        magnetometer: Platform.OS === 'ios', // More common on iOS
        barometer: false, // Less common
      };
    } catch (error) {
      console.warn(`[${this.context}] Could not check sensor availability:`, error);
      return {
        accelerometer: false,
        gyroscope: false,
        magnetometer: false,
        barometer: false,
      };
    }
  }

  /**
   * Check if specific sensor is available
   */
  public async isSensorAvailable(sensorType: SensorType): Promise<boolean> {
    try {
      const capabilities = await this.checkDeviceCapabilities();
      return capabilities.sensors[sensorType] || false;
    } catch (error) {
      console.warn(`[${this.context}] Could not check ${sensorType} availability:`, error);
      return false;
    }
  }

  /**
   * Update permission status
   */
  public async updatePermissionStatus(
    permission: string,
    granted: boolean
  ): Promise<void> {
    try {
      if (this.cachedCapabilities) {
        this.cachedCapabilities.permissions[permission] = granted;
        await this.saveCapabilities(this.cachedCapabilities);
      }
    } catch (error) {
      console.warn(`[${this.context}] Could not update permission status:`, error);
    }
  }

  /**
   * Get cached capabilities
   */
  public getCachedCapabilities(): DeviceCapabilities | undefined {
    return this.cachedCapabilities;
  }

  /**
   * Clear cached capabilities
   */
  public clearCache(): void {
    this.cachedCapabilities = undefined;
  }

  /**
   * Save capabilities to storage
   */
  private async saveCapabilities(capabilities: DeviceCapabilities): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'deviceCapabilities',
        JSON.stringify(capabilities)
      );
    } catch (error) {
      console.warn(`[${this.context}] Could not save capabilities:`, error);
    }
  }

  /**
   * Load capabilities from storage
   */
  public async loadCapabilities(): Promise<DeviceCapabilities | null> {
    try {
      const stored = await AsyncStorage.getItem('deviceCapabilities');
      if (stored) {
        this.cachedCapabilities = JSON.parse(stored);
        return this.cachedCapabilities;
      }
      return null;
    } catch (error) {
      console.warn(`[${this.context}] Could not load capabilities:`, error);
      return null;
    }
  }

  /**
   * Get capability summary
   */
  public getCapabilitySummary(): {
    platform: string;
    hasHealthApp: boolean;
    hasBluetooth: boolean;
    hasNFC: boolean;
    sensorCount: number;
    permissionCount: number;
  } {
    const capabilities = this.cachedCapabilities;
    
    if (!capabilities) {
      return {
        platform: 'unknown',
        hasHealthApp: false,
        hasBluetooth: false,
        hasNFC: false,
        sensorCount: 0,
        permissionCount: 0,
      };
    }

    return {
      platform: capabilities.platform,
      hasHealthApp: capabilities.hasHealthApp,
      hasBluetooth: capabilities.hasBluetooth,
      hasNFC: capabilities.hasNFC,
      sensorCount: Object.values(capabilities.sensors).filter(Boolean).length,
      permissionCount: Object.keys(capabilities.permissions).length,
    };
  }
}

/**
 * Factory function for creating device capability checker
 */
export function createDeviceCapabilityChecker(context?: string): DeviceCapabilityChecker {
  return new DeviceCapabilityChecker(context);
}

/**
 * Default device capability checker instance
 */
export const defaultDeviceCapabilityChecker = new DeviceCapabilityChecker();