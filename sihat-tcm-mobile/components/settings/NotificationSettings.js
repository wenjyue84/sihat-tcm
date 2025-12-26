import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Switch,
    TouchableOpacity,
    Alert,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { HapticTouchButton } from '../ui/EnhancedTouchInterface';
import MobileNotificationManager from '../../lib/MobileNotificationManager';

/**
 * Notification Settings Component
 * Provides comprehensive notification preferences management
 */

export default function NotificationSettings({
    onClose,
    theme,
    t = {}
}) {
    // State
    const [preferences, setPreferences] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [showQuietStartPicker, setShowQuietStartPicker] = useState(false);
    const [showQuietEndPicker, setShowQuietEndPicker] = useState(false);
    const [notificationStats, setNotificationStats] = useState({});

    // Translations
    const translations = {
        title: t.notificationSettings?.title || 'Notification Settings',
        generalSettings: t.notificationSettings?.generalSettings || 'General Settings',
        enableNotifications: t.notificationSettings?.enableNotifications || 'Enable Notifications',
        categories: t.notificationSettings?.categories || 'Notification Categories',
        quietHours: t.notificationSettings?.quietHours || 'Quiet Hours',
        frequency: t.notificationSettings?.frequency || 'Frequency Settings',
        statistics: t.notificationSettings?.statistics || 'Statistics',
        testNotification: t.notificationSettings?.testNotification || 'Send Test Notification',
        resetSettings: t.notificationSettings?.resetSettings || 'Reset to Defaults',
        save: t.notificationSettings?.save || 'Save Settings',
        
        // Categories
        health: t.notificationSettings?.health || 'Health Tips',
        medication: t.notificationSettings?.medication || 'Medication Reminders',
        exercise: t.notificationSettings?.exercise || 'Exercise Reminders',
        diet: t.notificationSettings?.diet || 'Dietary Advice',
        sleep: t.notificationSettings?.sleep || 'Sleep Reminders',
        appointments: t.notificationSettings?.appointments || 'Appointments',
        
        // Frequency
        daily: t.notificationSettings?.daily || 'Daily',
        weekly: t.notificationSettings?.weekly || 'Weekly',
        monthly: t.notificationSettings?.monthly || 'Monthly',
        
        // Quiet Hours
        enableQuietHours: t.notificationSettings?.enableQuietHours || 'Enable Quiet Hours',
        quietStart: t.notificationSettings?.quietStart || 'Start Time',
        quietEnd: t.notificationSettings?.quietEnd || 'End Time',
        
        // Statistics
        totalScheduled: t.notificationSettings?.totalScheduled || 'Scheduled',
        totalReceived: t.notificationSettings?.totalReceived || 'Received',
        pushToken: t.notificationSettings?.pushToken || 'Push Token',
        
        // Messages
        settingsSaved: t.notificationSettings?.settingsSaved || 'Settings saved successfully',
        testSent: t.notificationSettings?.testSent || 'Test notification sent',
        resetConfirm: t.notificationSettings?.resetConfirm || 'Reset all notification settings to defaults?',
        error: t.notificationSettings?.error || 'Error',
    };

    const styles = createStyles(theme);

    // Load preferences on mount
    useEffect(() => {
        loadPreferences();
        loadStatistics();
    }, []);

    /**
     * Load current notification preferences
     */
    const loadPreferences = async () => {
        try {
            setIsLoading(true);
            const stats = MobileNotificationManager.getNotificationStats();
            setPreferences(stats.preferences || {});
        } catch (error) {
            console.error('Failed to load notification preferences:', error);
            Alert.alert(translations.error, 'Failed to load notification settings');
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * Load notification statistics
     */
    const loadStatistics = async () => {
        try {
            const stats = MobileNotificationManager.getNotificationStats();
            setNotificationStats(stats);
        } catch (error) {
            console.error('Failed to load notification statistics:', error);
        }
    };

    /**
     * Update preference value
     */
    const updatePreference = (key, value) => {
        setPreferences(prev => ({
            ...prev,
            [key]: value,
        }));
    };

    /**
     * Update nested preference value
     */
    const updateNestedPreference = (parentKey, childKey, value) => {
        setPreferences(prev => ({
            ...prev,
            [parentKey]: {
                ...prev[parentKey],
                [childKey]: value,
            },
        }));
    };

    /**
     * Save preferences
     */
    const savePreferences = async () => {
        try {
            const success = await MobileNotificationManager.updatePreferences(preferences);
            if (success) {
                Alert.alert(translations.save, translations.settingsSaved);
                await loadStatistics(); // Refresh stats
            } else {
                Alert.alert(translations.error, 'Failed to save settings');
            }
        } catch (error) {
            console.error('Failed to save preferences:', error);
            Alert.alert(translations.error, 'Failed to save settings');
        }
    };

    /**
     * Send test notification
     */
    const sendTestNotification = async () => {
        try {
            await MobileNotificationManager.scheduleTCMNotification('constitutionTips', {
                isTest: true,
                message: 'This is a test notification from Sihat TCM',
            }, { seconds: 2 });
            
            Alert.alert(translations.testNotification, translations.testSent);
        } catch (error) {
            console.error('Failed to send test notification:', error);
            Alert.alert(translations.error, 'Failed to send test notification');
        }
    };

    /**
     * Reset settings to defaults
     */
    const resetSettings = () => {
        Alert.alert(
            translations.resetSettings,
            translations.resetConfirm,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reset',
                    style: 'destructive',
                    onPress: async () => {
                        const defaultPreferences = {
                            enabled: true,
                            healthReminders: true,
                            medicationAlerts: true,
                            appointmentReminders: true,
                            exerciseReminders: true,
                            sleepReminders: true,
                            quietHours: {
                                enabled: true,
                                start: '22:00',
                                end: '07:00',
                            },
                            frequency: {
                                daily: true,
                                weekly: true,
                                monthly: false,
                            },
                            categories: {
                                health: true,
                                medication: true,
                                exercise: true,
                                diet: true,
                                sleep: true,
                                appointments: true,
                            },
                        };
                        
                        setPreferences(defaultPreferences);
                        await MobileNotificationManager.updatePreferences(defaultPreferences);
                        Alert.alert(translations.resetSettings, 'Settings reset to defaults');
                    },
                },
            ]
        );
    };

    /**
     * Format time for display
     */
    const formatTime = (timeString) => {
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    /**
     * Handle time picker change
     */
    const handleTimeChange = (_, selectedTime, type) => {
        if (Platform.OS === 'android') {
            setShowQuietStartPicker(false);
            setShowQuietEndPicker(false);
        }

        if (selectedTime) {
            const timeString = `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}`;
            updateNestedPreference('quietHours', type, timeString);
        }
    };

    /**
     * Render general settings section
     */
    const renderGeneralSettings = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{translations.generalSettings}</Text>
            
            <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                    <Ionicons name="notifications" size={20} color={theme.accent.primary} />
                    <Text style={styles.settingLabel}>{translations.enableNotifications}</Text>
                </View>
                <Switch
                    value={preferences.enabled}
                    onValueChange={(value) => updatePreference('enabled', value)}
                    trackColor={{ false: '#767577', true: theme.accent.primary + '80' }}
                    thumbColor={preferences.enabled ? theme.accent.primary : '#f4f3f4'}
                />
            </View>
        </View>
    );

    /**
     * Render notification categories section
     */
    const renderCategoriesSettings = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{translations.categories}</Text>
            
            {Object.entries(preferences.categories || {}).map(([category, enabled]) => (
                <View key={category} style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Ionicons 
                            name={getCategoryIcon(category)} 
                            size={20} 
                            color={enabled ? theme.accent.primary : theme.text.tertiary} 
                        />
                        <Text style={styles.settingLabel}>{translations[category]}</Text>
                    </View>
                    <Switch
                        value={enabled}
                        onValueChange={(value) => updateNestedPreference('categories', category, value)}
                        trackColor={{ false: '#767577', true: theme.accent.primary + '80' }}
                        thumbColor={enabled ? theme.accent.primary : '#f4f3f4'}
                    />
                </View>
            ))}
        </View>
    );

    /**
     * Render quiet hours section
     */
    const renderQuietHoursSettings = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{translations.quietHours}</Text>
            
            <View style={styles.settingRow}>
                <View style={styles.settingInfo}>
                    <Ionicons name="moon" size={20} color={theme.accent.secondary} />
                    <Text style={styles.settingLabel}>{translations.enableQuietHours}</Text>
                </View>
                <Switch
                    value={preferences.quietHours?.enabled}
                    onValueChange={(value) => updateNestedPreference('quietHours', 'enabled', value)}
                    trackColor={{ false: '#767577', true: theme.accent.primary + '80' }}
                    thumbColor={preferences.quietHours?.enabled ? theme.accent.primary : '#f4f3f4'}
                />
            </View>
            
            {preferences.quietHours?.enabled && (
                <>
                    <TouchableOpacity 
                        style={styles.timePickerRow}
                        onPress={() => setShowQuietStartPicker(true)}
                    >
                        <Text style={styles.timeLabel}>{translations.quietStart}</Text>
                        <View style={styles.timeValue}>
                            <Text style={styles.timeText}>
                                {formatTime(preferences.quietHours?.start || '22:00')}
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color={theme.text.tertiary} />
                        </View>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={styles.timePickerRow}
                        onPress={() => setShowQuietEndPicker(true)}
                    >
                        <Text style={styles.timeLabel}>{translations.quietEnd}</Text>
                        <View style={styles.timeValue}>
                            <Text style={styles.timeText}>
                                {formatTime(preferences.quietHours?.end || '07:00')}
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color={theme.text.tertiary} />
                        </View>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );

    /**
     * Render frequency settings section
     */
    const renderFrequencySettings = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{translations.frequency}</Text>
            
            {Object.entries(preferences.frequency || {}).map(([freq, enabled]) => (
                <View key={freq} style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Ionicons 
                            name={getFrequencyIcon(freq)} 
                            size={20} 
                            color={enabled ? theme.accent.primary : theme.text.tertiary} 
                        />
                        <Text style={styles.settingLabel}>{translations[freq]}</Text>
                    </View>
                    <Switch
                        value={enabled}
                        onValueChange={(value) => updateNestedPreference('frequency', freq, value)}
                        trackColor={{ false: '#767577', true: theme.accent.primary + '80' }}
                        thumbColor={enabled ? theme.accent.primary : '#f4f3f4'}
                    />
                </View>
            ))}
        </View>
    );

    /**
     * Render statistics section
     */
    const renderStatistics = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{translations.statistics}</Text>
            
            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <Ionicons name="calendar" size={24} color={theme.accent.primary} />
                    <Text style={styles.statValue}>{notificationStats.totalScheduled || 0}</Text>
                    <Text style={styles.statLabel}>{translations.totalScheduled}</Text>
                </View>
                
                <View style={styles.statCard}>
                    <Ionicons name="checkmark-circle" size={24} color={theme.semantic.success} />
                    <Text style={styles.statValue}>{notificationStats.totalReceived || 0}</Text>
                    <Text style={styles.statLabel}>{translations.totalReceived}</Text>
                </View>
            </View>
            
            {notificationStats.pushToken && (
                <View style={styles.tokenContainer}>
                    <Text style={styles.tokenLabel}>{translations.pushToken}:</Text>
                    <Text style={styles.tokenValue} numberOfLines={1} ellipsizeMode="middle">
                        {notificationStats.pushToken}
                    </Text>
                </View>
            )}
        </View>
    );

    /**
     * Get category icon
     */
    const getCategoryIcon = (category) => {
        const icons = {
            health: 'heart',
            medication: 'medical',
            exercise: 'fitness',
            diet: 'restaurant',
            sleep: 'moon',
            appointments: 'calendar',
        };
        return icons[category] || 'notifications';
    };

    /**
     * Get frequency icon
     */
    const getFrequencyIcon = (frequency) => {
        const icons = {
            daily: 'today',
            weekly: 'calendar-outline',
            monthly: 'calendar',
        };
        return icons[frequency] || 'time';
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading settings...</Text>
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
                >
                    <Ionicons name="close" size={24} color={theme.text.primary} />
                </HapticTouchButton>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {renderGeneralSettings()}
                {renderCategoriesSettings()}
                {renderQuietHoursSettings()}
                {renderFrequencySettings()}
                {renderStatistics()}
                
                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                    <HapticTouchButton
                        onPress={sendTestNotification}
                        style={styles.testButton}
                        theme={theme}
                    >
                        <Ionicons name="send" size={20} color={theme.text.primary} />
                        <Text style={styles.testButtonText}>{translations.testNotification}</Text>
                    </HapticTouchButton>
                    
                    <HapticTouchButton
                        onPress={resetSettings}
                        style={styles.resetButton}
                        theme={theme}
                    >
                        <Ionicons name="refresh" size={20} color={theme.semantic.warning} />
                        <Text style={styles.resetButtonText}>{translations.resetSettings}</Text>
                    </HapticTouchButton>
                </View>
                
                <HapticTouchButton
                    onPress={savePreferences}
                    style={styles.saveButton}
                    theme={theme}
                >
                    <Text style={styles.saveButtonText}>{translations.save}</Text>
                </HapticTouchButton>
            </ScrollView>

            {/* Time Pickers */}
            {showQuietStartPicker && (
                <DateTimePicker
                    value={new Date(`2000-01-01T${preferences.quietHours?.start || '22:00'}:00`)}
                    mode="time"
                    is24Hour={false}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(time) => handleTimeChange(null, time, 'start')}
                />
            )}
            
            {showQuietEndPicker && (
                <DateTimePicker
                    value={new Date(`2000-01-01T${preferences.quietHours?.end || '07:00'}:00`)}
                    mode="time"
                    is24Hour={false}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(time) => handleTimeChange(null, time, 'end')}
                />
            )}
        </View>
    );
}

