/**
 * Camera Overlays Component
 * 
 * Provides visual overlays for camera including focus indicator, timer, and gesture hints.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { BlurView } from 'expo-blur';

interface CameraOverlaysProps {
  focusPoint?: { x: number; y: number };
  focusAnimation: Animated.Value;
  timerCount: number;
  timerAnimation: Animated.Value;
  showGestureHint: boolean;
  theme: any;
}

export const CameraOverlays: React.FC<CameraOverlaysProps> = ({
  focusPoint,
  focusAnimation,
  timerCount,
  timerAnimation,
  showGestureHint,
  theme,
}) => {
  return (
    <>
      {/* Focus Indicator */}
      {focusPoint && (
        <Animated.View
          style={[
            styles.focusIndicator,
            {
              left: focusPoint.x - 25,
              top: focusPoint.y - 25,
              opacity: focusAnimation,
              transform: [{ scale: focusAnimation }],
            },
          ]}
        >
          <View style={[styles.focusRing, { borderColor: theme.accent.primary }]} />
        </Animated.View>
      )}

      {/* Timer Countdown */}
      {timerCount > 0 && (
        <View style={styles.timerContainer}>
          <Animated.Text
            style={[
              styles.timerText,
              {
                color: theme.accent.primary,
                transform: [{ scale: timerAnimation }],
              },
            ]}
          >
            {timerCount}
          </Animated.Text>
        </View>
      )}

      {/* Gesture Hint */}
      {showGestureHint && (
        <BlurView intensity={80} style={styles.gestureHint}>
          <Text style={[styles.gestureHintText, { color: theme.text.primary }]}>
            Pinch to zoom, tap to focus
          </Text>
        </BlurView>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  focusIndicator: {
    position: 'absolute',
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  focusRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
  },
  timerContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -50 }, { translateY: -50 }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 72,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  gestureHint: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  gestureHintText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default CameraOverlays;