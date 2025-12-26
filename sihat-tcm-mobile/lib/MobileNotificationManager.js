import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Mobile Notification Manager
 * Handles push notifications, scheduling, personalization, and cross-device sync
 * 
 * Features:
 * - Push notification management
 * - Notification scheduling and personalization
 * - Cross-device notification sync
 * - Health reminders and alerts
 * - TCM-specific notification types
 */

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

class MobileNotificationManager {
    constructor() {
        this.isInitialized = false;
        this.expoPushToken = null;
        this.notificationListener = null;
        this.responseListener = null;
        this.scheduledNotifications = new Map();
        this.notificationHistory = [];
        this.userPreferences = {
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
        
        // TCM-specific notification templates
        this.tcmNotificationTemplates = {
            seasonalAdvice: {
                title: '🌿 Seasonal TCM Wisdom',
                body: 'Discover how to harmonize with the current season for optimal health.',
                category: 'health',
                priority: 'normal',
            },
            constitutionTips: {
                title: '⚖️ Constitution Balance',
                body: 'Personalized tips based on your TCM constitution assessment.',
                category: 'health',
                priority: 'normal',
            },
            medicationReminder: {
                title: '💊 Herbal Medicine Time',
                body: 'Time to take your prescribed herbal formula.',
                category: 'medication',
                priority: 'high',
            },
            exerciseReminder: {
                title: '🧘 Qi Exercise Time',
                body: 'Practice your daily Qi exercises for energy balance.',
                category: 'exercise',
                priority: 'normal',
            },
            dietaryAdvice: {
                title: '🍲 TCM Nutrition Tip',
                body: 'Nourish your body with foods that support your constitution.',
                category: 'diet',
                priority: 'normal',
            },
            sleepHygiene: {
                title: '🌙 Sleep & Qi Restoration',
                body: 'Prepare for restorative sleep to replenish your Qi.',
                category: 'sleep',
                priority: 'normal',
            },
            appointmentReminder: {
                title: '📅 TCM Consultation',
                body: 'Your TCM consultation is coming up.',
                category: 'appointments',
                priority: 'high',
            },
            healthAlert: {
                title: '⚠️ Health Alert',
                body: 'Important health information requires your attention.',
                category: 'health',
                priority: 'urgent',
            },
        };
    }

    /**
     * Initialize notification system
     */
    async initialize() {
        try {
            console.log('[NotificationManager] Initializing...');
            
            // Request permissions
            const permissionResult = await this.requestPermissions();
            if (!permissionResult.granted) {
                console.warn('[NotificationManager] Notification permissions not granted');
                return { success: false, error: 'Permissions not granted' };
            }

            // Get push token
            await this.registerForPushNotifications();
            
            // Load user preferences
            await this.loadUserPreferences();
            
            // Set up notification listeners
            this.setupNotificationListeners();
            
            // Schedule default notifications
            await this.scheduleDefaultNotifications();
            
            this.isInitialized = true;
            console.log('[NotificationManager] Initialization complete');
            
            return { success: true, token: this.expoPushToken };
        } catch (error) {
            console.error('[NotificationManager] Initialization failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Request notification permissions
     */
    async requestPermissions() {
        try {
            if (Device.isDevice) {
                const { status: existingStatus } = await Notifications.getPermissionsAsync();
                let finalStatus = existingStatus;
                
                if (existingStatus !== 'granted') {
                    const { status } = await Notifications.requestPermissionsAsync();
                    finalStatus = status;
                }
                
                if (finalStatus !== 'granted') {
                    console.warn('[NotificationManager] Failed to get push token for push notification!');
                    return { granted: false };
                }
                
                return { granted: true, status: finalStatus };
            } else {
                console.warn('[NotificationManager] Must use physical device for Push Notifications');
                return { granted: false };
            }
        } catch (error) {
            console.error('[NotificationManager] Permission request failed:', error);
            return { granted: false, error: error.message };
        }
    }

    /**
     * Register for push notifications and get token
     */
    async registerForPushNotifications() {
        try {
            if (Device.isDevice) {
                const token = await Notifications.getExpoPushTokenAsync({
                    projectId: 'your-expo-project-id', // Replace with your actual project ID
                });
                
                this.expoPushToken = token.data;
                console.log('[NotificationManager] Push token:', this.expoPushToken);
                
                // Store token for server registration
                await AsyncStorage.setItem('expoPushToken', this.expoPushToken);
                
                // Configure notification channels for Android
                if (Platform.OS === 'android') {
                    await this.setupAndroidChannels();
                }
                
                return this.expoPushToken;
            } else {
                console.warn('[NotificationManager] Must use physical device for Push Notifications');
                return null;
            }
        } catch (error) {
            console.error('[NotificationManager] Token registration failed:', error);
            throw error;
        }
    }

    /**
     * Setup Android notification channels
     */
    async setupAndroidChannels() {
        await Notifications.setNotificationChannelAsync('health', {
            name: 'Health Notifications',
            importance: Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#10b981',
        });

        await Notifications.setNotificationChannelAsync('medication', {
            name: 'Medication Reminders',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#ef4444',
        });

        await Notifications.setNotificationChannelAsync('exercise', {
            name: 'Exercise Reminders',
            importance: Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#3b82f6',
        });

        await Notifications.setNotificationChannelAsync('appointments', {
            name: 'Appointment Reminders',
            importance: Notifications.AndroidImportance.HIGH,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#f59e0b',
        });

        await Notifications.setNotificationChannelAsync('urgent', {
            name: 'Urgent Alerts',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#dc2626',
        });
    }

    /**
     * Setup notification listeners
     */
    setupNotificationListeners() {
        // Listener for notifications received while app is foregrounded
        this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
            console.log('[NotificationManager] Notification received:', notification);
            this.handleNotificationReceived(notification);
        });

        // Listener for when user taps on notification
        this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('[NotificationManager] Notification response:', response);
            this.handleNotificationResponse(response);
        });
    }

