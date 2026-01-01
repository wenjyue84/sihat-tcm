/**
 * Haptic Touch Button Component
 * 
 * Enhanced button with haptic feedback and touch optimizations
 */

import React, { useRef, useState } from 'react';
import {
  TouchableOpacity,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';

import {
  HapticTouchProps,
  TouchMetrics,
} from '../interfaces/TouchInterfaces';

import HapticManager from '../core/HapticManager';
import { HAPTIC_CONFIG } from '../../../../constants';

export const HapticTouchButton: React.FC<HapticTouchProps> = ({
  children,
  onPress,
  onLongPress,
  impactStyle = 'medium',
  enableHaptics = true,
  delayMs = 0,
  disabled = false,
  style,
  theme,
}) => {
  // Animation values
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  
  // State
  const [isPressed, setIsPressed] = useState(false);
  const [pressStartTime, setPressStartTime] = useState(0);

  /**
   * Handle press in
   */
  const handlePressIn = async () => {
    if (disabled) return;

    setIsPressed(true);
    setPressStartTime(Date.now());

    // Animate press feedback
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Haptic feedback on press
    if (enableHaptics) {
      await HapticManager.impact('light');
    }
  };

  /**
   * Handle press out
   */
  const handlePressOut = () => {
    if (disabled) return;

    setIsPressed(false);

    // Animate release
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
      Animated.spring(opacityAnim, {
        toValue: 1,
        useNativeDriver: true,
      }),
    ]).start();
  };

  /**
   * Handle press
   */
  const handlePress = async () => {
    if (disabled || !onPress) return;

    const endTime = Date.now();
    const duration = endTime - pressStartTime;

    // Create touch metrics
    const metrics: TouchMetrics = {
      startTime: pressStartTime,
      endTime,
      duration,
      distance: 0, // No movement for button press
      velocity: 0,
    };

    // Haptic feedback based on press characteristics
    if (enableHaptics) {
      if (duration < HAPTIC_CONFIG.QUICK_TAP_DURATION) {
        await HapticManager.impact('light');
      } else {
        await HapticManager.impact(impactStyle);
      }
    }

    // Execute press callback with delay if specified
    if (delayMs > 0) {
      setTimeout(() => {
        onPress();
      }, delayMs);
    } else {
      onPress();
    }
  };

  /**
   * Handle long press
   */
  const handleLongPress = async () => {
    if (disabled || !onLongPress) return;

    // Strong haptic feedback for long press
    if (enableHaptics) {
      await HapticManager.impact('heavy');
    }

    onLongPress();
  };

  /**
   * Get button style with theme and state
   */
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      opacity: disabled ? 0.5 : 1,
    };

    if (Array.isArray(style)) {
      return [baseStyle, ...style];
    }

    return [baseStyle, style];
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      onLongPress={handleLongPress}
      disabled={disabled}
      activeOpacity={1} // We handle opacity with animation
      delayLongPress={HAPTIC_CONFIG.LONG_PRESS_DURATION}
    >
      <Animated.View
        style={[
          getButtonStyle(),
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default HapticTouchButton;