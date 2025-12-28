/**
 * Notification System Usage Examples
 * 
 * Comprehensive examples showing how to use the refactored notification system
 * for various TCM-related scenarios and general notification management.
 */

import {
  MobileNotificationManager,
  NotificationPermissions,
  TokenManager,
  NotificationScheduler,
  NotificationHistory,
  PreferenceManager,
  TCMNotificationTemplates,
  NotificationListeners,
  initializeNotifications,
  scheduleTCMNotification,
  updateNotificationPreferences,
  getNotificationStats,
  getNotificationHistory
} from '../lib/notifications';

/**
 * Example 1: Basic Notification System Setup
 */
export async function basicNotificationSetup() {
  console.log('=== Basic Notification Setup ===');
  
  try {
    // Initialize the notification system
    const result = await initializeNotifications();
    
    if (result.success) {
      console.log('✅ Notifications initialized successfully');
      console.log('Push token:', result.data?.token);
      
      // Get current stats
      const stats = getNotificationStats();
      console.log('Current stats:', stats);
    } else {
      console.error('❌ Initialization failed:', result.error);
    }
  } catch (error) {
    console.error('Setup error:', error);
  }
}

/**
 * Example 2: TCM-Specific Notification Scheduling
 */
export async function tcmNotificationExamples() {
  console.log('=== TCM Notification Examples ===');
  
  const manager = MobileNotificationManager.getInstance();
  
  try {
    // Schedule seasonal advice notification
    const seasonalId = await scheduleTCMNotification(
      'SEASONAL_ADVICE',
      { season: 'spring', constitution: 'yang_deficiency' },
      { seconds: 60 } // 1 minute from now
    );
    console.log('✅ Seasonal advice scheduled:', seasonalId);

    // Schedule medication reminder
    const medicationId = await manager.scheduleTCMNotification(
      'MEDICATION_REMINDER',
      { 
        medicationName: 'Liu Wei Di Huang Wan',
        dosage: '6 pills',
        frequency: 'twice daily'
      },
      { 
        hour: 8,
        minute: 0,
        repeats: true
      }
    );
    console.log('✅ Medication reminder scheduled:', medicationId);

    // Schedule exercise reminder
    const exerciseId = await manager.scheduleTCMNotification(
      'EXERCISE_REMINDER',
      { 
        exerciseType: 'Qi Gong',
        duration: '15 minutes',
        focus: 'morning energy cultivation'
      },
      { 
        hour: 7,
        minute: 30,
        repeats: true
      }
    );
    console.log('✅ Exercise reminder scheduled:', exerciseId);

  } catch (error) {
    console.error('TCM notification error:', error);
  }
}

/**
 * Example 3: Advanced Template Usage
 */
export async function advancedTemplateUsage() {
  console.log('=== Advanced Template Usage ===');
  
  const templates = new TCMNotificationTemplates();
  
  // Get seasonal template
  const springTemplate = templates.getSeasonalTemplate('spring');
  console.log('Spring template:', springTemplate);

  // Get constitution-specific template
  const yinDeficiencyTemplate = templates.getConstitutionTemplate('yin_deficiency');
  console.log('Yin deficiency template:', yinDeficiencyTemplate);

  // Get templates by category
  const healthTemplates = templates.getTemplatesByCategory('health');
  console.log('Health templates count:', healthTemplates.length);

  // Create custom template
  const customTemplate = templates.createCustomTemplate(
    '🌱 Personal Growth',
    'Your TCM journey continues with today\'s personalized insights.',
    'health',
    'normal',
    { personalizedContent: true, userId: 'user123' }
  );
  console.log('Custom template:', customTemplate);
}

/**
 * Example 4: Preference Management
 */
export async function preferenceManagementExample() {
  console.log('=== Preference Management ===');
  
  const manager = MobileNotificationManager.getInstance();
  
  try {
    // Update notification preferences
    const success = await updateNotificationPreferences({
      enabled: true,
      healthReminders: true,
      medicationAlerts: true,
      exerciseReminders: true,
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '07:00'
      },
      categories: {
        health: true,
        medication: true,
        exercise: true,
        diet: false, // Disable diet notifications
        sleep: true,
        appointments: true
      }
    });

    if (success) {
      console.log('✅ Preferences updated successfully');
      
      // Get updated stats
      const stats = getNotificationStats();
      console.log('Updated preferences:', stats.preferences);
    } else {
      console.error('❌ Failed to update preferences');
    }
  } catch (error) {
    console.error('Preference management error:', error);
  }
}

/**
 * Example 5: Notification History Management
 */
