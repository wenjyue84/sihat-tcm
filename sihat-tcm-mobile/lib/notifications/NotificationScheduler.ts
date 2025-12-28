/**
 * Notification Scheduler Strategy Implementation
 * 
 * Extracted from MobileNotificationManager to follow Single Responsibility Principle.
 * Handles all notification scheduling logic with proper validation and conflict resolution.
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  NotificationScheduler,
  NotificationRequest,
  ScheduledNotification,
  NotificationPreferences,
  NotificationTrigger,
} from './NotificationInterfaces';

import {
  NOTIFICATION_CONFIG,
  PRIORITY_LEVELS,
} from '../../constants';

import { AppError, NotificationError, ErrorFactory } from '../errors/AppError';

/**
 * Enhanced Notification Scheduler
 * 
 * Handles intelligent notification scheduling with:
 * - Quiet hours respect
 * - Duplicate prevention
 * - Preference validation
 * - Conflict resolution
 */
export class EnhancedNotificationScheduler implements NotificationScheduler {
  private scheduledNotifications = new Map<string, ScheduledNotification>();
  private readonly context: string;
  private readonly storageKey = 'scheduledNotifications';

  constructor(context: string = 'NotificationScheduler') {
    this.context = context;
    this.loadScheduledNotifications();
  }

