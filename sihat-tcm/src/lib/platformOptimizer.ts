/**
 * Platform Optimizer
 *
 * Provides platform-specific UI adaptations, performance optimizations,
 * and responsive design enhancements for the Sihat TCM application.
 *
 * Features:
 * - Device and platform detection
 * - Responsive breakpoint management
 * - Performance optimizations per platform
 * - UI adaptations for different screen sizes and capabilities
 * - Accessibility enhancements
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
  capabilities: {
    webgl: boolean;
    webrtc: boolean;
    mediaDevices: boolean;
    geolocation: boolean;
    vibration: boolean;
    notifications: boolean;
    serviceWorker: boolean;
  };
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

class PlatformOptimizer {
  private deviceInfo: DeviceInfo | null = null;
  private breakpoints: ResponsiveBreakpoints;
  private mediaQueries: Map<string, MediaQueryList> = new Map();
  private listeners: Map<string, Set<(matches: boolean) => void>> = new Map();
  private isInitialized = false;

  constructor() {
    this.breakpoints = {
      xs: 0,
      sm: 640,
      md: 768,
      lg: 1024,
      xl: 1280,
      "2xl": 1536,
    };

    // Defer initialization to avoid issues in test/SSR environments
    if (typeof window !== "undefined") {
      this.initialize();
    }
  }

  /**
   * Initialize the platform optimizer (called lazily)
   */
  private initialize(): void {
    if (this.isInitialized || typeof window === "undefined") return;

    try {
      this.initializeMediaQueries();
      this.detectDevice();
      this.isInitialized = true;
    } catch (error) {
      console.warn("PlatformOptimizer initialization failed:", error);
    }
  }

  /**
   * Initialize media queries for responsive breakpoints
   */
  private initializeMediaQueries(): void {
    if (typeof window === "undefined" || !window.matchMedia) return;

    Object.entries(this.breakpoints).forEach(([key, value]) => {
      if (key !== "xs") {
        // xs is default (0px and up)
        const query = `(min-width: ${value}px)`;
        try {
          const mediaQuery = window.matchMedia(query);
          this.mediaQueries.set(key, mediaQuery);
          this.listeners.set(key, new Set());
        } catch (error) {
          console.warn(`Failed to create media query for ${key}:`, error);
        }
      }
    });

    // Additional useful media queries
    const additionalQueries = {
      touch: "(pointer: coarse)",
      hover: "(hover: hover)",
      "reduced-motion": "(prefers-reduced-motion: reduce)",
      dark: "(prefers-color-scheme: dark)",
      "high-contrast": "(prefers-contrast: high)",
      landscape: "(orientation: landscape)",
      portrait: "(orientation: portrait)",
    };

    Object.entries(additionalQueries).forEach(([key, query]) => {
      try {
        const mediaQuery = window.matchMedia(query);
        this.mediaQueries.set(key, mediaQuery);
        this.listeners.set(key, new Set());
      } catch (error) {
        console.warn(`Failed to create media query for ${key}:`, error);
      }
    });
  }

  /**
   * Detect device information and capabilities
   */
  private detectDevice(): DeviceInfo {
    if (typeof window === "undefined") {
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

    const userAgent = navigator.userAgent.toLowerCase();
    const screen = window.screen;

    // Detect platform
    let platform: DeviceInfo["platform"] = "unknown";
    if (/iphone|ipad|ipod/.test(userAgent)) {
      platform = "ios";
    } else if (/android/.test(userAgent)) {
      platform = "android";
    } else {
      platform = "web";
    }

    // Detect browser
    let browser: DeviceInfo["browser"] = "unknown";
    if (/chrome/.test(userAgent) && !/edge|edg/.test(userAgent)) {
      browser = "chrome";
    } else if (/safari/.test(userAgent) && !/chrome/.test(userAgent)) {
      browser = "safari";
    } else if (/firefox/.test(userAgent)) {
      browser = "firefox";
    } else if (/edge|edg/.test(userAgent)) {
      browser = "edge";
    }

    // Detect device type based on screen size and user agent
    let type: DeviceInfo["type"] = "desktop";
    const width = Math.max(screen.width, window.innerWidth);
    if (width < this.breakpoints.md || /mobile/.test(userAgent)) {
      type = "mobile";
    } else if (width < this.breakpoints.lg || /tablet|ipad/.test(userAgent)) {
      type = "tablet";
    }

    // Detect capabilities
    const capabilities: DeviceInfo["capabilities"] = {
      webgl: this.checkWebGLSupport(),
      webrtc: this.checkWebRTCSupport(),
      mediaDevices: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia),
      geolocation: !!navigator.geolocation,
      vibration: !!navigator.vibrate,
      notifications: "Notification" in window,
      serviceWorker: "serviceWorker" in navigator,
    };

    this.deviceInfo = {
      type,
      platform,
      browser,
      hasTouch: "ontouchstart" in window || navigator.maxTouchPoints > 0,
      isStandalone: window.matchMedia("(display-mode: standalone)").matches,
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      pixelRatio: window.devicePixelRatio || 1,
      orientation: window.innerWidth > window.innerHeight ? "landscape" : "portrait",
      capabilities,
    };

    return this.deviceInfo;
  }

  /**
   * Check WebGL support
   */
  private checkWebGLSupport(): boolean {
    try {
      const canvas = document.createElement("canvas");
      return !!(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
    } catch {
      return false;
    }
  }

  /**
   * Check WebRTC support
   */
  private checkWebRTCSupport(): boolean {
    return !!(
      window.RTCPeerConnection ||
      (window as any).webkitRTCPeerConnection ||
      (window as any).mozRTCPeerConnection
    );
  }

  /**
   * Get current device information
   */
  getDeviceInfo(): DeviceInfo {
    if (!this.isInitialized && typeof window !== "undefined") {
      this.initialize();
    }

    if (!this.deviceInfo) {
      this.deviceInfo = this.detectDevice();
    }
    return this.deviceInfo;
  }

  /**
   * Check if current viewport matches a breakpoint
   */
  isBreakpoint(breakpoint: keyof ResponsiveBreakpoints): boolean {
    if (typeof window === "undefined") return false;

    if (!this.isInitialized) {
      this.initialize();
    }

    if (breakpoint === "xs") {
      return window.innerWidth >= this.breakpoints.xs;
    }

    const mediaQuery = this.mediaQueries.get(breakpoint);
    return mediaQuery ? mediaQuery.matches : false;
  }

  /**
   * Get current active breakpoint
   */
  getCurrentBreakpoint(): keyof ResponsiveBreakpoints {
    if (typeof window === "undefined") return "lg";

    if (!this.isInitialized) {
      this.initialize();
    }

    const width = window.innerWidth;

    if (width >= this.breakpoints["2xl"]) return "2xl";
    if (width >= this.breakpoints.xl) return "xl";
    if (width >= this.breakpoints.lg) return "lg";
    if (width >= this.breakpoints.md) return "md";
    if (width >= this.breakpoints.sm) return "sm";
    return "xs";
  }

  /**
   * Subscribe to breakpoint changes
   */
  onBreakpointChange(
    breakpoint: keyof ResponsiveBreakpoints | string,
    callback: (matches: boolean) => void
  ): () => void {
    if (typeof window === "undefined") return () => {};

    if (!this.isInitialized) {
      this.initialize();
    }

    const mediaQuery = this.mediaQueries.get(breakpoint);
    if (!mediaQuery) return () => {};

    const listeners = this.listeners.get(breakpoint);
    if (!listeners) return () => {};

    listeners.add(callback);

    // Add event listener if this is the first callback for this breakpoint
    if (listeners.size === 1) {
      const handler = (e: MediaQueryListEvent) => {
        listeners.forEach((cb) => cb(e.matches));
      };
      try {
        mediaQuery.addEventListener("change", handler);
      } catch (error) {
        console.warn(`Failed to add event listener for ${breakpoint}:`, error);
      }
    }

    // Return unsubscribe function
    return () => {
      listeners.delete(callback);
      if (listeners.size === 0) {
        try {
          mediaQuery.removeEventListener("change", () => {});
        } catch (error) {
          console.warn(`Failed to remove event listener for ${breakpoint}:`, error);
        }
      }
    };
  }

  /**
   * Get platform-specific optimizations
   */
  getPlatformOptimizations(): PlatformOptimizations {
    const device = this.getDeviceInfo();

    // Base optimizations
    let optimizations: PlatformOptimizations = {
      imageQuality: "high",
      animationLevel: "full",
      prefersReducedMotion: false,
      maxConcurrentRequests: 6,
      cacheStrategy: "moderate",
      lazyLoadingThreshold: 100,
      debounceDelay: 300,
    };

    // Platform-specific adjustments
    if (device.type === "mobile") {
      optimizations = {
        ...optimizations,
        imageQuality: device.pixelRatio > 2 ? "medium" : "low",
        maxConcurrentRequests: 3,
        cacheStrategy: "aggressive",
        lazyLoadingThreshold: 50,
        debounceDelay: 500,
      };
    }

    // iOS-specific optimizations
    if (device.platform === "ios") {
      optimizations = {
        ...optimizations,
        animationLevel: "full", // iOS handles animations well
        cacheStrategy: "moderate", // iOS has good memory management
      };
    }

    // Android-specific optimizations
    if (device.platform === "android") {
      optimizations = {
        ...optimizations,
        animationLevel: device.type === "mobile" ? "reduced" : "full",
        maxConcurrentRequests: device.type === "mobile" ? 2 : 4,
      };
    }

    // Check for reduced motion preference
    if (typeof window !== "undefined") {
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReducedMotion) {
        optimizations.animationLevel = "none";
        optimizations.prefersReducedMotion = true;
      }
    }

    return optimizations;
  }

  /**
   * Get UI adaptations based on platform and device
   */
  getUIAdaptations(): UIAdaptations {
    const device = this.getDeviceInfo();

    let adaptations: UIAdaptations = {
      touchTargetSize: 44, // Default iOS recommendation
      fontSize: "medium",
      spacing: "normal",
      navigationStyle: "top",
      modalStyle: "centered",
      inputStyle: "custom",
    };

    // Mobile adaptations
    if (device.type === "mobile") {
      adaptations = {
        ...adaptations,
        touchTargetSize: device.hasTouch ? 48 : 44,
        spacing: "compact",
        navigationStyle: "bottom",
        modalStyle: "fullscreen",
        inputStyle: device.platform === "ios" ? "native" : "custom",
      };
    }

    // Tablet adaptations
    if (device.type === "tablet") {
      adaptations = {
        ...adaptations,
        touchTargetSize: 48,
        spacing: "comfortable",
        navigationStyle: device.orientation === "landscape" ? "sidebar" : "bottom",
        modalStyle: "centered",
      };
    }

    // Desktop adaptations
    if (device.type === "desktop") {
      adaptations = {
        ...adaptations,
        touchTargetSize: device.hasTouch ? 48 : 32,
        spacing: "comfortable",
        navigationStyle: "sidebar",
        modalStyle: "centered",
        inputStyle: "custom",
      };
    }

    return adaptations;
  }

  /**
   * Get optimized image dimensions for current device
   */
  getOptimizedImageDimensions(
    originalWidth: number,
    originalHeight: number
  ): {
    width: number;
    height: number;
    quality: number;
  } {
    const device = this.getDeviceInfo();
    const optimizations = this.getPlatformOptimizations();

    let scaleFactor = 1;
    let quality = 0.9;

    // Adjust based on device pixel ratio and screen size
    if (device.type === "mobile") {
      scaleFactor = Math.min(device.pixelRatio, 2);
      quality = optimizations.imageQuality === "low" ? 0.7 : 0.8;
    } else if (device.type === "tablet") {
      scaleFactor = Math.min(device.pixelRatio, 2.5);
      quality = 0.85;
    } else {
      scaleFactor = Math.min(device.pixelRatio, 3);
      quality = 0.9;
    }

    // Limit maximum dimensions to prevent memory issues
    const maxWidth = device.type === "mobile" ? 1200 : 2400;
    const maxHeight = device.type === "mobile" ? 1200 : 2400;

    let width = Math.min(originalWidth * scaleFactor, maxWidth);
    let height = Math.min(originalHeight * scaleFactor, maxHeight);

    // Maintain aspect ratio
    const aspectRatio = originalWidth / originalHeight;
    if (width / height !== aspectRatio) {
      if (width / aspectRatio <= maxHeight) {
        height = width / aspectRatio;
      } else {
        width = height * aspectRatio;
      }
    }

    return {
      width: Math.round(width),
      height: Math.round(height),
      quality,
    };
  }

  /**
   * Get platform-specific CSS classes
   */
  getPlatformClasses(): string[] {
    const device = this.getDeviceInfo();
    const classes: string[] = [];

    // Device type classes
    classes.push(`device-${device.type}`);

    // Platform classes
    classes.push(`platform-${device.platform}`);

    // Browser classes
    classes.push(`browser-${device.browser}`);

    // Capability classes
    if (device.hasTouch) classes.push("has-touch");
    if (device.isStandalone) classes.push("standalone");
    if (device.capabilities.webgl) classes.push("webgl-supported");

    // Orientation classes
    classes.push(`orientation-${device.orientation}`);

    // Pixel ratio classes
    if (device.pixelRatio >= 2) classes.push("high-dpi");
    if (device.pixelRatio >= 3) classes.push("ultra-high-dpi");

    return classes;
  }

  /**
   * Apply platform-specific performance optimizations
   */
  applyPerformanceOptimizations(): void {
    if (typeof window === "undefined") return;

    const device = this.getDeviceInfo();
    const optimizations = this.getPlatformOptimizations();

    // Disable animations if reduced motion is preferred
    if (optimizations.prefersReducedMotion) {
      document.documentElement.style.setProperty("--animation-duration", "0s");
      document.documentElement.style.setProperty("--transition-duration", "0s");
    }

    // Apply image loading optimizations
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach((img) => {
      if (img instanceof HTMLImageElement) {
        // Adjust loading threshold based on device
        img.style.setProperty("--loading-threshold", `${optimizations.lazyLoadingThreshold}px`);
      }
    });

    // Apply connection-based optimizations
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      if (connection && connection.effectiveType) {
        const effectiveType = connection.effectiveType;

        // Reduce quality for slow connections
        if (effectiveType === "slow-2g" || effectiveType === "2g") {
          document.documentElement.classList.add("slow-connection");
        }
      }
    }
  }

  /**
   * Get responsive font size based on device and user preferences
   */
  getResponsiveFontSize(baseSize: number): number {
    const device = this.getDeviceInfo();
    const adaptations = this.getUIAdaptations();

    let multiplier = 1;

    // Base adjustments for device type
    if (device.type === "mobile") {
      multiplier = 0.9;
    } else if (device.type === "tablet") {
      multiplier = 1.1;
    }

    // Font size preference adjustments
    switch (adaptations.fontSize) {
      case "small":
        multiplier *= 0.875;
        break;
      case "large":
        multiplier *= 1.125;
        break;
    }

    return Math.round(baseSize * multiplier);
  }

  /**
   * Check if device supports specific features
   */
  supportsFeature(feature: keyof DeviceInfo["capabilities"]): boolean {
    const device = this.getDeviceInfo();
    return device.capabilities[feature];
  }

  /**
   * Get optimal debounce delay for user input
   */
  getOptimalDebounceDelay(inputType: "search" | "resize" | "scroll" | "input" = "input"): number {
    const optimizations = this.getPlatformOptimizations();
    const baseDelay = optimizations.debounceDelay;

    switch (inputType) {
      case "search":
        return baseDelay;
      case "resize":
        return Math.min(baseDelay / 2, 150);
      case "scroll":
        return Math.min(baseDelay / 4, 50);
      case "input":
      default:
        return baseDelay;
    }
  }

  /**
   * Cleanup method to remove event listeners
   */
  cleanup(): void {
    this.listeners.clear();
    this.mediaQueries.clear();
  }
}

// Create singleton instance
export const platformOptimizer = new PlatformOptimizer();

// Types are already exported above as interfaces
export default platformOptimizer;