export async function historyManagementExample() {
  console.log('=== History Management ===');
  
  const manager = MobileNotificationManager.getInstance();
  
  try {
    // Get recent notification history
    const recentHistory = getNotificationHistory(10);
    console.log('Recent notifications:', recentHistory.length);

    // Get all notification history
    const allHistory = getNotificationHistory();
    console.log('Total notifications in history:', allHistory.length);

    // Clear notification history
    await manager.clearNotificationHistory();
    console.log('✅ Notification history cleared');

    // Verify history is cleared
    const clearedHistory = getNotificationHistory();
    console.log('History after clearing:', clearedHistory.length);
  } catch (error) {
    console.error('History management error:', error);
  }
}

/**
 * Example 6: Cross-Device Synchronization
 */
export async function crossDeviceSyncExample() {
  console.log('=== Cross-Device Synchronization ===');
  
  const manager = MobileNotificationManager.getInstance();
  
  try {
    // Sync notifications across devices
    const syncResult = await manager.syncNotificationsAcrossDevices('user123');
    
    if (syncResult.success) {
      console.log('✅ Cross-device sync completed');
      console.log('Sync data:', syncResult.data);
    } else {
      console.error('❌ Sync failed:', syncResult.error);
    }
  } catch (error) {
    console.error('Sync error:', error);
  }
}

/**
 * Example 7: Individual Component Usage
 */
export async function individualComponentExample() {
  console.log('=== Individual Component Usage ===');
  
  try {
    // Use individual components directly
    const permissions = new NotificationPermissions();
    const tokenManager = new TokenManager();
    const scheduler = new NotificationScheduler();
    const history = new NotificationHistory(1000);
    const preferences = new PreferenceManager();
    
    // Check permissions
    const permissionStatus = await permissions.requestPermissions();
    console.log('Permission status:', permissionStatus);
    
    // Get push token
    const token = await tokenManager.registerForPushNotifications();
    console.log('Push token:', token);
    
    // Load preferences
    await preferences.loadFromStorage();
    const userPrefs = preferences.getPreferences();
    console.log('User preferences:', userPrefs);
    
    // Schedule a simple notification
    const notificationId = await scheduler.scheduleNotification({
      title: 'Test Notification',
      body: 'This is a test notification',
      data: { test: true },
      trigger: { seconds: 30 }
    }, userPrefs);
    console.log('Scheduled notification:', notificationId);
    
  } catch (error) {
    console.error('Individual component error:', error);
  }
}

/**
 * Example 8: Complete Workflow Example
 */
export async function completeWorkflowExample() {
  console.log('=== Complete Workflow Example ===');
  
  try {
    // 1. Initialize system
    console.log('Step 1: Initializing...');
    const initResult = await initializeNotifications();
    if (!initResult.success) {
      throw new Error('Initialization failed');
    }

    // 2. Set up user preferences
    console.log('Step 2: Setting preferences...');
    await updateNotificationPreferences({
      enabled: true,
      healthReminders: true,
      medicationAlerts: true,
      quietHours: { enabled: true, start: '22:00', end: '07:00' }
    });

    // 3. Schedule various TCM notifications
    console.log('Step 3: Scheduling notifications...');
    const notifications = await Promise.all([
      scheduleTCMNotification('SEASONAL_ADVICE', { season: 'spring' }),
      scheduleTCMNotification('MEDICATION_REMINDER', { medication: 'Herbal Formula' }),
      scheduleTCMNotification('EXERCISE_REMINDER', { exercise: 'Tai Chi' })
    ]);
    console.log('Scheduled notifications:', notifications);

    // 4. Get system stats
    console.log('Step 4: Getting stats...');
    const stats = getNotificationStats();
    console.log('System stats:', {
      totalScheduled: stats.totalScheduled,
      totalReceived: stats.totalReceived,
      isInitialized: stats.isInitialized
    });

    console.log('✅ Complete workflow executed successfully');
    
  } catch (error) {
    console.error('❌ Workflow error:', error);
  }
}

/**
 * Run all examples
 */
export async function runAllNotificationExamples() {
  console.log('🚀 Running all notification system examples...\n');
  
  await basicNotificationSetup();
  console.log('\n');
  
  await tcmNotificationExamples();
  console.log('\n');
  
  await advancedTemplateUsage();
  console.log('\n');
  
  await preferenceManagementExample();
  console.log('\n');
  
  await historyManagementExample();
  console.log('\n');
  
  await crossDeviceSyncExample();
  console.log('\n');
  
  await individualComponentExample();
  console.log('\n');
  
  await completeWorkflowExample();
  
  console.log('\n✅ All notification examples completed!');
}

// Export individual examples for selective usage
export {
  basicNotificationSetup,
  tcmNotificationExamples,
  advancedTemplateUsage,
  preferenceManagementExample,
  historyManagementExample,
  crossDeviceSyncExample,
  individualComponentExample,
  completeWorkflowExample
};