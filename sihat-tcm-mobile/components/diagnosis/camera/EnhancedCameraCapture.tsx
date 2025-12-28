/**
 * Enhanced Camera Capture Component - Refactored Version
 * 
 * Modular camera capture component for TCM diagnosis
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

import { CameraController } from './core/CameraController';
import { ImageOptimizer } from './processing/ImageOptimizer';
import { CameraGestureHandler } from './gestures/CameraGestureHandler';
import {
  CameraProps,
  CameraState,
  CapturedImage,
  CameraSettings,
} from './interfaces/CameraInterfaces';

import { useTheme } from '../../../hooks/useTheme';
import { CAMERA_CONFIG } from '../../../constants';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

  // State
  const [cameraState, setCameraState] = useState<CameraState>({
    isReady: false,
    isCapturing: false,
    hasPermission: false,
    settings: {
      facing: 'front',
      flash: 'off',
      zoom: 0,
      quality: CAMERA_CONFIG.DEFAULT_QUALITY,
    },
  });
  const [capturedImages, setCapturedImages] = useState<CapturedImage[]>([]);
  const [timerCount, setTimerCount] = useState(0);
  const [showGestureHint, setShowGestureHint] = useState(false);

  // Refs
  const cameraRef = useRef<any>();
  const cameraController = useRef<CameraController>();
  const imageOptimizer = useRef<ImageOptimizer>();
  const gestureHandler = useRef<CameraGestureHandler>();
  
  // Animations
  const zoomAnimation = useRef(new Animated.Value(0)).current;
  const focusAnimation = useRef(new Animated.Value(0)).current;
  const captureAnimation = useRef(new Animated.Value(1)).current;
  const timerAnimation = useRef(new Animated.Value(1)).current;
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
      setCameraState(prev => ({ ...prev, hasPermission: true }));
    }
  }, [permission]);

  // Show gesture hint
  useEffect(() => {
    if (enableGestures && cameraState.hasPermission) {
      const timer = setTimeout(() => {
        setShowGestureHint(true);
        setTimeout(() => setShowGestureHint(false), 3000);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [enableGestures, cameraState.hasPermission]);

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
          onSettingsChange: handleSettingsChange,
          onFocusChange: handleFocusChange,
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
      
      setCameraState(prev => ({ 
        ...prev, 
        isReady: true,
        hasPermission: cameraController.current?.getState().hasPermission || false
      }));

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
   * Handle camera settings change
   */
  const handleSettingsChange = useCallback((settings: CameraSettings) => {
    setCameraState(prev => ({ ...prev, settings }));
    
    // Animate zoom changes
    Animated.timing(zoomAnimation, {
      toValue: settings.zoom,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, []);

  /**
   * Handle focus change
   */
  const handleFocusChange = useCallback((point: { x: number; y: number }) => {
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
  }, []);

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
   * Handle errors
   */
  const handleError = useCallback((error: string) => {
    setCameraState(prev => ({ ...prev, error }));
    Alert.alert('Camera Error', error);
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
        startTimerCapture();
      } else {
        setCameraState(prev => ({ ...prev, isCapturing: true }));
        
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

        const image = await cameraController.current.captureImage();
        await handleImageCaptured(image);
        
        setCameraState(prev => ({ ...prev, isCapturing: false }));
      }
    } catch (error) {
      console.error('[EnhancedCameraCapture] Capture failed:', error);
      setCameraState(prev => ({ ...prev, isCapturing: false }));
      handleError('Failed to capture image');
    }
  }, [captureMode, cameraState.isCapturing, handleImageCaptured]);
  /**
   * Start timer capture
   */
  const startTimerCapture = useCallback(() => {
    setTimerCount(timerDuration);
    
    const countdown = setInterval(() => {
      setTimerCount(prev => {
        if (prev <= 1) {
          clearInterval(countdown);
          // Capture after timer ends
          setTimeout(async () => {
            try {
              const image = await cameraController.current!.captureImage();
              await handleImageCaptured(image);
            } catch (error) {
              handleError('Timer capture failed');
            }
            setTimerCount(0);
          }, 100);
          return 0;
        }
        
        // Animate timer
        Animated.sequence([
          Animated.timing(timerAnimation, {
            toValue: 1.2,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(timerAnimation, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
        
        return prev - 1;
      });
    }, 1000);
  }, [timerDuration, handleImageCaptured]);

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
    } catch (error) {
      console.error('[EnhancedCameraCapture] Cleanup failed:', error);
    }
  }, []);
  // Render permission request if needed
  if (!cameraState.hasPermission) {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.permissionContainer}>
          <Ionicons 
            name="camera-off" 
            size={64} 
            color={finalTheme.text.secondary} 
          />
          <Text style={[styles.permissionText, { color: finalTheme.text.secondary }]}>
            Camera access is required for image capture and TCM analysis.
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, { backgroundColor: finalTheme.accent.primary }]}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>
              Grant Permission
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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

        {/* Focus Indicator */}
        {cameraState.focusPoint && (
          <Animated.View
            style={[
              styles.focusIndicator,
              {
                left: cameraState.focusPoint.x - 25,
                top: cameraState.focusPoint.y - 25,
                opacity: focusAnimation,
                transform: [{ scale: focusAnimation }],
              },
            ]}
          >
            <View style={[styles.focusRing, { borderColor: finalTheme.accent.primary }]} />
          </Animated.View>
        )}

        {/* Timer Countdown */}
        {timerCount > 0 && (
          <View style={styles.timerContainer}>
            <Animated.Text
              style={[
                styles.timerText,
                {
                  color: finalTheme.accent.primary,
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
            <Text style={[styles.gestureHintText, { color: finalTheme.text.primary }]}>
              Pinch to zoom, tap to focus
            </Text>
          </BlurView>
        )}
      </View>
      {/* Controls */}
      <View style={styles.controlsContainer}>
        {/* Top Controls */}
        <View style={styles.topControls}>
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
            onPress={onCancel}
          >
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.topControlsRight}>
            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
              onPress={toggleFlash}
            >
              <Ionicons 
                name={cameraState.settings.flash === 'off' ? 'flash-off' : 'flash'} 
                size={24} 
                color="#ffffff" 
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
              onPress={toggleFacing}
            >
              <Ionicons name="camera-reverse" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
            onPress={pickFromGallery}
          >
            <Ionicons name="images" size={24} color="#ffffff" />
          </TouchableOpacity>

          <Animated.View style={{ transform: [{ scale: captureAnimation }] }}>
            <TouchableOpacity
              style={[
                styles.captureButton,
                {
                  backgroundColor: cameraState.isCapturing 
                    ? finalTheme.accent.secondary 
                    : finalTheme.accent.primary,
                },
              ]}
              onPress={captureImage}
              disabled={cameraState.isCapturing || timerCount > 0}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </Animated.View>

          <View style={styles.captureInfo}>
            <Text style={[styles.captureMode, { color: '#ffffff' }]}>
              {captureMode.toUpperCase()}
            </Text>
            {capturedImages.length > 0 && (
              <Text style={[styles.captureCount, { color: '#ffffff' }]}>
                {capturedImages.length}/{maxImages}
              </Text>
            )}
          </View>
        </View>
      </View>
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
  controlsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topControlsRight: {
    flexDirection: 'row',
    gap: 12,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  secondaryButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
  },
  captureInfo: {
    alignItems: 'center',
    minWidth: 50,
  },
  captureMode: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  captureCount: {
    fontSize: 10,
    opacity: 0.8,
  },
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
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 20,
  },
  permissionButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  permissionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

export default EnhancedCameraCapture;