/**
 * Device Integration System - Main Export
 * 
 * Centralized exports for the modular device integration system
 */

// Main Manager
export { DeviceIntegrationManager } from './DeviceIntegrationManager';
export { default as deviceIntegrationManager } from './DeviceIntegrationManager';

// Core Components
export { DeviceScanner } from './core/DeviceScanner';
export { DeviceConnector } from './core/DeviceConnector';

// Providers
export { HealthDataProvider } from './providers/HealthDataProvider';

// Sensors
export { SensorManager } from './sensors/SensorManager';

// Analysis
export { DataAnalyzer } from './analysis/DataAnalyzer';

// Synchronization
export { DataSynchronizer } from './sync/DataSynchronizer';

// Interfaces
export * from './interfaces/DeviceInterfaces';

// Re-export types for convenience
export type {
  Device,
  DeviceConnectionResult,
  HealthDataPoint,
  SensorData,
  AggregatedHealthData,
  HealthSummary,
  DeviceIntegrationStatus,
  DeviceIntegrationConfig,
} from './interfaces/DeviceInterfaces';