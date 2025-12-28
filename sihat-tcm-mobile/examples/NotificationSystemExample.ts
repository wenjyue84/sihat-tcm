/**
 * Notification System Usage Examples
 * 
 * Demonstrates how to use the refactored notification system
 * with real-world scenarios for the Sihat TCM mobile application.
 */

import {
  createNotificationScheduler,
} from '../lib/notifications/NotificationScheduler';

import {
  createPreferenceManager,
} from '../lib/notifications/PreferenceManager';

import type {
  NotificationService,
  NotificationRequest,
  NotificationPreferences,
  ScheduledNotification,
} from '../lib/notifications/NotificationInterfaces';

import {
  NOTIFICATION_TEMPLATES,
  NOTIFICATION_CATEGORIES,
  PRIORITY_LEVELS,
} from '../constants';

/**
 * Example Notification Service Implementation
 */
class TCMNotificationService implements NotificationService {
  private scheduler = createNotificationScheduler('TCM-Mobile');
  private preferenceManager = createPreferenceManager('TCM-Mobile');
  private isInitialized = false;

  async initialize() {
    try {
      console.log('🔔 Initializing TCM Notification Service...');
      
      // Load preferences
      await this.preferenceManager.getPreferences();
      
      this.isInitialized = true;
      
      console.log('✅ Notification service initialized successfully');
      return { success: true, token: 'mock-expo-token' };
    } catch (error) {
      console.error('❌ Notification service initialization failed:', error);
      return { success: false, error: error.message };
    }
  }

  async schedule(notification: NotificationRequest): Promise<string | null> {
    if (!this.isInitialized) {
      throw new Error('Notification service not initialized');
    }

    // Check preferences before scheduling
    const shouldAllow = this.preferenceManager.shouldAllowNotification(
      notification.category,
      notification.priority
    );

    if (!shouldAllow.allowed) {
      console.log(`🚫 Notification blocked: ${shouldAllow.reason}`);
      return null;
    }

    return this.scheduler.schedule(notification);
  }

  async cancel(id: string): Promise<boolean> {
    return this.scheduler.cancel(id);
  }

  async cancelAll(): Promise<boolean> {
    return this.scheduler.cancelAll();
  }

  async getScheduled(): Promise<ScheduledNotification[]> {
    return this.scheduler.getScheduled();
  }

  async getHistory() {
    // Mock implementation
    return [];
  }

  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<boolean> {
    const success = await this.preferenceManager.updatePreferences(preferences);
    
    if (success) {
      // Reschedule notifications based on new preferences
      const currentPrefs = await this.preferenceManager.getPreferences();
      await this.scheduler.rescheduleAll(currentPrefs);
    }
    
    return success;
  }

