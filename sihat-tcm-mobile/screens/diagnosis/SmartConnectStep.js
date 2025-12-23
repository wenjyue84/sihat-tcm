import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Switch,
    ScrollView,
    Animated,
    Alert,
    Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '../../contexts/LanguageContext';

const HEALTH_SERVICES = [
    {
        id: 'apple_health',
        name: 'Apple Health',
        icon: 'heart-circle-outline',
        color: '#FF2D55',
        platform: 'ios',
    },
    {
        id: 'google_fit',
        name: 'Google Fit',
        icon: 'fitness-outline',
        color: '#4285F4',
        platform: 'android',
    },
];

const WEARABLE_DEVICES = [
    { id: 'apple_watch', name: 'Apple Watch', icon: 'watch-outline', platform: 'ios' },
    { id: 'galaxy_watch', name: 'Galaxy Watch', icon: 'watch-outline', platform: 'android' },
    { id: 'fitbit', name: 'Fitbit', icon: 'fitness-outline', platform: 'both' },
    { id: 'garmin', name: 'Garmin', icon: 'speedometer-outline', platform: 'both' },
    { id: 'xiaomi', name: 'Mi Band', icon: 'band-outline', platform: 'both' },
];

const getSyncDataTypes = (t) => [
    { id: 'steps', label: t.smartConnect.dataTypes.steps || 'Steps', icon: 'footsteps-outline', value: '8,432' },
    { id: 'sleep', label: t.smartConnect.dataTypes.sleep || 'Sleep', icon: 'moon-outline', value: '7h 23m' },
    { id: 'heart_rate', label: t.smartConnect.dataTypes.heartRate || 'Avg HR', icon: 'heart-outline', value: '72 bpm' },
    { id: 'spo2', label: 'SpO2', icon: 'water-outline', value: '98%' },
    { id: 'activity', label: t.smartConnect.dataTypes.activity || 'Activity', icon: 'flame-outline', value: '45 min' },
    { id: 'stress', label: t.smartConnect.dataTypes.stress || 'Stress', icon: 'pulse-outline', value: 'Low' },
];

