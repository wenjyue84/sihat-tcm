/**
 * Touch Interface Types
 * 
 * Type definitions for enhanced touch and gesture components
 */

import { ReactNode } from 'react';
import { ViewStyle, TouchableOpacityProps } from 'react-native';

export interface SwipeGestureConfig {
  swipeThreshold: number;
  velocityThreshold: number;
  enabled: boolean;
}

export interface SwipeCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export interface SwipeGestureHandlerProps extends SwipeCallbacks {
  children: ReactNode;
  swipeThreshold?: number;
  velocityThreshold?: number;
  enabled?: boolean;
  theme?: any;
  style?: ViewStyle;
}

export interface HapticConfig {
  type: 'light' | 'medium' | 'heavy';
  longPressDelay: number;
  enabled: boolean;
}

export interface HapticTouchButtonProps extends TouchableOpacityProps {
  onPress?: () => void;
  onLongPress?: () => void;
  children: ReactNode;
  hapticType?: 'light' | 'medium' | 'heavy';
  longPressDelay?: number;
  disabled?: boolean;
  theme?: any;
  style?: ViewStyle;
}

export interface GestureIndicatorProps {
  visible: boolean;
  direction: 'left' | 'right' | 'up' | 'down' | 'tap';
  text?: string;
  theme?: any;
  style?: ViewStyle;
}

export interface TouchFeedbackConfig {
  hapticEnabled: boolean;
  visualFeedbackEnabled: boolean;
  soundEnabled: boolean;
  animationDuration: number;
}

export interface GestureState {
  isActive: boolean;
  direction?: 'left' | 'right' | 'up' | 'down';
  velocity: { x: number; y: number };
  translation: { x: number; y: number };
}

export interface TouchMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  distance: number;
  velocity: number;
  pressure?: number;
}

export type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
export type GestureDirection = 'left' | 'right' | 'up' | 'down' | 'tap' | 'pinch' | 'rotate';
export type TouchEventType = 'press' | 'longPress' | 'swipe' | 'pinch' | 'rotate' | 'tap';