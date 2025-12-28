/**
 * Haptic Touch Button Component
 * 
 * Enhanced touch button with haptic feedback and animations
 */

import React, { useState, useRef } from 'react';
import { TouchableOpacity, Animated } from 'react-native';

import { HapticTouchButtonProps } from '../interfaces/TouchInterfaces';
import { HapticManager } from '../core/HapticManager';

export const HapticTouchButton: React.FC<HapticTouchButtonProps> = ({
  onPress,
  onLongPress,
  children,
  style,
  hapticType = 'medium',
  longPressDelay = 500,
  disabled = false,
  theme,
  ...props
}) => {
  // Animation
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // State
  const [isPressed, setIsPressed] = useState(false);
  
  // Haptic manager
  const hapticManager = HapticManager.getInstance();

  /**
   * Handle press in
   */
  const handlePressIn = async () => {
    if (disabled) return;

    setIsPressed(true);
    
    // Scale animation
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();

    // Haptic feedback
    await hapticManager.triggerHaptic(hapticType);
  };

  /**
   * Handle press out
   */
  const handlePressOut = () => {
    setIsPressed(false);
    
    // Reset scale animation
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  /**
   * Handle press
   */
  const handlePress = async () => {
    if (disabled) return;
    
    await hapticManager.triggerHaptic(hapticType);
    onPress?.();
  };

  /**
   * Handle long press
   */
  const handleLongPress = async () => {
    if (disabled) return;
    
    await hapticManager.triggerHaptic('success');
    onLongPress?.();
  };

  return (
    <TouchableOpacity
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      onLongPress={handleLongPress}
      delayLongPress={longPressDelay}
      disabled={disabled}
      activeOpacity={0.8}
      {...props}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [{ scale: scaleAnim }],
          },
          disabled && { opacity: 0.5 },
        ]}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};