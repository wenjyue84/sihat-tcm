/**
 * Notification Preference Manager - Strategy Pattern Implementation
 * 
 * Handles all notification preference management with validation,
 * persistence, and synchronization capabilities.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  PreferenceManager,
  NotificationPreferences,
  NotificationCategory,
} from './NotificationInterfaces';

import { NOTIFICATION_CONFIG } from '../../constants';
import { AppError, NotificationError, ErrorFactory } from '../errors/AppError';

/**
 * Enhanced Preference Manager
 * 
 * Manages notification preferences with comprehensive validation,
 * smart defaults, and conflict resolution.
 */
export class NotificationPreferenceManager implements PreferenceManager {
  private preferences: NotificationPreferences;
  private readonly storageKey = 'notificationPreferences';
  private readonly context: string;

  constructor(context: string = 'PreferenceManager') {
    this.context = context;
    this.preferences = this.getDefaultPreferences();
  }

  /**
   * Get current notification preferences
   */
  public async getPreferences(): Promise<NotificationPreferences> {
    try {
      await this.loadPreferences();
      return { ...this.preferences }; // Return copy
    } catch (error) {
      console.error(`[${this.context}] Failed to get preferences:`, error);
      return this.getDefaultPreferences();
    }
  }

  /**
   * Update notification preferences with validation
   */
  public async updatePreferences(updates: Partial<NotificationPreferences>): Promise<boolean> {
    try {
      // Create updated preferences
      const updatedPreferences = {
        ...this.preferences,
        ...updates,
      };

      // Validate the updated preferences
      const validation = this.validatePreferences(updatedPreferences);
      if (!validation.valid) {
        throw new NotificationError(
          `Invalid preferences: ${validation.errors.join(', ')}`,
          {
            component: this.context,
            action: 'updatePreferences',
            metadata: { errors: validation.errors, updates },
          }
        );
      }

      // Apply smart defaults and corrections
      const correctedPreferences = this.applySmartDefaults(updatedPreferences);

      // Save preferences
      this.preferences = correctedPreferences;
      await this.savePreferences();

      console.log(`[${this.context}] Preferences updated successfully`);
      
      // Log warnings if any
      if (validation.warnings.length > 0) {
        console.warn(`[${this.context}] Preference warnings:`, validation.warnings);
      }

      return true;

    } catch (error) {
      console.error(`[${this.context}] Failed to update preferences:`, error);
      return false;
    }
  }

  /**
   * Validate notification preferences
   */
  public validatePreferences(preferences: NotificationPreferences): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate quiet hours
    if (preferences.quietHours.enabled) {
      const { start, end } = preferences.quietHours;
      
      if (!this.isValidTimeFormat(start)) {
        errors.push('Invalid quiet hours start time format (expected HH:MM)');
      }
      
      if (!this.isValidTimeFormat(end)) {
        errors.push('Invalid quiet hours end time format (expected HH:MM)');
      }

      // Check for reasonable quiet hours duration
      if (this.isValidTimeFormat(start) && this.isValidTimeFormat(end)) {
        const duration = this.calculateQuietHoursDuration(start, end);
        if (duration < 4) {
          warnings.push('Quiet hours duration is less than 4 hours');
        } else if (duration > 12) {
          warnings.push('Quiet hours duration is more than 12 hours');
        }
      }
    }

    // Validate categories
    const requiredCategories: NotificationCategory[] = [
      'health', 'medication', 'exercise', 'diet', 'sleep', 'appointments'
    ];
    
    for (const category of requiredCategories) {
      if (!(category in preferences.categories)) {
        errors.push(`Missing category preference: ${category}`);
      }
    }

    // Check for conflicting settings
    if (!preferences.enabled && Object.values(preferences.categories).some(enabled => enabled)) {
      warnings.push('Some categories are enabled while notifications are globally disabled');
    }

    if (!preferences.healthReminders && preferences.categories.health) {
      warnings.push('Health category is enabled but health reminders are disabled');
    }

