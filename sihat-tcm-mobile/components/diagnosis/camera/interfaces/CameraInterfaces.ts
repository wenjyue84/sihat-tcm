/**
 * Camera Interfaces
 * 
 * Type definitions for the enhanced camera capture system
 */

export interface CameraSettings {
  facing: 'front' | 'back';
  flash: 'on' | 'off' | 'auto';
  zoom: number;
  quality: number;
  ratio?: string;
}

export interface CaptureOptions {
  quality: number;
  base64: boolean;
  skipProcessing: boolean;
  exif?: boolean;
}

export interface ImageOptimizationOptions {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: 'jpeg' | 'png';
  compress?: number;
}

export interface CapturedImage {
  uri: string;
  width: number;
  height: number;
  base64?: string;
  exif?: any;
  type: 'tongue' | 'face' | 'body' | 'pulse';
  timestamp: number;
  quality: number;
  metadata?: {
    lighting: 'good' | 'poor' | 'excellent';
    focus: 'sharp' | 'blurry' | 'acceptable';
    angle: 'optimal' | 'suboptimal' | 'poor';
    overall: number;
  };
}

export interface CameraState {
  isReady: boolean;
  isCapturing: boolean;
  hasPermission: boolean;
  settings: CameraSettings;
  focusPoint?: { x: number; y: number };
  error?: string;
}

export interface CameraCallbacks {
  onImageCaptured: (image: CapturedImage | CapturedImage[]) => void;
  onCancel?: () => void;
  onError?: (error: string) => void;
  onSettingsChange?: (settings: CameraSettings) => void;
  onFocusChange?: (point: { x: number; y: number }) => void;
}

export interface CameraProps {
  onImageCaptured: (image: CapturedImage | CapturedImage[]) => void;
  onCancel?: () => void;
  captureMode?: 'single' | 'burst' | 'timer';
  imageType?: 'tongue' | 'face' | 'body' | 'pulse';
  showQualityOverlay?: boolean;
  enableGestures?: boolean;
  maxImages?: number;
  timerDuration?: number;
  theme?: any;
  style?: any;
}

export interface GestureState {
  scale: number;
  translation: { x: number; y: number };
  isActive: boolean;
}

export interface QualityMetrics {
  brightness: number;
  contrast: number;
  sharpness: number;
  colorBalance: number;
  overall: number;
  recommendations: string[];
}

export interface CameraPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: string;
}

export type CaptureMode = 'single' | 'burst' | 'timer';
export type ImageType = 'tongue' | 'face' | 'body' | 'pulse';
export type FlashMode = 'on' | 'off' | 'auto';
export type CameraFacing = 'front' | 'back';