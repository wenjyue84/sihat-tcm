/**
 * Platform Optimizer - Main orchestrator
 * 
 * Provides comprehensive platform optimization by coordinating
 * device detection, responsive management, optimization provision,
 * and platform styling.
 */

import { 
  DeviceInfo, 
  ResponsiveBreakpoints, 
  PlatformOptimizations, 
  UIAdaptations, 
  OptimizedImageDimensions,
  MediaQueryListener,
  IPlatformOptimizer,
  PlatformConfig,
  DeviceCapabilities
} from './interfaces/PlatformInterfaces';

import { PlatformDetector } from './core/PlatformDetector';
import { ResponsiveManager } from './core/ResponsiveManager';
import { OptimizationProvider } from './optimization/OptimizationProvider';
import { PlatformStyler } from './styling/PlatformStyler';

/**
 * Enhanced Platform Optimizer with modular architecture
 */
export class PlatformOptimizer implements IPlatformOptimizer {
  private deviceInfo: DeviceInfo | null = null;
  private config: PlatformConfig;
  
  // Core components
  private detector: PlatformDetector;
  private responsiveManager: ResponsiveManager;
  private optimizationProvider: OptimizationProvider;
  private styler: PlatformStyler;
  
  private isInitialized = false;

  constructor(config?: Partial<PlatformConfig>) {
    // Default configuration
    this.config = {
      breakpoints: {
        xs: 0,
        sm: 640,
        md: 768,
        lg: 1024,
        xl: 1280,
        "2xl": 1536,
      },
      enableAutoDetection: true,
      enablePerformanceOptimizations: true,
      enableAccessibilityFeatures: true,
      ...config,
    };

    // Initialize components
    this.detector = new PlatformDetector(this.config.breakpoints);
    this.responsiveManager = new ResponsiveManager(this.config.breakpoints);
    this.optimizationProvider = new OptimizationProvider();
    this.styler = new PlatformStyler();

    // Defer initialization to avoid issues in test/SSR environments
    if (typeof window !== "undefined" && this.config.enableAutoDetection) {
      this.initialize();
    }
  }

  /**
   * Get current device information
   */
  getDeviceInfo(): DeviceInfo {
    if (!this.deviceInfo && this.config.enableAutoDetection) {
      this.deviceInfo = this.detector.detectDevice();
    }
    
    return this.deviceInfo || this.getServerSideDefaults();
  }

  /**
   * Detect device information and capabilities
   */
  detectDevice(): DeviceInfo {
    this.deviceInfo = this.detector.detectDevice();
    return this.deviceInfo;
  }

  /**
   * Check WebGL support
   */
  checkWebGLSupport(): boolean {
    return this.detector.checkWebGLSupport();
  }

  /**
   * Check WebRTC support
   */
  checkWebRTCSupport(): boolean {
    return this.detector.checkWebRTCSupport();
  }

  /**
   * Check if current viewport matches a breakpoint
   */
  isBreakpoint(breakpoint: keyof ResponsiveBreakpoints): boolean {
    return this.responsiveManager.isBreakpoint(breakpoint);
  }

  /**
   * Get current active breakpoint
   */
  getCurrentBreakpoint(): keyof ResponsiveBreakpoints {
    return this.responsiveManager.getCurrentBreakpoint();
  }

  /**
   * Subscribe to breakpoint changes
   */
  onBreakpointChange(
    breakpoint: keyof ResponsiveBreakpoints | string,
    callback: MediaQueryListener
  ): () => void {
    return this.responsiveManager.onBreakpointChange(breakpoint, callback);
  }

  /**
   * Get platform-specific optimizations
   */
  getPlatformOptimizations(): PlatformOptimizations {
    const device = this.getDeviceInfo();
    return this.optimizationProvider.getPlatformOptimizations(device);
  }

  /**
   * Get UI adaptations based on platform and device
   */
  getUIAdaptations(): UIAdaptations {
    const device = this.getDeviceInfo();
    return this.optimizationProvider.getUIAdaptations(device);
  }

  /**
   * Get optimized image dimensions for current device
   */
  getOptimizedImageDimensions(
    originalWidth: number,
    originalHeight: number
  ): OptimizedImageDimensions {
    const device = this.getDeviceInfo();
    return this.optimizationProvider.getOptimizedImageDimensions(
      originalWidth,
      originalHeight,
      device
    );
  }

  /**
   * Get platform-specific CSS classes
   */
  getPlatformClasses(): string[] {
    const device = this.getDeviceInfo();
    return this.styler.getPlatformClasses(device);
  }