    /**
     * Handle notification received
     */
    handleNotificationReceived(notification) {
        // Add to history
        this.notificationHistory.unshift({
            ...notification,
            receivedAt: Date.now(),
        });

        // Keep history limited
        if (this.notificationHistory.length > 100) {
            this.notificationHistory = this.notificationHistory.slice(0, 100);
        }

        // Save to storage
        this.saveNotificationHistory();
    }

    /**
     * Handle notification response (user tapped)
     */
    handleNotificationResponse(response) {
        const { notification, actionIdentifier } = response;
        const notificationData = notification.request.content.data;

        console.log('[NotificationManager] User tapped notification:', {
            actionIdentifier,
            data: notificationData,
        });

        // Handle different notification types
        switch (notificationData?.type) {
            case 'medication':
                this.handleMedicationNotificationResponse(notificationData);
                break;
            case 'appointment':
                this.handleAppointmentNotificationResponse(notificationData);
                break;
            case 'exercise':
                this.handleExerciseNotificationResponse(notificationData);
                break;
            case 'health_alert':
                this.handleHealthAlertNotificationResponse(notificationData);
                break;
            default:
                console.log('[NotificationManager] Unknown notification type');
        }
    }

    /**
     * Handle medication notification response
     */
    handleMedicationNotificationResponse(data) {
        // Navigate to medication tracking or mark as taken
        console.log('[NotificationManager] Handling medication notification:', data);
        // Implementation would depend on your navigation system
    }

    /**
     * Handle appointment notification response
     */
    handleAppointmentNotificationResponse(data) {
        // Navigate to appointment details or calendar
        console.log('[NotificationManager] Handling appointment notification:', data);
    }

    /**
     * Handle exercise notification response
     */
    handleExerciseNotificationResponse(data) {
        // Navigate to exercise/Qi practice screen
        console.log('[NotificationManager] Handling exercise notification:', data);
    }

