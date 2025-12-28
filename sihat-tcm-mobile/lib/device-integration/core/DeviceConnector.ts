/**
 * Device Connector
 * 
 * Handles Bluetooth device connections and data stream management
 */

import { 
  Device, 
  DeviceConnector as IDeviceConnector, 
  DeviceConnectionResult,
  HealthDataPoint 
} from '../interfaces/DeviceInterfaces';
import { HEALTH_DEVICE_CONFIG } from '../../../constants';
import { DeviceError, ErrorFactory } from '../../errors/AppError';

export class DeviceConnector implements IDeviceConnector {
  private connectedDevices = new Map<string, Device>();
  private dataIntervals = new Map<string, NodeJS.Timeout>();
  private dataCallbacks = new Map<string, (data: HealthDataPoint) => void>();

  /**
   * Connect to a device
   */
  async connect(deviceId: string): Promise<DeviceConnectionResult> {
    try {
      if (this.connectedDevices.has(deviceId)) {
        return {
          success: false,
          error: 'Device already connected'
        };
      }

      console.log(`[DeviceConnector] Connecting to device: ${deviceId}`);

      // In a real implementation, this would establish Bluetooth connection
      const device = await this.performMockConnection(deviceId);
      
      this.connectedDevices.set(deviceId, device);
      this.startDataStream(deviceId);

      console.log(`[DeviceConnector] Successfully connected to ${deviceId}`);

      return {
        success: true,
        device
      };
    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: 'DeviceConnector',
        action: 'connect',
        metadata: { deviceId }
      });
    }
  }

  /**
   * Disconnect from a device
   */
  async disconnect(deviceId: string): Promise<boolean> {
    try {
      const device = this.connectedDevices.get(deviceId);
      if (!device) {
        return false;
      }

      // Stop data stream
      this.stopDataStream(deviceId);

      // Remove from connected devices
      this.connectedDevices.delete(deviceId);
      this.dataCallbacks.delete(deviceId);

      console.log(`[DeviceConnector] Disconnected from device: ${deviceId}`);
      return true;
    } catch (error) {
      console.error(`[DeviceConnector] Failed to disconnect from ${deviceId}:`, error);
      return false;
    }
  }

  /**
   * Check if device is connected
   */
  isConnected(deviceId: string): boolean {
    return this.connectedDevices.has(deviceId);
  }

  /**
   * Get all connected devices
   */
  getConnectedDevices(): Device[] {
    return Array.from(this.connectedDevices.values());
  }

  /**
   * Set data callback for device
   */
  setDataCallback(deviceId: string, callback: (data: HealthDataPoint) => void): void {
    this.dataCallbacks.set(deviceId, callback);
  }

  /**
   * Perform mock connection for development/testing
   */
  private async performMockConnection(deviceId: string): Promise<Device> {
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock device data based on ID
    const mockDevices: Record<string, Partial<Device>> = {
      'fitbit_001': {
        name: 'Fitbit Charge 5',
        type: 'fitness_tracker',
        manufacturer: 'Fitbit',
        services: ['heart_rate', 'steps', 'sleep'],
      },
      'apple_watch_001': {
        name: 'Apple Watch Series 8',
        type: 'smartwatch',
        manufacturer: 'Apple',
        services: ['heart_rate', 'ecg', 'blood_oxygen', 'steps'],
      },
      'garmin_001': {
        name: 'Garmin Vivosmart 5',
        type: 'fitness_tracker',
        manufacturer: 'Garmin',
        services: ['heart_rate', 'stress', 'steps'],
      },
    };

    const deviceData = mockDevices[deviceId];
    if (!deviceData) {
      throw new DeviceError(`Unknown device: ${deviceId}`);
    }

    return {
      id: deviceId,
      ...deviceData,
      status: 'connected',
      connectedAt: Date.now(),
      lastDataSync: Date.now(),
    } as Device;
  }

  /**
   * Start data stream from device
   */
  private startDataStream(deviceId: string): void {
    const device = this.connectedDevices.get(deviceId);
    if (!device) return;

    // Simulate periodic data from device
    const interval = setInterval(() => {
      if (!this.connectedDevices.has(deviceId)) {
        clearInterval(interval);
        return;
      }

      this.generateMockDeviceData(deviceId, device);
    }, 60000); // Every minute

    this.dataIntervals.set(deviceId, interval);
  }

  /**
   * Stop data stream from device
   */
  private stopDataStream(deviceId: string): void {
    const interval = this.dataIntervals.get(deviceId);
    if (interval) {
      clearInterval(interval);
      this.dataIntervals.delete(deviceId);
    }
  }

  /**
   * Generate mock device data
   */
  private generateMockDeviceData(deviceId: string, device: Device): void {
    const callback = this.dataCallbacks.get(deviceId);
    if (!callback) return;

    // Generate different types of data based on device services
    if (device.services.includes('heart_rate')) {
      const heartRateData: HealthDataPoint = {
        id: `${deviceId}_hr_${Date.now()}`,
        deviceId,
        type: 'heart_rate',
        value: 60 + Math.random() * 40, // 60-100 BPM
        unit: 'bpm',
        timestamp: Date.now(),
        quality: Math.random() > 0.2 ? 'good' : 'fair',
        metadata: {
          deviceName: device.name,
          batteryLevel: device.batteryLevel,
        },
      };
      callback(heartRateData);
    }

    if (device.services.includes('steps')) {
      const stepData: HealthDataPoint = {
        id: `${deviceId}_steps_${Date.now()}`,
        deviceId,
        type: 'steps',
        value: Math.floor(Math.random() * 100), // Steps in last minute
        unit: 'count',
        timestamp: Date.now(),
        quality: 'good',
        metadata: {
          deviceName: device.name,
          batteryLevel: device.batteryLevel,
        },
      };
      callback(stepData);
    }

    if (device.services.includes('blood_oxygen')) {
      const oxygenData: HealthDataPoint = {
        id: `${deviceId}_spo2_${Date.now()}`,
        deviceId,
        type: 'oxygen_saturation',
        value: 95 + Math.random() * 5, // 95-100%
        unit: '%',
        timestamp: Date.now(),
        quality: 'good',
        metadata: {
          deviceName: device.name,
          batteryLevel: device.batteryLevel,
        },
      };
      callback(oxygenData);
    }

    // Update last sync time
    const updatedDevice = this.connectedDevices.get(deviceId);
    if (updatedDevice) {
      updatedDevice.lastDataSync = Date.now();
      this.connectedDevices.set(deviceId, updatedDevice);
    }
  }

  /**
   * Get device connection status
   */
  getDeviceStatus(deviceId: string): Device['status'] {
    const device = this.connectedDevices.get(deviceId);
    return device?.status || 'disconnected';
  }

  /**
   * Update device battery level
   */
  updateDeviceBattery(deviceId: string, batteryLevel: number): void {
    const device = this.connectedDevices.get(deviceId);
    if (device) {
      device.batteryLevel = batteryLevel;
      this.connectedDevices.set(deviceId, device);
    }
  }

  /**
   * Cleanup all connections
   */
  async cleanup(): Promise<void> {
    console.log('[DeviceConnector] Cleaning up connections...');
    
    // Disconnect all devices
    const deviceIds = Array.from(this.connectedDevices.keys());
    for (const deviceId of deviceIds) {
      await this.disconnect(deviceId);
    }

    // Clear all maps
    this.connectedDevices.clear();
    this.dataIntervals.clear();
    this.dataCallbacks.clear();

    console.log('[DeviceConnector] Cleanup complete');
  }
}