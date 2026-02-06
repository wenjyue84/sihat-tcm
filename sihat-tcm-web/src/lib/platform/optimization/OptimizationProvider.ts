/**
 * Optimization Provider
 *
 * Provides platform-specific optimizations for performance, UI adaptations,
 * and image processing based on device capabilities and characteristics.
 */

import {
  DeviceInfo,
  PlatformOptimizations,
  UIAdaptations,
  OptimizedImageDimensions,
  IOptimizationProvider,
} from "../interfaces/PlatformInterfaces";

export class OptimizationProvider implements IOptimizationProvider {
  /**
   * Get platform-specific optimizations
   */
  getPlatformOptimizations(device: DeviceInfo): PlatformOptimizations {
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
  getUIAdaptations(device: DeviceInfo): UIAdaptations {
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
    originalHeight: number,
    device: DeviceInfo
  ): OptimizedImageDimensions {
    const optimizations = this.getPlatformOptimizations(device);

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
   * Get optimal debounce delay for user input
   */
  getOptimalDebounceDelay(
    inputType: "search" | "resize" | "scroll" | "input" = "input",
    device: DeviceInfo
  ): number {
    const optimizations = this.getPlatformOptimizations(device);
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
   * Get connection-based optimizations
   */
  getConnectionOptimizations(): {
    isSlowConnection: boolean;
    effectiveType: string;
    downlink?: number;
  } {
    if (typeof navigator === "undefined" || !("connection" in navigator)) {
      return {
        isSlowConnection: false,
        effectiveType: "4g",
      };
    }

    const connection = (navigator as any).connection;
    if (!connection) {
      return {
        isSlowConnection: false,
        effectiveType: "4g",
      };
    }

    const effectiveType = connection.effectiveType || "4g";
    const isSlowConnection = effectiveType === "slow-2g" || effectiveType === "2g";

    return {
      isSlowConnection,
      effectiveType,
      downlink: connection.downlink,
    };
  }

  /**
   * Get memory-based optimizations
   */
  getMemoryOptimizations(): {
    deviceMemory?: number;
    shouldReduceQuality: boolean;
    maxCacheSize: number;
  } {
    if (typeof navigator === "undefined" || !("deviceMemory" in navigator)) {
      return {
        shouldReduceQuality: false,
        maxCacheSize: 50 * 1024 * 1024, // 50MB default
      };
    }

    const deviceMemory = (navigator as any).deviceMemory;
    const shouldReduceQuality = deviceMemory && deviceMemory < 4; // Less than 4GB RAM
    const maxCacheSize = deviceMemory
      ? Math.min(deviceMemory * 10 * 1024 * 1024, 100 * 1024 * 1024) // 10MB per GB, max 100MB
      : 50 * 1024 * 1024;

    return {
      deviceMemory,
      shouldReduceQuality,
      maxCacheSize,
    };
  }
}
