/**
 * Web Notification Manager - Legacy Wrapper
 * 
 * @deprecated This file is maintained for backward compatibility.
 * Use the new modular system: import { webNotificationManager } from './web-notifications'
 * 
 * The new system provides:
 * - Modular architecture with focused components
 * - Better separation of concerns
 * - Enhanced testing capabilities
 * - Improved maintainability
 */

import { 
  webNotificationManager,
  type NotificationPreferences,
  type ScheduledNotification,
  type NotificationOptions,
  type ScheduleNotificationOptions,
  type NotificationStats
} from './web-notifications';

// Legacy interface compatibility
interface LegacyNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  tag?: string;
  requireInteraction?: boolean;
}

interface LegacyScheduleOptions {
  id?: string;
  title: string;
  body: string;
  scheduledFor: Date;
  category: string;
  priority?: "low" | "normal" | "high" | "urgent";
  repeatPattern?: string;
  data?: Record<string, any>;
}

/**
 * @deprecated Use the new modular WebNotificationManager from './web-notifications'
 */
class WebNotificationManager {
  private isInitialized = false;
  private permission: NotificationPermission = "default";
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private preferences: NotificationPreferences;
  private scheduledNotifications: Map<string, ScheduledNotification> = new Map();
  private notificationHistory: any[] = [];

  constructor() {
    this.preferences = {
      enabled: true,
      healthReminders: true,
      medicationAlerts: true,
      appointmentReminders: true,
      exerciseReminders: true,
      sleepReminders: true,
      quietHours: {
        enabled: true,
        start: "22:00",
        end: "07:00",
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

  /**
   * Initialize web notification system
   */
  async initialize(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log("[WebNotificationManager] Initializing...");

      // Check browser support
      if (!("Notification" in window)) {
        console.warn("[WebNotificationManager] Browser does not support notifications");
        return { success: false, error: "Browser does not support notifications" };
      }

      // Request permission
      const permissionResult = await this.requestPermission();
      if (!permissionResult.granted) {
        console.warn("[WebNotificationManager] Notification permissions not granted");
        return { success: false, error: "Permissions not granted" };
      }

      // Register service worker for background notifications
      await this.registerServiceWorker();

      // Load preferences
      await this.loadPreferences();

      // Setup notification listeners
      this.setupNotificationListeners();

      this.isInitialized = true;
      console.log("[WebNotificationManager] Initialization complete");

      return { success: true };
    } catch (error) {
      console.error("[WebNotificationManager] Initialization failed:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<{ granted: boolean; permission: NotificationPermission }> {
    try {
      if (this.permission === "granted") {
        return { granted: true, permission: this.permission };
      }

      const permission = await Notification.requestPermission();
      this.permission = permission;

      return {
        granted: permission === "granted",
        permission,
      };
    } catch (error) {
      console.error("[WebNotificationManager] Permission request failed:", error);
      return { granted: false, permission: "denied" };
    }
  }

  /**
   * Register service worker for background notifications
   */
  async registerServiceWorker(): Promise<void> {
    try {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.register("/sw.js");
        this.serviceWorkerRegistration = registration;
        console.log("[WebNotificationManager] Service worker registered");
      }
    } catch (error) {
      console.error("[WebNotificationManager] Service worker registration failed:", error);
    }
  }

  /**
   * Setup notification event listeners
   */
  setupNotificationListeners(): void {
    // Listen for notification clicks
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "NOTIFICATION_CLICK") {
          this.handleNotificationClick(event.data.notification);
        }
      });
    }

