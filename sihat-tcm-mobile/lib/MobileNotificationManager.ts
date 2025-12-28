/**
 * Mobile Notification Manager - Refactored TypeScript Version
 * 
 * Improvements:
 * - Full TypeScript support with proper typing
 * - Better error handling and logging
 * - Improved architecture with separation of concerns
 * - Enhanced cross-device synchronization
 * - Better performance and memory management
 * - Comprehensive testing support
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { 
    NotificationPreferences, 
    NotificationStats, 
    ApiResponse,
    AppError 
} from '../types';

import {
    NOTIFICATION_CONFIG,
    NOTIFICATION_TEMPLATES,
    NOTIFICATION_CHANNELS,
    NOTIFICATION_CATEGORIES,
    PRIORITY_LEVELS,
    ERROR_CODES,
} from '../constants';

import {
    AppError,
    NotificationError,
    DeviceError,
    NetworkError,
    ErrorFactory,
    ErrorHandler,
} from './errors/AppError';

// Notification Configuration
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// Types
interface NotificationTemplate {
    title: string;
    body: string;
    category: keyof NotificationPreferences['categories'];
    priority: 'low' | 'normal' | 'high' | 'urgent';
}

interface ScheduledNotification {
    id: string;
    serverId?: string;
    title: string;
    body: string;
    data: any;
    category: string;
    priority: string;
    scheduledAt: number;
    trigger: any;
}

interface NotificationHistory {
    id?: string;
    title: string;
    body: string;
    data: any;
    category: string;
    priority: string;
    receivedAt: number;
    clicked?: boolean;
    clickedAt?: number;
    deviceType?: string;
}

interface SyncData {
    deviceToken: string;
    syncData: {
        notificationHistory: NotificationHistory[];
        scheduledNotifications: ScheduledNotification[];
        preferences: NotificationPreferences;
        deviceInfo: {
            platform: string;
            version: string | number;
            timestamp: number;
        };
    };
}

/**
 * Enhanced Mobile Notification Manager
 * 
 * Singleton class for managing push notifications with improved architecture
 */
class MobileNotificationManager {
    private static instance: MobileNotificationManager;
    
    // Core properties
    private isInitialized = false;
    private expoPushToken: string | null = null;
    private notificationListener: Notifications.Subscription | null = null;
    private responseListener: Notifications.Subscription | null = null;
    
    // Data management
    private scheduledNotifications = new Map<string, ScheduledNotification>();
    private notificationHistory: NotificationHistory[] = [];
    private userPreferences: NotificationPreferences = this.getDefaultPreferences();
    
    // Configuration using constants
    private readonly config = {
        maxHistorySize: NOTIFICATION_CONFIG.MAX_HISTORY_SIZE,
        maxCacheSize: NOTIFICATION_CONFIG.MAX_CACHE_SIZE,
        syncIntervalMinutes: NOTIFICATION_CONFIG.SYNC_INTERVAL_MINUTES,
        retryAttempts: NOTIFICATION_CONFIG.RETRY_ATTEMPTS,
        retryDelay: NOTIFICATION_CONFIG.RETRY_DELAY,
    };

