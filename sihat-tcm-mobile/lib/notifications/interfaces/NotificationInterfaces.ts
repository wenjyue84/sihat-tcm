/**
 * Core notification system interfaces and types
 */

/**
 * Notification template interface
 */
export interface NotificationTemplate {
  title: string;
  body: string;
  category: keyof NotificationPreferences['categories'];
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

/**
 * Scheduled notification interface
 */
export interface ScheduledNotification {
  id: string;
  serverId?: string;
  title: string;
  body: string;
  data: any;
  category: string;
  priority: string;
  scheduledAt: number;
  trigger: any;
}

/**
 * Notification history interface
 */
export interface NotificationHistory {
  id?: string;
  title: string;
  body: string;
  data: any;
  category: string;
  priority: string;
  receivedAt: number;
  clicked?: boolean;
  clickedAt?: number;
  deviceType?: string;
}

/**
 * Notification preferences interface
 */
export interface NotificationPreferences {
  enabled: boolean;
  healthReminders: boolean;
  medicationAlerts: boolean;
  appointmentReminders: boolean;
  exerciseReminders: boolean;
  sleepReminders: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  frequency: {
    daily: boolean;
    weekly: boolean;
    monthly: boolean;
  };
  categories: {
    health: boolean;
    medication: boolean;
    exercise: boolean;
    diet: boolean;
    sleep: boolean;
    appointments: boolean;
  };
}

/**
 * Notification statistics interface
 */
export interface NotificationStats {
  totalScheduled: number;
  totalReceived: number;
  pushToken?: string;
  preferences: NotificationPreferences;
  isInitialized: boolean;
}

/**
 * API response interface
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Sync data interface
 */
export interface SyncData {
  deviceToken: string;
  syncData: {
    notificationHistory: NotificationHistory[];
    scheduledNotifications: ScheduledNotification[];
    preferences: NotificationPreferences;
    deviceInfo: {
      platform: string;
      version: string | number;
      timestamp: number;
    };
  };
}

/**
 * Notification manager configuration
 */
export interface NotificationManagerConfig {
  maxHistorySize: number;
  maxCacheSize: number;
  syncIntervalMinutes: number;
  retryAttempts: number;
  retryDelay: number;
}