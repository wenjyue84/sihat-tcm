/**
 * Camera Controller
 * 
 * Core camera functionality with platform-specific implementations
 */

import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';

import {
  CameraSettings,
  CaptureOptions,
  CapturedImage,
  CameraState,
  CameraCallbacks,
  CameraPermissionStatus,
  CaptureMode,
  ImageType,
} from '../interfaces/CameraInterfaces';

import { CAMERA_CONFIG } from '../../../../constants';
import { ErrorFactory, CameraError } from '../../../../lib/errors/AppError';

export class CameraController {
  private cameraRef?: any;
  private state: CameraState;
  private callbacks: CameraCallbacks;
  private captureMode: CaptureMode;
  private imageType: ImageType;

  constructor(callbacks: CameraCallbacks, captureMode: CaptureMode = 'single', imageType: ImageType = 'tongue') {
    this.callbacks = callbacks;
    this.captureMode = captureMode;
    this.imageType = imageType;
    
    this.state = {
      isReady: false,
      isCapturing: false,
      hasPermission: false,
      settings: {
        facing: 'front',
        flash: 'off',
        zoom: 0,
        quality: CAMERA_CONFIG.DEFAULT_QUALITY,
      },
    };
  }

  /**
   * Initialize camera controller
   */
  async initialize(): Promise<void> {
    try {
      // Check permissions
      const permission = await this.checkPermissions();
      this.state.hasPermission = permission.granted;

      if (!permission.granted) {
        throw new CameraError('Camera permission not granted');
      }

      this.state.isReady = true;
    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: 'CameraController',
        action: 'initialize'
      });
    }
  }

  /**
   * Check camera permissions
   */
  async checkPermissions(): Promise<CameraPermissionStatus> {
    try {
      const { status, canAskAgain } = await Camera.requestCameraPermissionsAsync();
      
      return {
        granted: status === 'granted',
        canAskAgain,
        status,
      };
    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: 'CameraController',
        action: 'checkPermissions'
      });
    }
  }
  /**
   * Set camera reference
   */
  setCameraRef(ref: any): void {
    this.cameraRef = ref;
  }

  /**
   * Capture image
   */
  async captureImage(): Promise<CapturedImage> {
    try {
      if (!this.cameraRef) {
        throw new CameraError('Camera not initialized');
      }

      if (this.state.isCapturing) {
        throw new CameraError('Capture already in progress');
      }

      this.state.isCapturing = true;

      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

      const options: CaptureOptions = {
        quality: this.state.settings.quality,
        base64: false,
        skipProcessing: false,
        exif: true,
      };

      const photo = await this.cameraRef.takePictureAsync(options);

      // Create captured image object
      const capturedImage: CapturedImage = {
        uri: photo.uri,
        width: photo.width,
        height: photo.height,
        exif: photo.exif,
        type: this.imageType,
        timestamp: Date.now(),
        quality: this.state.settings.quality,
      };

      this.state.isCapturing = false;
      return capturedImage;
    } catch (error) {
      this.state.isCapturing = false;
      throw ErrorFactory.fromUnknownError(error, {
        component: 'CameraController',
        action: 'captureImage'
      });
    }
  }

  /**
   * Pick image from gallery
   */
  async pickFromGallery(): Promise<CapturedImage | null> {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        throw new CameraError('Gallery permission not granted');
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: this.getAspectRatio(),
        quality: this.state.settings.quality,
      });

      if (result.canceled || !result.assets[0]) {
        return null;
      }

      const asset = result.assets[0];
      
      const capturedImage: CapturedImage = {
        uri: asset.uri,
        width: asset.width,
        height: asset.height,
        type: this.imageType,
        timestamp: Date.now(),
        quality: this.state.settings.quality,
      };

      return capturedImage;
    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: 'CameraController',
        action: 'pickFromGallery'
      });
    }
  }
  /**
   * Update camera settings
   */
  updateSettings(newSettings: Partial<CameraSettings>): void {
    this.state.settings = { ...this.state.settings, ...newSettings };
    this.callbacks.onSettingsChange?.(this.state.settings);
  }

  /**
   * Set zoom level
   */
  setZoom(zoom: number): void {
    const clampedZoom = Math.max(0, Math.min(1, zoom));
    this.updateSettings({ zoom: clampedZoom });
  }

  /**
   * Toggle camera facing
   */
  toggleFacing(): void {
    const newFacing = this.state.settings.facing === 'front' ? 'back' : 'front';
    this.updateSettings({ facing: newFacing });
  }

  /**
   * Toggle flash
   */
  toggleFlash(): void {
    const flashModes = ['off', 'on', 'auto'] as const;
    const currentIndex = flashModes.indexOf(this.state.settings.flash);
    const nextIndex = (currentIndex + 1) % flashModes.length;
    this.updateSettings({ flash: flashModes[nextIndex] });
  }

  /**
   * Set focus point
   */
  setFocusPoint(point: { x: number; y: number }): void {
    this.state.focusPoint = point;
    this.callbacks.onFocusChange?.(point);
  }

  /**
   * Get current state
   */
  getState(): CameraState {
    return { ...this.state };
  }

  /**
   * Get current settings
   */
  getSettings(): CameraSettings {
    return { ...this.state.settings };
  }

  /**
   * Set capture mode
   */
  setCaptureMode(mode: CaptureMode): void {
    this.captureMode = mode;
  }

  /**
   * Set image type
   */
  setImageType(type: ImageType): void {
    this.imageType = type;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.cameraRef = undefined;
    this.state.isReady = false;
    this.state.isCapturing = false;
  }

  // Private helper methods

  /**
   * Get aspect ratio based on image type
   */
  private getAspectRatio(): [number, number] {
    switch (this.imageType) {
      case 'tongue':
        return [4, 3];
      case 'face':
        return [3, 4];
      case 'body':
        return [3, 4];
      case 'pulse':
        return [1, 1];
      default:
        return [4, 3];
    }
  }
}