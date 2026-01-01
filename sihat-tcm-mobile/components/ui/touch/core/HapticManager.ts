/**
 * Haptic Manager
 * 
 * Centralized haptic feedback management for touch interactions
 */

import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

import {
  HapticImpactStyle,
  TouchFeedbackConfig,
  TouchMetrics,
} from '../interfaces/TouchInterfaces';

import { HAPTIC_CONFIG } from '../../../../constants';
import { ErrorFactory } from '../../../../lib/errors/AppError';

export class HapticManager {
  private static instance: HapticManager;
  private isEnabled = true;
  private feedbackConfig: TouchFeedbackConfig;

  private constructor() {
    this.feedbackConfig = {
      hapticEnabled: true,
      visualEnabled: true,
      audioEnabled: false,
      intensity: 'medium',
    };
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): HapticManager {
    if (!HapticManager.instance) {
      HapticManager.instance = new HapticManager();
    }
    return HapticManager.instance;
  }

  /**
   * Initialize haptic manager
   */
  async initialize(): Promise<void> {
    try {
      // Check if haptics are supported
      if (Platform.OS === 'ios') {
        // iOS always supports haptics on modern devices
        this.isEnabled = true;
      } else if (Platform.OS === 'android') {
        // Android support varies by device
        this.isEnabled = true; // Assume supported, will handle errors gracefully
      } else {
        this.isEnabled = false;
      }
    } catch (error) {
      console.warn('[HapticManager] Initialization failed:', error);
      this.isEnabled = false;
    }
  }

  /**
   * Trigger impact haptic feedback
   */
  async impact(style: HapticImpactStyle = 'medium'): Promise<void> {
    try {
      if (!this.isEnabled || !this.feedbackConfig.hapticEnabled) {
        return;
      }

      const hapticStyle = this.getHapticStyle(style);
      await Haptics.impactAsync(hapticStyle);
    } catch (error) {
      console.warn('[HapticManager] Impact feedback failed:', error);
    }
  }

  /**
   * Trigger selection haptic feedback
   */
  async selection(): Promise<void> {
    try {
      if (!this.isEnabled || !this.feedbackConfig.hapticEnabled) {
        return;
      }

      await Haptics.selectionAsync();
    } catch (error) {
      console.warn('[HapticManager] Selection feedback failed:', error);
    }
  }

  /**
   * Trigger notification haptic feedback
   */
  async notification(type: 'success' | 'warning' | 'error' = 'success'): Promise<void> {
    try {
      if (!this.isEnabled || !this.feedbackConfig.hapticEnabled) {
        return;
      }

      const notificationType = this.getNotificationType(type);
      await Haptics.notificationAsync(notificationType);
    } catch (error) {
      console.warn('[HapticManager] Notification feedback failed:', error);
    }
  }

  /**
   * Trigger haptic feedback based on touch metrics
   */
  async feedbackForMetrics(metrics: TouchMetrics): Promise<void> {
    try {
      if (!this.isEnabled || !this.feedbackConfig.hapticEnabled) {
        return;
      }

      // Determine feedback intensity based on metrics
      let style: HapticImpactStyle = 'light';

      if (metrics.velocity > HAPTIC_CONFIG.HIGH_VELOCITY_THRESHOLD) {
        style = 'heavy';
      } else if (metrics.velocity > HAPTIC_CONFIG.MEDIUM_VELOCITY_THRESHOLD) {
        style = 'medium';
      }

      // Adjust for duration
      if (metrics.duration > HAPTIC_CONFIG.LONG_PRESS_DURATION) {
        style = 'heavy';
      }

      await this.impact(style);
    } catch (error) {
      console.warn('[HapticManager] Metrics-based feedback failed:', error);
    }
  }

  /**
   * Enable or disable haptic feedback
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Update feedback configuration
   */
  updateConfig(config: Partial<TouchFeedbackConfig>): void {
    this.feedbackConfig = { ...this.feedbackConfig, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): TouchFeedbackConfig {
    return { ...this.feedbackConfig };
  }

  /**
   * Check if haptics are supported and enabled
   */
  isHapticEnabled(): boolean {
    return this.isEnabled && this.feedbackConfig.hapticEnabled;
  }

  // Private helper methods

  /**
   * Convert style to Expo Haptics style
   */
  private getHapticStyle(style: HapticImpactStyle): Haptics.ImpactFeedbackStyle {
    switch (style) {
      case 'light':
        return Haptics.ImpactFeedbackStyle.Light;
      case 'medium':
        return Haptics.ImpactFeedbackStyle.Medium;
      case 'heavy':
        return Haptics.ImpactFeedbackStyle.Heavy;
      default:
        return Haptics.ImpactFeedbackStyle.Medium;
    }
  }

  /**
   * Convert notification type to Expo Haptics type
   */
  private getNotificationType(type: 'success' | 'warning' | 'error'): Haptics.NotificationFeedbackType {
    switch (type) {
      case 'success':
        return Haptics.NotificationFeedbackType.Success;
      case 'warning':
        return Haptics.NotificationFeedbackType.Warning;
      case 'error':
        return Haptics.NotificationFeedbackType.Error;
      default:
        return Haptics.NotificationFeedbackType.Success;
    }
  }
}

// Export singleton instance
export default HapticManager.getInstance();