/**
 * Touch Module Exports
 * 
 * Centralized exports for the enhanced touch interface system
 */

// Main components
export { SwipeGestureHandler } from './gestures/SwipeGestureHandler';
export { HapticTouchButton } from './buttons/HapticTouchButton';
export { GestureIndicator } from './indicators/GestureIndicator';

// Core utilities
export { HapticManager } from './core/HapticManager';

// Main interface (backward compatibility)
export { default as EnhancedTouchInterface } from './EnhancedTouchInterface';

// Interfaces
export type {
  SwipeGestureConfig,
  SwipeCallbacks,
  SwipeGestureHandlerProps,
  HapticConfig,
  HapticTouchButtonProps,
  GestureIndicatorProps,
  TouchFeedbackConfig,
  GestureState,
  TouchMetrics,
  HapticFeedbackType,
  GestureDirection,
  TouchEventType,
} from './interfaces/TouchInterfaces';