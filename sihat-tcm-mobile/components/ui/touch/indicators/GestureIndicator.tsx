/**
 * Gesture Indicator Component
 * 
 * Visual indicator for gesture hints and feedback
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import {
  GestureIndicatorProps,
  GestureType,
  SwipeDirection,
} from '../interfaces/TouchInterfaces';

export const GestureIndicator: React.FC<GestureIndicatorProps> = ({
  visible,
  type,
  direction,
  position,
  theme,
  style,
}) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const translateAnim = useRef(new Animated.Value(0)).current;

  // Animate visibility
  useEffect(() => {
    if (visible) {
      // Fade in and scale up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();

      // Add movement animation for swipe gestures
      if (type === 'swipe' && direction) {
        animateSwipeDirection(direction);
      }
    } else {
      // Fade out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, type, direction]);

  /**
   * Animate swipe direction
   */
  const animateSwipeDirection = (swipeDirection: SwipeDirection) => {
    const distance = 20;
    let toValue = 0;

    switch (swipeDirection) {
      case 'left':
        toValue = -distance;
        break;
      case 'right':
        toValue = distance;
        break;
      case 'up':
        toValue = -distance;
        break;
      case 'down':
        toValue = distance;
        break;
    }

    // Animate back and forth to show direction
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateAnim, {
          toValue,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(translateAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  /**
   * Get icon name based on gesture type and direction
   */
  const getIconName = (): string => {
    switch (type) {
      case 'swipe':
        switch (direction) {
          case 'left':
            return 'arrow-back';
          case 'right':
            return 'arrow-forward';
          case 'up':
            return 'arrow-up';
          case 'down':
            return 'arrow-down';
          default:
            return 'hand-left';
        }
      case 'tap':
        return 'finger-print';
      case 'pinch':
        return 'contract';
      case 'rotate':
        return 'refresh';
      default:
        return 'hand-left';
    }
  };

  /**
   * Get transform style based on gesture type
   */
  const getTransformStyle = () => {
    const baseTransform = [
      { scale: scaleAnim },
    ];

    if (type === 'swipe') {
      if (direction === 'left' || direction === 'right') {
        baseTransform.push({ translateX: translateAnim });
      } else {
        baseTransform.push({ translateY: translateAnim });
      }
    }

    return baseTransform;
  };

  /**
   * Get position style
   */
  const getPositionStyle = () => {
    if (position) {
      return {
        position: 'absolute' as const,
        left: position.x - 25, // Center the 50px indicator
        top: position.y - 25,
      };
    }
    return {};
  };

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        getPositionStyle(),
        {
          opacity: fadeAnim,
          transform: getTransformStyle(),
        },
        style,
      ]}
    >
      <View style={[
        styles.indicator,
        {
          backgroundColor: theme?.accent?.primary || '#007AFF',
          borderColor: theme?.accent?.secondary || '#0056CC',
        },
      ]}>
        <Ionicons
          name={getIconName() as any}
          size={24}
          color="#ffffff"
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default GestureIndicator;