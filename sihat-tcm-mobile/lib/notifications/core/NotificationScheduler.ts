/**
 * Notification scheduling and management
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { 
  NotificationTemplate, 
  ScheduledNotification, 
  NotificationPreferences 
} from '../interfaces/NotificationInterfaces';

export class NotificationScheduler {
  private readonly context = 'NotificationScheduler';
  private scheduledNotifications = new Map<string, ScheduledNotification>();

  /**
   * Schedule a notification with validation
   */
  public async scheduleNotification(
    options: {
      title: string;
      body: string;
      data?: any;
      category?: string;
      priority?: string;
      trigger?: any;
      sound?: string;
    },
    userPreferences: NotificationPreferences
  ): Promise<string | null> {
    try {
      // Validate user preferences
      if (!userPreferences.enabled) {
        console.log(`[${this.context}] Notifications disabled by user`);
        return null;
      }

      if (options.category && !userPreferences.categories[options.category as keyof typeof userPreferences.categories]) {
        console.log(`[${this.context}] Category ${options.category} disabled by user`);
        return null;
      }

      // Check quiet hours
      if (this.isInQuietHours(options.trigger, userPreferences)) {
        console.log(`[${this.context}] Adjusting for quiet hours...`);
        options.trigger = this.adjustForQuietHours(options.trigger, userPreferences);
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: options.title,
          body: options.body,
          data: options.data || {},
          sound: options.sound || 'default',
          priority: this.getPriorityLevel(options.priority || 'normal'),
        },
        trigger: options.trigger || { seconds: 60 },
      });

      // Store scheduled notification
      this.scheduledNotifications.set(notificationId, {
        id: notificationId,
        title: options.title,
        body: options.body,
        data: options.data || {},
        category: options.category || 'general',
        priority: options.priority || 'normal',
        scheduledAt: Date.now(),
        trigger: options.trigger,
      });

      console.log(`[${this.context}] Notification scheduled:`, notificationId);
      return notificationId;
    } catch (error) {
      console.error(`[${this.context}] Failed to schedule notification:`, error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  public async cancelNotification(notificationId: string): Promise<boolean> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      this.scheduledNotifications.delete(notificationId);
      console.log(`[${this.context}] Notification cancelled:`, notificationId);
      return true;
    } catch (error) {
      console.error(`[${this.context}] Failed to cancel notification:`, error);
      return false;
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  public async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.scheduledNotifications.clear();
      console.log(`[${this.context}] All notifications cancelled`);
    } catch (error) {
      console.error(`[${this.context}] Failed to cancel all notifications:`, error);
    }
  }

  /**
   * Get scheduled notifications
   */
  public getScheduledNotifications(): ScheduledNotification[] {
    return Array.from(this.scheduledNotifications.values());
  }

  /**
   * Setup Android notification channels
   */
  public async setupAndroidChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

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

    console.log(`[${this.context}] Android channels configured`);
  }

  // Private helper methods

  private isInQuietHours(trigger: any, preferences: NotificationPreferences): boolean {
    if (!preferences.quietHours.enabled) return false;
    
    const now = new Date();
    const currentHour = now.getHours();
    const startHour = parseInt(preferences.quietHours.start.split(':')[0]);
    const endHour = parseInt(preferences.quietHours.end.split(':')[0]);
    
    if (startHour > endHour) {
      return currentHour >= startHour || currentHour < endHour;
    } else {
      return currentHour >= startHour && currentHour < endHour;
    }
  }

  private adjustForQuietHours(trigger: any, preferences: NotificationPreferences): any {
    const endTime = preferences.quietHours.end.split(':');
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
}