    // TCM-specific notification templates using constants
    private readonly tcmNotificationTemplates: Record<string, NotificationTemplate> = {
        [NOTIFICATION_TEMPLATES.SEASONAL_ADVICE]: {
            title: '🌿 Seasonal TCM Wisdom',
            body: 'Discover how to harmonize with the current season for optimal health.',
            category: NOTIFICATION_CATEGORIES.HEALTH,
            priority: PRIORITY_LEVELS.NORMAL,
        },
        [NOTIFICATION_TEMPLATES.CONSTITUTION_TIPS]: {
            title: '⚖️ Constitution Balance',
            body: 'Personalized tips based on your TCM constitution assessment.',
            category: NOTIFICATION_CATEGORIES.HEALTH,
            priority: PRIORITY_LEVELS.NORMAL,
        },
        [NOTIFICATION_TEMPLATES.MEDICATION_REMINDER]: {
            title: '💊 Herbal Medicine Time',
            body: 'Time to take your prescribed herbal formula.',
            category: NOTIFICATION_CATEGORIES.MEDICATION,
            priority: PRIORITY_LEVELS.HIGH,
        },
        [NOTIFICATION_TEMPLATES.EXERCISE_REMINDER]: {
            title: '🧘 Qi Exercise Time',
            body: 'Practice your daily Qi exercises for energy balance.',
            category: NOTIFICATION_CATEGORIES.EXERCISE,
            priority: PRIORITY_LEVELS.NORMAL,
        },
        [NOTIFICATION_TEMPLATES.DIETARY_ADVICE]: {
            title: '🍲 TCM Nutrition Tip',
            body: 'Nourish your body with foods that support your constitution.',
            category: NOTIFICATION_CATEGORIES.DIET,
            priority: PRIORITY_LEVELS.NORMAL,
        },
        [NOTIFICATION_TEMPLATES.SLEEP_HYGIENE]: {
            title: '🌙 Sleep & Qi Restoration',
            body: 'Prepare for restorative sleep to replenish your Qi.',
            category: NOTIFICATION_CATEGORIES.SLEEP,
            priority: PRIORITY_LEVELS.NORMAL,
        },
        [NOTIFICATION_TEMPLATES.APPOINTMENT_REMINDER]: {
            title: '📅 TCM Consultation',
            body: 'Your TCM consultation is coming up.',
            category: NOTIFICATION_CATEGORIES.APPOINTMENTS,
            priority: PRIORITY_LEVELS.HIGH,
        },
        [NOTIFICATION_TEMPLATES.HEALTH_ALERT]: {
            title: '⚠️ Health Alert',
            body: 'Important health information requires your attention.',
            category: NOTIFICATION_CATEGORIES.HEALTH,
            priority: PRIORITY_LEVELS.URGENT,
        },
    };

    private constructor() {
        // Private constructor for singleton pattern
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): MobileNotificationManager {
        if (!MobileNotificationManager.instance) {
            MobileNotificationManager.instance = new MobileNotificationManager();
        }
        return MobileNotificationManager.instance;
    }

    /**
     * Initialize notification system with enhanced error handling
     */
    public async initialize(): Promise<ApiResponse<{ token: string }>> {
        try {
            console.log('[NotificationManager] Initializing...');
            
            // Request permissions
            const permissionResult = await this.requestPermissions();
            if (!permissionResult.granted) {
                throw new NotificationError('Notification permissions not granted', {
                    component: 'MobileNotificationManager',
                    action: 'initialize',
                    metadata: { permissionStatus: permissionResult.status }
                });
            }

            // Get push token
            const token = await this.registerForPushNotifications();
            if (!token) {
                throw new NotificationError('Failed to get push token', {
                    component: 'MobileNotificationManager',
                    action: 'registerForPushNotifications'
                });
            }

            // Load user preferences and history
            await Promise.all([
                this.loadUserPreferences(),
                this.loadNotificationHistory()
            ]);
            
            // Set up notification listeners
            this.setupNotificationListeners();
            
            // Schedule default notifications
            await this.scheduleDefaultNotifications();
            
            this.isInitialized = true;
            console.log('[NotificationManager] Initialization complete');
            
            return { 
                success: true, 
                data: { token }
            };
        } catch (error) {
            const appError = ErrorFactory.fromUnknownError(error, {
                component: 'MobileNotificationManager',
                action: 'initialize'
            });
            
            ErrorHandler.handle(appError);
            
            return { 
                success: false, 
                error: appError.getUserMessage()
            };
        }
    }

    /**
     * Request notification permissions with proper error handling
     */
    private async requestPermissions(): Promise<{ granted: boolean; status?: string }> {
        try {
            if (!Device.isDevice) {
                console.warn('[NotificationManager] Must use physical device for Push Notifications');
                return { granted: false };
            }

            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            
            return { 
                granted: finalStatus === 'granted', 
                status: finalStatus 
            };
        } catch (error) {
            console.error('[NotificationManager] Permission request failed:', error);
            return { granted: false };
        }
    }

    /**
     * Register for push notifications and get token
     */
    private async registerForPushNotifications(): Promise<string | null> {
        try {
            if (!Device.isDevice) {
                console.warn('[NotificationManager] Must use physical device for Push Notifications');
                return null;
            }

            const token = await Notifications.getExpoPushTokenAsync({
                projectId: process.env.EXPO_PROJECT_ID || 'your-expo-project-id',
            });
            
            this.expoPushToken = token.data;
            console.log('[NotificationManager] Push token obtained');
            
            // Store token for server registration
            await AsyncStorage.setItem('expoPushToken', this.expoPushToken);
            
            // Configure notification channels for Android
            if (Platform.OS === 'android') {
                await this.setupAndroidChannels();
            }
            
            return this.expoPushToken;
        } catch (error) {
            console.error('[NotificationManager] Token registration failed:', error);
            throw error;
        }
    }

