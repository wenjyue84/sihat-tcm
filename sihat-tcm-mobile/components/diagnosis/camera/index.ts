/**
 * Camera Module Exports
 * 
 * Centralized exports for the enhanced camera capture system
 */

// Main component
export { default as EnhancedCameraCapture } from './EnhancedCameraCapture';

// Core classes
export { CameraController } from './core/CameraController';
export { ImageOptimizer } from './processing/ImageOptimizer';
export { CameraGestureHandler } from './gestures/CameraGestureHandler';

// Interfaces
export type {
  CameraSettings,
  CaptureOptions,
  ImageOptimizationOptions,
  CapturedImage,
  CameraState,
  CameraCallbacks,
  CameraProps,
  GestureState,
  QualityMetrics,
  CameraPermissionStatus,
  CaptureMode,
  ImageType,
  FlashMode,
  CameraFacing,
} from './interfaces/CameraInterfaces';