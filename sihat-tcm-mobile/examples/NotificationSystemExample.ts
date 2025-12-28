/**
 * Mobile Notification System Implementation Example
 * 
 * Demonstrates how to use the new refactored notification system
 * for TCM health reminders and patient care.
 */

import {
  NotificationService,
  NotificationRequest,
  NotificationPreferences,
  NotificationScheduler,
  PreferenceManager,
} from '../lib/notifications/NotificationInterfaces';

import { createNotificationScheduler } from '../lib/notifications/NotificationScheduler';
import { createPreferenceManager } from '../lib/notifications/PreferenceManager';
import { createEventEmitter } from '../lib/events/EventSystem';

/**
 * TCM Health Notification Service
 * 
 * Comprehensive notification service specifically designed for
 * TCM health reminders, medication alerts, and wellness coaching.
 */
export class TCMHealthNotificationService implements NotificationService {
  private scheduler: NotificationScheduler;
  private preferenceManager: PreferenceManager;
  private eventEmitter = createEventEmitter('TCMNotifications');
  private isInitialized = false;
  private pushToken?: string;

  constructor() {
    this.scheduler = createNotificationScheduler('TCMHealth');
    this.preferenceManager = createPreferenceManager('TCMHealth');
    this.setupEventListeners();
  }

  /**
   * Initialize the notification service
   */
  async initialize() {
    try {
      console.log('[TCMNotifications] Initializing notification service...');

      // Initialize preference manager
      await this.preferenceManager.getPreferences();

      // Set up notification permissions and get push token
      // This would integrate with Expo Notifications in a real implementation
      this.pushToken = await this.requestNotificationPermissions();

      this.isInitialized = true;

      await this.eventEmitter.emit({
        type: 'notification:service:initialized',
        data: {
          pushToken: this.pushToken,
          timestamp: new Date(),
        },
      });

      console.log('[TCMNotifications] Service initialized successfully');
      return { success: true, token: this.pushToken };

    } catch (error) {
      console.error('[TCMNotifications] Initialization failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Initialization failed' 
      };
    }
  }

  /**
   * Schedule a TCM-specific notification
   */
  async schedule(notification: NotificationRequest): Promise<string | null> {
    if (!this.isInitialized) {
      throw new Error('Notification service not initialized');
    }

    try {
      // Check if notification should be allowed based on preferences
      const preferences = await this.preferenceManager.getPreferences();
      const allowanceCheck = this.preferenceManager.shouldAllowNotification(
        notification.category,
        notification.priority
      );

      if (!allowanceCheck.allowed) {
        console.log(`[TCMNotifications] Notification blocked: ${allowanceCheck.reason}`);
        return null;
      }

      // Schedule the notification
      const notificationId = await this.scheduler.schedule(notification);

      if (notificationId) {
        await this.eventEmitter.emit({
          type: 'notification:scheduled',
          data: {
            notificationId,
            category: notification.category,
            priority: notification.priority,
            title: notification.title,
          },
        });
      }

      return notificationId;

    } catch (error) {
      console.error('[TCMNotifications] Failed to schedule notification:', error);
      throw error;
    }
  }

