/**
 * Notification Listeners - Handles notification events and responses
 * 
 * Manages notification event listeners, response routing, and user interaction handling
 * for the mobile notification system.
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { NotificationHistory } from '../core/NotificationHistory';

export class NotificationListeners {
  private notificationListener: Notifications.Subscription | null = null;
  private responseListener: Notifications.Subscription | null = null;
  private history: NotificationHistory;
  private readonly context = 'NotificationListeners';

  constructor(history: NotificationHistory) {
    this.history = history;
  }

  /**
   * Setup notification listeners
   */
  public setupListeners(): void {
    console.log(`[${this.context}] Setting up notification listeners...`);

    // Listener for notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(
      this.handleNotificationReceived.bind(this)
    );

    // Listener for when user taps on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(
      this.handleNotificationResponse.bind(this)
    );

    console.log(`[${this.context}] Listeners setup complete`);
  }

  /**
   * Handle notification received while app is in foreground
   */
  private handleNotificationReceived(notification: Notifications.Notification): void {
    const notificationId = notification.request.identifier;
    console.log(`[${this.context}] Notification received:`, notificationId);
    
    // Extract notification data
    const content = notification.request.content;
    const historyItem = {
      id: notificationId,
      title: content.title || '',
      body: content.body || '',
      data: content.data || {},
      category: content.data?.category || 'general',
      priority: content.data?.priority || 'normal',
      receivedAt: Date.now(),
      deviceType: Platform.OS,
    };

    // Add to history
    this.history.addNotification(historyItem);

    // Handle TCM-specific notifications
    if (content.data?.tcmSpecific) {
      this.handleTCMNotification(content.data);
    }

    // Log analytics event
    this.logNotificationEvent('received', {
      type: content.data?.type,
      category: content.data?.category,
      platform: Platform.OS
    });
  }

  /**
   * Handle notification response (user tapped notification)
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse): void {
    const { notification, actionIdentifier } = response;
    const notificationData = notification.request.content.data;
    const notificationId = notification.request.identifier;

    console.log(`[${this.context}] User tapped notification:`, {
      id: notificationId,
      actionIdentifier,
      type: notificationData?.type,
    });

    // Update history with click information
    this.history.markAsClicked(notificationId);

    // Route notification response based on type
    this.routeNotificationResponse(notificationData?.type, notificationData);

    // Log analytics event
    this.logNotificationEvent('clicked', {
      type: notificationData?.type,
      category: notificationData?.category,
      actionIdentifier,
      platform: Platform.OS
    });
  }

  /**
   * Route notification responses to appropriate handlers
   */
  private routeNotificationResponse(type: string, data: any): void {
    switch (type) {
      case 'medication_reminder':
        this.handleMedicationResponse(data);
        break;
      case 'appointment_reminder':
        this.handleAppointmentResponse(data);
        break;
      case 'exercise_reminder':
        this.handleExerciseResponse(data);
        break;
      case 'health_alert':
        this.handleHealthAlertResponse(data);
        break;
      case 'seasonal_advice':
        this.handleSeasonalAdviceResponse(data);
        break;
      case 'constitution_tips':
        this.handleConstitutionTipsResponse(data);
        break;
      case 'dietary_advice':
        this.handleDietaryAdviceResponse(data);
        break;
      case 'sleep_hygiene':
        this.handleSleepHygieneResponse(data);
        break;
      case 'pulse_reminder':
        this.handlePulseReminderResponse(data);
        break;
      case 'tongue_examination':
        this.handleTongueExaminationResponse(data);
        break;
      default:
        this.handleGenericResponse(data);
    }
  }

  /**
   * Handle TCM-specific notification processing
   */
  private handleTCMNotification(data: any): void {
    console.log(`[${this.context}] Processing TCM notification:`, data.type);

    // Add TCM-specific processing logic here
    // For example: update TCM health metrics, trigger related actions, etc.
    
    if (data.constitution) {
      this.updateConstitutionMetrics(data.constitution);
    }

    if (data.season) {
      this.updateSeasonalRecommendations(data.season);
    }
  }

  /**
   * Cleanup listeners
   */
  public cleanup(): void {
    console.log(`[${this.context}] Cleaning up listeners...`);

    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }

    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }

    console.log(`[${this.context}] Listeners cleanup complete`);
  }

  // Response handlers for different notification types

  private handleMedicationResponse(data: any): void {
    console.log(`[${this.context}] Handling medication reminder response:`, data);
    // Navigate to medication tracking screen or mark as taken
    // Implementation depends on app navigation structure
  }

  private handleAppointmentResponse(data: any): void {
    console.log(`[${this.context}] Handling appointment reminder response:`, data);
    // Navigate to appointment details or calendar
  }

  private handleExerciseResponse(data: any): void {
    console.log(`[${this.context}] Handling exercise reminder response:`, data);
    // Navigate to exercise/Qi exercise screen
  }

  private handleHealthAlertResponse(data: any): void {
    console.log(`[${this.context}] Handling health alert response:`, data);
    // Navigate to health alerts or emergency information
  }

  private handleSeasonalAdviceResponse(data: any): void {
    console.log(`[${this.context}] Handling seasonal advice response:`, data);
    // Navigate to seasonal health recommendations
  }

  private handleConstitutionTipsResponse(data: any): void {
    console.log(`[${this.context}] Handling constitution tips response:`, data);
    // Navigate to constitution-specific recommendations
  }

  private handleDietaryAdviceResponse(data: any): void {
    console.log(`[${this.context}] Handling dietary advice response:`, data);
    // Navigate to meal planner or dietary recommendations
  }

  private handleSleepHygieneResponse(data: any): void {
    console.log(`[${this.context}] Handling sleep hygiene response:`, data);
    // Navigate to sleep tracking or recommendations
  }

  private handlePulseReminderResponse(data: any): void {
    console.log(`[${this.context}] Handling pulse reminder response:`, data);
    // Navigate to pulse assessment screen
  }

  private handleTongueExaminationResponse(data: any): void {
    console.log(`[${this.context}] Handling tongue examination response:`, data);
    // Navigate to tongue examination screen
  }

  private handleGenericResponse(data: any): void {
    console.log(`[${this.context}] Handling generic notification response:`, data);
    // Default handling for unknown notification types
  }

  // Helper methods

  private updateConstitutionMetrics(constitution: string): void {
    // Update user's constitution-related metrics
    console.log(`[${this.context}] Updating constitution metrics for:`, constitution);
  }

  private updateSeasonalRecommendations(season: string): void {
    // Update seasonal health recommendations
    console.log(`[${this.context}] Updating seasonal recommendations for:`, season);
  }

  private logNotificationEvent(event: string, data: any): void {
    // Log analytics event for notification interactions
    console.log(`[${this.context}] Analytics event:`, event, data);
    
    // Here you would typically send to analytics service
    // Example: Analytics.track('notification_' + event, data);
  }
}