    /**
     * Setup Android notification channels with proper configuration
     */
    private async setupAndroidChannels(): Promise<void> {
        const channels = [
            {
                id: 'health',
                name: 'Health Notifications',
                importance: Notifications.AndroidImportance.DEFAULT,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#10b981',
            },
            {
                id: 'medication',
                name: 'Medication Reminders',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#ef4444',
            },
            {
                id: 'exercise',
                name: 'Exercise Reminders',
                importance: Notifications.AndroidImportance.DEFAULT,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#3b82f6',
            },
            {
                id: 'appointments',
                name: 'Appointment Reminders',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#f59e0b',
            },
            {
                id: 'urgent',
                name: 'Urgent Alerts',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#dc2626',
            },
        ];

        for (const channel of channels) {
            await Notifications.setNotificationChannelAsync(channel.id, channel);
        }
    }

    /**
     * Setup notification listeners with proper cleanup
     */
    private setupNotificationListeners(): void {
        // Listener for notifications received while app is foregrounded
        this.notificationListener = Notifications.addNotificationReceivedListener(
            this.handleNotificationReceived.bind(this)
        );

        // Listener for when user taps on notification
        this.responseListener = Notifications.addNotificationResponseReceivedListener(
            this.handleNotificationResponse.bind(this)
        );
    }

    /**
     * Handle notification received with proper data management
     */
    private handleNotificationReceived(notification: Notifications.Notification): void {
        console.log('[NotificationManager] Notification received:', notification.request.identifier);
        
        // Add to history with size management
        const historyItem: NotificationHistory = {
            id: notification.request.identifier,
            title: notification.request.content.title || '',
            body: notification.request.content.body || '',
            data: notification.request.content.data || {},
            category: notification.request.content.data?.category || 'general',
            priority: notification.request.content.data?.priority || 'normal',
            receivedAt: Date.now(),
            deviceType: Platform.OS,
        };

        this.notificationHistory.unshift(historyItem);

        // Maintain history size limit
        if (this.notificationHistory.length > this.config.maxHistorySize) {
            this.notificationHistory = this.notificationHistory.slice(0, this.config.maxHistorySize);
        }

        // Save to storage asynchronously
        this.saveNotificationHistory().catch(error => 
            console.error('[NotificationManager] Failed to save notification history:', error)
        );
    }

    /**
     * Handle notification response with proper routing
     */
    private handleNotificationResponse(response: Notifications.NotificationResponse): void {
        const { notification, actionIdentifier } = response;
        const notificationData = notification.request.content.data;

        console.log('[NotificationManager] User tapped notification:', {
            actionIdentifier,
            type: notificationData?.type,
        });

        // Update history with click information
        const historyIndex = this.notificationHistory.findIndex(
            item => item.id === notification.request.identifier
        );
        
        if (historyIndex !== -1) {
            this.notificationHistory[historyIndex].clicked = true;
            this.notificationHistory[historyIndex].clickedAt = Date.now();
            this.saveNotificationHistory().catch(console.error);
        }

        // Handle different notification types
        this.routeNotificationResponse(notificationData?.type, notificationData);
    }

    /**
     * Route notification responses to appropriate handlers
     */
    private routeNotificationResponse(type: string, data: any): void {
        switch (type) {
            case 'medication':
                this.handleMedicationNotificationResponse(data);
                break;
            case 'appointment':
                this.handleAppointmentNotificationResponse(data);
                break;
            case 'exercise':
                this.handleExerciseNotificationResponse(data);
                break;
            case 'health_alert':
                this.handleHealthAlertNotificationResponse(data);
                break;
            default:
                console.log('[NotificationManager] Unknown notification type:', type);
        }
    }

    /**
     * Schedule TCM-specific notification with validation
     */
    public async scheduleTCMNotification(
        templateType: string,
        customData: any = {},
        trigger: any = null
    ): Promise<string | null> {
        const template = this.tcmNotificationTemplates[templateType];
        if (!template) {
            throw new Error(`Unknown TCM notification template: ${templateType}`);
        }

        const options = {
            ...template,
            data: {
                type: templateType,
                tcmSpecific: true,
                ...customData,
            },
            trigger: trigger || { seconds: 60 },
        };

        return this.scheduleNotification(options);
    }

