import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    Switch,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

import { HapticTouchButton } from '../ui/EnhancedTouchInterface';
import MobileDeviceIntegrationManager from '../../lib/MobileDeviceIntegrationManager';

/**
 * Health Device Integration Component
 * Provides UI for connecting and managing health devices and apps
 */

export default function HealthDeviceIntegration({
    onDataReceived,
    onClose,
    theme,
    isDark,
    t = {}
}) {
    // State
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [capabilities, setCapabilities] = useState(null);
    const [connectedDevices, setConnectedDevices] = useState([]);
    const [availableDevices, setAvailableDevices] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [healthData, setHealthData] = useState(null);
    const [integrationStatus, setIntegrationStatus] = useState({});
    
    // Settings
    const [enableHealthApp, setEnableHealthApp] = useState(true);
    const [enableSensors, setEnableSensors] = useState(true);
    const [enableWearables, setEnableWearables] = useState(true);

    // Translations
    const translations = {
        title: t.healthDevices?.title || 'Health Device Integration',
        healthApps: t.healthDevices?.healthApps || 'Health Apps',
        wearableDevices: t.healthDevices?.wearableDevices || 'Wearable Devices',
        sensors: t.healthDevices?.sensors || 'Device Sensors',
        scanDevices: t.healthDevices?.scanDevices || 'Scan for Devices',
        connect: t.healthDevices?.connect || 'Connect',
        disconnect: t.healthDevices?.disconnect || 'Disconnect',
        connected: t.healthDevices?.connected || 'Connected',
        notConnected: t.healthDevices?.notConnected || 'Not Connected',
        healthData: t.healthDevices?.healthData || 'Health Data Summary',
        syncData: t.healthDevices?.syncData || 'Sync Health Data',
        useData: t.healthDevices?.useData || 'Use for Diagnosis',
        noDevices: t.healthDevices?.noDevices || 'No devices found',
        scanning: t.healthDevices?.scanning || 'Scanning...',
        initializing: t.healthDevices?.initializing || 'Initializing...',
        error: t.healthDevices?.error || 'Error',
        success: t.healthDevices?.success || 'Success',
    };

    const styles = createStyles(theme, isDark);

    // Initialize device integration on mount
    useEffect(() => {
        initializeIntegration();
        return () => {
            // Cleanup on unmount
            MobileDeviceIntegrationManager.cleanup();
        };
    }, []);

    // Refresh status periodically
    useEffect(() => {
        const interval = setInterval(() => {
            refreshStatus();
        }, 5000); // Every 5 seconds

        return () => clearInterval(interval);
    }, []);

    /**
     * Initialize device integration
     */
    const initializeIntegration = async () => {
        try {
            setIsLoading(true);
            
            const result = await MobileDeviceIntegrationManager.initialize();
            
            if (result.success) {
                setIsInitialized(true);
                await refreshStatus();
                await loadHealthData();
            } else {
                Alert.alert(translations.error, result.error);
            }
        } catch (error) {
            console.error('Integration initialization failed:', error);
            Alert.alert(translations.error, 'Failed to initialize device integration');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Refresh integration status
     */
    const refreshStatus = async () => {
        try {
            const status = MobileDeviceIntegrationManager.getStatus();
            setIntegrationStatus(status);
            setCapabilities(status.capabilities);
            
            const devices = MobileDeviceIntegrationManager.getConnectedDevices();
            setConnectedDevices(devices);
        } catch (error) {
            console.error('Failed to refresh status:', error);
        }
    };

    /**
     * Load aggregated health data
     */
    const loadHealthData = async () => {
        try {
            const data = await MobileDeviceIntegrationManager.getAggregatedHealthData(7);
            setHealthData(data);
        } catch (error) {
            console.error('Failed to load health data:', error);
        }
    };

    /**
     * Scan for wearable devices
     */
    const scanForDevices = async () => {
        try {
            setIsScanning(true);
            const devices = await MobileDeviceIntegrationManager.scanForWearableDevices();
            setAvailableDevices(devices);
        } catch (error) {
            console.error('Device scan failed:', error);
            Alert.alert(translations.error, 'Failed to scan for devices');
        } finally {
            setIsScanning(false);
        }
    };

    /**
     * Connect to a device
     */
    const connectToDevice = async (deviceId) => {
        try {
            const result = await MobileDeviceIntegrationManager.connectToDevice(deviceId);
            
            if (result.success) {
                Alert.alert(translations.success, 'Device connected successfully');
                await refreshStatus();
            } else {
                Alert.alert(translations.error, result.error);
            }
        } catch (error) {
            console.error('Device connection failed:', error);
            Alert.alert(translations.error, 'Failed to connect to device');
        }
    };

    /**
     * Disconnect from a device
     */
    const disconnectFromDevice = async (deviceId) => {
        try {
            const result = await MobileDeviceIntegrationManager.disconnectFromDevice(deviceId);
            
            if (result.success) {
                Alert.alert(translations.success, 'Device disconnected');
                await refreshStatus();
            } else {
                Alert.alert(translations.error, result.error);
            }
        } catch (error) {
            console.error('Device disconnection failed:', error);
            Alert.alert(translations.error, 'Failed to disconnect from device');
        }
    };

    /**
     * Use health data for diagnosis
     */
    const useHealthDataForDiagnosis = () => {
        if (healthData) {
            onDataReceived({
                type: 'healthDeviceData',
                data: healthData,
                timestamp: Date.now(),
            });
        }
    };

    /**
     * Render health app integration section
     */
    const renderHealthAppSection = () => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Ionicons name="fitness" size={24} color={theme.accent.primary} />
                <Text style={styles.sectionTitle}>{translations.healthApps}</Text>
                <Switch
                    value={enableHealthApp}
                    onValueChange={setEnableHealthApp}
                    trackColor={{ false: '#767577', true: theme.accent.primary + '80' }}
                    thumbColor={enableHealthApp ? theme.accent.primary : '#f4f3f4'}
                />
            </View>
            
            {enableHealthApp && capabilities && (
                <View style={styles.sectionContent}>
                    <View style={styles.statusCard}>
                        <Text style={styles.statusLabel}>
                            {capabilities.platform === 'ios' ? 'Apple Health' : 'Google Fit'}
                        </Text>
                        <View style={styles.statusIndicator}>
                            <Ionicons 
                                name="checkmark-circle" 
                                size={16} 
                                color={theme.semantic.success} 
                            />
                            <Text style={styles.statusText}>Connected</Text>
                        </View>
                    </View>
                    
                    <Text style={styles.dataTypesLabel}>Available Data Types:</Text>
                    <View style={styles.dataTypesList}>
                        {['Heart Rate', 'Steps', 'Sleep', 'Weight'].map((type, index) => (
                            <View key={index} style={styles.dataTypeChip}>
                                <Text style={styles.dataTypeText}>{type}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );

    /**
     * Render wearable devices section
     */
    const renderWearableDevicesSection = () => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Ionicons name="watch" size={24} color={theme.accent.primary} />
                <Text style={styles.sectionTitle}>{translations.wearableDevices}</Text>
                <Switch
                    value={enableWearables}
                    onValueChange={setEnableWearables}
                    trackColor={{ false: '#767577', true: theme.accent.primary + '80' }}
                    thumbColor={enableWearables ? theme.accent.primary : '#f4f3f4'}
                />
            </View>
            
            {enableWearables && (
                <View style={styles.sectionContent}>
                    {/* Connected Devices */}
                    {connectedDevices.length > 0 && (
                        <View style={styles.connectedDevices}>
                            <Text style={styles.subsectionTitle}>Connected Devices</Text>
                            {connectedDevices.map((device) => (
                                <View key={device.id} style={styles.deviceCard}>
                                    <View style={styles.deviceInfo}>
                                        <Ionicons name="bluetooth" size={20} color={theme.semantic.success} />
                                        <Text style={styles.deviceName}>{device.name || device.id}</Text>
                                    </View>
                                    <HapticTouchButton
                                        onPress={() => disconnectFromDevice(device.id)}
                                        style={styles.disconnectButton}
                                        theme={theme}
                                        isDark={isDark}
                                    >
                                        <Text style={styles.disconnectButtonText}>{translations.disconnect}</Text>
                                    </HapticTouchButton>
                                </View>
                            ))}
                        </View>
                    )}
                    
                    {/* Scan for Devices */}
                    <HapticTouchButton
                        onPress={scanForDevices}
                        style={styles.scanButton}
                        disabled={isScanning}
                        theme={theme}
                        isDark={isDark}
                    >
                        {isScanning ? (
                            <ActivityIndicator size="small" color={theme.text.primary} />
                        ) : (
                            <Ionicons name="search" size={20} color={theme.text.primary} />
                        )}
                        <Text style={styles.scanButtonText}>
                            {isScanning ? translations.scanning : translations.scanDevices}
                        </Text>
                    </HapticTouchButton>
                    
                    {/* Available Devices */}
                    {availableDevices.length > 0 && (
                        <View style={styles.availableDevices}>
                            <Text style={styles.subsectionTitle}>Available Devices</Text>
                            {availableDevices.map((device) => (
                                <View key={device.id} style={styles.deviceCard}>
                                    <View style={styles.deviceInfo}>
                                        <Ionicons name="bluetooth-outline" size={20} color={theme.text.tertiary} />
                                        <View>
                                            <Text style={styles.deviceName}>{device.name}</Text>
                                            <Text style={styles.deviceType}>{device.type}</Text>
                                        </View>
                                    </View>
                                    <HapticTouchButton
                                        onPress={() => connectToDevice(device.id)}
                                        style={styles.connectButton}
                                        theme={theme}
                                        isDark={isDark}
                                    >
                                        <Text style={styles.connectButtonText}>{translations.connect}</Text>
                                    </HapticTouchButton>
                                </View>
                            ))}
                        </View>
                    )}
                    
                    {availableDevices.length === 0 && !isScanning && (
                        <Text style={styles.noDevicesText}>{translations.noDevices}</Text>
                    )}
                </View>
            )}
        </View>
    );

    /**
     * Render sensors section
     */
    const renderSensorsSection = () => (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Ionicons name="phone-portrait" size={24} color={theme.accent.primary} />
                <Text style={styles.sectionTitle}>{translations.sensors}</Text>
                <Switch
                    value={enableSensors}
                    onValueChange={setEnableSensors}
                    trackColor={{ false: '#767577', true: theme.accent.primary + '80' }}
                    thumbColor={enableSensors ? theme.accent.primary : '#f4f3f4'}
                />
            </View>
            
            {enableSensors && capabilities && (
                <View style={styles.sectionContent}>
                    <View style={styles.sensorsGrid}>
                        {Object.entries(capabilities.sensors || {}).map(([sensor, available]) => (
                            <View key={sensor} style={styles.sensorCard}>
                                <Ionicons 
                                    name={getSensorIcon(sensor)} 
                                    size={20} 
                                    color={available ? theme.semantic.success : theme.text.tertiary} 
                                />
                                <Text style={[
                                    styles.sensorName,
                                    { color: available ? theme.text.primary : theme.text.tertiary }
                                ]}>
                                    {sensor.charAt(0).toUpperCase() + sensor.slice(1)}
                                </Text>
                                <Text style={styles.sensorStatus}>
                                    {available ? 'Active' : 'Unavailable'}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>
            )}
        </View>
    );

    /**
     * Render health data summary
     */
    const renderHealthDataSummary = () => {
        if (!healthData || !healthData.summary) return null;

        const { summary } = healthData;

        return (
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Ionicons name="analytics" size={24} color={theme.accent.primary} />
                    <Text style={styles.sectionTitle}>{translations.healthData}</Text>
                </View>
                
                <View style={styles.sectionContent}>
                    <View style={styles.healthSummaryGrid}>
                        <View style={styles.healthMetricCard}>
                            <Ionicons name="heart" size={24} color={theme.semantic.error} />
                            <Text style={styles.metricValue}>{summary.averageHeartRate}</Text>
                            <Text style={styles.metricLabel}>Avg Heart Rate</Text>
                            <Text style={styles.metricUnit}>BPM</Text>
                        </View>
                        
                        <View style={styles.healthMetricCard}>
                            <Ionicons name="walk" size={24} color={theme.accent.primary} />
                            <Text style={styles.metricValue}>{summary.dailyStepsAverage.toLocaleString()}</Text>
                            <Text style={styles.metricLabel}>Daily Steps</Text>
                            <Text style={styles.metricUnit}>avg</Text>
                        </View>
                        
                        <View style={styles.healthMetricCard}>
                            <Ionicons name="moon" size={24} color={theme.accent.secondary} />
                            <Text style={styles.metricValue}>{summary.sleepQuality}</Text>
                            <Text style={styles.metricLabel}>Sleep Quality</Text>
                            <Text style={styles.metricUnit}>7 days</Text>
                        </View>
                        
                        <View style={styles.healthMetricCard}>
                            <Ionicons name="fitness" size={24} color={theme.semantic.success} />
                            <Text style={styles.metricValue}>{summary.activityLevel}</Text>
                            <Text style={styles.metricLabel}>Activity Level</Text>
                            <Text style={styles.metricUnit}>overall</Text>
                        </View>
                    </View>
                    
                    <HapticTouchButton
                        onPress={useHealthDataForDiagnosis}
                        style={styles.useDataButton}
                        theme={theme}
                        isDark={isDark}
                    >
                        <LinearGradient
                            colors={theme.gradients.primary}
                            style={styles.useDataGradient}
                        >
                            <Text style={styles.useDataButtonText}>{translations.useData}</Text>
                            <Ionicons name="arrow-forward" size={20} color="#ffffff" />
                        </LinearGradient>
                    </HapticTouchButton>
                </View>
            </View>
        );
    };

    /**
     * Get sensor icon name
     */
    const getSensorIcon = (sensorType) => {
        switch (sensorType) {
            case 'accelerometer': return 'speedometer';
            case 'gyroscope': return 'compass';
            case 'magnetometer': return 'magnet';
            case 'barometer': return 'cloud';
            default: return 'hardware-chip';
        }
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.accent.primary} />
                <Text style={styles.loadingText}>{translations.initializing}</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>{translations.title}</Text>
                <HapticTouchButton
                    onPress={onClose}
                    style={styles.closeButton}
                    theme={theme}
                    isDark={isDark}
                >
                    <Ionicons name="close" size={24} color={theme.text.primary} />
                </HapticTouchButton>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {renderHealthAppSection()}
                {renderWearableDevicesSection()}
                {renderSensorsSection()}
                {renderHealthDataSummary()}
            </ScrollView>
        </View>
    );
}

const createStyles = (theme, isDark) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.background.primary,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.background.primary,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: theme.text.secondary,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.text.primary,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.surface.elevated,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    section: {
        marginBottom: 24,
        backgroundColor: theme.surface.elevated,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: theme.border.default,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        gap: 12,
    },
    sectionTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.text.primary,
    },
    sectionContent: {
        gap: 12,
    },
    statusCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: theme.surface.default,
        borderRadius: 12,
    },
    statusLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text.primary,
    },
    statusIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.semantic.success,
    },
    dataTypesLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.text.secondary,
        marginTop: 8,
    },
    dataTypesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
    },
    dataTypeChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: theme.accent.primary + '20',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.accent.primary + '40',
    },
    dataTypeText: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.accent.primary,
    },
    subsectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.text.primary,
        marginBottom: 8,
    },
    deviceCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 12,
        backgroundColor: theme.surface.default,
        borderRadius: 12,
        marginBottom: 8,
    },
    deviceInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    deviceName: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.text.primary,
    },
    deviceType: {
        fontSize: 12,
        color: theme.text.tertiary,
        marginTop: 2,
    },
    connectButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: theme.accent.primary,
        borderRadius: 12,
    },
    connectButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#ffffff',
    },
    disconnectButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: theme.surface.default,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border.default,
    },
    disconnectButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.text.primary,
    },
    scanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: theme.surface.default,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border.default,
        gap: 8,
    },
    scanButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.text.primary,
    },
    noDevicesText: {
        textAlign: 'center',
        fontSize: 14,
        color: theme.text.tertiary,
        fontStyle: 'italic',
        marginTop: 16,
    },
    sensorsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    sensorCard: {
        flex: 1,
        minWidth: '45%',
        alignItems: 'center',
        padding: 12,
        backgroundColor: theme.surface.default,
        borderRadius: 12,
        gap: 6,
    },
    sensorName: {
        fontSize: 12,
        fontWeight: '600',
    },
    sensorStatus: {
        fontSize: 10,
        color: theme.text.tertiary,
    },
    healthSummaryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
    },
    healthMetricCard: {
        flex: 1,
        minWidth: '45%',
        alignItems: 'center',
        padding: 16,
        backgroundColor: theme.surface.default,
        borderRadius: 12,
        gap: 4,
    },
    metricValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.text.primary,
        marginTop: 8,
    },
    metricLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: theme.text.secondary,
        textAlign: 'center',
    },
    metricUnit: {
        fontSize: 10,
        color: theme.text.tertiary,
    },
    useDataButton: {
        borderRadius: 12,
        overflow: 'hidden',
    },
    useDataGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    useDataButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
    },
});