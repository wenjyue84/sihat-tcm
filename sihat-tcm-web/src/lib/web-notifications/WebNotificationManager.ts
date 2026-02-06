/**
 * Web Notification Manager - Main Orchestrator
 * Coordinates all web notification components with clean architecture
 */

import {
  NotificationOptions,
  ScheduleNotificationOptions,
  NotificationPreferences,
  NotificationStats,
  InitializationResult,
  SyncResult,
} from "./interfaces/WebNotificationInterfaces";

import { PermissionManager } from "./core/PermissionManager";
import { PreferenceManager } from "./core/PreferenceManager";
import { NotificationScheduler } from "./core/NotificationScheduler";
import { NotificationDisplay } from "./core/NotificationDisplay";
import { NotificationHandlers } from "./handlers/NotificationHandlers";
import { SyncManager } from "./sync/SyncManager";

/**
 * Enhanced Web Notification Manager with modular architecture
 */
export class WebNotificationManager {
  private isInitialized = false;

  // Core components
  private permissionManager: PermissionManager;
  private preferenceManager: PreferenceManager;
  private scheduler: NotificationScheduler;
  private display: NotificationDisplay;
  private handlers: NotificationHandlers;
  private syncManager: SyncManager;

  constructor() {
    // Initialize components
    this.permissionManager = new PermissionManager();
    this.preferenceManager = new PreferenceManager();
    this.scheduler = new NotificationScheduler();
    this.display = new NotificationDisplay();
    this.handlers = new NotificationHandlers();

    // Initialize sync manager with dependencies
    this.syncManager = new SyncManager(this.preferenceManager, this.scheduler, this.display);
  }

