/**
 * Notification System - Main exports
 * 
 * Provides clean, organized exports for the entire notification system.
 * Use this file to import notification components throughout the application.
 */

// Main notification manager
export { MobileNotificationManager } from './MobileNotificationManager';

// Core components
export { NotificationPermissions } from './core/NotificationPermissions';
export { TokenManager } from './core/TokenManager';
export { NotificationScheduler } from './core/NotificationScheduler';
export { NotificationHistory } from './core/NotificationHistory';
export { PreferenceManager } from './core/PreferenceManager';

// Specialized components
export { TCMNotificationTemplates } from './templates/TCMNotificationTemplates';
export { NotificationListeners } from './listeners/NotificationListeners';

// Interfaces and types
export type {
  NotificationPreferences,
  NotificationStats,
  ApiResponse,
  NotificationTemplate,
  NotificationManagerConfig,
  ScheduledNotification,
  NotificationHistoryItem,
  QuietHours,
  NotificationFrequency,
  NotificationCategories
} from './interfaces/NotificationInterfaces';

// Default instance for convenience
import { MobileNotificationManager } from './MobileNotificationManager';
export default MobileNotificationManager.getInstance();

// Convenience functions for common operations
export const notificationManager = MobileNotificationManager.getInstance();

/**
 * Quick initialization function
 */
export const initializeNotifications = async () => {
  return await notificationManager.initialize();
};

/**
 * Quick TCM notification scheduling
 */
export const scheduleTCMNotification = async (
  templateType: string,
  customData?: any,
  trigger?: any
) => {
  return await notificationManager.scheduleTCMNotification(templateType, customData, trigger);
};

/**
 * Quick preference updates
 */
export const updateNotificationPreferences = async (preferences: any) => {
  return await notificationManager.updatePreferences(preferences);
};

/**
 * Quick stats retrieval
 */
export const getNotificationStats = () => {
  return notificationManager.getNotificationStats();
};

/**
 * Quick history retrieval
 */
export const getNotificationHistory = (limit?: number) => {
  return notificationManager.getNotificationHistory(limit);
};

/**
 * Quick cleanup
 */
export const cleanupNotifications = () => {
  notificationManager.cleanup();
};