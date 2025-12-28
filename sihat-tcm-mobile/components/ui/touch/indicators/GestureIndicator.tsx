/**
 * Gesture Indicator Component
 * 
 * Visual indicator for gesture hints and feedback
 */

import React, { useRef, useEffect } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { GestureIndicatorProps } from '../interfaces/TouchInterfaces';

export const GestureIndicator: React.FC<GestureIndicatorProps> = ({
  visible,
  direction,
  text,
  theme,
  style,
}) => {
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Handle visibility changes
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  /**
   * Get icon name based on direction
   */
  const getIconName = (): string => {
    switch (direction) {
      case 'left':
        return 'chevron-back';
      case 'right':
        return 'chevron-forward';
      case 'up':
        return 'chevron-up';
      case 'down':
        return 'chevron-down';
      default:
        return 'hand-left';
    }
  };

  /**
   * Get transform animation based on direction
   */
  const getTransform = () => {
    const slideValue = slideAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [20, 0],
    });

    switch (direction) {
      case 'left':
        return [{ translateX: slideValue }];
      case 'right':
        return [{ translateX: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }];
      case 'up':
        return [{ translateY: slideValue }];
      case 'down':
        return [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }];
      default:
        return [{ scale: slideAnim }];
    }
  };

  const styles = createStyles(theme);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: getTransform(),
        },
        style,
      ]}
      pointerEvents="none"
    >
      <View style={styles.indicator}>
        <Ionicons
          name={getIconName()}
          size={24}
          color={theme?.accent?.primary || '#007AFF'}
        />
        {text && (
          <Text style={[styles.text, { color: theme?.text?.primary || '#000000' }]}>
            {text}
          </Text>
        )}
      </View>
    </Animated.View>
  );
};

/**
 * Create styles for gesture indicator
 */
const createStyles = (theme?: any) => StyleSheet.create({
  container: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    zIndex: 1000,
  },
  indicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme?.surface?.elevated || 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  text: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
});