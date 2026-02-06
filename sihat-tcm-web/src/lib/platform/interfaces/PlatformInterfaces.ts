/**
 * Platform Optimizer Interfaces
 *
 * Comprehensive type definitions for platform detection, optimization,
 * and UI adaptation across different devices and browsers.
 */

export interface DeviceInfo {
  type: "mobile" | "tablet" | "desktop";
  platform: "ios" | "android" | "web" | "unknown";
  browser: "chrome" | "safari" | "firefox" | "edge" | "unknown";
  hasTouch: boolean;
  isStandalone: boolean;
  screenSize: {
    width: number;
    height: number;
  };
  pixelRatio: number;
  orientation: "portrait" | "landscape";
  capabilities: DeviceCapabilities;
}

export interface DeviceCapabilities {
  webgl: boolean;
  webrtc: boolean;
  mediaDevices: boolean;
  geolocation: boolean;
  vibration: boolean;
  notifications: boolean;
  serviceWorker: boolean;
}

export interface ResponsiveBreakpoints {
  xs: number; // 0px
  sm: number; // 640px
  md: number; // 768px
  lg: number; // 1024px
  xl: number; // 1280px
  "2xl": number; // 1536px
}

export interface PlatformOptimizations {
  imageQuality: "low" | "medium" | "high";
  animationLevel: "none" | "reduced" | "full";
  prefersReducedMotion: boolean;
  maxConcurrentRequests: number;
  cacheStrategy: "aggressive" | "moderate" | "minimal";
  lazyLoadingThreshold: number;
  debounceDelay: number;
}

export interface UIAdaptations {
  touchTargetSize: number;
  fontSize: "small" | "medium" | "large";
  spacing: "compact" | "normal" | "comfortable";
  navigationStyle: "bottom" | "sidebar" | "top";
  modalStyle: "fullscreen" | "centered" | "drawer";
  inputStyle: "native" | "custom";
}

export interface OptimizedImageDimensions {
  width: number;
  height: number;
  quality: number;
}

export interface MediaQueryListener {
  (matches: boolean): void;
}

export interface PlatformConfig {
  breakpoints: ResponsiveBreakpoints;
  enableAutoDetection: boolean;
  enablePerformanceOptimizations: boolean;
  enableAccessibilityFeatures: boolean;
}

export interface IPlatformDetector {
  detectDevice(): DeviceInfo;
  checkWebGLSupport(): boolean;
  checkWebRTCSupport(): boolean;
}

export interface IResponsiveManager {
  isBreakpoint(breakpoint: keyof ResponsiveBreakpoints): boolean;
  getCurrentBreakpoint(): keyof ResponsiveBreakpoints;
  onBreakpointChange(
    breakpoint: keyof ResponsiveBreakpoints | string,
    callback: MediaQueryListener
  ): () => void;
}

export interface IOptimizationProvider {
  getPlatformOptimizations(): PlatformOptimizations;
  getUIAdaptations(): UIAdaptations;
  getOptimizedImageDimensions(
    originalWidth: number,
    originalHeight: number
  ): OptimizedImageDimensions;
}

export interface IPlatformStyler {
  getPlatformClasses(): string[];
  getResponsiveFontSize(baseSize: number): number;
  applyPerformanceOptimizations(): void;
}

export interface IPlatformOptimizer
  extends IPlatformDetector, IResponsiveManager, IOptimizationProvider, IPlatformStyler {
  getDeviceInfo(): DeviceInfo;
  supportsFeature(feature: keyof DeviceCapabilities): boolean;
  getOptimalDebounceDelay(inputType?: "search" | "resize" | "scroll" | "input"): number;
  cleanup(): void;
}
