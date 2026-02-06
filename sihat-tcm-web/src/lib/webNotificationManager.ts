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

import webNotificationManager from "./web-notifications/WebNotificationManager";
import type {
  NotificationPreferences,
  NotificationOptions,
  ScheduleNotificationOptions,
  NotificationStats,
} from "./web-notifications/interfaces/WebNotificationInterfaces";

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
  /**
   * Initialize web notification system
   * @deprecated Use webNotificationManager.initialize() from './web-notifications'
   */
  async initialize(): Promise<{ success: boolean; error?: string }> {
    console.warn(
      "[WebNotificationManager] Using deprecated API. Please migrate to the new modular system."
    );
    return await webNotificationManager.initialize();
  }

  /**
   * Show immediate notification
   * @deprecated Use webNotificationManager.showNotification() from './web-notifications'
   */
  async showNotification(options: LegacyNotificationOptions): Promise<void> {
    console.warn(
      "[WebNotificationManager] Using deprecated API. Please migrate to the new modular system."
    );
    return await webNotificationManager.showNotification(options as NotificationOptions);
  }

  /**
   * Schedule notification
   * @deprecated Use webNotificationManager.scheduleNotification() from './web-notifications'
   */
  async scheduleNotification(options: LegacyScheduleOptions): Promise<string | null> {
    console.warn(
      "[WebNotificationManager] Using deprecated API. Please migrate to the new modular system."
    );
    return await webNotificationManager.scheduleNotification(
      options as ScheduleNotificationOptions
    );
  }

  /**
   * Cancel scheduled notification
   * @deprecated Use webNotificationManager.cancelNotification() from './web-notifications'
   */
  async cancelNotification(notificationId: string): Promise<boolean> {
    console.warn(
      "[WebNotificationManager] Using deprecated API. Please migrate to the new modular system."
    );
    return await webNotificationManager.cancelNotification(notificationId);
  }

  /**
   * Update preferences
   * @deprecated Use webNotificationManager.updatePreferences() from './web-notifications'
   */
  async updatePreferences(newPreferences: Partial<NotificationPreferences>): Promise<boolean> {
    console.warn(
      "[WebNotificationManager] Using deprecated API. Please migrate to the new modular system."
    );
    return await webNotificationManager.updatePreferences(newPreferences);
  }

  /**
   * Sync with server
   * @deprecated Use webNotificationManager.syncWithServer() from './web-notifications'
   */
  async syncWithServer(): Promise<{ success: boolean; error?: string }> {
    console.warn(
      "[WebNotificationManager] Using deprecated API. Please migrate to the new modular system."
    );
    return await webNotificationManager.syncWithServer();
  }

  /**
   * Get notification statistics
   * @deprecated Use webNotificationManager.getNotificationStats() from './web-notifications'
   */
  getNotificationStats(): NotificationStats {
    console.warn(
      "[WebNotificationManager] Using deprecated API. Please migrate to the new modular system."
    );
    return webNotificationManager.getNotificationStats();
  }

  /**
   * Cleanup
   * @deprecated Use webNotificationManager.cleanup() from './web-notifications'
   */
  cleanup(): void {
    console.warn(
      "[WebNotificationManager] Using deprecated API. Please migrate to the new modular system."
    );
    webNotificationManager.cleanup();
  }

  // Legacy methods that were in the original implementation
  async requestPermission() {
    console.warn(
      "[WebNotificationManager] Using deprecated API. Please migrate to the new modular system."
    );
    return await webNotificationManager.requestPermission();
  }

  async loadPreferences(): Promise<void> {
    console.warn(
      "[WebNotificationManager] Using deprecated API. Please migrate to the new modular system."
    );
    // This is now handled internally by the new system
  }

  handleNotificationClick(notificationData: any): void {
    console.warn(
      "[WebNotificationManager] Using deprecated API. Please migrate to the new modular system."
    );
    webNotificationManager.handleNotificationClick(notificationData);
  }
}

// Export singleton instance
export default new WebNotificationManager();

// Also export the class for testing
export { WebNotificationManager };
