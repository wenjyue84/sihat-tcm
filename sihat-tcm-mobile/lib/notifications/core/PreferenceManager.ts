/**
 * Notification preferences management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationPreferences } from '../interfaces/NotificationInterfaces';

export class PreferenceManager {
  private readonly context = 'PreferenceManager';
  private userPreferences: NotificationPreferences;

  constructor() {
    this.userPreferences = this.getDefaultPreferences();
  }

  /**
   * Get current preferences
   */
  public getPreferences(): NotificationPreferences {
    return { ...this.userPreferences };
  }

  /**
   * Update preferences with validation
   */
  public async updatePreferences(newPreferences: Partial<NotificationPreferences>): Promise<boolean> {
    try {
      // Validate preferences
      const validatedPreferences = this.validatePreferences(newPreferences);
      
      this.userPreferences = {
        ...this.userPreferences,
        ...validatedPreferences,
      };
      
      // Save to local storage
      await this.saveToStorage();
      
      console.log(`[${this.context}] Preferences updated successfully`);
      return true;
    } catch (error) {
      console.error(`[${this.context}] Failed to update preferences:`, error);
      return false;
    }
  }

  /**
   * Load preferences from storage
   */
  public async loadFromStorage(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('notificationPreferences');
      if (stored) {
        const storedPreferences = JSON.parse(stored);
        this.userPreferences = {
          ...this.userPreferences,
          ...storedPreferences,
        };
        console.log(`[${this.context}] Preferences loaded from storage`);
      }
    } catch (error) {
      console.error(`[${this.context}] Failed to load preferences:`, error);
    }
  }

  /**
   * Save preferences to storage
   */
  public async saveToStorage(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        'notificationPreferences', 
        JSON.stringify(this.userPreferences)
      );
    } catch (error) {
      console.error(`[${this.context}] Failed to save preferences:`, error);
      throw error;
    }
  }

  /**
   * Reset to default preferences
   */
  public async resetToDefaults(): Promise<void> {
    try {
      this.userPreferences = this.getDefaultPreferences();
      await this.saveToStorage();
      console.log(`[${this.context}] Preferences reset to defaults`);
    } catch (error) {
      console.error(`[${this.context}] Failed to reset preferences:`, error);
      throw error;
    }
  }

  /**
   * Check if category is enabled
   */
  public isCategoryEnabled(category: keyof NotificationPreferences['categories']): boolean {
    return this.userPreferences.enabled && this.userPreferences.categories[category];
  }

  /**
   * Check if notifications are enabled
   */
  public areNotificationsEnabled(): boolean {
    return this.userPreferences.enabled;
  }

  /**
   * Get quiet hours configuration
   */
  public getQuietHours(): NotificationPreferences['quietHours'] {
    return { ...this.userPreferences.quietHours };
  }

  /**
   * Update specific category
   */
  public async updateCategory(
    category: keyof NotificationPreferences['categories'], 
    enabled: boolean
  ): Promise<void> {
    this.userPreferences.categories[category] = enabled;
    await this.saveToStorage();
  }

  /**
   * Update quiet hours
   */
  public async updateQuietHours(quietHours: Partial<NotificationPreferences['quietHours']>): Promise<void> {
    this.userPreferences.quietHours = {
      ...this.userPreferences.quietHours,
      ...quietHours,
    };
    await this.saveToStorage();
  }

  // Private helper methods

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
      },
    };
  }

  private validatePreferences(preferences: Partial<NotificationPreferences>): Partial<NotificationPreferences> {
    const validated: Partial<NotificationPreferences> = {};

    // Validate boolean fields
    if (typeof preferences.enabled === 'boolean') {
      validated.enabled = preferences.enabled;
    }

    if (typeof preferences.healthReminders === 'boolean') {
      validated.healthReminders = preferences.healthReminders;
    }

    if (typeof preferences.medicationAlerts === 'boolean') {
      validated.medicationAlerts = preferences.medicationAlerts;
    }

    if (typeof preferences.appointmentReminders === 'boolean') {
      validated.appointmentReminders = preferences.appointmentReminders;
    }

    if (typeof preferences.exerciseReminders === 'boolean') {
      validated.exerciseReminders = preferences.exerciseReminders;
    }

    if (typeof preferences.sleepReminders === 'boolean') {
      validated.sleepReminders = preferences.sleepReminders;
    }

    // Validate quiet hours
    if (preferences.quietHours) {
      validated.quietHours = {};
      
      if (typeof preferences.quietHours.enabled === 'boolean') {
        validated.quietHours.enabled = preferences.quietHours.enabled;
      }

      if (typeof preferences.quietHours.start === 'string' && this.isValidTime(preferences.quietHours.start)) {
        validated.quietHours.start = preferences.quietHours.start;
      }

      if (typeof preferences.quietHours.end === 'string' && this.isValidTime(preferences.quietHours.end)) {
        validated.quietHours.end = preferences.quietHours.end;
      }
    }

    // Validate categories
    if (preferences.categories) {
      validated.categories = {};
      const validCategories = ['health', 'medication', 'exercise', 'diet', 'sleep', 'appointments'];
      
      for (const category of validCategories) {
        if (typeof preferences.categories[category as keyof typeof preferences.categories] === 'boolean') {
          validated.categories[category as keyof typeof validated.categories] = 
            preferences.categories[category as keyof typeof preferences.categories];
        }
      }
    }

    // Validate frequency
    if (preferences.frequency) {
      validated.frequency = {};
      
      if (typeof preferences.frequency.daily === 'boolean') {
        validated.frequency.daily = preferences.frequency.daily;
      }

      if (typeof preferences.frequency.weekly === 'boolean') {
        validated.frequency.weekly = preferences.frequency.weekly;
      }

      if (typeof preferences.frequency.monthly === 'boolean') {
        validated.frequency.monthly = preferences.frequency.monthly;
      }
    }

    return validated;
  }

  private isValidTime(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }
}