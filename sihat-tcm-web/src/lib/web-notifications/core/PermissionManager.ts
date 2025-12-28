/**
 * Permission Manager
 * Handles browser notification permissions and service worker registration
 */

import { PermissionResult } from '../interfaces/WebNotificationInterfaces';

export class PermissionManager {
  private permission: NotificationPermission = "default";
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;

  /**
   * Check if browser supports notifications
   */
  static isSupported(): boolean {
    return typeof window !== "undefined" && "Notification" in window;
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<PermissionResult> {
    try {
      if (!PermissionManager.isSupported()) {
        return { granted: false, permission: "denied" };
      }

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
      console.error("[PermissionManager] Permission request failed:", error);
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
        console.log("[PermissionManager] Service worker registered");
      }
    } catch (error) {
      console.error("[PermissionManager] Service worker registration failed:", error);
    }
  }

  /**
   * Get current permission status
   */
  getPermission(): NotificationPermission {
    return this.permission;
  }

  /**
   * Get service worker registration
   */
  getServiceWorkerRegistration(): ServiceWorkerRegistration | null {
    return this.serviceWorkerRegistration;
  }

  /**
   * Check if permissions are granted
   */
  hasPermission(): boolean {
    return this.permission === "granted";
  }
}