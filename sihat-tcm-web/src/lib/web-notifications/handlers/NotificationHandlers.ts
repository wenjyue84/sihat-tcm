/**
 * Notification Handlers
 * Handles different types of notification interactions and routing
 */

export class NotificationHandlers {
  /**
   * Handle notification click events
   */
  handleNotificationClick(notificationData: any): void {
    console.log("[NotificationHandlers] Notification clicked:", notificationData);

    // Handle different notification types
    switch (notificationData.type) {
      case "medication":
        this.handleMedicationNotification(notificationData);
        break;
      case "appointment":
        this.handleAppointmentNotification(notificationData);
        break;
      case "exercise":
        this.handleExerciseNotification(notificationData);
        break;
      case "health_alert":
        this.handleHealthAlertNotification(notificationData);
        break;
      case "diet":
        this.handleDietNotification(notificationData);
        break;
      case "sleep":
        this.handleSleepNotification(notificationData);
        break;
      default:
        this.handleGenericNotification(notificationData);
    }
  }

  /**
   * Handle medication reminder notifications
   */
  private handleMedicationNotification(data: any): void {
    console.log("[NotificationHandlers] Handling medication notification:", data);
    
    // Navigate to medication tracking
    this.navigateToRoute("/dashboard/medications", {
      medicationId: data.medicationId,
      reminder: true,
    });
  }

  /**
   * Handle appointment reminder notifications
   */
  private handleAppointmentNotification(data: any): void {
    console.log("[NotificationHandlers] Handling appointment notification:", data);
    
    // Navigate to appointment details
    this.navigateToRoute("/dashboard/appointments", {
      appointmentId: data.appointmentId,
      reminder: true,
    });
  }

  /**
   * Handle exercise reminder notifications
   */
  private handleExerciseNotification(data: any): void {
    console.log("[NotificationHandlers] Handling exercise notification:", data);
    
    // Navigate to exercise screen
    this.navigateToRoute("/dashboard/exercise", {
      exerciseType: data.exerciseType,
      reminder: true,
    });
  }

  /**
   * Handle health alert notifications
   */
  private handleHealthAlertNotification(data: any): void {
    console.log("[NotificationHandlers] Handling health alert notification:", data);
    
    // Navigate to health alerts with high priority
    this.navigateToRoute("/dashboard/health-alerts", {
      alertId: data.alertId,
      priority: data.priority || "high",
    });
  }

  /**
   * Handle diet reminder notifications
   */
  private handleDietNotification(data: any): void {
    console.log("[NotificationHandlers] Handling diet notification:", data);
    
    // Navigate to meal planner or diet tracking
    this.navigateToRoute("/dashboard/meal-planner", {
      mealType: data.mealType,
      reminder: true,
    });
  }

  /**
   * Handle sleep reminder notifications
   */
  private handleSleepNotification(data: any): void {
    console.log("[NotificationHandlers] Handling sleep notification:", data);
    
    // Navigate to sleep tracking
    this.navigateToRoute("/dashboard/sleep", {
      reminder: true,
      sleepGoal: data.sleepGoal,
    });
  }

  /**
   * Handle generic notifications
   */
  private handleGenericNotification(data: any): void {
    console.log("[NotificationHandlers] Handling generic notification:", data);
    
    // Navigate to dashboard or specific route if provided
    const route = data.route || "/dashboard";
    this.navigateToRoute(route, data.params || {});
  }

