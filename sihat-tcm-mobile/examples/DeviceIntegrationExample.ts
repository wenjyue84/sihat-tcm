/**
 * Device Integration System Example
 * 
 * Comprehensive examples demonstrating the refactored device integration system.
 * Shows how to use the modular components for health device management.
 */

import DeviceIntegrationManager from '../lib/device-integration/DeviceIntegrationManager';
import { createDeviceCapabilityChecker } from '../lib/device-integration/core/DeviceCapabilityChecker';
import { createConfigurationManager } from '../lib/device-integration/core/ConfigurationManager';

/**
 * Example 1: Basic Device Integration Setup
 */
export async function basicDeviceIntegrationExample() {
  console.log('=== Basic Device Integration Example ===');

  try {
    // Get the device integration manager instance
    const deviceManager = DeviceIntegrationManager.getInstance();

    // Initialize the system
    console.log('Initializing device integration system...');
    const initResult = await deviceManager.initialize();
    
    if (!initResult.success) {
      console.error('Initialization failed:', initResult.error);
      return;
    }

    console.log('✅ Device integration system initialized successfully');

    // Check device capabilities
    const capabilities = await deviceManager.getDeviceCapabilities();
    console.log('📱 Device capabilities:', {
      platform: capabilities.platform,
      hasHealthApp: capabilities.hasHealthApp,
      hasBluetooth: capabilities.hasBluetooth,
      sensors: capabilities.sensors,
    });

    // Get system status
    const status = deviceManager.getStatus();
    console.log('📊 System status:', {
      isInitialized: status.isInitialized,
      connectedDevices: status.connectedDevicesCount,
      cacheSize: status.cacheSize,
      isOnline: status.isOnline,
    });

    return { success: true, capabilities, status };

  } catch (error) {
    console.error('❌ Basic device integration example failed:', error);
    return { success: false, error };
  }
}

/**
 * Example 2: Device Scanning and Connection
 */
export async function deviceScanningExample() {
  console.log('=== Device Scanning Example ===');

  try {
    const deviceManager = DeviceIntegrationManager.getInstance();

    // Ensure system is initialized
    if (!deviceManager.isInitialized()) {
      await deviceManager.initialize();
    }

    // Scan for available devices
    console.log('🔍 Scanning for available devices...');
    const devices = await deviceManager.scanForDevices();
    
    console.log(`📱 Found ${devices.length} devices:`);
    devices.forEach((device, index) => {
      console.log(`  ${index + 1}. ${device.name} (${device.id}) - ${device.type}`);
    });

    // Connect to first device if available
    if (devices.length > 0) {
      const firstDevice = devices[0];
      console.log(`🔗 Connecting to ${firstDevice.name}...`);
      
      const connectionResult = await deviceManager.connectToDevice(firstDevice.id);
      
      if (connectionResult.success) {
        console.log('✅ Successfully connected to device');
        console.log('📊 Device info:', connectionResult.device);
      } else {
        console.log('❌ Failed to connect:', connectionResult.error);
      }
    }

    // Get connected devices
    const connectedDevices = deviceManager.getConnectedDevices();
    console.log(`🔗 Currently connected devices: ${connectedDevices.length}`);

    return { success: true, devices, connectedDevices };

  } catch (error) {
    console.error('❌ Device scanning example failed:', error);
    return { success: false, error };
  }
}

/**
 * Example 3: Health Data Retrieval
 */
export async function healthDataRetrievalExample() {
  console.log('=== Health Data Retrieval Example ===');

  try {
    const deviceManager = DeviceIntegrationManager.getInstance();

    // Ensure system is initialized
    if (!deviceManager.isInitialized()) {
      await deviceManager.initialize();
    }

    // Get health data for the last 7 days
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

    console.log('📊 Retrieving health data...');

    // Get different types of health data
    const [heartRateData, stepsData, sleepData] = await Promise.all([
      deviceManager.getHealthData({
        dataType: 'heart_rate',
        startDate,
        endDate,
      }),
      deviceManager.getHealthData({
        dataType: 'steps',
        startDate,
        endDate,
      }),
      deviceManager.getHealthData({
        dataType: 'sleep',
        startDate,
        endDate,
      }),
    ]);

    console.log('❤️ Heart rate data points:', heartRateData.length);
    console.log('👣 Steps data points:', stepsData.length);
    console.log('😴 Sleep data points:', sleepData.length);

    // Get aggregated health data for TCM analysis
    console.log('🔄 Getting aggregated health data...');
    const aggregatedData = await deviceManager.getAggregatedHealthData(7);
    
    console.log('📈 Health summary:', {
      averageHeartRate: aggregatedData.summary.averageHeartRate,
      dailyStepsAverage: aggregatedData.summary.dailyStepsAverage,
      sleepQuality: aggregatedData.summary.sleepQuality,
      activityLevel: aggregatedData.summary.activityLevel,
    });

    return { 
      success: true, 
      heartRateData, 
      stepsData, 
      sleepData, 
      aggregatedData 
    };

  } catch (error) {
    console.error('❌ Health data retrieval example failed:', error);
    return { success: false, error };
  }
}

