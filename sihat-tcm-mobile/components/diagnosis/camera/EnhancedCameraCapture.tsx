/**
 * Enhanced Camera Capture Component - Refactored Version
 * 
 * Modular camera capture component for TCM diagnosis using clean architecture.
 * This component orchestrates smaller focused components for better maintainability.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

// Core components
import { CameraController } from './core/CameraController';
import { ImageOptimizer } from './processing/ImageOptimizer';
import { CameraGestureHandler } from './gestures/CameraGestureHandler';

// UI components
import CameraPermissionView from './ui/CameraPermissionView';
import CameraControls from './ui/CameraControls';
import CameraOverlays from './ui/CameraOverlays';

// Hooks
import useCameraState from './hooks/useCameraState';
import useCameraTimer from './hooks/useCameraTimer';

// Types and interfaces
import {
  CameraProps,
  CapturedImage,
} from './interfaces/CameraInterfaces';

// Theme hook (mock for now since it doesn't exist)
const useTheme = () => ({
  text: { primary: '#000000', secondary: '#666666' },
  accent: { primary: '#007AFF', secondary: '#FF6B6B' },
});

export const EnhancedCameraCapture: React.FC<CameraProps> = ({
  onImageCaptured,
  onCancel,
  captureMode = 'single',
  imageType = 'tongue',
  showQualityOverlay = true,
  enableGestures = true,
  maxImages = 5,
  timerDuration = 3,
  theme: customTheme,
  style,
}) => {
  // Hooks
  const theme = useTheme();
  const finalTheme = customTheme || theme;
  const [permission, requestPermission] = useCameraPermissions();

  // Custom hooks for state management
  const {
    cameraState,
    timerCount,
    showGestureHint,
    zoomAnimation,
    focusAnimation,
    captureAnimation,
    timerAnimation,
    updateSettings,
    updateFocusPoint,
    setCapturing,
    setError,
    setReady,
    setPermission,
    setTimerCount,
    setShowGestureHint,
  } = useCameraState();

  // State for captured images
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);

  // Refs for core components
  const cameraRef = useRef<any>(null);
  const cameraController = useRef<CameraController | null>(null);
  const imageOptimizer = useRef<ImageOptimizer | null>(null);
  const gestureHandler = useRef<CameraGestureHandler | null>(null);
  /**
   * Handle errors
   */
  const handleError = useCallback((error: string) => {
    setError(error);
    Alert.alert('Camera Error', error);
  }, [setError]);

  // Timer hook for delayed capture
  const { startTimer, cancelTimer } = useCameraTimer({
    timerDuration,
    timerAnimation,
    onTimerComplete: async () => {
      const image = await cameraController.current!.captureImage();
      await handleImageCaptured(image);
    },
    onTimerUpdate: setTimerCount,
    onError: handleError,
  });

  // Initialize components
  useEffect(() => {
    initializeComponents();
    return () => {
      cleanup();
    };
  }, []);

  // Handle permission changes
  useEffect(() => {
    if (permission?.granted) {
      setPermission(true);
    }
  }, [permission, setPermission]);

  // Show gesture hint
  useEffect(() => {
    if (enableGestures && cameraState.hasPermission) {
      const timer = setTimeout(() => {
        setShowGestureHint(true);
        setTimeout(() => setShowGestureHint(false), 3000);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [enableGestures, cameraState.hasPermission, setShowGestureHint]);

  /**
   * Initialize camera components
   */
  const initializeComponents = async () => {
    try {
      // Initialize camera controller
      cameraController.current = new CameraController(
        {
          onImageCaptured: handleImageCaptured,
          onError: handleError,
          onSettingsChange: updateSettings,
          onFocusChange: updateFocusPoint,
        },
        captureMode,
        imageType
      );

      // Initialize image optimizer
      imageOptimizer.current = new ImageOptimizer();

      // Initialize gesture handler
      gestureHandler.current = new CameraGestureHandler({
        onZoomChange: handleZoomChange,
        onFocusPoint: handleFocusPoint,
        onDoubleTap: handleDoubleTap,
      });

      // Initialize camera controller
      await cameraController.current.initialize();
      
      setReady(true);
      setPermission(cameraController.current?.getState().hasPermission || false);

    } catch (error) {
      console.error('[EnhancedCameraCapture] Initialization failed:', error);
      handleError(error instanceof Error ? error.message : 'Initialization failed');
    }
  };

  /**
   * Handle image captured
   */
  const handleImageCaptured = useCallback(async (image: CapturedImage | CapturedImage[]) => {
    try {
      if (Array.isArray(image)) {
        // Multiple images (burst mode)
        const optimizedImages = await Promise.all(
          image.map(img => imageOptimizer.current!.optimizeImage(img, imageType))
        );
        onImageCaptured(optimizedImages);
      } else {
        // Single image
        const optimizedImage = await imageOptimizer.current!.optimizeImage(image, imageType);
        
        if (captureMode === 'single') {
          onImageCaptured(optimizedImage);
        } else {
          // Add to captured images for burst/timer mode
          setCapturedImages(prev => {
            const newImages = [...prev, optimizedImage];
            if (newImages.length >= maxImages) {
              onImageCaptured(newImages);
              return [];
            }
            return newImages;
          });
        }
      }
    } catch (error) {
      console.error('[EnhancedCameraCapture] Image processing failed:', error);
      handleError('Failed to process captured image');
    }
  }, [captureMode, imageType, maxImages, onImageCaptured]);

  /**
   * Handle errors
   */
  const handleError = useCallback((error: string) => {
    setError(error);
    Alert.alert('Camera Error', error);
  }, [setError]);

  /**
   * Handle zoom change from gestures
   */
  const handleZoomChange = useCallback((zoom: number) => {
    cameraController.current?.setZoom(zoom);
  }, []);

  /**
   * Handle focus point from gestures
   */
  const handleFocusPoint = useCallback((point: { x: number; y: number }) => {
    cameraController.current?.setFocusPoint(point);
  }, []);

  /**
   * Handle double tap (toggle camera facing)
   */
  const handleDoubleTap = useCallback(() => {
    cameraController.current?.toggleFacing();
  }, []);

  /**
   * Capture image
   */
  const captureImage = useCallback(async () => {
    try {
      if (!cameraController.current || cameraState.isCapturing) {
        return;
      }

      if (captureMode === 'timer') {
        startTimer();
      } else {
        setCapturing(true);
        
        const image = await cameraController.current.captureImage();
        await handleImageCaptured(image);
        
        setCapturing(false);
      }
    } catch (error) {
      console.error('[EnhancedCameraCapture] Capture failed:', error);
      setCapturing(false);
      handleError('Failed to capture image');
    }
  }, [captureMode, cameraState.isCapturing, handleImageCaptured, startTimer, setCapturing]);

  /**
   * Pick from gallery
   */
  const pickFromGallery = useCallback(async () => {
    try {
      const image = await cameraController.current?.pickFromGallery();
      if (image) {
        await handleImageCaptured(image);
      }
    } catch (error) {
      console.error('[EnhancedCameraCapture] Gallery pick failed:', error);
      handleError('Failed to pick image from gallery');
    }
  }, [handleImageCaptured]);

  /**
   * Toggle flash
   */
  const toggleFlash = useCallback(() => {
    cameraController.current?.toggleFlash();
  }, []);

  /**
   * Toggle camera facing
   */
  const toggleFacing = useCallback(() => {
    cameraController.current?.toggleFacing();
  }, []);

  /**
   * Handle gesture events
   */
  const handleGestureEvent = useCallback((event: any) => {
    if (!enableGestures || !gestureHandler.current) return;

    const { nativeEvent } = event;
    
    if (nativeEvent.scale !== undefined) {
      // Pinch gesture
      gestureHandler.current.handlePinchGesture(nativeEvent.scale, nativeEvent.velocity);
    } else if (nativeEvent.locationX !== undefined) {
      // Tap gesture
      gestureHandler.current.handleTapGesture(nativeEvent.locationX, nativeEvent.locationY);
    }
  }, [enableGestures]);

  /**
   * Cleanup resources
   */
  const cleanup = useCallback(async () => {
    try {
      if (cameraController.current) {
        cameraController.current.cleanup();
      }
      if (imageOptimizer.current) {
        imageOptimizer.current.clearCache();
      }
      if (gestureHandler.current) {
        gestureHandler.current.reset();
      }
      cancelTimer();
    } catch (error) {
      console.error('[EnhancedCameraCapture] Cleanup failed:', error);
    }
  }, [cancelTimer]);

  // Render permission request if needed
  if (!cameraState.hasPermission) {
    return (
      <CameraPermissionView
        onRequestPermission={requestPermission}
        theme={finalTheme}
        style={style}
      />
    );
  }

  return (
    <View style={[styles.container, style]}>
      {/* Camera View */}
      <View style={styles.cameraContainer}>
        <CameraView
          ref={(ref) => {
            cameraRef.current = ref;
            cameraController.current?.setCameraRef(ref);
          }}
          style={styles.camera}
          facing={cameraState.settings.facing}
          flash={cameraState.settings.flash}
          zoom={cameraState.settings.zoom}
          onTouchEnd={handleGestureEvent}
        />

        {/* Camera Overlays */}
        <CameraOverlays
          focusPoint={cameraState.focusPoint}
          focusAnimation={focusAnimation}
          timerCount={timerCount}
          timerAnimation={timerAnimation}
          showGestureHint={showGestureHint}
          theme={finalTheme}
        />
      </View>

      {/* Camera Controls */}
      <CameraControls
        settings={cameraState.settings}
        isCapturing={cameraState.isCapturing}
        timerCount={timerCount}
        capturedImagesCount={capturedImages.length}
        maxImages={maxImages}
        captureMode={captureMode}
        captureAnimation={captureAnimation}
        onCapture={captureImage}
        onToggleFlash={toggleFlash}
        onToggleFacing={toggleFacing}
        onPickFromGallery={pickFromGallery}
        onCancel={onCancel || (() => {})}
      />
    </View>
  );
};
// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
});

export default EnhancedCameraCapture;