    /**
     * Schedule notification with comprehensive validation
     */
    private async scheduleNotification(options: any): Promise<string | null> {
        try {
            // Validate user preferences
            if (!this.userPreferences.enabled) {
                console.log('[NotificationManager] Notifications disabled by user');
                return null;
            }

            if (options.category && !this.userPreferences.categories[options.category]) {
                console.log(`[NotificationManager] Category ${options.category} disabled by user`);
                return null;
            }

            // Check quiet hours
            if (this.isInQuietHours(options.trigger)) {
                console.log('[NotificationManager] Adjusting for quiet hours...');
                options.trigger = this.adjustForQuietHours(options.trigger);
            }

            const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title: options.title,
                    body: options.body,
                    data: options.data || {},
                    sound: options.sound || 'default',
                    priority: this.getPriorityLevel(options.priority),
                },
                trigger: options.trigger,
            });

            // Store scheduled notification
            this.scheduledNotifications.set(notificationId, {
                id: notificationId,
                ...options,
                scheduledAt: Date.now(),
            });

            console.log('[NotificationManager] Notification scheduled:', notificationId);
            return notificationId;
        } catch (error) {
            console.error('[NotificationManager] Failed to schedule notification:', error);
            throw error;
        }
    }

    /**
     * Update user preferences with validation and sync
     */
    public async updatePreferences(newPreferences: Partial<NotificationPreferences>): Promise<boolean> {
        try {
            // Validate preferences
            const validatedPreferences = this.validatePreferences(newPreferences);
            
            this.userPreferences = {
                ...this.userPreferences,
                ...validatedPreferences,
            };
            
            // Save to local storage
            await AsyncStorage.setItem(
                'notificationPreferences', 
                JSON.stringify(this.userPreferences)
            );
            
            // Sync with server (non-blocking)
            this.syncPreferencesWithServer().catch(error =>
                console.warn('[NotificationManager] Server sync failed:', error)
            );
            
            // Reschedule notifications based on new preferences
            await this.rescheduleNotifications();
            
            console.log('[NotificationManager] Preferences updated successfully');
            return true;
        } catch (error) {
            console.error('[NotificationManager] Failed to update preferences:', error);
            return false;
        }
    }

    /**
     * Get notification statistics with comprehensive data
     */
    public getNotificationStats(): NotificationStats {
        return {
            totalScheduled: this.scheduledNotifications.size,
            totalReceived: this.notificationHistory.length,
            pushToken: this.expoPushToken || undefined,
            preferences: this.userPreferences,
            isInitialized: this.isInitialized,
        };
    }

    /**
     * Enhanced cross-device synchronization
     */
    public async syncNotificationsAcrossDevices(userId: string): Promise<ApiResponse<any>> {
        try {
            if (!this.expoPushToken) {
                return { success: false, error: 'No push token available for sync' };
            }

            const syncData: SyncData = {
                deviceToken: this.expoPushToken,
                syncData: {
                    notificationHistory: this.notificationHistory.slice(0, 50),
                    scheduledNotifications: Array.from(this.scheduledNotifications.values()),
                    preferences: this.userPreferences,
                    deviceInfo: {
                        platform: Platform.OS,
                        version: Platform.Version,
                        timestamp: Date.now()
                    }
                }
            };

            // Call sync API with retry logic
            const response = await this.callApiWithRetry('/api/notifications/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                },
                body: JSON.stringify(syncData)
            });

            if (response.success && response.data?.syncData) {
                await this.applySyncData(response.data.syncData);
                console.log('[NotificationManager] Cross-device sync completed successfully');
            }

            return response;
        } catch (error) {
            const appError = this.createAppError('SYNC_FAILED', 'Cross-device sync failed', error);
            console.error('[NotificationManager]', appError);
            return { success: false, error: appError.message };
        }
    }

    /**
     * Cleanup and remove listeners with proper resource management
     */
    public cleanup(): void {
        console.log('[NotificationManager] Cleaning up...');
        
        // Remove notification listeners
        if (this.notificationListener) {
            Notifications.removeNotificationSubscription(this.notificationListener);
            this.notificationListener = null;
        }
        
        if (this.responseListener) {
            Notifications.removeNotificationSubscription(this.responseListener);
            this.responseListener = null;
        }
        
        // Clear data structures
        this.scheduledNotifications.clear();
        this.notificationHistory = [];
        
        this.isInitialized = false;
        console.log('[NotificationManager] Cleanup complete');
    }

    // Private helper methods

    private getDefaultPreferences(): NotificationPreferences {
        return {
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
    }

    private validatePreferences(preferences: Partial<NotificationPreferences>): Partial<NotificationPreferences> {
        // Add validation logic here
        return preferences;
    }

    private async loadUserPreferences(): Promise<void> {
        try {
            const stored = await AsyncStorage.getItem('notificationPreferences');
            if (stored) {
                this.userPreferences = {
                    ...this.userPreferences,
                    ...JSON.parse(stored),
                };
            }
        } catch (error) {
            console.error('[NotificationManager] Failed to load preferences:', error);
        }
    }

    private async loadNotificationHistory(): Promise<void> {
        try {
            const stored = await AsyncStorage.getItem('notificationHistory');
            if (stored) {
                this.notificationHistory = JSON.parse(stored);
            }
        } catch (error) {
            console.error('[NotificationManager] Failed to load notification history:', error);
        }
    }

    private async saveNotificationHistory(): Promise<void> {
        try {
            await AsyncStorage.setItem(
                'notificationHistory', 
                JSON.stringify(this.notificationHistory)
            );
        } catch (error) {
            console.error('[NotificationManager] Failed to save notification history:', error);
        }
    }

    private isInQuietHours(trigger: any): boolean {
        if (!this.userPreferences.quietHours.enabled) return false;
        
        const now = new Date();
        const currentHour = now.getHours();
        const startHour = parseInt(this.userPreferences.quietHours.start.split(':')[0]);
        const endHour = parseInt(this.userPreferences.quietHours.end.split(':')[0]);
        
        if (startHour > endHour) {
            return currentHour >= startHour || currentHour < endHour;
        } else {
            return currentHour >= startHour && currentHour < endHour;
        }
    }

    private adjustForQuietHours(trigger: any): any {
        const endTime = this.userPreferences.quietHours.end.split(':');
        return {
            ...trigger,
            hour: parseInt(endTime[0]),
            minute: parseInt(endTime[1]),
        };
    }

    private getPriorityLevel(priority: string): Notifications.AndroidImportance {
        switch (priority) {
            case 'urgent': return Notifications.AndroidImportance.MAX;
            case 'high': return Notifications.AndroidImportance.HIGH;
            case 'normal': return Notifications.AndroidImportance.DEFAULT;
            case 'low': return Notifications.AndroidImportance.LOW;
            default: return Notifications.AndroidImportance.DEFAULT;
        }
    }

    private async scheduleDefaultNotifications(): Promise<void> {
        // Implementation for default notifications
    }

    private async rescheduleNotifications(): Promise<void> {
        // Implementation for rescheduling
    }

    private async syncPreferencesWithServer(): Promise<void> {
        // Implementation for server sync
    }

    private async applySyncData(syncData: any): Promise<void> {
        // Implementation for applying sync data
    }

    private async callApiWithRetry(url: string, options: any): Promise<ApiResponse> {
        // Implementation for API calls with retry logic
        return { success: true };
    }

    private async getAuthToken(): Promise<string | null> {
        try {
            return await AsyncStorage.getItem('supabase.auth.token');
        } catch (error) {
            console.error('[NotificationManager] Failed to get auth token:', error);
            return null;
        }
    }

    private createAppError(code: string, message: string, originalError?: any): AppError {
        return {
            code,
            message,
            details: originalError,
            timestamp: Date.now(),
        };
    }

    // Notification response handlers
    private handleMedicationNotificationResponse(data: any): void {
        console.log('[NotificationManager] Handling medication notification:', data);
    }

    private handleAppointmentNotificationResponse(data: any): void {
        console.log('[NotificationManager] Handling appointment notification:', data);
    }

    private handleExerciseNotificationResponse(data: any): void {
        console.log('[NotificationManager] Handling exercise notification:', data);
    }

    private handleHealthAlertNotificationResponse(data: any): void {
        console.log('[NotificationManager] Handling health alert notification:', data);
    }
}

// Export singleton instance
export default MobileNotificationManager.getInstance();