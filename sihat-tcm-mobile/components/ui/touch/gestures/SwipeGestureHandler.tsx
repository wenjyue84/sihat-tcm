/**
 * Swipe Gesture Handler Component
 * 
 * Enhanced swipe gesture detection with haptic feedback
 */

import React, { useState, useRef } from 'react';
import { Animated } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

import { SwipeGestureHandlerProps, GestureState } from '../interfaces/TouchInterfaces';
import { HapticManager } from '../core/HapticManager';

export const SwipeGestureHandler: React.FC<SwipeGestureHandlerProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  swipeThreshold = 50,
  velocityThreshold = 500,
  enabled = true,
  theme,
  style,
}) => {
  // Animation values
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  
  // State
  const [gestureState, setGestureState] = useState<GestureState>({
    isActive: false,
    velocity: { x: 0, y: 0 },
    translation: { x: 0, y: 0 },
  });

  // Haptic manager
  const hapticManager = HapticManager.getInstance();

  /**
   * Handle gesture events
   */
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
    { useNativeDriver: true }
  );

  /**
   * Handle gesture state changes
   */
  const onHandlerStateChange = async (event: any) => {
    if (!enabled) return;

    const { state, translationX, translationY, velocityX, velocityY } = event.nativeEvent;

    switch (state) {
      case State.BEGAN:
        setGestureState(prev => ({ ...prev, isActive: true }));
        await hapticManager.triggerHaptic('light');
        break;

      case State.ACTIVE:
        setGestureState(prev => ({
          ...prev,
          translation: { x: translationX, y: translationY },
          velocity: { x: velocityX, y: velocityY },
        }));
        break;

      case State.END:
        await handleGestureEnd(translationX, translationY, velocityX, velocityY);
        resetGesture();
        break;

      case State.CANCELLED:
      case State.FAILED:
        resetGesture();
        break;
    }
  };

  /**
   * Handle gesture completion
   */
  const handleGestureEnd = async (
    translationX: number,
    translationY: number,
    velocityX: number,
    velocityY: number
  ) => {
    const absX = Math.abs(translationX);
    const absY = Math.abs(translationY);
    const absVelX = Math.abs(velocityX);
    const absVelY = Math.abs(velocityY);

    // Check if gesture meets threshold requirements
    const meetsDistanceThreshold = absX > swipeThreshold || absY > swipeThreshold;
    const meetsVelocityThreshold = absVelX > velocityThreshold || absVelY > velocityThreshold;

    if (meetsDistanceThreshold || meetsVelocityThreshold) {
      // Determine primary direction
      if (absX > absY) {
        // Horizontal swipe
        if (translationX > 0 && onSwipeRight) {
          await hapticManager.triggerHaptic('medium');
          onSwipeRight();
        } else if (translationX < 0 && onSwipeLeft) {
          await hapticManager.triggerHaptic('medium');
          onSwipeLeft();
        }
      } else {
        // Vertical swipe
        if (translationY > 0 && onSwipeDown) {
          await hapticManager.triggerHaptic('medium');
          onSwipeDown();
        } else if (translationY < 0 && onSwipeUp) {
          await hapticManager.triggerHaptic('medium');
          onSwipeUp();
        }
      }
    }
  };

  /**
   * Reset gesture state and animations
   */
  const resetGesture = () => {
    setGestureState({
      isActive: false,
      velocity: { x: 0, y: 0 },
      translation: { x: 0, y: 0 },
    });

    // Reset animations
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return (
    <PanGestureHandler
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
      enabled={enabled}
    >
      <Animated.View
        style={[
          { flex: 1 },
          {
            transform: [
              { translateX: translateX },
              { translateY: translateY },
            ],
          },
          gestureState.isActive && { opacity: 0.8 },
          style,
        ]}
      >
        {children}
      </Animated.View>
    </PanGestureHandler>
  );
};