    /**
     * Handle health alert notification response
     */
    handleHealthAlertNotificationResponse(data) {
        // Navigate to health alerts or emergency information
        console.log('[NotificationManager] Handling health alert notification:', data);
    }

    /**
     * Schedule a notification
     */
    async scheduleNotification(options) {
        try {
            if (!this.userPreferences.enabled) {
                console.log('[NotificationManager] Notifications disabled by user');
                return null;
            }

            // Check if category is enabled
            if (options.category && !this.userPreferences.categories[options.category]) {
                console.log(`[NotificationManager] Category ${options.category} disabled by user`);
                return null;
            }

            // Check quiet hours
            if (this.isInQuietHours(options.trigger)) {
                console.log('[NotificationManager] Notification scheduled during quiet hours, adjusting...');
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
     * Schedule TCM-specific notification
     */
    async scheduleTCMNotification(templateType, customData = {}, trigger = null) {
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
            trigger: trigger || { seconds: 60 }, // Default to 1 minute from now
        };

        return await this.scheduleNotification(options);
    }

    /**
     * Schedule medication reminder
     */
    async scheduleMedicationReminder(medicationName, dosage, times) {
        const notifications = [];
        
        for (const time of times) {
            const [hours, minutes] = time.split(':').map(Number);
            
            const notificationId = await this.scheduleTCMNotification('medicationReminder', {
                medicationName,
                dosage,
                time,
            }, {
                hour: hours,
                minute: minutes,
                repeats: true,
            });
            
            notifications.push(notificationId);
        }
        
        return notifications;
    }

    /**
     * Schedule appointment reminder
     */
    async scheduleAppointmentReminder(appointment) {
        const appointmentDate = new Date(appointment.dateTime);
        
        // Schedule 24 hours before
        const dayBeforeId = await this.scheduleTCMNotification('appointmentReminder', {
            appointmentId: appointment.id,
            practitioner: appointment.practitioner,
            type: appointment.type,
            reminderType: '24h',
        }, {
            date: new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000),
        });

        // Schedule 1 hour before
        const hourBeforeId = await this.scheduleTCMNotification('appointmentReminder', {
            appointmentId: appointment.id,
            practitioner: appointment.practitioner,
            type: appointment.type,
            reminderType: '1h',
        }, {
            date: new Date(appointmentDate.getTime() - 60 * 60 * 1000),
        });

        return [dayBeforeId, hourBeforeId];
    }

    /**
     * Schedule daily health reminders
     */
    async scheduleDailyHealthReminders() {
        if (!this.userPreferences.healthReminders) return [];

        const reminders = [];

        // Morning constitution tip
        const morningId = await this.scheduleTCMNotification('constitutionTips', {
            timeOfDay: 'morning',
        }, {
            hour: 8,
            minute: 0,
            repeats: true,
        });
        reminders.push(morningId);

        // Evening Qi exercise reminder
        const exerciseId = await this.scheduleTCMNotification('exerciseReminder', {
            exerciseType: 'qi_gong',
        }, {
            hour: 18,
            minute: 30,
            repeats: true,
        });
        reminders.push(exerciseId);

        // Sleep preparation reminder
        const sleepId = await this.scheduleTCMNotification('sleepHygiene', {
            timeOfDay: 'evening',
        }, {
            hour: 21,
            minute: 30,
            repeats: true,
        });
        reminders.push(sleepId);

        return reminders;
    }

    /**
     * Schedule seasonal TCM advice
     */
    async scheduleSeasonalAdvice() {
        const currentSeason = this.getCurrentSeason();
        
        return await this.scheduleTCMNotification('seasonalAdvice', {
            season: currentSeason,
            advice: this.getSeasonalAdvice(currentSeason),
        }, {
            weekday: 1, // Monday
            hour: 9,
            minute: 0,
            repeats: true,
        });
    }

    /**
     * Send immediate health alert
     */
    async sendHealthAlert(alertData) {
        return await this.scheduleTCMNotification('healthAlert', {
            alertType: alertData.type,
            severity: alertData.severity,
            message: alertData.message,
            actionRequired: alertData.actionRequired,
        }, {
            seconds: 1, // Immediate
        });
    }

    /**
     * Cancel scheduled notification
     */
    async cancelNotification(notificationId) {
        try {
            await Notifications.cancelScheduledNotificationAsync(notificationId);
            this.scheduledNotifications.delete(notificationId);
            console.log('[NotificationManager] Notification cancelled:', notificationId);
            return true;
        } catch (error) {
            console.error('[NotificationManager] Failed to cancel notification:', error);
            return false;
        }
    }

    /**
     * Cancel all scheduled notifications
     */
    async cancelAllNotifications() {
        try {
            await Notifications.cancelAllScheduledNotificationsAsync();
            this.scheduledNotifications.clear();
            console.log('[NotificationManager] All notifications cancelled');
            return true;
        } catch (error) {
            console.error('[NotificationManager] Failed to cancel all notifications:', error);
            return false;
        }
    }

    /**
     * Get scheduled notifications
     */
    async getScheduledNotifications() {
        try {
            const scheduled = await Notifications.getAllScheduledNotificationsAsync();
            return scheduled;
        } catch (error) {
            console.error('[NotificationManager] Failed to get scheduled notifications:', error);
            return [];
        }
    }

    /**
     * Update user preferences
     */
    async updatePreferences(newPreferences) {
        try {
            this.userPreferences = {
                ...this.userPreferences,
                ...newPreferences,
            };
            
            await AsyncStorage.setItem('notificationPreferences', JSON.stringify(this.userPreferences));
            
            // Sync with server
            await this.syncPreferencesWithServer();
            
            // Reschedule notifications based on new preferences
            await this.rescheduleNotifications();
            
            console.log('[NotificationManager] Preferences updated and synced');
            return true;
        } catch (error) {
            console.error('[NotificationManager] Failed to update preferences:', error);
            return false;
        }
    }

    /**
     * Load user preferences
     */
    async loadUserPreferences() {
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

    /**
     * Save notification history
     */
    async saveNotificationHistory() {
        try {
            await AsyncStorage.setItem('notificationHistory', JSON.stringify(this.notificationHistory));
        } catch (error) {
            console.error('[NotificationManager] Failed to save notification history:', error);
        }
    }

    /**
     * Load notification history
     */
    async loadNotificationHistory() {
        try {
            const stored = await AsyncStorage.getItem('notificationHistory');
            if (stored) {
                this.notificationHistory = JSON.parse(stored);
            }
        } catch (error) {
            console.error('[NotificationManager] Failed to load notification history:', error);
        }
    }

    /**
     * Schedule default notifications
     */
    async scheduleDefaultNotifications() {
        try {
            // Schedule daily health reminders
            await this.scheduleDailyHealthReminders();
            
            // Schedule seasonal advice
            await this.scheduleSeasonalAdvice();
            
            console.log('[NotificationManager] Default notifications scheduled');
        } catch (error) {
            console.error('[NotificationManager] Failed to schedule default notifications:', error);
        }
    }

    /**
     * Reschedule notifications based on preferences
     */
    async rescheduleNotifications() {
        try {
            // Cancel all existing notifications
            await this.cancelAllNotifications();
            
            // Reschedule based on current preferences
            if (this.userPreferences.enabled) {
                await this.scheduleDefaultNotifications();
            }
            
            console.log('[NotificationManager] Notifications rescheduled');
        } catch (error) {
            console.error('[NotificationManager] Failed to reschedule notifications:', error);
        }
    }

    /**
     * Check if time is in quiet hours
     */
    isInQuietHours(trigger) {
        if (!this.userPreferences.quietHours.enabled) return false;
        
        // This is a simplified check - in production you'd want more sophisticated logic
        const now = new Date();
        const currentHour = now.getHours();
        const startHour = parseInt(this.userPreferences.quietHours.start.split(':')[0]);
        const endHour = parseInt(this.userPreferences.quietHours.end.split(':')[0]);
        
        if (startHour > endHour) {
            // Quiet hours span midnight
            return currentHour >= startHour || currentHour < endHour;
        } else {
            return currentHour >= startHour && currentHour < endHour;
        }
    }

    /**
     * Adjust trigger time for quiet hours
     */
    adjustForQuietHours(trigger) {
        // Move notification to end of quiet hours
        const endTime = this.userPreferences.quietHours.end.split(':');
        return {
            ...trigger,
            hour: parseInt(endTime[0]),
            minute: parseInt(endTime[1]),
        };
    }

    /**
     * Get priority level for notification
     */
    getPriorityLevel(priority) {
        switch (priority) {
            case 'urgent': return Notifications.AndroidImportance.MAX;
            case 'high': return Notifications.AndroidImportance.HIGH;
            case 'normal': return Notifications.AndroidImportance.DEFAULT;
            case 'low': return Notifications.AndroidImportance.LOW;
            default: return Notifications.AndroidImportance.DEFAULT;
        }
    }

    /**
     * Get current season for TCM advice
     */
    getCurrentSeason() {
        const month = new Date().getMonth() + 1;
        if (month >= 3 && month <= 5) return 'spring';
        if (month >= 6 && month <= 8) return 'summer';
        if (month >= 9 && month <= 11) return 'autumn';
        return 'winter';
    }

    /**
     * Get seasonal advice based on TCM principles
     */
    getSeasonalAdvice(season) {
        const advice = {
            spring: 'Focus on liver health and gentle detox. Eat green vegetables and practice gentle stretching.',
            summer: 'Support heart health and stay cool. Eat cooling foods and practice calming exercises.',
            autumn: 'Nourish lung health and prepare for winter. Eat warming foods and practice breathing exercises.',
            winter: 'Support kidney health and conserve energy. Eat warming foods and practice restorative exercises.',
        };
        
        return advice[season] || advice.spring;
    }

    /**
     * Get notification statistics
     */
    getNotificationStats() {
        return {
            totalScheduled: this.scheduledNotifications.size,
            totalReceived: this.notificationHistory.length,
            preferences: this.userPreferences,
            pushToken: this.expoPushToken,
            isInitialized: this.isInitialized,
        };
    }

    /**
     * Sync notifications across devices (enhanced implementation)
     */
    async syncNotificationsAcrossDevices(userId) {
        try {
            console.log('[NotificationManager] Syncing notifications for user:', userId);
            
            if (!this.expoPushToken) {
                console.warn('[NotificationManager] No push token available for sync');
                return { success: false, error: 'No push token' };
            }

            // Prepare sync data
            const syncData = {
                deviceToken: this.expoPushToken,
                syncData: {
                    notificationHistory: this.notificationHistory.slice(0, 50), // Last 50 notifications
                    scheduledNotifications: Array.from(this.scheduledNotifications.values()),
                    preferences: this.userPreferences,
                    deviceInfo: {
                        platform: Platform.OS,
                        version: Platform.Version,
                        timestamp: Date.now()
                    }
                }
            };

            // Call sync API
            const response = await fetch(`${this.getApiBaseUrl()}/api/notifications/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                },
                body: JSON.stringify(syncData)
            });

            if (!response.ok) {
                throw new Error(`Sync failed: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success && result.syncData) {
                // Update local data with server data
                await this.applySyncData(result.syncData);
                
                console.log('[NotificationManager] Cross-device sync completed successfully');
                return { success: true, syncData: result.syncData };
            } else {
                throw new Error('Invalid sync response');
            }
            
        } catch (error) {
            console.error('[NotificationManager] Cross-device sync failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Apply synced data from server
     */
    async applySyncData(syncData) {
        try {
            // Update preferences if they differ
            if (syncData.preferences) {
                const serverPrefs = this.convertServerPreferences(syncData.preferences);
                if (JSON.stringify(serverPrefs) !== JSON.stringify(this.userPreferences)) {
                    this.userPreferences = serverPrefs;
                    await AsyncStorage.setItem('notificationPreferences', JSON.stringify(this.userPreferences));
                    console.log('[NotificationManager] Preferences synced from server');
                }
            }

            // Merge notification history
            if (syncData.notificationHistory && Array.isArray(syncData.notificationHistory)) {
                const serverHistory = syncData.notificationHistory.map(item => ({
                    id: item.id,
                    title: item.title,
                    body: item.body,
                    data: item.data,
                    category: item.category,
                    priority: item.priority,
                    sentAt: item.sent_at,
                    clicked: item.clicked,
                    clickedAt: item.clicked_at,
                    deviceType: item.device_type,
                    receivedAt: new Date(item.sent_at).getTime()
                }));

                // Merge with local history, avoiding duplicates
                const mergedHistory = this.mergeNotificationHistory(this.notificationHistory, serverHistory);
                this.notificationHistory = mergedHistory.slice(0, 100); // Keep last 100
                await this.saveNotificationHistory();
                console.log('[NotificationManager] Notification history synced');
            }

            // Sync scheduled notifications
            if (syncData.scheduledNotifications && Array.isArray(syncData.scheduledNotifications)) {
                await this.syncScheduledNotifications(syncData.scheduledNotifications);
            }

            // Handle pending notifications
            if (syncData.pendingNotifications && Array.isArray(syncData.pendingNotifications)) {
                await this.processPendingNotifications(syncData.pendingNotifications);
            }

        } catch (error) {
            console.error('[NotificationManager] Failed to apply sync data:', error);
        }
    }

    /**
     * Convert server preferences format to local format
     */
    convertServerPreferences(serverPrefs) {
        return {
            enabled: serverPrefs.enabled,
            healthReminders: serverPrefs.health_reminders,
            medicationAlerts: serverPrefs.medication_alerts,
            appointmentReminders: serverPrefs.appointment_reminders,
            exerciseReminders: serverPrefs.exercise_reminders,
            sleepReminders: serverPrefs.sleep_reminders,
            quietHours: {
                enabled: serverPrefs.quiet_hours_enabled,
                start: serverPrefs.quiet_hours_start?.substring(0, 5) || '22:00',
                end: serverPrefs.quiet_hours_end?.substring(0, 5) || '07:00',
            },
            frequency: {
                daily: serverPrefs.frequency_daily,
                weekly: serverPrefs.frequency_weekly,
                monthly: serverPrefs.frequency_monthly,
            },
            categories: serverPrefs.categories || {
                health: true,
                medication: true,
                exercise: true,
                diet: true,
                sleep: true,
                appointments: true,
            },
        };
    }

    /**
     * Merge notification histories, avoiding duplicates
     */
    mergeNotificationHistory(localHistory, serverHistory) {
        const merged = [...localHistory];
        const localIds = new Set(localHistory.map(item => item.id).filter(Boolean));

        for (const serverItem of serverHistory) {
            if (!serverItem.id || !localIds.has(serverItem.id)) {
                // Check for duplicates by content and timestamp
                const isDuplicate = merged.some(localItem => 
                    localItem.title === serverItem.title &&
                    localItem.body === serverItem.body &&
                    Math.abs(localItem.receivedAt - serverItem.receivedAt) < 60000 // Within 1 minute
                );

                if (!isDuplicate) {
                    merged.push(serverItem);
                }
            }
        }

        // Sort by receivedAt descending
        return merged.sort((a, b) => b.receivedAt - a.receivedAt);
    }

    /**
     * Sync scheduled notifications with server
     */
    async syncScheduledNotifications(serverNotifications) {
        try {
            // Cancel all local notifications first
            await this.cancelAllNotifications();

            // Reschedule based on server data
            for (const serverNotification of serverNotifications) {
                const scheduledFor = new Date(serverNotification.scheduled_for);
                
                // Only schedule future notifications
                if (scheduledFor > new Date()) {
                    const trigger = this.convertServerTrigger(serverNotification);
                    
                    const notificationId = await this.scheduleNotification({
                        title: serverNotification.title,
                        body: serverNotification.body,
                        data: {
                            ...serverNotification.data,
                            serverId: serverNotification.id,
                            type: serverNotification.notification_type
                        },
                        category: serverNotification.category,
                        priority: serverNotification.priority,
                        trigger
                    });

                    if (notificationId) {
                        this.scheduledNotifications.set(notificationId, {
                            id: notificationId,
                            serverId: serverNotification.id,
                            ...serverNotification,
                            scheduledAt: Date.now(),
                        });
                    }
                }
            }

            console.log('[NotificationManager] Scheduled notifications synced');
        } catch (error) {
            console.error('[NotificationManager] Failed to sync scheduled notifications:', error);
        }
    }

    /**
     * Convert server trigger format to local format
     */
    convertServerTrigger(serverNotification) {
        const scheduledFor = new Date(serverNotification.scheduled_for);
        
        if (serverNotification.repeat_pattern) {
            switch (serverNotification.repeat_pattern) {
                case 'daily':
                    return {
                        hour: scheduledFor.getHours(),
                        minute: scheduledFor.getMinutes(),
                        repeats: true,
                    };
                case 'weekly':
                    return {
                        weekday: scheduledFor.getDay() + 1, // Expo uses 1-7, JS uses 0-6
                        hour: scheduledFor.getHours(),
                        minute: scheduledFor.getMinutes(),
                        repeats: true,
                    };
                case 'monthly':
                    return {
                        day: scheduledFor.getDate(),
                        hour: scheduledFor.getHours(),
                        minute: scheduledFor.getMinutes(),
                        repeats: true,
                    };
                default:
                    return { date: scheduledFor };
            }
        }

        return { date: scheduledFor };
    }

    /**
     * Process pending notifications from server
     */
    async processPendingNotifications(pendingNotifications) {
        try {
            for (const notification of pendingNotifications) {
                // Send immediate notification for pending items
                await this.scheduleNotification({
                    title: notification.title,
                    body: notification.body,
                    data: {
                        ...notification.data,
                        serverId: notification.id,
                        type: notification.notification_type,
                        isPending: true
                    },
                    category: notification.category,
                    priority: notification.priority,
                    trigger: { seconds: 1 } // Immediate
                });

                // Mark as sent on server
                await this.markServerNotificationSent(notification.id);
            }

            console.log(`[NotificationManager] Processed ${pendingNotifications.length} pending notifications`);
        } catch (error) {
            console.error('[NotificationManager] Failed to process pending notifications:', error);
        }
    }

    /**
     * Mark notification as sent on server
     */
    async markServerNotificationSent(notificationId) {
        try {
            const response = await fetch(`${this.getApiBaseUrl()}/api/notifications/schedule?id=${notificationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                }
            });

            if (!response.ok) {
                console.warn(`[NotificationManager] Failed to mark notification ${notificationId} as sent`);
            }
        } catch (error) {
            console.error('[NotificationManager] Error marking notification as sent:', error);
        }
    }

    /**
     * Register device with server
     */
    async registerDeviceWithServer() {
        try {
            if (!this.expoPushToken) {
                console.warn('[NotificationManager] No push token available for registration');
                return { success: false, error: 'No push token' };
            }

            const deviceInfo = {
                deviceToken: this.expoPushToken,
                deviceType: Platform.OS,
                deviceName: await this.getDeviceName(),
                platformInfo: {
                    platform: Platform.OS,
                    version: Platform.Version,
                    constants: Platform.constants
                }
            };

            const response = await fetch(`${this.getApiBaseUrl()}/api/notifications/register-device`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                },
                body: JSON.stringify(deviceInfo)
            });

            if (!response.ok) {
                throw new Error(`Device registration failed: ${response.status}`);
            }

            const result = await response.json();
            console.log('[NotificationManager] Device registered successfully');
            return result;

        } catch (error) {
            console.error('[NotificationManager] Device registration failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Sync preferences with server
     */
    async syncPreferencesWithServer() {
        try {
            const serverPrefs = this.convertLocalPreferencesToServer(this.userPreferences);

            const response = await fetch(`${this.getApiBaseUrl()}/api/notifications/preferences`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${await this.getAuthToken()}`
                },
                body: JSON.stringify(serverPrefs)
            });

            if (!response.ok) {
                throw new Error(`Preferences sync failed: ${response.status}`);
            }

            const result = await response.json();
            console.log('[NotificationManager] Preferences synced with server');
            return result;

        } catch (error) {
            console.error('[NotificationManager] Preferences sync failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Convert local preferences format to server format
     */
    convertLocalPreferencesToServer(localPrefs) {
        return {
            enabled: localPrefs.enabled,
            health_reminders: localPrefs.healthReminders,
            medication_alerts: localPrefs.medicationAlerts,
            appointment_reminders: localPrefs.appointmentReminders,
            exercise_reminders: localPrefs.exerciseReminders,
            sleep_reminders: localPrefs.sleepReminders,
            quiet_hours_enabled: localPrefs.quietHours?.enabled,
            quiet_hours_start: localPrefs.quietHours?.start + ':00',
            quiet_hours_end: localPrefs.quietHours?.end + ':00',
            frequency_daily: localPrefs.frequency?.daily,
            frequency_weekly: localPrefs.frequency?.weekly,
            frequency_monthly: localPrefs.frequency?.monthly,
            categories: localPrefs.categories
        };
    }

    /**
     * Get API base URL
     */
    getApiBaseUrl() {
        // In production, this should come from environment variables
        return __DEV__ ? 'http://localhost:3000' : 'https://your-production-domain.com';
    }

    /**
     * Get authentication token
     */
    async getAuthToken() {
        try {
            // This should integrate with your auth system (Supabase)
            const token = await AsyncStorage.getItem('supabase.auth.token');
            return token;
        } catch (error) {
            console.error('[NotificationManager] Failed to get auth token:', error);
            return null;
        }
    }

    /**
     * Get device name
     */
    async getDeviceName() {
        try {
            // Try to get a meaningful device name
            const deviceName = await AsyncStorage.getItem('deviceName');
            if (deviceName) return deviceName;

            // Fallback to platform info
            return `${Platform.OS} Device`;
        } catch (error) {
            return `${Platform.OS} Device`;
        }
    }

    /**
     * Enhanced initialization with server sync
     */
    async initializeWithSync(userId) {
        try {
            console.log('[NotificationManager] Initializing with server sync...');
            
            // Initialize local notification system
            const initResult = await this.initialize();
            if (!initResult.success) {
                return initResult;
            }

            // Register device with server
            await this.registerDeviceWithServer();

            // Sync with server
            const syncResult = await this.syncNotificationsAcrossDevices(userId);
            
            return {
                success: true,
                token: this.expoPushToken,
                syncResult
            };

        } catch (error) {
            console.error('[NotificationManager] Enhanced initialization failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Cleanup and remove listeners
     */
    cleanup() {
        if (this.notificationListener) {
            Notifications.removeNotificationSubscription(this.notificationListener);
        }
        
        if (this.responseListener) {
            Notifications.removeNotificationSubscription(this.responseListener);
        }
        
        this.isInitialized = false;
        console.log('[NotificationManager] Cleanup complete');
    }
}

// Export singleton instance
export default new MobileNotificationManager();