export default function SmartConnectStep({ data, onUpdate, theme, isDark }) {
    const styles = useMemo(() => createStyles(theme, isDark), [theme, isDark]);
    const { t } = useLanguage();
    const SYNC_DATA_TYPES = useMemo(() => getSyncDataTypes(t), [t]);
    const [isConnecting, setIsConnecting] = useState(false);
    const [connectedService, setConnectedService] = useState(data.smartConnectData?.service || null);
    const [connectedDevice, setConnectedDevice] = useState(data.smartConnectData?.device || null);
    const [syncedData, setSyncedData] = useState(data.smartConnectData?.syncedData || {});
    const [dataPermissions, setDataPermissions] = useState({
        steps: true, sleep: true, heart_rate: true, spo2: true, activity: false, stress: false,
    });

    const spinAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const rippleAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(0)).current;
    const [scanStep, setScanStep] = useState('idle'); // idle, scanning, connecting, reading, result
    const [currentReading, setCurrentReading] = useState('--');

    const platform = Platform.OS;
    const availableServices = HEALTH_SERVICES.filter(s => s.platform === platform || s.platform === 'both');
    const availableDevices = WEARABLE_DEVICES.filter(d => d.platform === platform || d.platform === 'both');

    useEffect(() => {
        if (scanStep === 'scanning') {
            rippleAnim.setValue(0);
            Animated.loop(
                Animated.timing(rippleAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                })
            ).start();
        } else if (scanStep === 'connecting') {
            Animated.loop(
                Animated.timing(spinAnim, {
                    toValue: 1,
                    duration: 1500,
                    useNativeDriver: true,
                })
            ).start();
        } else if (scanStep === 'reading') {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 0.5, duration: 400, useNativeDriver: true }),
                ])
            ).start();
        }
    }, [scanStep]);

    useEffect(() => {
        Animated.timing(fadeAnim, { toValue: connectedService ? 1 : 0, duration: 300, useNativeDriver: true }).start();
    }, [connectedService]);

    const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

    const handleConnectService = (service) => {
        setScanStep('scanning');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        setTimeout(() => {
            setScanStep('connecting');
            setTimeout(() => {
                setScanStep('reading');
                let count = 0;
                const interval = setInterval(() => {
                    count++;
                    const mockVal = Math.floor(Math.random() * (85 - 68) + 68);
                    setCurrentReading(mockVal.toString());
                    if (count % 4 === 0) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

                    if (count >= 15) {
                        clearInterval(interval);
                        setScanStep('result');
                        setConnectedService(service.id);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                        const simulatedData = {};
                        SYNC_DATA_TYPES.forEach(dt => {
                            if (dataPermissions[dt.id]) simulatedData[dt.id] = dt.value;
                        });
                        setSyncedData(simulatedData);
                        onUpdate({
                            ...data,
                            smartConnectData: { service: service.id, syncedData: simulatedData },
                        });
                    }
                }, 200);
            }, 2000);
        }, 2000);
    };

    const handleDisconnect = () => {
        Alert.alert(
            t.smartConnect.disconnectTitle || 'Disconnect Health Service',
            t.smartConnect.disconnectMessage || 'Are you sure you want to disconnect? Your synced data will be cleared.',
            [
                { text: t.common.cancel || 'Cancel', style: 'cancel' },
                {
                    text: t.smartConnect.disconnect || 'Disconnect',
                    style: 'destructive',
                    onPress: () => {
                        setConnectedService(null);
                        setConnectedDevice(null);
                        setSyncedData({});
                        onUpdate({ ...data, smartConnectData: null });
                    },
                },
            ]
        );
    };

    const handleDeviceConnect = (device) => {
        setConnectedDevice(device.id);
        onUpdate({
            ...data,
            smartConnectData: { ...data.smartConnectData, device: device.id },
        });
    };

    const togglePermission = (dataType) => {
        setDataPermissions(prev => ({ ...prev, [dataType]: !prev[dataType] }));
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)' }]}>
                    <Ionicons name="watch-outline" size={32} color={theme.accent.primary} />
                </View>
                <Text style={styles.title}>{t.smartConnect.title || 'Smart Connect'}</Text>
                <Text style={styles.description}>
                    {t.smartConnect.subtitle || 'Import health data from wearables and health apps for better diagnosis.'}
                </Text>
            </View>

            {!connectedService ? (
                <>
                    {scanStep === 'idle' && (
                        <>
                            {/* Health Services */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Health Services</Text>
                                {availableServices.map((service) => (
                                    <TouchableOpacity
                                        key={service.id}
                                        style={styles.serviceCard}
                                        onPress={() => handleConnectService(service)}
                                    >
                                        <View style={[styles.serviceIcon, { backgroundColor: service.color + '20' }]}>
                                            <Ionicons name={service.icon} size={24} color={service.color} />
                                        </View>
                                        <View style={styles.serviceInfo}>
                                            <Text style={styles.serviceName}>{service.name}</Text>
                                            <Text style={styles.serviceStatus}>{t.smartConnect.tapToConnect || 'Tap to connect'}</Text>
                                        </View>
                                        <Ionicons name="chevron-forward" size={20} color={theme.text.tertiary} />
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Wearable Devices */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Wearable Devices</Text>
                                <View style={styles.devicesGrid}>
                                    {availableDevices.map((device) => (
                                        <View key={device.id} style={styles.deviceChip}>
                                            <Ionicons name={device.icon} size={18} color={theme.text.tertiary} />
                                            <Text style={styles.deviceName}>{device.name}</Text>
                                        </View>
                                    ))}
                                </View>
                                <Text style={styles.devicesNote}>
                                    {t.smartConnect.connectNote || 'Connect a health service first to sync wearable data'}
                                </Text>
                            </View>
                        </>
                    )}

                    {scanStep !== 'idle' && !connectedService && (
                        <View style={styles.wizardOverlay}>
                            <BlurView intensity={30} tint={isDark ? 'dark' : 'light'} style={styles.wizardBlur}>
                                <LinearGradient
                                    colors={isDark ? ['rgba(16,185,129,0.15)', 'rgba(2,44,34,0.3)'] : ['rgba(16,185,129,0.1)', 'rgba(255,255,255,0.8)']}
                                    style={styles.wizardGradient}
                                >
                                    <View style={styles.wizardContent}>
                                        {scanStep === 'scanning' && (
                                            <View style={styles.stepContainer}>
                                                <View style={styles.rippleContainer}>
                                                    {[1, 2, 3].map((i) => (
                                                        <Animated.View
                                                            key={i}
                                                            style={[
                                                                styles.ripple,
                                                                {
                                                                    transform: [{
                                                                        scale: rippleAnim.interpolate({
                                                                            inputRange: [0, 1],
                                                                            outputRange: [1, 1.5 + (i * 0.2)]
                                                                        })
                                                                    }],
                                                                    opacity: rippleAnim.interpolate({
                                                                        inputRange: [0, 0.5, 1],
                                                                        outputRange: [0, 0.4, 0]
                                                                    })
                                                                }
                                                            ]}
                                                        />
                                                    ))}
                                                    <View style={styles.wizardIconCircle}>
                                                        <Ionicons name="bluetooth" size={32} color={theme.accent.primary} style={styles.pulseIcon} />
                                                    </View>
                                                </View>
                                                <Text style={styles.wizardStatus}>{t.smartConnect.scanning || 'Scanning for Devices...'}</Text>
                                                <Text style={styles.wizardSubStatus}>{t.smartConnect.enableBluetooth || 'Make sure Bluetooth is enabled'}</Text>
                                            </View>
                                        )}

                                        {scanStep === 'connecting' && (
                                            <View style={styles.stepContainer}>
                                                <View style={styles.wizardIconCircle}>
                                                    <Animated.View style={[styles.loadingRing, { transform: [{ rotate: spin }] }]} />
                                                    <Ionicons name="watch-outline" size={32} color={theme.accent.primary} />
                                                </View>
                                                <Text style={styles.wizardStatus}>{t.smartConnect.handshaking || 'Handshaking...'}</Text>
                                                <Text style={styles.wizardSubStatus}>{t.smartConnect.establishing || 'Establishing secure connection'}</Text>
                                            </View>
                                        )}

                                        {scanStep === 'reading' && (
                                            <View style={styles.stepContainer}>
                                                <View style={styles.readingHeader}>
                                                    <Ionicons name="heart" size={24} color="#FF2D55" />
                                                    <Text style={styles.readingValue}>{currentReading}</Text>
                                                    <Text style={styles.readingUnit}>BPM</Text>
                                                </View>

                                                <View style={styles.waveformContainer}>
                                                    {[...Array(8)].map((_, i) => (
                                                        <Animated.View
                                                            key={i}
                                                            style={[
                                                                styles.waveBar,
                                                                {
                                                                    height: pulseAnim.interpolate({
                                                                        inputRange: [0.5, 1],
                                                                        outputRange: [10 + (i * 2), 40 - (i * 2)]
                                                                    }),
                                                                    opacity: pulseAnim,
                                                                    backgroundColor: theme.accent.primary,
                                                                }
                                                            ]}
                                                        />
                                                    ))}
                                                </View>
                                                <Text style={styles.wizardStatus}>{t.smartConnect.reading || 'Reading Live Stream...'}</Text>
                                            </View>
                                        )}

                                        {scanStep === 'result' && (
                                            <View style={styles.stepContainer}>
                                                <View style={styles.successCircle}>
                                                    <Ionicons name="checkmark-sharp" size={40} color="#ffffff" />
                                                </View>
                                                <Text style={styles.wizardStatus}>{t.smartConnect.verified || 'Connection Verified'}</Text>
                                                <View style={styles.resultDetails}>
                                                    <Text style={styles.resultValue}>{currentReading} BPM</Text>
                                                    <Text style={styles.resultLabel}>{t.smartConnect.restingHr || 'Resting Heart Rate'}</Text>
                                                </View>
                                                <TouchableOpacity
                                                    style={styles.continueButton}
                                                    onPress={() => setScanStep('idle')}
                                                >
                                                    <Text style={styles.continueButtonText}>{t.smartConnect.reviewData || 'Review Synced Data'}</Text>
                                                </TouchableOpacity>
                                            </View>
                                        )}
                                    </View>
                                </LinearGradient>
                            </BlurView>
                        </View>
                    )}
                </>
            ) : (
                <Animated.View style={{ opacity: fadeAnim }}>
                    {/* Connected Status */}
                    <View style={styles.connectedCard}>
                        <View style={styles.connectedHeader}>
                            <View style={styles.connectedIcon}>
                                <Ionicons name="checkmark-circle" size={24} color={theme.semantic.success} />
                            </View>
                            <View style={styles.connectedInfo}>
                                <Text style={styles.connectedTitle}>{t.smartConnect.connected || 'Connected'}</Text>
                                <Text style={styles.connectedService}>
                                    {HEALTH_SERVICES.find(s => s.id === connectedService)?.name}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={handleDisconnect}>
                                <Ionicons name="close-circle" size={24} color={theme.text.tertiary} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Synced Data Grid */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t.smartConnect.syncedData || 'Synced Health Data'}</Text>
                        <View style={styles.dataGrid}>
                            {SYNC_DATA_TYPES.filter(dt => syncedData[dt.id]).map((dt) => (
                                <View key={dt.id} style={styles.dataCard}>
                                    <Ionicons name={dt.icon} size={20} color={theme.accent.primary} />
                                    <Text style={styles.dataValue}>{syncedData[dt.id]}</Text>
                                    <Text style={styles.dataLabel}>{dt.label}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Data Permissions */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>{t.smartConnect.permissions || 'Data Permissions'}</Text>
                        {SYNC_DATA_TYPES.map((dt) => (
                            <View key={dt.id} style={styles.permissionRow}>
                                <Ionicons name={dt.icon} size={18} color={theme.text.tertiary} />
                                <Text style={styles.permissionLabel}>{dt.label}</Text>
                                <Switch
                                    value={dataPermissions[dt.id]}
                                    onValueChange={() => togglePermission(dt.id)}
                                    trackColor={{ false: theme.border.default, true: theme.accent.primary }}
                                    thumbColor="#ffffff"
                                />
                            </View>
                        ))}
                    </View>
                </Animated.View>
            )}

            {/* Privacy Note */}
            <View style={styles.privacyNote}>
                <Ionicons name="shield-checkmark-outline" size={18} color={theme.text.tertiary} />
                <Text style={styles.privacyText}>
                    {t.smartConnect.privacy || 'Your health data is encrypted and used only for diagnosis. Connection is optional.'}
                </Text>
            </View>
        </ScrollView>
    );
}

const createStyles = (theme, isDark) => StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 24, paddingBottom: 40 },
    header: { alignItems: 'center', marginBottom: 28 },
    iconContainer: {
        width: 72, height: 72, borderRadius: 36,
        justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    },
    title: { fontSize: 24, fontWeight: 'bold', color: theme.text.primary, marginBottom: 8 },
    description: { fontSize: 14, color: theme.text.secondary, textAlign: 'center', lineHeight: 22 },
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 14, fontWeight: 'bold', color: theme.text.primary, marginBottom: 12, textTransform: 'uppercase' },
    serviceCard: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: theme.surface.elevated,
        padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.border.default,
    },
    serviceIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    serviceInfo: { flex: 1 },
    serviceName: { color: theme.text.primary, fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
    serviceStatus: { color: theme.text.tertiary, fontSize: 13, fontWeight: '500' },
    devicesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
    deviceChip: {
        flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: theme.surface.elevated,
        paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: theme.border.default,
    },
    deviceName: { color: theme.text.secondary, fontSize: 13, fontWeight: '600' },
    devicesNote: { color: theme.text.tertiary, fontSize: 12, fontStyle: 'italic', textAlign: 'center' },
    connectedCard: {
        backgroundColor: isDark ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)', borderRadius: 16, padding: 16, marginBottom: 24,
        borderWidth: 1, borderColor: theme.semantic.success,
    },
    connectedHeader: { flexDirection: 'row', alignItems: 'center' },
    connectedIcon: { marginRight: 12 },
    connectedInfo: { flex: 1 },
    connectedTitle: { color: theme.semantic.success, fontSize: 14, fontWeight: 'bold' },
    connectedService: { color: theme.text.primary, fontSize: 16, fontWeight: 'bold' },
    dataGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    dataCard: {
        width: '30%', backgroundColor: theme.surface.default, padding: 14, borderRadius: 14, alignItems: 'center',
        borderWidth: 1, borderColor: theme.border.subtle,
    },
    dataValue: { color: theme.text.primary, fontSize: 16, fontWeight: 'bold', marginTop: 8, marginBottom: 4 },
    dataLabel: { color: theme.text.tertiary, fontSize: 11, fontWeight: '600' },
    permissionRow: {
        flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
        borderBottomWidth: 1, borderBottomColor: theme.border.subtle, gap: 10,
    },
    permissionLabel: { flex: 1, color: theme.text.primary, fontSize: 14, fontWeight: '500' },
    privacyNote: {
        flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: theme.surface.elevated,
        padding: 14, borderRadius: 12, borderWidth: 1, borderColor: theme.border.default,
    },
    privacyText: { flex: 1, color: theme.text.secondary, fontSize: 12, lineHeight: 18 },
    // Wizard Styles
    wizardOverlay: {
        marginTop: 10,
        borderRadius: 24,
        overflow: 'hidden',
        minHeight: 320,
    },
    wizardBlur: {
        flex: 1,
    },
    wizardGradient: {
        flex: 1,
        padding: 2, // Border effect
    },
    wizardContent: {
        flex: 1,
        padding: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepContainer: {
        alignItems: 'center',
        width: '100%',
    },
    rippleContainer: {
        width: 120,
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    ripple: {
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 2,
        borderColor: theme.accent.primary,
    },
    wizardIconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.surface.elevated,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.border.default,
    },
    loadingRing: {
        position: 'absolute',
        width: 84,
        height: 84,
        borderRadius: 42,
        borderWidth: 3,
        borderColor: theme.accent.primary,
        borderTopColor: 'transparent',
    },
    wizardStatus: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.text.primary,
        marginBottom: 8,
    },
    wizardSubStatus: {
        fontSize: 14,
        color: theme.text.tertiary,
    },
    readingHeader: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 8,
        marginBottom: 20,
    },
    readingValue: {
        fontSize: 48,
        fontWeight: 'bold',
        color: theme.text.primary,
    },
    readingUnit: {
        fontSize: 18,
        color: theme.text.tertiary,
    },
    waveformContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 60,
        marginBottom: 24,
    },
    waveBar: {
        width: 4,
        borderRadius: 2,
    },
    successCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: theme.semantic.success,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        elevation: 4,
        shadowColor: theme.semantic.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    resultDetails: {
        alignItems: 'center',
        marginVertical: 20,
    },
    resultValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: theme.text.primary,
    },
    resultLabel: {
        fontSize: 14,
        color: theme.text.tertiary,
    },
    continueButton: {
        backgroundColor: theme.accent.primary,
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 14,
        marginTop: 10,
    },
    continueButtonText: {
        color: theme.text.inverse,
        fontWeight: 'bold',
        fontSize: 15,
    },
});
