/**
 * Notification Display
 * Handles immediate notification display and interaction
 */

import {
  NotificationOptions,
  NotificationHistoryItem,
} from "../interfaces/WebNotificationInterfaces";

export class NotificationDisplay {
  private notificationHistory: NotificationHistoryItem[] = [];

  /**
   * Show immediate notification
   */
  async showNotification(options: NotificationOptions): Promise<void> {
    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || "/logo.png",
        badge: options.badge || "/logo.png",
        data: options.data || {},
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
      });

      // Add to history
      this.addToHistory({
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

      console.log("[NotificationDisplay] Notification shown:", options.title);
    } catch (error) {
      console.error("[NotificationDisplay] Failed to show notification:", error);
    }
  }

  /**
   * Show notification with service worker
   */
  async showServiceWorkerNotification(
    registration: ServiceWorkerRegistration,
    options: NotificationOptions
  ): Promise<void> {
    try {
      await registration.showNotification(options.title, {
        body: options.body,
        icon: options.icon || "/logo.png",
        badge: options.badge || "/logo.png",
        data: options.data || {},
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
      });

      // Add to history
      this.addToHistory({
        title: options.title,
        body: options.body,
        data: options.data,
        sentAt: Date.now(),
        clicked: false,
      });

      console.log("[NotificationDisplay] Service worker notification shown:", options.title);
    } catch (error) {
      console.error("[NotificationDisplay] Failed to show service worker notification:", error);
    }
  }

  /**
   * Add notification to history
   */
  private addToHistory(item: NotificationHistoryItem): void {
    this.notificationHistory.unshift(item);

    // Keep only last 100 notifications
    if (this.notificationHistory.length > 100) {
      this.notificationHistory = this.notificationHistory.slice(0, 100);
    }
  }

  /**
   * Mark notification as clicked in history
   */
  markAsClicked(notificationData: any): void {
    const historyItem = this.notificationHistory.find(
      (item) => item.title === notificationData.title && item.sentAt === notificationData.sentAt
    );

    if (historyItem) {
      historyItem.clicked = true;
      historyItem.clickedAt = Date.now();
    }

    // Also add to history if not found (from service worker)
    if (!historyItem) {
      this.addToHistory({
        ...notificationData,
        clicked: true,
        clickedAt: Date.now(),
      });
    }
  }

  /**
   * Get notification history
   */
  getHistory(): NotificationHistoryItem[] {
    return [...this.notificationHistory];
  }

  /**
   * Get history count
   */
  getHistoryCount(): number {
    return this.notificationHistory.length;
  }

  /**
   * Clear notification history
   */
  clearHistory(): void {
    this.notificationHistory.length = 0;
  }

  /**
   * Get notification statistics
   */
  getStatistics(): {
    total: number;
    clicked: number;
    clickRate: number;
    recent: number;
  } {
    const total = this.notificationHistory.length;
    const clicked = this.notificationHistory.filter((item) => item.clicked).length;
    const clickRate = total > 0 ? (clicked / total) * 100 : 0;

    // Recent notifications (last 24 hours)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recent = this.notificationHistory.filter((item) => item.sentAt > oneDayAgo).length;

    return {
      total,
      clicked,
      clickRate: Math.round(clickRate * 100) / 100,
      recent,
    };
  }
}
