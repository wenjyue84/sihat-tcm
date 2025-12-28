/**
 * Web Notifications Module - Barrel Export
 * Clean exports for the modular web notification system
 */

// Main manager (singleton and class)
export { default as webNotificationManager, WebNotificationManager } from './WebNotificationManager';

// Core components
export { PermissionManager } from './core/PermissionManager';
export { PreferenceManager } from './core/PreferenceManager';
export { NotificationScheduler } from './core/NotificationScheduler';
export { NotificationDisplay } from './core/NotificationDisplay';

// Handlers and sync
export { NotificationHandlers } from './handlers/NotificationHandlers';
export { SyncManager } from './sync/SyncManager';

// Interfaces
export type {
  NotificationPreferences,
  ScheduledNotification,
  NotificationOptions,
  ScheduleNotificationOptions,
  NotificationHistoryItem,
  SyncData,
  NotificationStats,
  InitializationResult,
  PermissionResult,
  SyncResult,
} from './interfaces/WebNotificationInterfaces';

// Convenience functions
export const checkNotificationSupport = () => WebNotificationManager.isSupported();

export const createWebNotificationManager = () => new WebNotificationManager();