    // Listen for visibility changes to sync when app becomes active
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && this.isInitialized) {
        this.syncWithServer();
      }
    });
  }

  /**
   * Handle notification click
   */
  handleNotificationClick(notificationData: any): void {
    console.log("[WebNotificationManager] Notification clicked:", notificationData);

    // Add to history
    this.notificationHistory.unshift({
      ...notificationData,
      clicked: true,
      clickedAt: Date.now(),
    });

    // Handle different notification types
    switch (notificationData.type) {
      case "medication":
        this.handleMedicationNotification(notificationData);
        break;
      case "appointment":
        this.handleAppointmentNotification(notificationData);
        break;
      case "exercise":
        this.handleExerciseNotification(notificationData);
        break;
      case "health_alert":
        this.handleHealthAlertNotification(notificationData);
        break;
      default:
        console.log("[WebNotificationManager] Unknown notification type");
    }
  }

  /**
   * Show immediate notification
   */
  async showNotification(options: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: Record<string, any>;
    tag?: string;
    requireInteraction?: boolean;
  }): Promise<void> {
    try {
      if (!this.preferences.enabled || this.permission !== "granted") {
        console.log("[WebNotificationManager] Notifications disabled or no permission");
        return;
      }

      // Check quiet hours
      if (this.isInQuietHours()) {
        console.log("[WebNotificationManager] In quiet hours, skipping notification");
        return;
      }

      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || "/logo.png",
        badge: options.badge || "/logo.png",
        data: options.data || {},
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
      });

      // Add to history
      this.notificationHistory.unshift({
        title: options.title,
        body: options.body,
        data: options.data,
        sentAt: Date.now(),
        clicked: false,
      });

      // Auto-close after 5 seconds unless requireInteraction is true
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      console.log("[WebNotificationManager] Notification shown:", options.title);
    } catch (error) {
      console.error("[WebNotificationManager] Failed to show notification:", error);
    }
  }

  /**
   * Schedule notification
   */
  async scheduleNotification(options: {
    id?: string;
    title: string;
    body: string;
    scheduledFor: Date;
    category: string;
    priority?: "low" | "normal" | "high" | "urgent";
    repeatPattern?: string;
    data?: Record<string, any>;
  }): Promise<string | null> {
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
            this.showNotification({
              title: options.title,
              body: options.body,
              data: { ...options.data, scheduledId: id },
              tag: id,
            });
          }, delay);
        }
      }

      // Sync with server
      await this.syncScheduledNotificationWithServer(scheduledNotification);

      console.log("[WebNotificationManager] Notification scheduled:", id);
      return id;
    } catch (error) {
      console.error("[WebNotificationManager] Failed to schedule notification:", error);
      return null;
    }
  }

  /**
   * Cancel scheduled notification
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

      console.log("[WebNotificationManager] Notification cancelled:", notificationId);
      return true;
    } catch (error) {
      console.error("[WebNotificationManager] Failed to cancel notification:", error);
      return false;
    }
  }

  /**
   * Update preferences
   */
  async updatePreferences(newPreferences: Partial<NotificationPreferences>): Promise<boolean> {
    try {
      this.preferences = {
        ...this.preferences,
        ...newPreferences,
      };

      // Save to localStorage
      localStorage.setItem("webNotificationPreferences", JSON.stringify(this.preferences));

      // Sync with server
      await this.syncPreferencesWithServer();

      console.log("[WebNotificationManager] Preferences updated");
      return true;
    } catch (error) {
      console.error("[WebNotificationManager] Failed to update preferences:", error);
      return false;
    }
  }

  /**
   * Load preferences from localStorage
   */
  async loadPreferences(): Promise<void> {
    try {
      const stored = localStorage.getItem("webNotificationPreferences");
      if (stored) {
        this.preferences = {
          ...this.preferences,
          ...JSON.parse(stored),
        };
      }

      // Also load from server
      await this.loadPreferencesFromServer();
    } catch (error) {
      console.error("[WebNotificationManager] Failed to load preferences:", error);
    }
  }

  /**
   * Sync with server
   */
  async syncWithServer(): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch("/api/notifications/sync", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Sync failed: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.syncData) {
        await this.applySyncData(result.syncData);
        console.log("[WebNotificationManager] Sync completed successfully");
        return { success: true };
      } else {
        throw new Error("Invalid sync response");
      }
    } catch (error) {
      console.error("[WebNotificationManager] Sync failed:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Apply synced data from server
   */
  private async applySyncData(syncData: any): Promise<void> {
    try {
      // Update preferences
      if (syncData.preferences) {
        const serverPrefs = this.convertServerPreferences(syncData.preferences);
        this.preferences = serverPrefs;
        localStorage.setItem("webNotificationPreferences", JSON.stringify(this.preferences));
      }

      // Process pending notifications
      if (syncData.pendingNotifications && Array.isArray(syncData.pendingNotifications)) {
        for (const notification of syncData.pendingNotifications) {
          await this.showNotification({
            title: notification.title,
            body: notification.body,
            data: {
              ...notification.data,
              serverId: notification.id,
              type: notification.notification_type,
            },
          });
        }
      }

      // Sync scheduled notifications
      if (syncData.scheduledNotifications && Array.isArray(syncData.scheduledNotifications)) {
        for (const serverNotification of syncData.scheduledNotifications) {
          const scheduledFor = new Date(serverNotification.scheduled_for);
          if (scheduledFor > new Date()) {
            await this.scheduleNotification({
              id: serverNotification.id,
              title: serverNotification.title,
              body: serverNotification.body,
              scheduledFor,
              category: serverNotification.category,
              priority: serverNotification.priority,
              repeatPattern: serverNotification.repeat_pattern,
              data: serverNotification.data,
            });
          }
        }
      }
    } catch (error) {
      console.error("[WebNotificationManager] Failed to apply sync data:", error);
    }
  }

  /**
   * Helper methods
   */
  private generateNotificationId(): string {
    return `web_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isInQuietHours(): boolean {
    if (!this.preferences.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const startTime = this.parseTime(this.preferences.quietHours.start);
    const endTime = this.parseTime(this.preferences.quietHours.end);

    if (startTime > endTime) {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime < endTime;
    } else {
      return currentTime >= startTime && currentTime < endTime;
    }
  }

  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(":").map(Number);
    return hours * 60 + minutes;
  }

  private convertServerPreferences(serverPrefs: any): NotificationPreferences {
    return {
      enabled: serverPrefs.enabled,
      healthReminders: serverPrefs.health_reminders,
      medicationAlerts: serverPrefs.medication_alerts,
      appointmentReminders: serverPrefs.appointment_reminders,
      exerciseReminders: serverPrefs.exercise_reminders,
      sleepReminders: serverPrefs.sleep_reminders,
      quietHours: {
        enabled: serverPrefs.quiet_hours_enabled,
        start: serverPrefs.quiet_hours_start?.substring(0, 5) || "22:00",
        end: serverPrefs.quiet_hours_end?.substring(0, 5) || "07:00",
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

  private async syncPreferencesWithServer(): Promise<void> {
    try {
      const serverPrefs = {
        enabled: this.preferences.enabled,
        health_reminders: this.preferences.healthReminders,
        medication_alerts: this.preferences.medicationAlerts,
        appointment_reminders: this.preferences.appointmentReminders,
        exercise_reminders: this.preferences.exerciseReminders,
        sleep_reminders: this.preferences.sleepReminders,
        quiet_hours_enabled: this.preferences.quietHours.enabled,
        quiet_hours_start: this.preferences.quietHours.start + ":00",
        quiet_hours_end: this.preferences.quietHours.end + ":00",
        frequency_daily: this.preferences.frequency.daily,
        frequency_weekly: this.preferences.frequency.weekly,
        frequency_monthly: this.preferences.frequency.monthly,
        categories: this.preferences.categories,
      };

      await fetch("/api/notifications/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serverPrefs),
      });
    } catch (error) {
      console.error("[WebNotificationManager] Failed to sync preferences with server:", error);
    }
  }

  private async loadPreferencesFromServer(): Promise<void> {
    try {
      const response = await fetch("/api/notifications/preferences");
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.preferences) {
          const serverPrefs = this.convertServerPreferences(result.preferences);
          this.preferences = serverPrefs;
          localStorage.setItem("webNotificationPreferences", JSON.stringify(this.preferences));
        }
      }
    } catch (error) {
      console.error("[WebNotificationManager] Failed to load preferences from server:", error);
    }
  }

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
        "[WebNotificationManager] Failed to sync scheduled notification with server:",
        error
      );
    }
  }

  private async cancelServerNotification(notificationId: string): Promise<void> {
    try {
      await fetch(`/api/notifications/schedule?id=${notificationId}`, {
        method: "DELETE",
      });
    } catch (error) {
      console.error("[WebNotificationManager] Failed to cancel server notification:", error);
    }
  }

  private handleMedicationNotification(data: any): void {
    // Navigate to medication tracking
    console.log("[WebNotificationManager] Handling medication notification:", data);
  }

  private handleAppointmentNotification(data: any): void {
    // Navigate to appointment details
    console.log("[WebNotificationManager] Handling appointment notification:", data);
  }

  private handleExerciseNotification(data: any): void {
    // Navigate to exercise screen
    console.log("[WebNotificationManager] Handling exercise notification:", data);
  }

  private handleHealthAlertNotification(data: any): void {
    // Navigate to health alerts
    console.log("[WebNotificationManager] Handling health alert notification:", data);
  }

  /**
   * Get notification statistics
   */
  getNotificationStats() {
    return {
      totalScheduled: this.scheduledNotifications.size,
      totalReceived: this.notificationHistory.length,
      preferences: this.preferences,
      permission: this.permission,
      isInitialized: this.isInitialized,
    };
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.scheduledNotifications.clear();
    this.isInitialized = false;
    console.log("[WebNotificationManager] Cleanup complete");
  }
}

// Export singleton instance
export default new WebNotificationManager();

// Also export the class for testing
export { WebNotificationManager };
