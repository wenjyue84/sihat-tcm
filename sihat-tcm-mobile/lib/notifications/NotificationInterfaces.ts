/**
 * Notification System Interfaces - Strategy Pattern Implementation
 * 
 * Defines clean interfaces for the notification system following
 * the Strategy pattern for better separation of concerns.
 */

export interface NotificationRequest {
  title: string;
  body: string;
  data?: Record<string, any>;
  category: NotificationCategory;
  priority: NotificationPriority;
  trigger?: NotificationTrigger;
  sound?: string;
  badge?: number;
}

export interface ScheduledNotification {
  id: string;
  serverId?: string;
  title: string;
  body: string;
  data: Record<string, any>;
  category: NotificationCategory;
  priority: NotificationPriority;
  scheduledAt: number;
  trigger: NotificationTrigger;
  status: 'scheduled' | 'delivered' | 'cancelled' | 'failed';
}

export interface NotificationHistory {
  id: string;
  title: string;
  body: string;
  data: Record<string, any>;
  category: NotificationCategory;
  priority: NotificationPriority;
  receivedAt: number;
  clicked?: boolean;
  clickedAt?: number;
  deviceType: string;
  source: 'local' | 'push' | 'sync';
}

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
  categories: Record<NotificationCategory, boolean>;
}

export type NotificationCategory = 
  | 'health' 
  | 'medication' 
  | 'exercise' 
  | 'diet' 
  | 'sleep' 
  | 'appointments' 
  | 'general';

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface NotificationTrigger {
  type: 'time' | 'interval' | 'location' | 'condition';
  seconds?: number;
  repeats?: boolean;
  date?: Date;
  interval?: number;
  location?: {
    latitude: number;
    longitude: number;
    radius: number;
  };
  condition?: string;
}

export interface DeliveryResult {
  success: boolean;
  notificationId?: string;
  error?: string;
  deliveredAt?: Date;
}

export interface NotificationStats {
  totalScheduled: number;
  totalReceived: number;
  totalClicked: number;
  pushToken?: string;
  preferences: NotificationPreferences;
  isInitialized: boolean;
  lastSync?: Date;
}

/**
 * Core notification service interface
 */
export interface NotificationService {
  initialize(): Promise<{ success: boolean; token?: string; error?: string }>;
  schedule(notification: NotificationRequest): Promise<string | null>;
  cancel(id: string): Promise<boolean>;
  cancelAll(): Promise<boolean>;
  getScheduled(): Promise<ScheduledNotification[]>;
  getHistory(): Promise<NotificationHistory[]>;
  updatePreferences(preferences: Partial<NotificationPreferences>): Promise<boolean>;
  getPreferences(): NotificationPreferences;
  getStats(): NotificationStats;
  cleanup(): void;
}

/**
 * Notification delivery strategy interface
 */
export interface NotificationDeliveryStrategy {
  send(notification: NotificationRequest): Promise<DeliveryResult>;
  registerDevice(token: string): Promise<boolean>;
  unregisterDevice(token: string): Promise<boolean>;
  isAvailable(): Promise<boolean>;
}

/**
 * Preference management strategy interface
 */
export interface PreferenceManager {
  getPreferences(): Promise<NotificationPreferences>;
  updatePreferences(updates: Partial<NotificationPreferences>): Promise<boolean>;
  validatePreferences(preferences: NotificationPreferences): { valid: boolean; errors: string[] };
  resetToDefaults(): Promise<boolean>;
}

/**
 * Notification scheduling strategy interface
 */
export interface NotificationScheduler {
  schedule(notification: NotificationRequest): Promise<string | null>;
  cancel(id: string): Promise<boolean>;
  cancelAll(): Promise<boolean>;
  getScheduled(): Promise<ScheduledNotification[]>;
  rescheduleAll(preferences: NotificationPreferences): Promise<void>;
}

/**
 * Cross-platform sync strategy interface
 */
export interface NotificationSyncStrategy {
  syncWithServer(userId: string): Promise<{ success: boolean; error?: string }>;
  uploadData(data: NotificationSyncData): Promise<{ success: boolean; error?: string }>;
  downloadData(userId: string): Promise<{ success: boolean; data?: NotificationSyncData; error?: string }>;
  resolveConflicts(local: NotificationSyncData, remote: NotificationSyncData): NotificationSyncData;
}

export interface NotificationSyncData {
  deviceToken: string;
  notificationHistory: NotificationHistory[];
  scheduledNotifications: ScheduledNotification[];
  preferences: NotificationPreferences;
  deviceInfo: {
    platform: string;
    version: string | number;
    timestamp: number;
  };
}

/**
 * Notification response handler interface
 */
export interface NotificationResponseHandler {
  handleResponse(
    notificationId: string, 
    actionId: string, 
    data: Record<string, any>
  ): Promise<void>;
  
  registerHandler(
    category: NotificationCategory, 
    handler: (data: Record<string, any>) => Promise<void>
  ): void;
  
  unregisterHandler(category: NotificationCategory): void;
}

/**
 * Template management interface
 */
export interface NotificationTemplateManager {
  getTemplate(templateId: string): NotificationTemplate | null;
  registerTemplate(templateId: string, template: NotificationTemplate): void;
  unregisterTemplate(templateId: string): void;
  getAllTemplates(): Record<string, NotificationTemplate>;
}

export interface NotificationTemplate {
  title: string;
  body: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  defaultTrigger?: NotificationTrigger;
  variables?: string[];
}

/**
 * Main notification manager interface - Facade pattern
 */
export interface NotificationManager {
  initialize(): Promise<{ success: boolean; token?: string; error?: string }>;
  
  // Scheduling
  scheduleNotification(request: NotificationRequest): Promise<string | null>;
  scheduleFromTemplate(templateId: string, variables?: Record<string, string>, trigger?: NotificationTrigger): Promise<string | null>;
  cancelNotification(id: string): Promise<boolean>;
  
  // Management
  updatePreferences(preferences: Partial<NotificationPreferences>): Promise<boolean>;
  syncAcrossDevices(userId: string): Promise<{ success: boolean; error?: string }>;
  
  // Analytics
  getStats(): NotificationStats;
  getHistory(): Promise<NotificationHistory[]>;
  
  // Lifecycle
  cleanup(): void;
}