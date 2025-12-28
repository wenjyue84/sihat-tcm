/**
 * Notification Scheduler
 * Handles scheduling and managing timed notifications
 */

import { ScheduledNotification, ScheduleNotificationOptions } from '../interfaces/WebNotificationInterfaces';

export class NotificationScheduler {
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map();
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  constructor(serviceWorkerRegistration?: ServiceWorkerRegistration | null) {
    this.serviceWorkerRegistration = serviceWorkerRegistration || null;
  }

  /**
   * Set service worker registration
   */
  setServiceWorkerRegistration(registration: ServiceWorkerRegistration): void {
    this.serviceWorkerRegistration = registration;
  }

  /**
   * Schedule a notification
   */
  async scheduleNotification(options: ScheduleNotificationOptions): Promise<string | null> {
    try {
      const id = options.id || this.generateNotificationId();
      const scheduledNotification: ScheduledNotification = {
        id,
        type: options.category,
        title: options.title,
        body: options.body,
        data: options.data || {},
        scheduledFor: options.scheduledFor,
        category: options.category,
        priority: options.priority || "normal",
        repeatPattern: options.repeatPattern,
      };

      this.scheduledNotifications.set(id, scheduledNotification);

      // Schedule with browser API or service worker
      if (this.serviceWorkerRegistration) {
        await this.serviceWorkerRegistration.showNotification(options.title, {
          body: options.body,
          data: { ...options.data, scheduledId: id },
          tag: id,
        });
      } else {
        // Fallback to setTimeout for immediate scheduling
        const delay = options.scheduledFor.getTime() - Date.now();
        if (delay > 0) {
          setTimeout(() => {
            this.triggerScheduledNotification(scheduledNotification);
          }, delay);
        }
      }

      // Sync with server
      await this.syncScheduledNotificationWithServer(scheduledNotification);

      console.log("[NotificationScheduler] Notification scheduled:", id);
      return id;
    } catch (error) {
      console.error("[NotificationScheduler] Failed to schedule notification:", error);
      return null;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId: string): Promise<boolean> {
    try {
      this.scheduledNotifications.delete(notificationId);

      // Cancel with service worker
      if (this.serviceWorkerRegistration) {
        const notifications = await this.serviceWorkerRegistration.getNotifications({
          tag: notificationId,
        });
        notifications.forEach((notification) => notification.close());
      }

      // Cancel on server
      await this.cancelServerNotification(notificationId);

      console.log("[NotificationScheduler] Notification cancelled:", notificationId);
      return true;
    } catch (error) {
      console.error("[NotificationScheduler] Failed to cancel notification:", error);
      return false;
    }
  }

  /**
   * Get all scheduled notifications
   */
  getScheduledNotifications(): ScheduledNotification[] {
    return Array.from(this.scheduledNotifications.values());
  }

  /**
   * Get scheduled notification by ID
   */
  getScheduledNotification(id: string): ScheduledNotification | undefined {
    return this.scheduledNotifications.get(id);
  }

  /**
   * Get count of scheduled notifications
   */
  getScheduledCount(): number {
    return this.scheduledNotifications.size;
  }

  /**
   * Clear all scheduled notifications
   */
  clearAllScheduled(): void {
    this.scheduledNotifications.clear();
  }

  /**
   * Apply scheduled notifications from sync data
   */
  async applyScheduledNotifications(scheduledNotifications: Array<{
    id: string;
    title: string;
    body: string;
    scheduled_for: string;
    category: string;
    priority: string;
    repeat_pattern?: string;
    data: Record<string, any>;
  }>): Promise<void> {
    for (const serverNotification of scheduledNotifications) {
      const scheduledFor = new Date(serverNotification.scheduled_for);
      if (scheduledFor > new Date()) {
        await this.scheduleNotification({
          id: serverNotification.id,
          title: serverNotification.title,
          body: serverNotification.body,
          scheduledFor,
          category: serverNotification.category,
          priority: serverNotification.priority as any,
          repeatPattern: serverNotification.repeat_pattern,
          data: serverNotification.data,
        });
      }
    }
  }

  /**
   * Generate unique notification ID
   */
  private generateNotificationId(): string {
    return `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Trigger a scheduled notification
   */
  private triggerScheduledNotification(notification: ScheduledNotification): void {
    // This would trigger the actual notification display
    // Implementation depends on the notification display system
    console.log("[NotificationScheduler] Triggering scheduled notification:", notification.id);
  }

  /**
   * Sync scheduled notification with server
   */
  private async syncScheduledNotificationWithServer(
    notification: ScheduledNotification
  ): Promise<void> {
    try {
      await fetch("/api/notifications/schedule", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notification_type: notification.type,
          title: notification.title,
          body: notification.body,
          data: notification.data,
          scheduled_for: notification.scheduledFor.toISOString(),
          repeat_pattern: notification.repeatPattern,
          category: notification.category,
          priority: notification.priority,
        }),
      });
    } catch (error) {
      console.error(
        "[NotificationScheduler] Failed to sync scheduled notification with server:",
        error
      );
    }
  }

  /**
   * Cancel notification on server
   */
  private async cancelServerNotification(notificationId: string): Promise<void> {
    try {
      await fetch(`/api/notifications/schedule?id=${notificationId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("[NotificationScheduler] Failed to cancel server notification:", error);
    }
  }
}