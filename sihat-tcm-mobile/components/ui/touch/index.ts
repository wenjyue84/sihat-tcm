/**
 * Enhanced Touch Interface Module Exports
 * 
 * Centralized exports for the enhanced touch interface system
 */

// Core components
export { default as HapticTouchButton } from './buttons/HapticTouchButton';
export { default as SwipeGestureHandler } from './gestures/SwipeGestureHandler';
export { default as GestureIndicator } from './indicators/GestureIndicator';

// Core managers
export { default as HapticManager } from './core/HapticManager';

// Interfaces
export type {
  SwipeGestureConfig,
  SwipeGestureCallbacks,
  SwipeGestureProps,
  HapticTouchConfig,
  HapticTouchProps,
  GestureIndicatorProps,
  TouchFeedbackConfig,
  GestureState,
  TouchMetrics,
  HapticImpactStyle,
  GestureType,
  SwipeDirection,
} from './interfaces/TouchInterfaces';

// Legacy exports for backward compatibility
export { HapticTouchButton } from './buttons/HapticTouchButton';
export { SwipeGestureHandler } from './gestures/SwipeGestureHandler';
export { GestureIndicator } from './indicators/GestureIndicator';