const createStyles = (theme) => StyleSheet.create({
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
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: theme.text.primary,
        marginBottom: 16,
    },
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: theme.border.subtle,
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    settingLabel: {
        fontSize: 16,
        color: theme.text.primary,
        fontWeight: '500',
    },
    timePickerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: theme.surface.default,
        borderRadius: 12,
        marginTop: 8,
    },
    timeLabel: {
        fontSize: 16,
        color: theme.text.primary,
        fontWeight: '500',
    },
    timeValue: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    timeText: {
        fontSize: 16,
        color: theme.accent.primary,
        fontWeight: '600',
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        alignItems: 'center',
        padding: 16,
        backgroundColor: theme.surface.default,
        borderRadius: 12,
        gap: 8,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: theme.text.primary,
    },
    statLabel: {
        fontSize: 12,
        color: theme.text.secondary,
        textAlign: 'center',
    },
    tokenContainer: {
        padding: 12,
        backgroundColor: theme.surface.default,
        borderRadius: 12,
    },
    tokenLabel: {
        fontSize: 12,
        color: theme.text.tertiary,
        marginBottom: 4,
    },
    tokenValue: {
        fontSize: 10,
        color: theme.text.secondary,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    testButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: theme.surface.elevated,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.border.default,
        gap: 8,
    },
    testButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.text.primary,
    },
    resetButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        backgroundColor: theme.surface.elevated,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: theme.semantic.warning + '40',
        gap: 8,
    },
    resetButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.semantic.warning,
    },
    saveButton: {
        backgroundColor: theme.accent.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 40,
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ffffff',
    },
});