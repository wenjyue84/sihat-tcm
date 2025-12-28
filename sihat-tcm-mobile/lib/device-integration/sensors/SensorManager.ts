/**
 * Sensor Manager
 * 
 * Handles device sensor monitoring and data collection
 */

import * as Sensors from 'expo-sensors';
import { 
  SensorManager as ISensorManager, 
  SensorType, 
  SensorData 
} from '../interfaces/DeviceInterfaces';
import { ErrorFactory } from '../../errors/AppError';

export class SensorManager implements ISensorManager {
  private sensorSubscriptions = new Map<SensorType, any>();
  private sensorData = new Map<string, SensorData>();
  private enabledSensors: SensorType[] = [];
  private readonly maxCacheSize = 1000;

  /**
   * Initialize sensor manager
   */
  async initialize(enabledSensors: SensorType[]): Promise<void> {
    try {
      console.log('[SensorManager] Initializing with sensors:', enabledSensors);
      this.enabledSensors = enabledSensors;

      // Start monitoring enabled sensors
      for (const sensorType of enabledSensors) {
        if (await this.isSensorAvailable(sensorType)) {
          await this.startMonitoring(sensorType);
        }
      }

      console.log('[SensorManager] Initialization complete');
    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: 'SensorManager',
        action: 'initialize'
      });
    }
  }

  /**
   * Start monitoring a sensor
   */
  async startMonitoring(sensorType: SensorType): Promise<boolean> {
    try {
      if (this.sensorSubscriptions.has(sensorType)) {
        console.log(`[SensorManager] ${sensorType} already being monitored`);
        return true;
      }

      const available = await this.isSensorAvailable(sensorType);
      if (!available) {
        console.warn(`[SensorManager] ${sensorType} not available`);
        return false;
      }

      let subscription: any;

      switch (sensorType) {
        case 'accelerometer':
          Sensors.Accelerometer.setUpdateInterval(1000);
          subscription = Sensors.Accelerometer.addListener((data) => {
            this.processSensorData('accelerometer', data);
          });
          break;

        case 'gyroscope':
          Sensors.Gyroscope.setUpdateInterval(1000);
          subscription = Sensors.Gyroscope.addListener((data) => {
            this.processSensorData('gyroscope', data);
          });
          break;

        case 'magnetometer':
          Sensors.Magnetometer.setUpdateInterval(1000);
          subscription = Sensors.Magnetometer.addListener((data) => {
            this.processSensorData('magnetometer', data);
          });
          break;

        case 'barometer':
          if (Sensors.Barometer) {
            Sensors.Barometer.setUpdateInterval(5000); // Less frequent for barometer
            subscription = Sensors.Barometer.addListener((data) => {
              this.processSensorData('barometer', {
                x: data.pressure || 0,
                y: 0,
                z: 0,
                timestamp: Date.now(),
              });
            });
          }
          break;

        default:
          console.warn(`[SensorManager] Unknown sensor type: ${sensorType}`);
          return false;
      }

      if (subscription) {
        this.sensorSubscriptions.set(sensorType, subscription);
        console.log(`[SensorManager] Started monitoring ${sensorType}`);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`[SensorManager] Failed to start monitoring ${sensorType}:`, error);
      return false;
    }
  }

  /**
   * Stop monitoring a sensor
   */
  async stopMonitoring(sensorType: SensorType): Promise<boolean> {
    try {
      const subscription = this.sensorSubscriptions.get(sensorType);
      if (subscription) {
        subscription.remove();
        this.sensorSubscriptions.delete(sensorType);
        console.log(`[SensorManager] Stopped monitoring ${sensorType}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`[SensorManager] Failed to stop monitoring ${sensorType}:`, error);
      return false;
    }
  }

  /**
   * Check if currently monitoring a sensor
   */
  isMonitoring(sensorType: SensorType): boolean {
    return this.sensorSubscriptions.has(sensorType);
  }

  /**
   * Get available sensors
   */
  getAvailableSensors(): SensorType[] {
    return ['accelerometer', 'gyroscope', 'magnetometer', 'barometer'];
  }

  /**
   * Check if sensor is available
   */
  async isSensorAvailable(sensorType: SensorType): Promise<boolean> {
    try {
      switch (sensorType) {
        case 'accelerometer':
          return await Sensors.Accelerometer.isAvailableAsync();
        case 'gyroscope':
          return await Sensors.Gyroscope.isAvailableAsync();
        case 'magnetometer':
          return await Sensors.Magnetometer.isAvailableAsync();
        case 'barometer':
          return Sensors.Barometer ? await Sensors.Barometer.isAvailableAsync() : false;
        default:
          return false;
      }
    } catch (error) {
      console.error(`[SensorManager] Error checking ${sensorType} availability:`, error);
      return false;
    }
  }

  /**
   * Process sensor data
   */
  private processSensorData(sensorType: SensorType, rawData: any): void {
    const sensorData: SensorData = {
      type: sensorType,
      x: rawData.x || 0,
      y: rawData.y || 0,
      z: rawData.z || 0,
      timestamp: Date.now(),
      accuracy: rawData.accuracy,
    };

    // Store in cache
    const cacheKey = `${sensorType}_${Date.now()}`;
    this.sensorData.set(cacheKey, sensorData);

    // Maintain cache size
    if (this.sensorData.size > this.maxCacheSize) {
      const oldestKey = this.sensorData.keys().next().value;
      if (oldestKey) {
        this.sensorData.delete(oldestKey);
      }
    }

    // Log for debugging (can be removed in production)
    if (Math.random() < 0.01) { // Log 1% of readings to avoid spam
      console.log(`[SensorManager] ${sensorType} data:`, sensorData);
    }
  }

  /**
   * Get cached sensor data within date range
   */
  async getCachedData(startDate: Date, endDate: Date): Promise<SensorData[]> {
    const data: SensorData[] = [];
    
    for (const [key, sensorData] of this.sensorData.entries()) {
      if (sensorData.timestamp >= startDate.getTime() && 
          sensorData.timestamp <= endDate.getTime()) {
        data.push(sensorData);
      }
    }

    return data.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.sensorData.size;
  }

  /**
   * Update enabled sensors
   */
  async updateEnabledSensors(enabledSensors: SensorType[]): Promise<void> {
    // Stop sensors that are no longer enabled
    for (const sensorType of this.enabledSensors) {
      if (!enabledSensors.includes(sensorType)) {
        await this.stopMonitoring(sensorType);
      }
    }

    // Start newly enabled sensors
    for (const sensorType of enabledSensors) {
      if (!this.enabledSensors.includes(sensorType)) {
        await this.startMonitoring(sensorType);
      }
    }

    this.enabledSensors = enabledSensors;
    console.log('[SensorManager] Updated enabled sensors:', enabledSensors);
  }

  /**
   * Get sensor statistics
   */
  getSensorStatistics(): Record<SensorType, { 
    isMonitoring: boolean; 
    dataPoints: number; 
    lastReading?: number 
  }> {
    const stats: any = {};

    for (const sensorType of this.getAvailableSensors()) {
      const dataPoints = Array.from(this.sensorData.values())
        .filter(data => data.type === sensorType).length;
      
      const lastReading = Array.from(this.sensorData.values())
        .filter(data => data.type === sensorType)
        .sort((a, b) => b.timestamp - a.timestamp)[0]?.timestamp;

      stats[sensorType] = {
        isMonitoring: this.isMonitoring(sensorType),
        dataPoints,
        lastReading,
      };
    }

    return stats;
  }

  /**
   * Clear cached data
   */
  clearCache(): void {
    this.sensorData.clear();
    console.log('[SensorManager] Cache cleared');
  }

  /**
   * Cleanup all sensors
   */
  async cleanup(): Promise<void> {
    console.log('[SensorManager] Cleaning up...');

    // Stop all sensor monitoring
    for (const sensorType of Array.from(this.sensorSubscriptions.keys())) {
      await this.stopMonitoring(sensorType);
    }

    // Clear cache
    this.clearCache();

    console.log('[SensorManager] Cleanup complete');
  }
}