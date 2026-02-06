/**
 * Sync Manager
 * Handles synchronization with server for notifications and preferences
 */

import { SyncData, SyncResult } from "../interfaces/WebNotificationInterfaces";
import { PreferenceManager } from "../core/PreferenceManager";
import { NotificationScheduler } from "../core/NotificationScheduler";
import { NotificationDisplay } from "../core/NotificationDisplay";

export class SyncManager {
  private preferenceManager: PreferenceManager;
  private scheduler: NotificationScheduler;
  private display: NotificationDisplay;

  constructor(
    preferenceManager: PreferenceManager,
    scheduler: NotificationScheduler,
    display: NotificationDisplay
  ) {
    this.preferenceManager = preferenceManager;
    this.scheduler = scheduler;
    this.display = display;
  }

  /**
   * Sync with server
   */
  async syncWithServer(): Promise<SyncResult> {
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
        console.log("[SyncManager] Sync completed successfully");
        return { success: true };
      } else {
        throw new Error("Invalid sync response");
      }
    } catch (error) {
      console.error("[SyncManager] Sync failed:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Apply synced data from server
   */
  private async applySyncData(syncData: SyncData): Promise<void> {
    try {
      // Update preferences
      if (syncData.preferences) {
        const serverPrefs = this.preferenceManager.convertServerPreferences(syncData.preferences);
        await this.preferenceManager.updatePreferences(serverPrefs);
      }

      // Process pending notifications
      if (syncData.pendingNotifications && Array.isArray(syncData.pendingNotifications)) {
        await this.processPendingNotifications(syncData.pendingNotifications);
      }

      // Sync scheduled notifications
      if (syncData.scheduledNotifications && Array.isArray(syncData.scheduledNotifications)) {
        await this.scheduler.applyScheduledNotifications(syncData.scheduledNotifications);
      }
    } catch (error) {
      console.error("[SyncManager] Failed to apply sync data:", error);
    }
  }

  /**
   * Process pending notifications from server
   */
  private async processPendingNotifications(
    pendingNotifications: Array<{
      id: string;
      title: string;
      body: string;
      data: Record<string, any>;
      notification_type: string;
    }>
  ): Promise<void> {
    for (const notification of pendingNotifications) {
      await this.display.showNotification({
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

  /**
   * Upload local data to server
   */
  async uploadLocalData(): Promise<SyncResult> {
    try {
      const localData = {
        preferences: this.preferenceManager.getPreferences(),
        scheduledNotifications: this.scheduler.getScheduledNotifications(),
        notificationHistory: this.display.getHistory().slice(0, 50), // Last 50 notifications
      };

      const response = await fetch("/api/notifications/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(localData),
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log("[SyncManager] Local data uploaded successfully");
        return { success: true };
      } else {
        throw new Error(result.error || "Upload failed");
      }
    } catch (error) {
      console.error("[SyncManager] Upload failed:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Perform full synchronization (bidirectional)
   */
  async performFullSync(): Promise<SyncResult> {
    try {
      // First upload local changes
      const uploadResult = await this.uploadLocalData();
      if (!uploadResult.success) {
        console.warn("[SyncManager] Upload failed, continuing with download");
      }

      // Then download server changes
      const downloadResult = await this.syncWithServer();

      return downloadResult;
    } catch (error) {
      console.error("[SyncManager] Full sync failed:", error);
      return { success: false, error: (error as Error).message };
    }
  }

  /**
   * Check sync status with server
   */
  async checkSyncStatus(): Promise<{
    lastSync: Date | null;
    pendingChanges: number;
    serverAvailable: boolean;
  }> {
    try {
      const response = await fetch("/api/notifications/sync-status", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        return {
          lastSync: null,
          pendingChanges: 0,
          serverAvailable: false,
        };
      }

      const result = await response.json();

      return {
        lastSync: result.lastSync ? new Date(result.lastSync) : null,
        pendingChanges: result.pendingChanges || 0,
        serverAvailable: true,
      };
    } catch (error) {
      console.error("[SyncManager] Failed to check sync status:", error);
      return {
        lastSync: null,
        pendingChanges: 0,
        serverAvailable: false,
      };
    }
  }

  /**
   * Schedule automatic sync
   */
  scheduleAutoSync(intervalMinutes: number = 30): void {
    // Clear any existing interval
    this.clearAutoSync();

    // Set up new interval
    const intervalId = setInterval(
      async () => {
        const syncResult = await this.syncWithServer();
        if (!syncResult.success) {
          console.warn("[SyncManager] Auto-sync failed:", syncResult.error);
        }
      },
      intervalMinutes * 60 * 1000
    );

    // Store interval ID for cleanup
    (this as any)._autoSyncInterval = intervalId;
  }

  /**
   * Clear automatic sync
   */
  clearAutoSync(): void {
    if ((this as any)._autoSyncInterval) {
      clearInterval((this as any)._autoSyncInterval);
      (this as any)._autoSyncInterval = null;
    }
  }

  /**
   * Handle offline/online events
   */
  setupOfflineHandling(): void {
    if (typeof window === "undefined") return;

    window.addEventListener("online", async () => {
      console.log("[SyncManager] Connection restored, syncing...");
      await this.performFullSync();
    });

    window.addEventListener("offline", () => {
      console.log("[SyncManager] Connection lost, entering offline mode");
      this.clearAutoSync();
    });
  }

  /**
   * Get sync statistics
   */
  getSyncStatistics(): {
    autoSyncEnabled: boolean;
    lastSyncAttempt: Date | null;
    syncErrors: number;
  } {
    return {
      autoSyncEnabled: !!(this as any)._autoSyncInterval,
      lastSyncAttempt: (this as any)._lastSyncAttempt || null,
      syncErrors: (this as any)._syncErrors || 0,
    };
  }
}