  /**
   * Initialize web notification system
   */
  async initialize(): Promise<InitializationResult> {
    try {
      console.log("[WebNotificationManager] Initializing...");

      // Check browser support
      if (!PermissionManager.isSupported()) {
        console.warn("[WebNotificationManager] Browser does not support notifications");
        return { success: false, error: "Browser does not support notifications" };
      }

      // Request permission
      const permissionResult = await this.permissionManager.requestPermission();
      if (!permissionResult.granted) {
        console.warn("[WebNotificationManager] Notification permissions not granted");
        return { success: false, error: "Permissions not granted" };
      }

      // Register service worker for background notifications
      await this.permissionManager.registerServiceWorker();

      // Set service worker registration in scheduler
      const registration = this.permissionManager.getServiceWorkerRegistration();
      if (registration) {
        this.scheduler.setServiceWorkerRegistration(registration);
      }

      // Load preferences
      await this.preferenceManager.loadPreferences();

      // Setup notification listeners
      this.setupNotificationListeners();

      // Setup sync manager
      this.syncManager.setupOfflineHandling();
      this.syncManager.scheduleAutoSync(30); // Auto-sync every 30 minutes

      this.isInitialized = true;
      console.log("[WebNotificationManager] Initialization complete");

      return { success: true };
    } catch (error) {
      console.error("[WebNotificationManager] Initialization failed:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Setup notification event listeners
   */
  private setupNotificationListeners(): void {
    // Setup service worker listeners
    this.handlers.setupServiceWorkerListeners();

    // Setup visibility change listeners for sync
    this.handlers.setupVisibilityListeners(() => {
      if (this.isInitialized) {
        this.syncManager.syncWithServer();
      }
    });
  }

  /**
   * Show immediate notification
   */
  async showNotification(options: NotificationOptions): Promise<void> {
    try {
      if (
        !this.preferenceManager.areNotificationsEnabled() ||
        !this.permissionManager.hasPermission()
      ) {
        console.log("[WebNotificationManager] Notifications disabled or no permission");
        return;
      }

      // Check quiet hours
      if (this.preferenceManager.isInQuietHours()) {
        console.log("[WebNotificationManager] In quiet hours, skipping notification");
        return;
      }

      // Use service worker if available, otherwise fallback to direct notification
      const registration = this.permissionManager.getServiceWorkerRegistration();
      if (registration) {
        await this.display.showServiceWorkerNotification(registration, options);
      } else {
        await this.display.showNotification(options);
      }

      console.log("[WebNotificationManager] Notification shown:", options.title);
    } catch (error) {
      console.error("[WebNotificationManager] Failed to show notification:", error);
    }
  }

  /**
   * Schedule notification
   */
  async scheduleNotification(options: ScheduleNotificationOptions): Promise<string | null> {
    try {
      if (!this.preferenceManager.areNotificationsEnabled()) {
        console.log("[WebNotificationManager] Notifications disabled");
        return null;
      }

      // Check if category is enabled
      if (!this.preferenceManager.isCategoryEnabled(options.category as any)) {
        console.log("[WebNotificationManager] Category disabled:", options.category);
        return null;
      }

      const notificationId = await this.scheduler.scheduleNotification(options);

      if (notificationId) {
        console.log("[WebNotificationManager] Notification scheduled:", notificationId);
      }

      return notificationId;
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
      const result = await this.scheduler.cancelNotification(notificationId);

      if (result) {
        console.log("[WebNotificationManager] Notification cancelled:", notificationId);
      }

      return result;
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
      const result = await this.preferenceManager.updatePreferences(newPreferences);

      if (result) {
        console.log("[WebNotificationManager] Preferences updated");
      }

      return result;
    } catch (error) {
      console.error("[WebNotificationManager] Failed to update preferences:", error);
      return false;
    }
  }

  /**
   * Get current preferences
   */
  getPreferences(): NotificationPreferences {
    return this.preferenceManager.getPreferences();
  }

  /**
   * Sync with server
   */
  async syncWithServer(): Promise<SyncResult> {
    return await this.syncManager.syncWithServer();
  }

  /**
   * Perform full synchronization
   */
  async performFullSync(): Promise<SyncResult> {
    return await this.syncManager.performFullSync();
  }

  /**
   * Handle notification click (called by service worker or direct notification)
   */
  handleNotificationClick(notificationData: any): void {
    // Mark as clicked in display history
    this.display.markAsClicked(notificationData);

    // Handle the click with appropriate routing
    this.handlers.handleNotificationClick(notificationData);
  }

  /**
   * Get notification statistics
   */
  getNotificationStats(): NotificationStats {
    const displayStats = this.display.getStatistics();
    const syncStats = this.syncManager.getSyncStatistics();

    return {
      totalScheduled: this.scheduler.getScheduledCount(),
      totalReceived: displayStats.total,
      preferences: this.preferenceManager.getPreferences(),
      permission: this.permissionManager.getPermission(),
      isInitialized: this.isInitialized,
    };
  }

  /**
   * Get detailed system status
   */
  getSystemStatus(): {
    initialized: boolean;
    permission: NotificationPermission;
    serviceWorkerRegistered: boolean;
    preferencesLoaded: boolean;
    syncStatus: ReturnType<SyncManager["getSyncStatistics"]>;
    displayStats: ReturnType<NotificationDisplay["getStatistics"]>;
  } {
    return {
      initialized: this.isInitialized,
      permission: this.permissionManager.getPermission(),
      serviceWorkerRegistered: !!this.permissionManager.getServiceWorkerRegistration(),
      preferencesLoaded: true, // Could add a flag to preference manager
      syncStatus: this.syncManager.getSyncStatistics(),
      displayStats: this.display.getStatistics(),
    };
  }

  /**
   * Enable/disable auto-sync
   */
  setAutoSync(enabled: boolean, intervalMinutes: number = 30): void {
    if (enabled) {
      this.syncManager.scheduleAutoSync(intervalMinutes);
    } else {
      this.syncManager.clearAutoSync();
    }
  }

  /**
   * Request permission (can be called separately)
   */
  async requestPermission() {
    return await this.permissionManager.requestPermission();
  }

  /**
   * Check if browser supports notifications
   */
  static isSupported(): boolean {
    return PermissionManager.isSupported();
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.scheduler.clearAllScheduled();
    this.display.clearHistory();
    this.syncManager.clearAutoSync();
    this.isInitialized = false;
    console.log("[WebNotificationManager] Cleanup complete");
  }
}

// Export singleton instance
export default new WebNotificationManager();

// Also export the class for testing
export { WebNotificationManager };