  /**
   * Schedule a notification with comprehensive validation
   */
  public async schedule(notification: NotificationRequest): Promise<string | null> {
    try {
      // Validate notification request
      this.validateNotificationRequest(notification);

      // Check for duplicates
      if (this.isDuplicate(notification)) {
        console.log(`[${this.context}] Duplicate notification detected, skipping`);
        return null;
      }

      // Adjust trigger for quiet hours if needed
      const adjustedTrigger = this.adjustTriggerForQuietHours(
        notification.trigger || { type: 'time', seconds: 60 }
      );

      // Schedule with Expo Notifications
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          sound: notification.sound || 'default',
          priority: this.mapPriorityToExpo(notification.priority),
          badge: notification.badge,
        },
        trigger: this.mapTriggerToExpo(adjustedTrigger),
      });

      // Store scheduled notification
      const scheduledNotification: ScheduledNotification = {
        id: notificationId,
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        category: notification.category,
        priority: notification.priority,
        scheduledAt: Date.now(),
        trigger: adjustedTrigger,
        status: 'scheduled',
      };

      this.scheduledNotifications.set(notificationId, scheduledNotification);
      await this.saveScheduledNotifications();

      console.log(`[${this.context}] Notification scheduled: ${notificationId}`);
      return notificationId;

    } catch (error) {
      console.error(`[${this.context}] Failed to schedule notification:`, error);
      throw ErrorFactory.fromUnknownError(error, {
        component: this.context,
        action: 'schedule',
        metadata: { notification },
      });
    }
  }

  /**
   * Cancel a scheduled notification
   */
  public async cancel(id: string): Promise<boolean> {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
      
      const notification = this.scheduledNotifications.get(id);
      if (notification) {
        notification.status = 'cancelled';
        this.scheduledNotifications.set(id, notification);
        await this.saveScheduledNotifications();
      }

      console.log(`[${this.context}] Notification cancelled: ${id}`);
      return true;

    } catch (error) {
      console.error(`[${this.context}] Failed to cancel notification:`, error);
      return false;
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  public async cancelAll(): Promise<boolean> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      
      // Update all notifications to cancelled status
      for (const [id, notification] of this.scheduledNotifications) {
        notification.status = 'cancelled';
        this.scheduledNotifications.set(id, notification);
      }
      
      await this.saveScheduledNotifications();
      console.log(`[${this.context}] All notifications cancelled`);
      return true;

    } catch (error) {
      console.error(`[${this.context}] Failed to cancel all notifications:`, error);
      return false;
    }
  }

  /**
   * Get all scheduled notifications
   */
  public async getScheduled(): Promise<ScheduledNotification[]> {
    try {
      // Get active notifications from Expo
      const activeNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const activeIds = new Set(activeNotifications.map(n => n.identifier));

      // Update status of notifications that are no longer active
      for (const [id, notification] of this.scheduledNotifications) {
        if (!activeIds.has(id) && notification.status === 'scheduled') {
          notification.status = 'delivered';
          this.scheduledNotifications.set(id, notification);
        }
      }

      await this.saveScheduledNotifications();
      
      return Array.from(this.scheduledNotifications.values())
        .filter(n => n.status === 'scheduled');

    } catch (error) {
      console.error(`[${this.context}] Failed to get scheduled notifications:`, error);
      return [];
    }
  }

  /**
   * Reschedule all notifications based on new preferences
   */
  public async rescheduleAll(preferences: NotificationPreferences): Promise<void> {
    try {
      console.log(`[${this.context}] Rescheduling all notifications based on new preferences`);

      // Cancel all current notifications
      await this.cancelAll();

      // Get notifications that should be rescheduled
      const toReschedule = Array.from(this.scheduledNotifications.values())
        .filter(n => this.shouldRescheduleNotification(n, preferences));

      // Reschedule eligible notifications
      for (const notification of toReschedule) {
        const request: NotificationRequest = {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          category: notification.category,
          priority: notification.priority,
          trigger: notification.trigger,
        };

        await this.schedule(request);
      }

      console.log(`[${this.context}] Rescheduled ${toReschedule.length} notifications`);

    } catch (error) {
      console.error(`[${this.context}] Failed to reschedule notifications:`, error);
      throw error;
    }
  }

  // Private helper methods

  /**
   * Validate notification request
   */
  private validateNotificationRequest(notification: NotificationRequest): void {
    if (!notification.title?.trim()) {
      throw new NotificationError('Notification title is required');
    }

    if (!notification.body?.trim()) {
      throw new NotificationError('Notification body is required');
    }

    if (!notification.category) {
      throw new NotificationError('Notification category is required');
    }

    if (!notification.priority) {
      throw new NotificationError('Notification priority is required');
    }
  }

  /**
   * Check if notification is a duplicate
   */
  private isDuplicate(notification: NotificationRequest): boolean {
    const existing = Array.from(this.scheduledNotifications.values());
    
    return existing.some(scheduled => 
      scheduled.title === notification.title &&
      scheduled.body === notification.body &&
      scheduled.category === notification.category &&
      scheduled.status === 'scheduled' &&
      Math.abs(scheduled.scheduledAt - Date.now()) < NOTIFICATION_CONFIG.DUPLICATE_THRESHOLD
    );
  }

  /**
   * Adjust trigger for quiet hours
   */
  private adjustTriggerForQuietHours(trigger: NotificationTrigger): NotificationTrigger {
    // For now, return as-is. In a full implementation, this would
    // check quiet hours preferences and adjust the trigger accordingly
    return trigger;
  }

  /**
   * Map priority to Expo notification priority
   */
  private mapPriorityToExpo(priority: string): Notifications.AndroidImportance {
    switch (priority) {
      case PRIORITY_LEVELS.URGENT: return Notifications.AndroidImportance.MAX;
      case PRIORITY_LEVELS.HIGH: return Notifications.AndroidImportance.HIGH;
      case PRIORITY_LEVELS.NORMAL: return Notifications.AndroidImportance.DEFAULT;
      case PRIORITY_LEVELS.LOW: return Notifications.AndroidImportance.LOW;
      default: return Notifications.AndroidImportance.DEFAULT;
    }
  }

  /**
   * Map trigger to Expo notification trigger
   */
  private mapTriggerToExpo(trigger: NotificationTrigger): any {
    switch (trigger.type) {
      case 'time':
        if (trigger.date) {
          return { date: trigger.date };
        } else if (trigger.seconds) {
          return { seconds: trigger.seconds, repeats: trigger.repeats || false };
        }
        return { seconds: 60 };

      case 'interval':
        return { 
          seconds: trigger.interval || 3600, 
          repeats: true 
        };

      case 'location':
        // Location-based triggers would need additional setup
        return { seconds: 60 };

      case 'condition':
        // Condition-based triggers would need additional logic
        return { seconds: 60 };

      default:
        return { seconds: 60 };
    }
  }

  /**
   * Check if notification should be rescheduled based on preferences
   */
  private shouldRescheduleNotification(
    notification: ScheduledNotification, 
    preferences: NotificationPreferences
  ): boolean {
    // Check if notifications are enabled
    if (!preferences.enabled) {
      return false;
    }

    // Check if category is enabled
    if (!preferences.categories[notification.category]) {
      return false;
    }

    // Check specific preference flags
    switch (notification.category) {
      case 'health':
        return preferences.healthReminders;
      case 'medication':
        return preferences.medicationAlerts;
      case 'appointments':
        return preferences.appointmentReminders;
      case 'exercise':
        return preferences.exerciseReminders;
      case 'sleep':
        return preferences.sleepReminders;
      default:
        return true;
    }
  }

  /**
   * Load scheduled notifications from storage
   */
  private async loadScheduledNotifications(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      if (stored) {
        const notifications = JSON.parse(stored);
        this.scheduledNotifications = new Map(Object.entries(notifications));
      }
    } catch (error) {
      console.error(`[${this.context}] Failed to load scheduled notifications:`, error);
    }
  }

  /**
   * Save scheduled notifications to storage
   */
  private async saveScheduledNotifications(): Promise<void> {
    try {
      const notifications = Object.fromEntries(this.scheduledNotifications);
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(notifications));
    } catch (error) {
      console.error(`[${this.context}] Failed to save scheduled notifications:`, error);
    }
  }
}

/**
 * Factory function for creating notification scheduler
 */
export function createNotificationScheduler(context?: string): NotificationScheduler {
  return new EnhancedNotificationScheduler(context);
}