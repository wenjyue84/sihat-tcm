/**
 * Enhanced Touch Interface - Refactored Version
 * 
 * Main export file for enhanced touch and gesture components
 */

import React from 'react';

// Core components
export { SwipeGestureHandler } from './gestures/SwipeGestureHandler';
export { HapticTouchButton } from './buttons/HapticTouchButton';
export { GestureIndicator } from './indicators/GestureIndicator';

// Core utilities
export { HapticManager } from './core/HapticManager';

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

// Legacy compatibility - maintain backward compatibility
export const EnhancedTouchInterface = {
  SwipeGestureHandler,
  HapticTouchButton,
  GestureIndicator,
  HapticManager: HapticManager.getInstance(),
};

export default EnhancedTouchInterface;