/**
 * Touch Interface Types
 * 
 * Type definitions for the enhanced touch interface system
 */

export interface SwipeGestureConfig {
  swipeThreshold: number;
  velocityThreshold: number;
  enabled: boolean;
}

export interface SwipeGestureCallbacks {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export interface SwipeGestureProps extends SwipeGestureCallbacks {
  children: React.ReactNode;
  swipeThreshold?: number;
  velocityThreshold?: number;
  enabled?: boolean;
  theme?: any;
  style?: any;
}

export interface HapticTouchConfig {
  impactStyle: 'light' | 'medium' | 'heavy';
  enableHaptics: boolean;
  delayMs: number;
}

export interface HapticTouchProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  impactStyle?: 'light' | 'medium' | 'heavy';
  enableHaptics?: boolean;
  delayMs?: number;
  disabled?: boolean;
  style?: any;
  theme?: any;
}

export interface GestureIndicatorProps {
  visible: boolean;
  type: 'swipe' | 'tap' | 'pinch' | 'rotate';
  direction?: 'left' | 'right' | 'up' | 'down';
  position?: { x: number; y: number };
  theme?: any;
  style?: any;
}

export interface TouchFeedbackConfig {
  hapticEnabled: boolean;
  visualEnabled: boolean;
  audioEnabled: boolean;
  intensity: 'light' | 'medium' | 'heavy';
}

export interface GestureState {
  isActive: boolean;
  startPosition: { x: number; y: number };
  currentPosition: { x: number; y: number };
  velocity: { x: number; y: number };
  scale: number;
  rotation: number;
}

export interface TouchMetrics {
  startTime: number;
  endTime: number;
  duration: number;
  distance: number;
  velocity: number;
  pressure?: number;
}

export type HapticImpactStyle = 'light' | 'medium' | 'heavy';
export type GestureType = 'swipe' | 'tap' | 'pinch' | 'rotate' | 'pan';
export type SwipeDirection = 'left' | 'right' | 'up' | 'down';