  /**
   * Navigate to a specific route with parameters
   */
  private navigateToRoute(route: string, params: Record<string, any> = {}): void {
    try {
      // Create URL with parameters
      const url = new URL(route, window.location.origin);
      
      // Add parameters as search params
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, String(value));
      });

      // Navigate to the route
      if (typeof window !== "undefined") {
        window.location.href = url.toString();
      }
    } catch (error) {
      console.error("[NotificationHandlers] Navigation failed:", error);
      
      // Fallback to simple navigation
      if (typeof window !== "undefined") {
        window.location.href = route;
      }
    }
  }

  /**
   * Setup service worker message listeners
   */
  setupServiceWorkerListeners(): void {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        if (event.data && event.data.type === "NOTIFICATION_CLICK") {
          this.handleNotificationClick(event.data.notification);
        }
      });
    }
  }

  /**
   * Setup visibility change listeners for sync
   */
  setupVisibilityListeners(syncCallback: () => void): void {
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        syncCallback();
      }
    });
  }

  /**
   * Create notification action buttons
   */
  createNotificationActions(type: string): NotificationAction[] {
    const actions: NotificationAction[] = [];

    switch (type) {
      case "medication":
        actions.push(
          { action: "taken", title: "Mark as Taken", icon: "/icons/check.png" },
          { action: "snooze", title: "Remind Later", icon: "/icons/snooze.png" }
        );
        break;
      
      case "appointment":
        actions.push(
          { action: "confirm", title: "Confirm", icon: "/icons/check.png" },
          { action: "reschedule", title: "Reschedule", icon: "/icons/calendar.png" }
        );
        break;
      
      case "exercise":
        actions.push(
          { action: "start", title: "Start Exercise", icon: "/icons/play.png" },
          { action: "skip", title: "Skip Today", icon: "/icons/skip.png" }
        );
        break;
      
      default:
        actions.push(
          { action: "view", title: "View", icon: "/icons/view.png" },
          { action: "dismiss", title: "Dismiss", icon: "/icons/close.png" }
        );
    }

    return actions;
  }

  /**
   * Handle notification action clicks
   */
  handleNotificationAction(action: string, notificationData: any): void {
    console.log("[NotificationHandlers] Action clicked:", action, notificationData);

    switch (action) {
      case "taken":
        this.handleMedicationTaken(notificationData);
        break;
      case "snooze":
        this.handleSnoozeReminder(notificationData);
        break;
      case "confirm":
        this.handleAppointmentConfirm(notificationData);
        break;
      case "reschedule":
        this.handleAppointmentReschedule(notificationData);
        break;
      case "start":
        this.handleExerciseStart(notificationData);
        break;
      case "skip":
        this.handleExerciseSkip(notificationData);
        break;
      default:
        this.handleNotificationClick(notificationData);
    }
  }

  /**
   * Handle medication taken action
   */
  private handleMedicationTaken(data: any): void {
    // API call to mark medication as taken
    fetch("/api/medications/taken", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        medicationId: data.medicationId,
        takenAt: new Date().toISOString(),
      }),
    }).catch(error => {
      console.error("[NotificationHandlers] Failed to mark medication as taken:", error);
    });
  }

  /**
   * Handle snooze reminder action
   */
  private handleSnoozeReminder(data: any): void {
    // Schedule a new reminder in 15 minutes
    const snoozeTime = new Date(Date.now() + 15 * 60 * 1000);
    
    // This would integrate with the notification scheduler
    console.log("[NotificationHandlers] Snoozing reminder until:", snoozeTime);
  }

  /**
   * Handle appointment confirmation
   */
  private handleAppointmentConfirm(data: any): void {
    fetch("/api/appointments/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        appointmentId: data.appointmentId,
        confirmedAt: new Date().toISOString(),
      }),
    }).catch(error => {
      console.error("[NotificationHandlers] Failed to confirm appointment:", error);
    });
  }

  /**
   * Handle appointment rescheduling
   */
  private handleAppointmentReschedule(data: any): void {
    this.navigateToRoute("/dashboard/appointments/reschedule", {
      appointmentId: data.appointmentId,
    });
  }

  /**
   * Handle exercise start
   */
  private handleExerciseStart(data: any): void {
    this.navigateToRoute("/dashboard/exercise/session", {
      exerciseType: data.exerciseType,
      autoStart: true,
    });
  }

  /**
   * Handle exercise skip
   */
  private handleExerciseSkip(data: any): void {
    fetch("/api/exercise/skip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exerciseType: data.exerciseType,
        skippedAt: new Date().toISOString(),
        reason: "user_skip",
      }),
    }).catch(error => {
      console.error("[NotificationHandlers] Failed to skip exercise:", error);
    });
  }
}