/**
 * Haptic Manager
 * 
 * Centralized haptic feedback management with intelligent patterns
 */

import * as Haptics from 'expo-haptics';
import { HapticFeedbackType, TouchEventType } from '../interfaces/TouchInterfaces';

export class HapticManager {
  private static instance: HapticManager;
  private isEnabled = true;
  private lastHapticTime = 0;
  private hapticThrottleMs = 50; // Minimum time between haptics

  private constructor() {}

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
   * Trigger haptic feedback with throttling
   */
  async triggerHaptic(type: HapticFeedbackType): Promise<void> {
    if (!this.isEnabled) return;

    const now = Date.now();
    if (now - this.lastHapticTime < this.hapticThrottleMs) {
      return; // Throttle rapid haptic calls
    }

    this.lastHapticTime = now;

    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
        default:
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (error) {
      console.warn('[HapticManager] Haptic feedback failed:', error);
    }
  }

  /**
   * Trigger contextual haptic for touch events
   */
  async triggerContextualHaptic(eventType: TouchEventType): Promise<void> {
    const hapticMap: Record<TouchEventType, HapticFeedbackType> = {
      press: 'light',
      longPress: 'heavy',
      swipe: 'medium',
      pinch: 'light',
      rotate: 'light',
      tap: 'light',
    };

    const hapticType = hapticMap[eventType] || 'medium';
    await this.triggerHaptic(hapticType);
  }

  /**
   * Enable/disable haptic feedback
   */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  /**
   * Check if haptics are enabled
   */
  isHapticEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Set haptic throttle time
   */
  setThrottleTime(ms: number): void {
    this.hapticThrottleMs = Math.max(0, ms);
  }

  /**
   * Create haptic pattern for complex interactions
   */
  async triggerPattern(pattern: HapticFeedbackType[], intervals: number[]): Promise<void> {
    if (!this.isEnabled || pattern.length !== intervals.length) return;

    for (let i = 0; i < pattern.length; i++) {
      await this.triggerHaptic(pattern[i]);
      if (i < intervals.length - 1) {
        await new Promise(resolve => setTimeout(resolve, intervals[i]));
      }
    }
  }

  /**
   * Trigger success pattern
   */
  async triggerSuccessPattern(): Promise<void> {
    await this.triggerPattern(['light', 'medium', 'success'], [100, 100]);
  }

  /**
   * Trigger error pattern
   */
  async triggerErrorPattern(): Promise<void> {
    await this.triggerPattern(['heavy', 'error'], [150]);
  }
}