/**
 * Platform Optimization System - Barrel Export
 *
 * Provides a unified interface for all platform optimization functionality
 * including device detection, responsive management, and performance optimizations.
 */

// Main orchestrator
export {
  PlatformOptimizer,
  defaultPlatformOptimizer,
  getPlatformOptimizations,
  getUIAdaptations,
  supportsFeature,
} from "./PlatformOptimizer";

// Core components
export { PlatformDetector } from "./core/PlatformDetector";
export { ResponsiveManager } from "./core/ResponsiveManager";

// Optimization providers
export { OptimizationProvider } from "./optimization/OptimizationProvider";

// Styling utilities
export { PlatformStyler } from "./styling/PlatformStyler";

// Interfaces and types
export type {
  DeviceInfo,
  DeviceCapabilities,
  ResponsiveBreakpoints,
  PlatformOptimizations,
  UIAdaptations,
  OptimizedImageDimensions,
  MediaQueryListener,
  PlatformConfig,
  IPlatformDetector,
  IResponsiveManager,
  IOptimizationProvider,
  IPlatformStyler,
  IPlatformOptimizer,
} from "./interfaces/PlatformInterfaces";

// Legacy compatibility - re-export from original file
export { platformOptimizer } from "../platformOptimizer";

/**
 * Create a new PlatformOptimizer instance with custom configuration
 */
export function createPlatformOptimizer(
  config?: Partial<import("./interfaces/PlatformInterfaces").PlatformConfig>
) {
  return new PlatformOptimizer(config);
}

/**
 * Utility function to detect if running on mobile device
 */
export function isMobileDevice(): boolean {
  return defaultPlatformOptimizer.getDeviceInfo().type === "mobile";
}

/**
 * Utility function to detect if running on tablet device
 */
export function isTabletDevice(): boolean {
  return defaultPlatformOptimizer.getDeviceInfo().type === "tablet";
}

/**
 * Utility function to detect if running on desktop device
 */
export function isDesktopDevice(): boolean {
  return defaultPlatformOptimizer.getDeviceInfo().type === "desktop";
}

/**
 * Utility function to check if device has touch capability
 */
export function hasTouchCapability(): boolean {
  return defaultPlatformOptimizer.getDeviceInfo().hasTouch;
}

/**
 * Utility function to get current screen orientation
 */
export function getScreenOrientation(): "portrait" | "landscape" {
  return defaultPlatformOptimizer.getDeviceInfo().orientation;
}
