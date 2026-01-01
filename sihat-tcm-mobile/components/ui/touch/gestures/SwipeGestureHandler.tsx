/**
 * Swipe Gesture Handler Component
 * 
 * Handles swipe gestures with haptic feedback and customizable thresholds
 */

import React, { useRef, useState } from 'react';
import { Animated } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';

import {
  SwipeGestureProps,
  SwipeDirection,
  TouchMetrics,
} from '../interfaces/TouchInterfaces';

import HapticManager from '../core/HapticManager';
import { GESTURE_CONFIG } from '../../../../constants';

export const SwipeGestureHandler: React.FC<SwipeGestureProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  swipeThreshold = GESTURE_CONFIG.SWIPE_THRESHOLD,
  velocityThreshold = GESTURE_CONFIG.VELOCITY_THRESHOLD,
  enabled = true,
  theme,
  style,
}) => {
  // Animation values
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  
  // State
  const [isGesturing, setIsGesturing] = useState(false);
  const [startTime, setStartTime] = useState(0);

  /**
   * Handle gesture event
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
        handleGestureBegan();
        break;
      
      case State.ACTIVE:
        handleGestureActive(translationX, translationY);
        break;
      
      case State.END:
        await handleGestureEnd(translationX, translationY, velocityX, velocityY);
        break;
      
      case State.CANCELLED:
      case State.FAILED:
        handleGestureCancelled();
        break;
    }
  };

  /**
   * Handle gesture began
   */
  const handleGestureBegan = async () => {
    setIsGesturing(true);
    setStartTime(Date.now());
    
    // Light haptic feedback on gesture start
    await HapticManager.impact('light');
  };

  /**
   * Handle active gesture
   */
  const handleGestureActive = (translationX: number, translationY: number) => {
    // Could add real-time feedback here if needed
    // For now, just track that gesture is active
  };

  /**
   * Handle gesture end
   */
  const handleGestureEnd = async (
    translationX: number,
    translationY: number,
    velocityX: number,
    velocityY: number
  ) => {
    setIsGesturing(false);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    const distance = Math.sqrt(translationX * translationX + translationY * translationY);
    const velocity = Math.sqrt(velocityX * velocityX + velocityY * velocityY);

    // Create touch metrics
    const metrics: TouchMetrics = {
      startTime,
      endTime,
      duration,
      distance,
      velocity,
    };

    // Determine if gesture meets thresholds
    const meetsDistanceThreshold = Math.abs(translationX) > swipeThreshold || Math.abs(translationY) > swipeThreshold;
    const meetsVelocityThreshold = velocity > velocityThreshold;

    if (meetsDistanceThreshold || meetsVelocityThreshold) {
      const direction = determineSwipeDirection(translationX, translationY);
      await handleSwipe(direction, metrics);
    }

    // Reset animations
    resetAnimations();
  };

  /**
   * Handle gesture cancelled
   */
  const handleGestureCancelled = () => {
    setIsGesturing(false);
    resetAnimations();
  };

  /**
   * Determine swipe direction
   */
  const determineSwipeDirection = (translationX: number, translationY: number): SwipeDirection | null => {
    const absX = Math.abs(translationX);
    const absY = Math.abs(translationY);

    // Determine primary direction
    if (absX > absY) {
      // Horizontal swipe
      return translationX > 0 ? 'right' : 'left';
    } else {
      // Vertical swipe
      return translationY > 0 ? 'down' : 'up';
    }
  };

  /**
   * Handle swipe in specific direction
   */
  const handleSwipe = async (direction: SwipeDirection | null, metrics: TouchMetrics) => {
    if (!direction) return;

    // Provide haptic feedback based on metrics
    await HapticManager.feedbackForMetrics(metrics);

    // Call appropriate callback
    switch (direction) {
      case 'left':
        onSwipeLeft?.();
        break;
      case 'right':
        onSwipeRight?.();
        break;
      case 'up':
        onSwipeUp?.();
        break;
      case 'down':
        onSwipeDown?.();
        break;
    }
  };

  /**
   * Reset animations to initial state
   */
  const resetAnimations = () => {
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
          style,
          {
            transform: [
              { translateX },
              { translateY },
            ],
          },
        ]}
      >
        {children}
      </Animated.View>
    </PanGestureHandler>
  );
};

export default SwipeGestureHandler;