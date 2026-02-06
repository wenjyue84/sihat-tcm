/**
 * Preference Manager
 * Handles notification preferences and quiet hours logic
 */

import { NotificationPreferences } from "../interfaces/WebNotificationInterfaces";

export class PreferenceManager {
  private preferences: NotificationPreferences;
  private readonly STORAGE_KEY = "webNotificationPreferences";

  constructor() {
    this.preferences = this.getDefaultPreferences();
  }

  /**
   * Get default notification preferences
   */
  private getDefaultPreferences(): NotificationPreferences {
    return {
      enabled: true,
      healthReminders: true,
      medicationAlerts: true,
      appointmentReminders: true,
      exerciseReminders: true,
      sleepReminders: true,
      quietHours: {
        enabled: true,
        start: "22:00",
        end: "07:00",
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
      },
    };
  }

  /**
   * Load preferences from localStorage
   */
  async loadPreferences(): Promise<void> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.preferences = {
          ...this.preferences,
          ...JSON.parse(stored),
        };
      }

      // Also load from server
      await this.loadPreferencesFromServer();
    } catch (error) {
      console.error("[PreferenceManager] Failed to load preferences:", error);
    }
  }

  /**
   * Update preferences
   */
  async updatePreferences(newPreferences: Partial<NotificationPreferences>): Promise<boolean> {
    try {
      this.preferences = {
        ...this.preferences,
        ...newPreferences,
      };

      // Save to localStorage
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.preferences));

      // Sync with server
      await this.syncPreferencesWithServer();

      console.log("[PreferenceManager] Preferences updated");
      return true;
    } catch (error) {
      console.error("[PreferenceManager] Failed to update preferences:", error);
      return false;
    }
  }

  /**
   * Get current preferences
   */
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  /**
   * Check if notifications are enabled
   */
  areNotificationsEnabled(): boolean {
    return this.preferences.enabled;
  }

  /**
   * Check if currently in quiet hours
   */
  isInQuietHours(): boolean {
    if (!this.preferences.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    const startTime = this.parseTime(this.preferences.quietHours.start);
    const endTime = this.parseTime(this.preferences.quietHours.end);

    if (startTime > endTime) {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime < endTime;
    } else {
      return currentTime >= startTime && currentTime < endTime;
    }
  }

  /**
   * Check if category is enabled
   */
  isCategoryEnabled(category: keyof NotificationPreferences["categories"]): boolean {
    return this.preferences.categories[category];
  }

  /**
   * Parse time string to minutes
   */
  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(":").map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Convert server preferences format
   */
  convertServerPreferences(serverPrefs: any): NotificationPreferences {
    return {
      enabled: serverPrefs.enabled,
      healthReminders: serverPrefs.health_reminders,
      medicationAlerts: serverPrefs.medication_alerts,
      appointmentReminders: serverPrefs.appointment_reminders,
      exerciseReminders: serverPrefs.exercise_reminders,
      sleepReminders: serverPrefs.sleep_reminders,
      quietHours: {
        enabled: serverPrefs.quiet_hours_enabled,
        start: serverPrefs.quiet_hours_start?.substring(0, 5) || "22:00",
        end: serverPrefs.quiet_hours_end?.substring(0, 5) || "07:00",
      },
      frequency: {
        daily: serverPrefs.frequency_daily,
        weekly: serverPrefs.frequency_weekly,
        monthly: serverPrefs.frequency_monthly,
      },
      categories: serverPrefs.categories || {
        health: true,
        medication: true,
        exercise: true,
        diet: true,
        sleep: true,
        appointments: true,
      },
    };
  }

  /**
   * Sync preferences with server
   */
  private async syncPreferencesWithServer(): Promise<void> {
    try {
      const serverPrefs = {
        enabled: this.preferences.enabled,
        health_reminders: this.preferences.healthReminders,
        medication_alerts: this.preferences.medicationAlerts,
        appointment_reminders: this.preferences.appointmentReminders,
        exercise_reminders: this.preferences.exerciseReminders,
        sleep_reminders: this.preferences.sleepReminders,
        quiet_hours_enabled: this.preferences.quietHours.enabled,
        quiet_hours_start: this.preferences.quietHours.start + ":00",
        quiet_hours_end: this.preferences.quietHours.end + ":00",
        frequency_daily: this.preferences.frequency.daily,
        frequency_weekly: this.preferences.frequency.weekly,
        frequency_monthly: this.preferences.frequency.monthly,
        categories: this.preferences.categories,
      };

      await fetch("/api/notifications/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(serverPrefs),
      });
    } catch (error) {
      console.error("[PreferenceManager] Failed to sync preferences with server:", error);
    }
  }

  /**
   * Load preferences from server
   */
  private async loadPreferencesFromServer(): Promise<void> {
    try {
      const response = await fetch("/api/notifications/preferences");
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.preferences) {
          const serverPrefs = this.convertServerPreferences(result.preferences);
          this.preferences = serverPrefs;
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.preferences));
        }
      }
    } catch (error) {
      console.error("[PreferenceManager] Failed to load preferences from server:", error);
    }
  }
}