/**
 * Example 4: Sensor Monitoring
 */
export async function sensorMonitoringExample() {
  console.log('=== Sensor Monitoring Example ===');

  try {
    const deviceManager = DeviceIntegrationManager.getInstance();

    // Ensure system is initialized
    if (!deviceManager.isInitialized()) {
      await deviceManager.initialize();
    }

    // Start monitoring different sensors
    console.log('🔄 Starting sensor monitoring...');

    const sensors = ['accelerometer', 'gyroscope'] as const;
    const monitoringResults = await Promise.all(
      sensors.map(async (sensor) => {
        const started = await deviceManager.startSensorMonitoring(sensor);
        console.log(`📱 ${sensor} monitoring: ${started ? '✅ Started' : '❌ Failed'}`);
        return { sensor, started };
      })
    );

    // Monitor for a short period
    console.log('⏱️ Monitoring sensors for 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Stop monitoring
    console.log('🛑 Stopping sensor monitoring...');
    const stopResults = await Promise.all(
      sensors.map(async (sensor) => {
        const stopped = await deviceManager.stopSensorMonitoring(sensor);
        console.log(`📱 ${sensor} monitoring: ${stopped ? '✅ Stopped' : '❌ Failed to stop'}`);
        return { sensor, stopped };
      })
    );

    return { success: true, monitoringResults, stopResults };

  } catch (error) {
    console.error('❌ Sensor monitoring example failed:', error);
    return { success: false, error };
  }
}

/**
 * Example 5: Configuration Management
 */
export async function configurationManagementExample() {
  console.log('=== Configuration Management Example ===');

  try {
    const deviceManager = DeviceIntegrationManager.getInstance();
    const configManager = createConfigurationManager('ConfigExample');

    // Initialize configuration manager
    await configManager.initialize();

    // Get current configuration
    console.log('⚙️ Current configuration:');
    const currentConfig = configManager.getConfiguration();
    console.log(JSON.stringify(currentConfig, null, 2));

    // Update configuration
    console.log('🔄 Updating configuration...');
    await configManager.updateConfiguration({
      syncIntervalMinutes: 30,
      enabledSensors: ['accelerometer', 'gyroscope', 'magnetometer'],
      maxCacheSize: 2000,
    });

    // Apply configuration to device manager
    await deviceManager.updateConfiguration(configManager.getConfiguration());

    console.log('✅ Configuration updated successfully');

    // Get configuration statistics
    const stats = configManager.getConfigurationStatistics();
    console.log('📊 Configuration statistics:', stats);

    // Export configuration
    const exportedConfig = configManager.exportConfiguration();
    console.log('📤 Exported configuration length:', exportedConfig.length);

    return { success: true, currentConfig, stats, exportedConfig };

  } catch (error) {
    console.error('❌ Configuration management example failed:', error);
    return { success: false, error };
  }
}

/**
 * Example 6: Device Capability Checking
 */
export async function deviceCapabilityExample() {
  console.log('=== Device Capability Example ===');

  try {
    const capabilityChecker = createDeviceCapabilityChecker('CapabilityExample');

    // Check comprehensive device capabilities
    console.log('🔍 Checking device capabilities...');
    const capabilities = await capabilityChecker.checkDeviceCapabilities();

    console.log('📱 Device capabilities:', {
      platform: capabilities.platform,
      deviceType: capabilities.deviceType,
      systemVersion: capabilities.systemVersion,
      hasHealthApp: capabilities.hasHealthApp,
      hasBluetooth: capabilities.hasBluetooth,
      hasNFC: capabilities.hasNFC,
    });

    console.log('🔧 Available sensors:');
    Object.entries(capabilities.sensors).forEach(([sensor, available]) => {
      console.log(`  ${sensor}: ${available ? '✅' : '❌'}`);
    });

    // Check individual sensor availability
    const sensorChecks = await Promise.all([
      capabilityChecker.isSensorAvailable('accelerometer'),
      capabilityChecker.isSensorAvailable('gyroscope'),
      capabilityChecker.isSensorAvailable('magnetometer'),
      capabilityChecker.isSensorAvailable('barometer'),
    ]);

    console.log('🔍 Individual sensor checks:', {
      accelerometer: sensorChecks[0],
      gyroscope: sensorChecks[1],
      magnetometer: sensorChecks[2],
      barometer: sensorChecks[3],
    });

    // Get capability summary
    const summary = capabilityChecker.getCapabilitySummary();
    console.log('📊 Capability summary:', summary);

    return { success: true, capabilities, summary };

  } catch (error) {
    console.error('❌ Device capability example failed:', error);
    return { success: false, error };
  }
}

/**
 * Example 7: Complete Integration Workflow
 */
export async function completeIntegrationWorkflow() {
  console.log('=== Complete Integration Workflow ===');

  try {
    console.log('🚀 Starting complete device integration workflow...');

    // Step 1: Initialize system
    const initResult = await basicDeviceIntegrationExample();
    if (!initResult.success) {
      throw new Error('System initialization failed');
    }

    // Step 2: Check capabilities
    const capabilityResult = await deviceCapabilityExample();
    if (!capabilityResult.success) {
      throw new Error('Capability check failed');
    }

    // Step 3: Configure system
    const configResult = await configurationManagementExample();
    if (!configResult.success) {
      throw new Error('Configuration failed');
    }

    // Step 4: Scan and connect devices
    const scanResult = await deviceScanningExample();
    if (!scanResult.success) {
      throw new Error('Device scanning failed');
    }

    // Step 5: Monitor sensors
    const sensorResult = await sensorMonitoringExample();
    if (!sensorResult.success) {
      console.warn('⚠️ Sensor monitoring had issues, but continuing...');
    }

    // Step 6: Retrieve health data
    const healthDataResult = await healthDataRetrievalExample();
    if (!healthDataResult.success) {
      console.warn('⚠️ Health data retrieval had issues, but continuing...');
    }

    console.log('🎉 Complete integration workflow completed successfully!');

    return {
      success: true,
      results: {
        initialization: initResult,
        capabilities: capabilityResult,
        configuration: configResult,
        deviceScanning: scanResult,
        sensorMonitoring: sensorResult,
        healthData: healthDataResult,
      }
    };

  } catch (error) {
    console.error('❌ Complete integration workflow failed:', error);
    return { success: false, error };
  }
}

/**
 * Run all examples
 */
export async function runAllDeviceIntegrationExamples() {
  console.log('🔄 Running all device integration examples...\n');

  const examples = [
    { name: 'Basic Integration', fn: basicDeviceIntegrationExample },
    { name: 'Device Scanning', fn: deviceScanningExample },
    { name: 'Health Data Retrieval', fn: healthDataRetrievalExample },
    { name: 'Sensor Monitoring', fn: sensorMonitoringExample },
    { name: 'Configuration Management', fn: configurationManagementExample },
    { name: 'Device Capabilities', fn: deviceCapabilityExample },
    { name: 'Complete Workflow', fn: completeIntegrationWorkflow },
  ];

  const results = [];

  for (const example of examples) {
    console.log(`\n--- ${example.name} ---`);
    try {
      const result = await example.fn();
      results.push({ name: example.name, ...result });
      console.log(`✅ ${example.name} completed\n`);
    } catch (error) {
      console.error(`❌ ${example.name} failed:`, error);
      results.push({ name: example.name, success: false, error });
    }
  }

  // Summary
  console.log('\n=== DEVICE INTEGRATION EXAMPLES SUMMARY ===');
  const successful = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`✅ Successful: ${successful}/${total}`);
  console.log(`❌ Failed: ${total - successful}/${total}`);

  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${result.name}`);
  });

  return results;
}

// Export individual examples for selective testing
export {
  basicDeviceIntegrationExample,
  deviceScanningExample,
  healthDataRetrievalExample,
  sensorMonitoringExample,
  configurationManagementExample,
  deviceCapabilityExample,
  completeIntegrationWorkflow,
};