  /**
   * Get responsive font size based on device and user preferences
   */
  getResponsiveFontSize(baseSize: number): number {
    const device = this.getDeviceInfo();
    return this.styler.getResponsiveFontSize(baseSize, device);
  }

  /**
   * Apply platform-specific performance optimizations
   */
  applyPerformanceOptimizations(): void {
    if (!this.config.enablePerformanceOptimizations) return;
    
    const device = this.getDeviceInfo();
    this.styler.applyPerformanceOptimizations(device);
  }

  /**
   * Check if device supports specific features
   */
  supportsFeature(feature: keyof DeviceCapabilities): boolean {
    const device = this.getDeviceInfo();
    return device.capabilities[feature];
  }

  /**
   * Get optimal debounce delay for user input
   */
  getOptimalDebounceDelay(inputType: "search" | "resize" | "scroll" | "input" = "input"): number {
    const device = this.getDeviceInfo();
    return this.optimizationProvider.getOptimalDebounceDelay(inputType, device);
  }

  /**
   * Get CSS custom properties for platform adaptations
   */
  getCSSCustomProperties(): Record<string, string> {
    const device = this.getDeviceInfo();
    return this.styler.getCSSCustomProperties(device);
  }

  /**
   * Apply CSS custom properties to document
   */
  applyCSSCustomProperties(): void {
    const device = this.getDeviceInfo();
    this.styler.applyCSSCustomProperties(device);
  }

  /**
   * Get platform-specific modal styles
   */
  getModalStyles(): {
    maxWidth: string;
    maxHeight: string;
    borderRadius: string;
    padding: string;
  } {
    const device = this.getDeviceInfo();
    return this.styler.getModalStyles(device);
  }

  /**
   * Update configuration
   */
  updateConfiguration(newConfig: Partial<PlatformConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reinitialize if breakpoints changed
    if (newConfig.breakpoints) {
      this.responsiveManager.cleanup();
      this.responsiveManager = new ResponsiveManager(this.config.breakpoints);
      this.detector = new PlatformDetector(this.config.breakpoints);
    }
  }

  /**
   * Get system statistics and information
   */
  getSystemInfo(): {
    device: DeviceInfo;
    activeBreakpoints: Array<keyof ResponsiveBreakpoints>;
    optimizations: PlatformOptimizations;
    adaptations: UIAdaptations;
    configuration: PlatformConfig;
  } {
    const device = this.getDeviceInfo();
    
    return {
      device,
      activeBreakpoints: this.responsiveManager.getActiveBreakpoints?.() || [this.getCurrentBreakpoint()],
      optimizations: this.getPlatformOptimizations(),
      adaptations: this.getUIAdaptations(),
      configuration: this.config,
    };
  }

  /**
   * Cleanup method to remove event listeners
   */
  cleanup(): void {
    this.responsiveManager.cleanup();
    this.isInitialized = false;
  }

  // Private methods

  private initialize(): void {
    if (this.isInitialized || typeof window === "undefined") return;

    try {
      // Detect device information
      if (this.config.enableAutoDetection) {
        this.deviceInfo = this.detector.detectDevice();
      }

      // Apply initial optimizations
      if (this.config.enablePerformanceOptimizations) {
        this.applyPerformanceOptimizations();
        this.applyCSSCustomProperties();
      }

      this.isInitialized = true;
    } catch (error) {
      console.warn("PlatformOptimizer initialization failed:", error);
    }
  }

  private getServerSideDefaults(): DeviceInfo {
    return {
      type: "desktop",
      platform: "unknown",
      browser: "unknown",
      hasTouch: false,
      isStandalone: false,
      screenSize: { width: 1920, height: 1080 },
      pixelRatio: 1,
      orientation: "landscape",
      capabilities: {
        webgl: false,
        webrtc: false,
        mediaDevices: false,
        geolocation: false,
        vibration: false,
        notifications: false,
        serviceWorker: false,
      },
    };
  }
}

/**
 * Create a singleton instance for the application
 */
export const defaultPlatformOptimizer = new PlatformOptimizer();

/**
 * Convenience function to get platform optimizations
 */
export function getPlatformOptimizations(): PlatformOptimizations {
  return defaultPlatformOptimizer.getPlatformOptimizations();
}

/**
 * Convenience function to get UI adaptations
 */
export function getUIAdaptations(): UIAdaptations {
  return defaultPlatformOptimizer.getUIAdaptations();
}

/**
 * Convenience function to check device capabilities
 */
export function supportsFeature(feature: keyof DeviceCapabilities): boolean {
  return defaultPlatformOptimizer.supportsFeature(feature);
}

export default defaultPlatformOptimizer;