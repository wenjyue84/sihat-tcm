/**
 * Web Notification System Interfaces
 * Type definitions for browser-based notification management
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

export interface ScheduledNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, any>;
  scheduledFor: Date;
  category: string;
  priority: "low" | "normal" | "high" | "urgent";
  repeatPattern?: string;
}

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, any>;
  tag?: string;
  requireInteraction?: boolean;
}

export interface ScheduleNotificationOptions {
  id?: string;
  title: string;
  body: string;
  scheduledFor: Date;
  category: string;
  priority?: "low" | "normal" | "high" | "urgent";
  repeatPattern?: string;
  data?: Record<string, any>;
}

export interface NotificationHistoryItem {
  title: string;
  body: string;
  data?: Record<string, any>;
  sentAt: number;
  clicked: boolean;
  clickedAt?: number;
  serverId?: string;
  type?: string;
}

export interface SyncData {
  preferences?: any;
  pendingNotifications?: Array<{
    id: string;
    title: string;
    body: string;
    data: Record<string, any>;
    notification_type: string;
  }>;
  scheduledNotifications?: Array<{
    id: string;
    title: string;
    body: string;
    scheduled_for: string;
    category: string;
    priority: string;
    repeat_pattern?: string;
    data: Record<string, any>;
  }>;
}

export interface NotificationStats {
  totalScheduled: number;
  totalReceived: number;
  preferences: NotificationPreferences;
  permission: NotificationPermission;
  isInitialized: boolean;
}

export interface InitializationResult {
  success: boolean;
  error?: string;
}

export interface PermissionResult {
  granted: boolean;
  permission: NotificationPermission;
}

export interface SyncResult {
  success: boolean;
  error?: string;
}