  /**
   * Cancel a scheduled notification
   */
  async cancel(id: string): Promise<boolean> {
    try {
      const result = await this.scheduler.cancel(id);
      
      if (result) {
        await this.eventEmitter.emit({
          type: 'notification:cancelled',
          data: { notificationId: id },
        });
      }

      return result;
    } catch (error) {
      console.error('[TCMNotifications] Failed to cancel notification:', error);
      return false;
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelAll(): Promise<boolean> {
    return this.scheduler.cancelAll();
  }

  /**
   * Get scheduled notifications
   */
  async getScheduled() {
    return this.scheduler.getScheduled();
  }

  /**
   * Get notification history (mock implementation)
   */
  async getHistory() {
    // In a real implementation, this would fetch from storage
    return [];
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<boolean> {
    try {
      const result = await this.preferenceManager.updatePreferences(preferences);
      
      if (result) {
        // Reschedule notifications based on new preferences
        const currentPreferences = await this.preferenceManager.getPreferences();
        await this.scheduler.rescheduleAll(currentPreferences);

        await this.eventEmitter.emit({
          type: 'notification:preferences:updated',
          data: { preferences: currentPreferences },
        });
      }

      return result;
    } catch (error) {
      console.error('[TCMNotifications] Failed to update preferences:', error);
      return false;
    }
  }

  /**
   * Get current preferences
   */
  getPreferences(): NotificationPreferences {
    // This would be async in a real implementation
    return {
      enabled: true,
      healthReminders: true,
      medicationAlerts: true,
      appointmentReminders: true,
      exerciseReminders: true,
      sleepReminders: true,
      quietHours: { enabled: true, start: '22:00', end: '07:00' },
      frequency: { daily: true, weekly: true, monthly: false },
      categories: {
        health: true,
        medication: true,
        exercise: true,
        diet: true,
        sleep: true,
        appointments: true,
        general: true,
      },
    };
  }

  /**
   * Get notification statistics
   */
  getStats() {
    return {
      totalScheduled: 0, // Would be calculated from actual data
      totalReceived: 0,
      totalClicked: 0,
      pushToken: this.pushToken,
      preferences: this.getPreferences(),
      isInitialized: this.isInitialized,
      lastSync: new Date(),
    };
  }

  /**
   * Clean up resources
   */
  cleanup(): void {
    console.log('[TCMNotifications] Cleaning up notification service');
    // Clean up any resources, listeners, etc.
  }

  // TCM-specific notification methods

  /**
   * Schedule herbal medicine reminder
   */
  async scheduleHerbalMedicineReminder(medicineData: {
    name: string;
    dosage: string;
    frequency: 'daily' | 'twice-daily' | 'three-times-daily';
    duration: number; // days
    instructions?: string;
  }) {
    const notifications: NotificationRequest[] = [];
    const now = new Date();

    // Calculate notification times based on frequency
    const times = this.calculateMedicationTimes(medicineData.frequency);

    // Schedule notifications for the duration
    for (let day = 0; day < medicineData.duration; day++) {
      for (const time of times) {
        const scheduledDate = new Date(now);
        scheduledDate.setDate(scheduledDate.getDate() + day);
        scheduledDate.setHours(time.hour, time.minute, 0, 0);

        notifications.push({
          title: '🌿 TCM Herbal Medicine',
          body: `Time to take ${medicineData.name} (${medicineData.dosage})`,
          category: 'medication',
          priority: 'high',
          data: {
            type: 'herbal-medicine',
            medicineName: medicineData.name,
            dosage: medicineData.dosage,
            instructions: medicineData.instructions,
          },
          trigger: {
            type: 'time',
            date: scheduledDate,
          },
        });
      }
    }

    // Schedule all notifications
    const scheduledIds = await Promise.all(
      notifications.map(notification => this.schedule(notification))
    );

    return scheduledIds.filter(id => id !== null);
  }

  /**
   * Schedule seasonal TCM advice
   */
  async scheduleSeasonalAdvice(season: 'spring' | 'summer' | 'autumn' | 'winter') {
    const seasonalAdvice = {
      spring: {
        title: '🌸 Spring TCM Wisdom',
        body: 'Support your Liver Qi with gentle detox and green foods.',
        advice: 'Focus on liver cleansing, eat more greens, practice gentle exercise.',
      },
      summer: {
        title: '☀️ Summer TCM Balance',
        body: 'Cool your Heart Fire with hydrating foods and calm activities.',
        advice: 'Stay cool, eat cooling foods, practice meditation.',
      },
      autumn: {
        title: '🍂 Autumn TCM Preparation',
        body: 'Nourish your Lung Qi with warming foods and breathing exercises.',
        advice: 'Strengthen lungs, eat warming foods, practice breathing exercises.',
      },
      winter: {
        title: '❄️ Winter TCM Nourishment',
        body: 'Tonify your Kidney Yang with warming foods and rest.',
        advice: 'Conserve energy, eat warming foods, get adequate rest.',
      },
    };

    const advice = seasonalAdvice[season];

    return this.schedule({
      title: advice.title,
      body: advice.body,
      category: 'health',
      priority: 'normal',
      data: {
        type: 'seasonal-advice',
        season,
        advice: advice.advice,
      },
      trigger: {
        type: 'time',
        seconds: 3600, // 1 hour from now
      },
    });
  }

  /**
   * Schedule Qi exercise reminders
   */
  async scheduleQiExerciseReminders(exerciseSchedule: {
    exercises: string[];
    frequency: 'daily' | 'weekly';
    preferredTimes: string[]; // ['08:00', '18:00']
  }) {
    const notifications: NotificationRequest[] = [];

    for (const timeStr of exerciseSchedule.preferredTimes) {
      const [hour, minute] = timeStr.split(':').map(Number);
      
      notifications.push({
        title: '🧘 Qi Exercise Time',
        body: 'Practice your daily Qi exercises for energy balance.',
        category: 'exercise',
        priority: 'normal',
        data: {
          type: 'qi-exercise',
          exercises: exerciseSchedule.exercises,
          preferredTime: timeStr,
        },
        trigger: {
          type: 'time',
          seconds: this.calculateSecondsUntilTime(hour, minute),
          repeats: true,
        },
      });
    }

    const scheduledIds = await Promise.all(
      notifications.map(notification => this.schedule(notification))
    );

    return scheduledIds.filter(id => id !== null);
  }

  /**
   * Schedule constitution-based dietary reminders
   */
  async scheduleConstitutionDietReminders(constitution: {
    type: string;
    recommendations: string[];
    avoidFoods: string[];
  }) {
    return this.schedule({
      title: '🍲 TCM Nutrition Reminder',
      body: `Foods that support your ${constitution.type} constitution are ready!`,
      category: 'diet',
      priority: 'normal',
      data: {
        type: 'constitution-diet',
        constitutionType: constitution.type,
        recommendations: constitution.recommendations,
        avoidFoods: constitution.avoidFoods,
      },
      trigger: {
        type: 'time',
        seconds: 1800, // 30 minutes
      },
    });
  }

  // Private helper methods

  private async requestNotificationPermissions(): Promise<string> {
    // Mock implementation - in real app, this would use Expo Notifications
    return `mock-token-${Date.now()}`;
  }

  private setupEventListeners(): void {
    // Set up any event listeners for cross-component communication
    this.eventEmitter.on('user:constitution:updated', async (event) => {
      // Reschedule constitution-based notifications
      console.log('[TCMNotifications] Constitution updated, rescheduling notifications');
    });
  }

  private calculateMedicationTimes(frequency: string): Array<{ hour: number; minute: number }> {
    switch (frequency) {
      case 'daily':
        return [{ hour: 8, minute: 0 }]; // 8 AM
      case 'twice-daily':
        return [
          { hour: 8, minute: 0 },  // 8 AM
          { hour: 20, minute: 0 }, // 8 PM
        ];
      case 'three-times-daily':
        return [
          { hour: 8, minute: 0 },  // 8 AM
          { hour: 14, minute: 0 }, // 2 PM
          { hour: 20, minute: 0 }, // 8 PM
        ];
      default:
        return [{ hour: 8, minute: 0 }];
    }
  }

  private calculateSecondsUntilTime(hour: number, minute: number): number {
    const now = new Date();
    const target = new Date();
    target.setHours(hour, minute, 0, 0);

    // If target time has passed today, schedule for tomorrow
    if (target <= now) {
      target.setDate(target.getDate() + 1);
    }

    return Math.floor((target.getTime() - now.getTime()) / 1000);
  }
}

/**
 * Usage Examples
 */

// Example 1: Basic Notification Service Setup
export async function exampleNotificationSetup() {
  const notificationService = new TCMHealthNotificationService();
  
  // Initialize the service
  const initResult = await notificationService.initialize();
  console.log('Notification service initialized:', initResult);

  // Update preferences
  await notificationService.updatePreferences({
    healthReminders: true,
    medicationAlerts: true,
    quietHours: {
      enabled: true,
      start: '22:00',
      end: '07:00',
    },
  });

  return notificationService;
}

// Example 2: Schedule Herbal Medicine Reminders
export async function exampleHerbalMedicineReminders() {
  const service = await exampleNotificationSetup();

  const scheduledIds = await service.scheduleHerbalMedicineReminder({
    name: 'Liu Wei Di Huang Wan',
    dosage: '6 pills',
    frequency: 'twice-daily',
    duration: 30, // 30 days
    instructions: 'Take with warm water after meals',
  });

  console.log('Scheduled herbal medicine reminders:', scheduledIds);
  return scheduledIds;
}

// Example 3: Seasonal TCM Advice
export async function exampleSeasonalAdvice() {
  const service = await exampleNotificationSetup();

  const notificationId = await service.scheduleSeasonalAdvice('winter');
  console.log('Scheduled seasonal advice:', notificationId);

  return notificationId;
}

// Example 4: Qi Exercise Reminders
export async function exampleQiExerciseReminders() {
  const service = await exampleNotificationSetup();

  const scheduledIds = await service.scheduleQiExerciseReminders({
    exercises: ['Ba Duan Jin', 'Tai Chi', 'Qi Gong breathing'],
    frequency: 'daily',
    preferredTimes: ['07:00', '18:00'], // Morning and evening
  });

  console.log('Scheduled Qi exercise reminders:', scheduledIds);
  return scheduledIds;
}

// Example 5: Constitution-based Diet Reminders
export async function exampleConstitutionDietReminders() {
  const service = await exampleNotificationSetup();

  const notificationId = await service.scheduleConstitutionDietReminders({
    type: 'Yang Deficiency',
    recommendations: [
      'Warm ginger tea',
      'Cooked vegetables',
      'Warming spices (cinnamon, cloves)',
      'Bone broth',
    ],
    avoidFoods: [
      'Cold drinks',
      'Raw foods',
      'Excessive dairy',
      'Cold fruits',
    ],
  });

  console.log('Scheduled constitution diet reminder:', notificationId);
  return notificationId;
}

// Example 6: Comprehensive TCM Notification Schedule
export async function exampleComprehensiveTCMSchedule() {
  const service = await exampleNotificationSetup();

  // Schedule various TCM-related notifications
  const results = await Promise.all([
    service.scheduleHerbalMedicineReminder({
      name: 'Gan Mao Ling',
      dosage: '3 tablets',
      frequency: 'three-times-daily',
      duration: 7,
    }),
    service.scheduleSeasonalAdvice('spring'),
    service.scheduleQiExerciseReminders({
      exercises: ['Morning Qi Gong'],
      frequency: 'daily',
      preferredTimes: ['06:30'],
    }),
    service.scheduleConstitutionDietReminders({
      type: 'Qi Deficiency',
      recommendations: ['Cooked grains', 'Root vegetables', 'Gentle soups'],
      avoidFoods: ['Cold foods', 'Excessive raw foods'],
    }),
  ]);

  console.log('Comprehensive TCM schedule created:', results);
  
  // Get service statistics
  const stats = service.getStats();
  console.log('Notification service stats:', stats);

  return { results, stats };
}

export default TCMHealthNotificationService;