  getPreferences(): NotificationPreferences {
    // This would normally be async, but for demo purposes
    return {
      enabled: true,
      healthReminders: true,
      medicationAlerts: true,
      appointmentReminders: true,
      exerciseReminders: true,
      sleepReminders: true,
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '07:00',
      },
      frequency: {
        daily: true,
        weekly: true,
        monthly: false,
      },
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

  getStats() {
    return {
      totalScheduled: 0,
      totalReceived: 0,
      totalClicked: 0,
      pushToken: 'mock-expo-token',
      preferences: this.getPreferences(),
      isInitialized: this.isInitialized,
    };
  }

  cleanup(): void {
    console.log('🧹 Cleaning up notification service...');
    this.isInitialized = false;
  }
}

/**
 * Example 1: Basic Notification Setup
 */
export async function basicNotificationSetup() {
  console.log('=== Basic Notification Setup ===');

  const notificationService = new TCMNotificationService();
  
  // Initialize the service
  const initResult = await notificationService.initialize();
  
  if (!initResult.success) {
    throw new Error(`Initialization failed: ${initResult.error}`);
  }

  console.log('Notification service ready with token:', initResult.token);
  return notificationService;
}

/**
 * Example 2: TCM Medication Reminders
 */
export async function medicationReminderExample() {
  console.log('=== TCM Medication Reminder Example ===');

  const service = await basicNotificationSetup();

  // Schedule herbal medicine reminder
  const medicationReminder: NotificationRequest = {
    title: '💊 Herbal Medicine Time',
    body: 'Time to take your prescribed herbal formula: Liu Wei Di Huang Wan',
    category: 'medication',
    priority: 'high',
    data: {
      medicationType: 'herbal_formula',
      formulaName: 'Liu Wei Di Huang Wan',
      dosage: '6 pills',
      instructions: 'Take with warm water after meals',
    },
    trigger: {
      type: 'time',
      seconds: 60, // 1 minute from now for demo
      repeats: false,
    },
  };

  try {
    const notificationId = await service.schedule(medicationReminder);
    
    if (notificationId) {
      console.log(`✅ Medication reminder scheduled: ${notificationId}`);
      console.log(`   Formula: ${medicationReminder.data.formulaName}`);
      console.log(`   Dosage: ${medicationReminder.data.dosage}`);
    } else {
      console.log('🚫 Medication reminder was blocked by user preferences');
    }

    return notificationId;
  } catch (error) {
    console.error('❌ Failed to schedule medication reminder:', error);
    throw error;
  }
}

/**
 * Example 3: TCM Health Reminders
 */
export async function healthReminderExample() {
  console.log('=== TCM Health Reminder Example ===');

  const service = await basicNotificationSetup();

  // Schedule various TCM health reminders
  const healthReminders = [
    {
      title: '🌿 Seasonal TCM Wisdom',
      body: 'Winter is the season of the Kidney. Focus on warming foods and rest.',
      category: 'health' as const,
      priority: 'normal' as const,
      data: {
        season: 'winter',
        organ: 'kidney',
        advice: 'warming_foods_and_rest',
      },
    },
    {
      title: '⚖️ Constitution Balance',
      body: 'Your Yang deficiency constitution benefits from ginger tea in the morning.',
      category: 'health' as const,
      priority: 'normal' as const,
      data: {
        constitution: 'yang_deficiency',
        recommendation: 'ginger_tea_morning',
      },
    },
    {
      title: '🧘 Qi Exercise Time',
      body: 'Practice your daily Qi Gong exercises for 15 minutes.',
      category: 'exercise' as const,
      priority: 'normal' as const,
      data: {
        exerciseType: 'qi_gong',
        duration: '15_minutes',
      },
    },
  ];

  const scheduledIds: string[] = [];

  for (const reminder of healthReminders) {
    try {
      const notificationId = await service.schedule({
        ...reminder,
        trigger: {
          type: 'time',
          seconds: Math.random() * 300 + 60, // Random time between 1-5 minutes
          repeats: false,
        },
      });

      if (notificationId) {
        scheduledIds.push(notificationId);
        console.log(`✅ Health reminder scheduled: ${reminder.title}`);
      }
    } catch (error) {
      console.error(`❌ Failed to schedule reminder: ${reminder.title}`, error);
    }
  }

  console.log(`Total health reminders scheduled: ${scheduledIds.length}`);
  return scheduledIds;
}

/**
 * Example 4: Appointment Reminders
 */
export async function appointmentReminderExample() {
  console.log('=== TCM Appointment Reminder Example ===');

  const service = await basicNotificationSetup();

  // Schedule appointment reminder
  const appointmentReminder: NotificationRequest = {
    title: '📅 TCM Consultation Tomorrow',
    body: 'Your consultation with Dr. Chen is scheduled for tomorrow at 2:00 PM.',
    category: 'appointments',
    priority: 'high',
    data: {
      appointmentId: 'apt-123',
      practitionerName: 'Dr. Chen',
      appointmentTime: '2024-01-15T14:00:00Z',
      type: 'follow_up_consultation',
      location: 'TCM Wellness Center',
    },
    trigger: {
      type: 'time',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      repeats: false,
    },
  };

  try {
    const notificationId = await service.schedule(appointmentReminder);
    
    if (notificationId) {
      console.log(`✅ Appointment reminder scheduled: ${notificationId}`);
      console.log(`   Practitioner: ${appointmentReminder.data.practitionerName}`);
      console.log(`   Location: ${appointmentReminder.data.location}`);
    }

    return notificationId;
  } catch (error) {
    console.error('❌ Failed to schedule appointment reminder:', error);
    throw error;
  }
}

/**
 * Example 5: Preference Management
 */
export async function preferenceManagementExample() {
  console.log('=== Preference Management Example ===');

  const service = await basicNotificationSetup();

  // Get current preferences
  const currentPrefs = service.getPreferences();
  console.log('Current Preferences:', {
    enabled: currentPrefs.enabled,
    quietHours: currentPrefs.quietHours,
    enabledCategories: Object.entries(currentPrefs.categories)
      .filter(([_, enabled]) => enabled)
      .map(([category, _]) => category),
  });

  // Update preferences
  const updates = {
    quietHours: {
      enabled: true,
      start: '23:00', // Later bedtime
      end: '06:00',   // Earlier wake time
    },
    medicationAlerts: true,
    exerciseReminders: false, // Disable exercise reminders
    categories: {
      ...currentPrefs.categories,
      exercise: false,
      sleep: true,
    },
  };

  try {
    const success = await service.updatePreferences(updates);
    
    if (success) {
      console.log('✅ Preferences updated successfully');
      console.log('   New quiet hours: 23:00 - 06:00');
      console.log('   Exercise reminders: disabled');
      console.log('   Sleep reminders: enabled');
    } else {
      console.log('❌ Failed to update preferences');
    }

    return success;
  } catch (error) {
    console.error('❌ Preference update error:', error);
    throw error;
  }
}

/**
 * Example 6: Notification Analytics and Management
 */
export async function notificationAnalyticsExample() {
  console.log('=== Notification Analytics Example ===');

  const service = await basicNotificationSetup();

  // Schedule some test notifications
  await medicationReminderExample();
  await healthReminderExample();

  // Get scheduled notifications
  const scheduled = await service.getScheduled();
  console.log(`📊 Currently scheduled: ${scheduled.length} notifications`);

  scheduled.forEach((notification, index) => {
    console.log(`   ${index + 1}. ${notification.title} (${notification.category})`);
  });

  // Get service statistics
  const stats = service.getStats();
  console.log('Service Statistics:', {
    totalScheduled: stats.totalScheduled,
    isInitialized: stats.isInitialized,
    pushToken: stats.pushToken ? 'Available' : 'Not available',
  });

  // Demonstrate cancellation
  if (scheduled.length > 0) {
    const firstNotification = scheduled[0];
    console.log(`\n🗑️ Cancelling notification: ${firstNotification.title}`);
    
    const cancelled = await service.cancel(firstNotification.id);
    console.log(`   Cancellation ${cancelled ? 'successful' : 'failed'}`);
  }

  return { scheduled, stats };
}

/**
 * Example 7: Batch Notification Operations
 */
export async function batchNotificationExample() {
  console.log('=== Batch Notification Example ===');

  const service = await basicNotificationSetup();

  // Create a week's worth of medication reminders
  const weeklyMedications = [
    { day: 'Monday', time: '08:00', formula: 'Liu Wei Di Huang Wan' },
    { day: 'Tuesday', time: '08:00', formula: 'Gan Mai Da Zao Tang' },
    { day: 'Wednesday', time: '08:00', formula: 'Liu Wei Di Huang Wan' },
    { day: 'Thursday', time: '08:00', formula: 'Xiao Yao San' },
    { day: 'Friday', time: '08:00', formula: 'Liu Wei Di Huang Wan' },
    { day: 'Saturday', time: '09:00', formula: 'Bu Yang Huan Wu Tang' },
    { day: 'Sunday', time: '09:00', formula: 'Rest Day - No medication' },
  ];

  const batchResults: (string | null)[] = [];

  console.log('📅 Scheduling weekly medication plan...');

  for (const med of weeklyMedications) {
    if (med.formula === 'Rest Day - No medication') {
      console.log(`   ${med.day}: Rest day - no medication`);
      continue;
    }

    const notification: NotificationRequest = {
      title: `💊 ${med.day} Medication`,
      body: `Time for your ${med.formula} - ${med.time}`,
      category: 'medication',
      priority: 'high',
      data: {
        day: med.day,
        time: med.time,
        formula: med.formula,
        weeklyPlan: true,
      },
      trigger: {
        type: 'time',
        seconds: Math.random() * 60 + 30, // Random time for demo
        repeats: false,
      },
    };

    try {
      const id = await service.schedule(notification);
      batchResults.push(id);
      console.log(`   ✅ ${med.day}: ${med.formula} scheduled`);
    } catch (error) {
      batchResults.push(null);
      console.log(`   ❌ ${med.day}: Failed to schedule`);
    }
  }

  const successCount = batchResults.filter(id => id !== null).length;
  console.log(`\n📊 Batch Results: ${successCount}/${weeklyMedications.length - 1} notifications scheduled`);

  return batchResults;
}

/**
 * Example 8: Error Handling and Recovery
 */
export async function errorHandlingExample() {
  console.log('=== Error Handling Example ===');

  const service = await basicNotificationSetup();

  // Test various error scenarios
  const errorScenarios = [
    {
      name: 'Invalid Notification (Missing Title)',
      notification: {
        title: '', // Invalid: empty title
        body: 'This should fail validation',
        category: 'health' as const,
        priority: 'normal' as const,
      },
    },
    {
      name: 'Invalid Category',
      notification: {
        title: 'Test Notification',
        body: 'This has an invalid category',
        category: 'invalid_category' as any,
        priority: 'normal' as const,
      },
    },
    {
      name: 'Disabled Category',
      notification: {
        title: 'Exercise Reminder',
        body: 'Time to exercise',
        category: 'exercise' as const,
        priority: 'normal' as const,
      },
      setup: async () => {
        // Disable exercise category
        await service.updatePreferences({
          categories: { exercise: false },
        });
      },
    },
  ];

  for (const scenario of errorScenarios) {
    console.log(`\n🧪 Testing: ${scenario.name}`);
    
    try {
      // Run setup if provided
      if (scenario.setup) {
        await scenario.setup();
      }

      const result = await service.schedule(scenario.notification as NotificationRequest);
      
      if (result === null) {
        console.log('   ✅ Notification appropriately blocked');
      } else {
        console.log(`   ⚠️ Notification scheduled unexpectedly: ${result}`);
      }
    } catch (error) {
      console.log(`   ✅ Expected error caught: ${error.message}`);
    }
  }
}

/**
 * Run all notification examples
 */
export async function runAllNotificationExamples() {
  console.log('🔔 Running All Notification System Examples\n');

  try {
    await basicNotificationSetup();
    await medicationReminderExample();
    await healthReminderExample();
    await appointmentReminderExample();
    await preferenceManagementExample();
    await notificationAnalyticsExample();
    await batchNotificationExample();
    await errorHandlingExample();
    
    console.log('\n✅ All notification examples completed successfully!');
  } catch (error) {
    console.error('\n❌ Notification example execution failed:', error);
  }
}

// Export for use in other files
export default {
  TCMNotificationService,
  basicNotificationSetup,
  medicationReminderExample,
  healthReminderExample,
  appointmentReminderExample,
  preferenceManagementExample,
  notificationAnalyticsExample,
  batchNotificationExample,
  errorHandlingExample,
  runAllNotificationExamples,
};