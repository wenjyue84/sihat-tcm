/**
 * Refactored Mobile Notification Manager - Main orchestrator
 * 
 * This is the new modular version that delegates to specialized components.
 * The original large file has been broken down into focused modules.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { 
  NotificationStats, 
  ApiResponse, 
  NotificationTemplate,
  NotificationManagerConfig
} from './interfaces/NotificationInterfaces';

import { NotificationPermissions } from './core/NotificationPermissions';
import { TokenManager } from './core/TokenManager';
import { NotificationScheduler } from './core/NotificationScheduler';
import { NotificationHistory } from './core/NotificationHistory';
import { PreferenceManager } from './core/PreferenceManager';
import { TCMNotificationTemplates } from './templates/TCMNotificationTemplates';
import { NotificationListeners } from './listeners/NotificationListeners';

// Notification Configuration
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export class MobileNotificationManager {
  private static instance: MobileNotificationManager;
  
  // Core components
  private permissions: NotificationPermissions;
  private tokenManager: TokenManager;
  private scheduler: NotificationScheduler;
  private history: NotificationHistory;
  private preferences: PreferenceManager;
  private templates: TCMNotificationTemplates;
  private listeners: NotificationListeners;
  
  // State
  private isInitialized = false;
  private readonly context = 'MobileNotificationManager';
  
  // Configuration
  private readonly config: NotificationManagerConfig = {
    maxHistorySize: 1000,
    maxCacheSize: 500,
    syncIntervalMinutes: 30,
    retryAttempts: 3,
    retryDelay: 1000,
  };

  private constructor() {
    this.permissions = new NotificationPermissions();
    this.tokenManager = new TokenManager();
    this.scheduler = new NotificationScheduler();
    this.history = new NotificationHistory(this.config.maxHistorySize);
    this.preferences = new PreferenceManager();
    this.templates = new TCMNotificationTemplates();
    this.listeners = new NotificationListeners(this.history);
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
   * Initialize notification system
   */
  public async initialize(): Promise<ApiResponse<{ token: string }>> {
    try {
      console.log(`[${this.context}] Initializing...`);
      
      // Request permissions
      const permissionResult = await this.permissions.requestPermissions();
      if (!permissionResult.granted) {
        return {
          success: false,
          error: 'Notification permissions not granted'
        };
      }

      // Get push token
      const token = await this.tokenManager.registerForPushNotifications();
      if (!token) {
        return {
          success: false,
          error: 'Failed to get push token'
        };
      }

      // Load user data
      await Promise.all([
        this.preferences.loadFromStorage(),
        this.history.loadFromStorage()
      ]);
      
      // Setup platform-specific features
      if (Platform.OS === 'android') {
        await this.scheduler.setupAndroidChannels();
      }
      
      // Setup notification listeners
      this.listeners.setupListeners();
      
      // Schedule default notifications
      await this.scheduleDefaultNotifications();
      
      this.isInitialized = true;
      console.log(`[${this.context}] Initialization complete`);
      
      return { 
        success: true, 
        data: { token }
      };
    } catch (error) {
      console.error(`[${this.context}] Initialization failed:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Schedule TCM-specific notification
   */
  public async scheduleTCMNotification(
    templateType: string,
    customData: any = {},
    trigger: any = null
  ): Promise<string | null> {
    try {
      const template = this.templates.getTemplate(templateType);
      if (!template) {
        throw new Error(`Unknown TCM notification template: ${templateType}`);
      }

      const options = {
        title: template.title,
        body: template.body,
        category: template.category,
        priority: template.priority,
        data: {
          type: templateType,
          tcmSpecific: true,
          ...customData,
        },
        trigger: trigger || { seconds: 60 },
      };

      const userPreferences = this.preferences.getPreferences();
      return await this.scheduler.scheduleNotification(options, userPreferences);
    } catch (error) {
      console.error(`[${this.context}] Failed to schedule TCM notification:`, error);
      return null;
    }
  }

  /**
   * Update user preferences
   */
  public async updatePreferences(newPreferences: any): Promise<boolean> {
    try {
      const success = await this.preferences.updatePreferences(newPreferences);
      
      if (success) {
        // Reschedule notifications based on new preferences
        await this.rescheduleNotifications();
      }
      
      return success;
    } catch (error) {
      console.error(`[${this.context}] Failed to update preferences:`, error);
      return false;
    }
  }

  /**
   * Get notification statistics
   */
  public getNotificationStats(): NotificationStats {
    const scheduledNotifications = this.scheduler.getScheduledNotifications();
    const historyStats = this.history.getStats();
    const userPreferences = this.preferences.getPreferences();
    const pushToken = this.tokenManager.getPushToken();

    return {
      totalScheduled: scheduledNotifications.length,
      totalReceived: historyStats.total,
      pushToken: pushToken || undefined,
      preferences: userPreferences,
      isInitialized: this.isInitialized,
    };
  }

  /**
   * Get notification history
   */
  public getNotificationHistory(limit?: number) {
    return this.history.getHistory(limit);
  }

  /**
   * Clear notification history
   */
  public async clearNotificationHistory(): Promise<void> {
    await this.history.clearHistory();
  }

  /**
   * Cancel notification
   */
  public async cancelNotification(notificationId: string): Promise<boolean> {
    return await this.scheduler.cancelNotification(notificationId);
  }

  /**
   * Cancel all notifications
   */
  public async cancelAllNotifications(): Promise<void> {
    await this.scheduler.cancelAllNotifications();
  }

  /**
   * Sync notifications across devices
   */
  public async syncNotificationsAcrossDevices(userId: string): Promise<ApiResponse<any>> {
    try {
      const pushToken = this.tokenManager.getPushToken();
      if (!pushToken) {
        return { success: false, error: 'No push token available for sync' };
      }

      const syncData = {
        deviceToken: pushToken,
        syncData: {
          notificationHistory: this.history.getHistory(50),
          scheduledNotifications: this.scheduler.getScheduledNotifications(),
          preferences: this.preferences.getPreferences(),
          deviceInfo: {
            platform: Platform.OS,
            version: Platform.Version,
            timestamp: Date.now()
          }
        }
      };

      // TODO: Implement actual API call
      console.log(`[${this.context}] Sync data prepared for user:`, userId);
      
      return { 
        success: true, 
        data: { synced: true } 
      };
    } catch (error) {
      console.error(`[${this.context}] Sync failed:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Sync failed' 
      };
    }
  }

  /**
   * Cleanup and remove listeners
   */
  public cleanup(): void {
    console.log(`[${this.context}] Cleaning up...`);
    
    this.listeners.cleanup();
    this.isInitialized = false;
    
    console.log(`[${this.context}] Cleanup complete`);
  }

  // Private helper methods

  private async scheduleDefaultNotifications(): Promise<void> {
    // Schedule some default TCM notifications
    const defaultNotifications = [
      { template: 'SEASONAL_ADVICE', delay: 3600 }, // 1 hour
      { template: 'EXERCISE_REMINDER', delay: 7200 }, // 2 hours
    ];

    for (const notification of defaultNotifications) {
      await this.scheduleTCMNotification(
        notification.template,
        {},
        { seconds: notification.delay }
      );
    }
  }

  private async rescheduleNotifications(): Promise<void> {
    // Cancel all current notifications
    await this.scheduler.cancelAllNotifications();
    
    // Reschedule based on new preferences
    await this.scheduleDefaultNotifications();
    
    console.log(`[${this.context}] Notifications rescheduled`);
  }
}

// Export singleton instance
export default MobileNotificationManager.getInstance();