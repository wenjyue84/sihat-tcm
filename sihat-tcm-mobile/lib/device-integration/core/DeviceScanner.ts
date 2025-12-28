/**
 * Device Scanner
 * 
 * Handles Bluetooth device discovery and scanning for wearable devices
 */

import { Device, DeviceScanner as IDeviceScanner } from '../interfaces/DeviceInterfaces';
import { HEALTH_DEVICE_CONFIG } from '../../../constants';
import { DeviceError, ErrorFactory } from '../../errors/AppError';

export class DeviceScanner implements IDeviceScanner {
  private isCurrentlyScanning = false;
  private scanTimeout?: NodeJS.Timeout;

  /**
   * Scan for available Bluetooth devices
   */
  async scan(duration: number = HEALTH_DEVICE_CONFIG.SCAN_TIMEOUT): Promise<Device[]> {
    try {
      if (this.isCurrentlyScanning) {
        throw new DeviceError('Scan already in progress', {
          component: 'DeviceScanner',
          action: 'scan'
        });
      }

      console.log('[DeviceScanner] Starting device scan...');
      this.isCurrentlyScanning = true;

      // In a real implementation, this would use react-native-bluetooth-classic
      // or expo-bluetooth for actual Bluetooth scanning
      const mockDevices = await this.performMockScan(duration);

      this.isCurrentlyScanning = false;
      console.log(`[DeviceScanner] Scan completed, found ${mockDevices.length} devices`);

      return mockDevices;
    } catch (error) {
      this.isCurrentlyScanning = false;
      throw ErrorFactory.fromUnknownError(error, {
        component: 'DeviceScanner',
        action: 'scan'
      });
    }
  }

  /**
   * Stop ongoing scan
   */
  async stopScan(): Promise<void> {
    if (this.scanTimeout) {
      clearTimeout(this.scanTimeout);
      this.scanTimeout = undefined;
    }
    this.isCurrentlyScanning = false;
    console.log('[DeviceScanner] Scan stopped');
  }

  /**
   * Check if currently scanning
   */
  isScanning(): boolean {
    return this.isCurrentlyScanning;
  }

  /**
   * Perform mock scan for development/testing
   */
  private async performMockScan(duration: number): Promise<Device[]> {
    return new Promise((resolve) => {
      this.scanTimeout = setTimeout(() => {
        const mockDevices: Device[] = [
          {
            id: 'fitbit_001',
            name: 'Fitbit Charge 5',
            type: 'fitness_tracker',
            manufacturer: 'Fitbit',
            model: 'Charge 5',
            services: ['heart_rate', 'steps', 'sleep'],
            rssi: -45,
            isConnectable: true,
            status: 'disconnected',
            batteryLevel: 85,
          },
          {
            id: 'apple_watch_001',
            name: 'Apple Watch Series 8',
            type: 'smartwatch',
            manufacturer: 'Apple',
            model: 'Series 8',
            services: ['heart_rate', 'ecg', 'blood_oxygen', 'steps'],
            rssi: -38,
            isConnectable: true,
            status: 'disconnected',
            batteryLevel: 92,
          },
          {
            id: 'garmin_001',
            name: 'Garmin Vivosmart 5',
            type: 'fitness_tracker',
            manufacturer: 'Garmin',
            model: 'Vivosmart 5',
            services: ['heart_rate', 'stress', 'steps'],
            rssi: -52,
            isConnectable: true,
            status: 'disconnected',
            batteryLevel: 78,
          },
          {
            id: 'samsung_001',
            name: 'Samsung Galaxy Watch 5',
            type: 'smartwatch',
            manufacturer: 'Samsung',
            model: 'Galaxy Watch 5',
            services: ['heart_rate', 'blood_pressure', 'steps', 'sleep'],
            rssi: -41,
            isConnectable: true,
            status: 'disconnected',
            batteryLevel: 67,
          },
        ];

        resolve(mockDevices);
      }, duration);
    });
  }

  /**
   * Filter devices by type
   */
  filterDevicesByType(devices: Device[], deviceType: Device['type']): Device[] {
    return devices.filter(device => device.type === deviceType);
  }

  /**
   * Sort devices by signal strength (RSSI)
   */
  sortDevicesBySignalStrength(devices: Device[]): Device[] {
    return devices.sort((a, b) => (b.rssi || -100) - (a.rssi || -100));
  }

  /**
   * Filter devices by manufacturer
   */
  filterDevicesByManufacturer(devices: Device[], manufacturer: string): Device[] {
    return devices.filter(device => 
      device.manufacturer.toLowerCase().includes(manufacturer.toLowerCase())
    );
  }

  /**
   * Get devices with specific service
   */
  getDevicesWithService(devices: Device[], service: string): Device[] {
    return devices.filter(device => device.services.includes(service));
  }
}