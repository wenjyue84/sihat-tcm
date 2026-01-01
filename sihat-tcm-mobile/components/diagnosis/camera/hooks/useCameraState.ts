/**
 * Camera State Hook
 * 
 * Manages camera state including settings, capture status, and animations.
 */

import { useState, useRef } from 'react';
import { Animated } from 'react-native';
import { CameraState, CameraSettings } from '../interfaces/CameraInterfaces';
import { CAMERA_CONFIG } from '../../../constants';

export function useCameraState() {
  // State
  const [cameraState, setCameraState] = useState<CameraState>({
    isReady: false,
    isCapturing: false,
    hasPermission: false,
    settings: {
      facing: 'front',
      flash: 'off',
      zoom: 0,
      quality: CAMERA_CONFIG?.DEFAULT_QUALITY || 0.8,
    },
  });

  const [timerCount, setTimerCount] = useState(0);
  const [showGestureHint, setShowGestureHint] = useState(false);

  // Animations
  const zoomAnimation = useRef(new Animated.Value(0)).current;
  const focusAnimation = useRef(new Animated.Value(0)).current;
  const captureAnimation = useRef(new Animated.Value(1)).current;
  const timerAnimation = useRef(new Animated.Value(1)).current;

  // Update camera settings
  const updateSettings = (newSettings: Partial<CameraSettings>) => {
    setCameraState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));

    // Animate zoom changes
    if (newSettings.zoom !== undefined) {
      Animated.timing(zoomAnimation, {
        toValue: newSettings.zoom,
        duration: 200,
        useNativeDriver: false,
      }).start();
    }
  };

  // Update focus point with animation
  const updateFocusPoint = (point: { x: number; y: number }) => {
    setCameraState(prev => ({ ...prev, focusPoint: point }));
    
    // Animate focus indicator
    focusAnimation.setValue(0);
    Animated.sequence([
      Animated.timing(focusAnimation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(focusAnimation, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCameraState(prev => ({ ...prev, focusPoint: undefined }));
    });
  };

  // Set capturing state with animation
  const setCapturing = (isCapturing: boolean) => {
    setCameraState(prev => ({ ...prev, isCapturing }));
    
    if (isCapturing) {
      // Animate capture button
      Animated.sequence([
        Animated.timing(captureAnimation, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(captureAnimation, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  // Set error state
  const setError = (error: string) => {
    setCameraState(prev => ({ ...prev, error }));
  };

  // Set ready state
  const setReady = (isReady: boolean) => {
    setCameraState(prev => ({ ...prev, isReady }));
  };

  // Set permission state
  const setPermission = (hasPermission: boolean) => {
    setCameraState(prev => ({ ...prev, hasPermission }));
  };

  return {
    // State
    cameraState,
    timerCount,
    showGestureHint,
    
    // Animations
    zoomAnimation,
    focusAnimation,
    captureAnimation,
    timerAnimation,
    
    // Actions
    updateSettings,
    updateFocusPoint,
    setCapturing,
    setError,
    setReady,
    setPermission,
    setTimerCount,
    setShowGestureHint,
  };
}

export default useCameraState;