    if (!preferences.medicationAlerts && preferences.categories.medication) {
      warnings.push('Medication category is enabled but medication alerts are disabled');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Reset preferences to defaults
   */
  public async resetToDefaults(): Promise<boolean> {
    try {
      this.preferences = this.getDefaultPreferences();
      await this.savePreferences();
      
      console.log(`[${this.context}] Preferences reset to defaults`);
      return true;

    } catch (error) {
      console.error(`[${this.context}] Failed to reset preferences:`, error);
      return false;
    }
  }

  /**
   * Get preference summary for display
   */
  public getPreferenceSummary(): {
    enabled: boolean;
    enabledCategories: string[];
    quietHoursEnabled: boolean;
    quietHoursRange?: string;
    totalEnabledFeatures: number;
  } {
    const enabledCategories = Object.entries(this.preferences.categories)
      .filter(([_, enabled]) => enabled)
      .map(([category, _]) => category);

    const totalEnabledFeatures = [
      this.preferences.healthReminders,
      this.preferences.medicationAlerts,
      this.preferences.appointmentReminders,
      this.preferences.exerciseReminders,
      this.preferences.sleepReminders,
    ].filter(Boolean).length;

    const summary: any = {
      enabled: this.preferences.enabled,
      enabledCategories,
      quietHoursEnabled: this.preferences.quietHours.enabled,
      totalEnabledFeatures,
    };

    if (this.preferences.quietHours.enabled) {
      summary.quietHoursRange = `${this.preferences.quietHours.start} - ${this.preferences.quietHours.end}`;
    }

    return summary;
  }

  /**
   * Check if a specific notification should be allowed based on preferences
   */
  public shouldAllowNotification(
    category: NotificationCategory,
    priority: string,
    currentTime?: Date
  ): {
    allowed: boolean;
    reason?: string;
  } {
    // Check if notifications are globally enabled
    if (!this.preferences.enabled) {
      return { allowed: false, reason: 'Notifications globally disabled' };
    }

    // Check category preference
    if (!this.preferences.categories[category]) {
      return { allowed: false, reason: `Category '${category}' disabled` };
    }

    // Check specific feature flags
    switch (category) {
      case 'health':
        if (!this.preferences.healthReminders) {
          return { allowed: false, reason: 'Health reminders disabled' };
        }
        break;
      case 'medication':
        if (!this.preferences.medicationAlerts) {
          return { allowed: false, reason: 'Medication alerts disabled' };
        }
        break;
      case 'appointments':
        if (!this.preferences.appointmentReminders) {
          return { allowed: false, reason: 'Appointment reminders disabled' };
        }
        break;
      case 'exercise':
        if (!this.preferences.exerciseReminders) {
          return { allowed: false, reason: 'Exercise reminders disabled' };
        }
        break;
      case 'sleep':
        if (!this.preferences.sleepReminders) {
          return { allowed: false, reason: 'Sleep reminders disabled' };
        }
        break;
    }

    // Check quiet hours (unless it's urgent)
    if (priority !== 'urgent' && this.isInQuietHours(currentTime)) {
      return { allowed: false, reason: 'Currently in quiet hours' };
    }

    return { allowed: true };
  }

  /**
   * Export preferences for backup or sync
   */
  public exportPreferences(): string {
    return JSON.stringify({
      preferences: this.preferences,
      exportedAt: new Date().toISOString(),
      version: '1.0',
    });
  }

  /**
   * Import preferences from backup or sync
   */
  public async importPreferences(data: string): Promise<boolean> {
    try {
      const imported = JSON.parse(data);
      
      if (!imported.preferences) {
        throw new Error('Invalid import data: missing preferences');
      }

      const validation = this.validatePreferences(imported.preferences);
      if (!validation.valid) {
        throw new Error(`Invalid preferences: ${validation.errors.join(', ')}`);
      }

      await this.updatePreferences(imported.preferences);
      console.log(`[${this.context}] Preferences imported successfully`);
      return true;

    } catch (error) {
      console.error(`[${this.context}] Failed to import preferences:`, error);
      return false;
    }
  }

  // Private helper methods

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

  /**
   * Load preferences from storage
   */
  private async loadPreferences(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Merge with defaults to handle new preference fields
        this.preferences = {
          ...this.getDefaultPreferences(),
          ...parsed,
          categories: {
            ...this.getDefaultPreferences().categories,
            ...parsed.categories,
          },
        };
      }
    } catch (error) {
      console.error(`[${this.context}] Failed to load preferences:`, error);
      this.preferences = this.getDefaultPreferences();
    }
  }

  /**
   * Save preferences to storage
   */
  private async savePreferences(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.storageKey, JSON.stringify(this.preferences));
    } catch (error) {
      console.error(`[${this.context}] Failed to save preferences:`, error);
      throw error;
    }
  }

  /**
   * Apply smart defaults and corrections
   */
  private applySmartDefaults(preferences: NotificationPreferences): NotificationPreferences {
    const corrected = { ...preferences };

    // If notifications are disabled, disable all categories
    if (!corrected.enabled) {
      Object.keys(corrected.categories).forEach(category => {
        corrected.categories[category as NotificationCategory] = false;
      });
    }

    // If medication alerts are enabled, ensure medication category is enabled
    if (corrected.medicationAlerts && !corrected.categories.medication) {
      corrected.categories.medication = true;
    }

    // If health reminders are enabled, ensure health category is enabled
    if (corrected.healthReminders && !corrected.categories.health) {
      corrected.categories.health = true;
    }

    return corrected;
  }

  /**
   * Validate time format (HH:MM)
   */
  private isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  /**
   * Calculate quiet hours duration in hours
   */
  private calculateQuietHoursDuration(start: string, end: string): number {
    const [startHour, startMin] = start.split(':').map(Number);
    const [endHour, endMin] = end.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;
    
    // Handle overnight quiet hours
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60; // Add 24 hours
    }
    
    return (endMinutes - startMinutes) / 60;
  }

  /**
   * Check if current time is in quiet hours
   */
  private isInQuietHours(currentTime?: Date): boolean {
    if (!this.preferences.quietHours.enabled) {
      return false;
    }

    const now = currentTime || new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentMinutes = currentHour * 60 + currentMinute;

    const [startHour, startMin] = this.preferences.quietHours.start.split(':').map(Number);
    const [endHour, endMin] = this.preferences.quietHours.end.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    // Handle overnight quiet hours
    if (startMinutes > endMinutes) {
      return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
    } else {
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    }
  }
}

/**
 * Factory function for creating preference manager
 */
export function createPreferenceManager(context?: string): PreferenceManager {
  return new NotificationPreferenceManager(context);
}