/**
 * Camera Gesture Handler
 * 
 * Handles gesture controls for camera zoom, focus, and other interactions
 */

import * as Haptics from 'expo-haptics';
import { GestureState } from '../interfaces/CameraInterfaces';

export interface GestureCallbacks {
  onZoomChange: (zoom: number) => void;
  onFocusPoint: (point: { x: number; y: number }) => void;
  onDoubleTap: () => void;
}

export class CameraGestureHandler {
  private callbacks: GestureCallbacks;
  private gestureState: GestureState;
  private lastTapTime = 0;
  private doubleTapDelay = 300; // ms

  constructor(callbacks: GestureCallbacks) {
    this.callbacks = callbacks;
    this.gestureState = {
      scale: 1,
      translation: { x: 0, y: 0 },
      isActive: false,
    };
  }

  /**
   * Handle pinch gesture for zoom
   */
  handlePinchGesture(scale: number, velocity?: number): void {
    try {
      this.gestureState.scale = scale;
      this.gestureState.isActive = true;

      // Calculate zoom level (0-1 range)
      const zoomDelta = (scale - 1) * 0.1;
      const newZoom = Math.max(0, Math.min(1, zoomDelta));

      // Provide haptic feedback for significant zoom changes
      if (Math.abs(scale - 1) > 0.2) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      this.callbacks.onZoomChange(newZoom);
    } catch (error) {
      console.error('[CameraGestureHandler] Pinch gesture error:', error);
    }
  }

  /**
   * Handle tap gesture for focus
   */
  handleTapGesture(x: number, y: number): void {
    try {
      const currentTime = Date.now();
      const timeDiff = currentTime - this.lastTapTime;

      if (timeDiff < this.doubleTapDelay) {
        // Double tap detected
        this.handleDoubleTap();
      } else {
        // Single tap - set focus point
        this.callbacks.onFocusPoint({ x, y });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      this.lastTapTime = currentTime;
    } catch (error) {
      console.error('[CameraGestureHandler] Tap gesture error:', error);
    }
  }

  /**
   * Handle double tap gesture
   */
  private handleDoubleTap(): void {
    try {
      this.callbacks.onDoubleTap();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } catch (error) {
      console.error('[CameraGestureHandler] Double tap error:', error);
    }
  }

  /**
   * Handle pan gesture
   */
  handlePanGesture(translationX: number, translationY: number): void {
    try {
      this.gestureState.translation = { x: translationX, y: translationY };
      this.gestureState.isActive = true;

      // Pan gestures could be used for additional camera controls
      // For now, we'll just track the state
    } catch (error) {
      console.error('[CameraGestureHandler] Pan gesture error:', error);
    }
  }

  /**
   * Handle gesture end
   */
  handleGestureEnd(): void {
    this.gestureState.isActive = false;
    this.gestureState.scale = 1;
    this.gestureState.translation = { x: 0, y: 0 };
  }

  /**
   * Get current gesture state
   */
  getGestureState(): GestureState {
    return { ...this.gestureState };
  }

  /**
   * Reset gesture handler
   */
  reset(): void {
    this.gestureState = {
      scale: 1,
      translation: { x: 0, y: 0 },
      isActive: false,
    };
    this.lastTapTime = 0;
  }
}