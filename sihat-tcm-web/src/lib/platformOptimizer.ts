/**
 * Platform Optimizer - Legacy Compatibility Layer
 *
 * @deprecated Use the new modular platform system from './platform/PlatformOptimizer'
 * This file maintains backward compatibility while delegating to the new system.
 *
 * Migration Guide:
 * - Replace `import { platformOptimizer } from './platformOptimizer'`
 * - With `import { defaultPlatformOptimizer } from './platform'`
 */

import { 
  PlatformOptimizer as NewPlatformOptimizer,
  defaultPlatformOptimizer,
  type DeviceInfo,
  type ResponsiveBreakpoints,
  type PlatformOptimizations,
  type UIAdaptations
} from './platform';

// Re-export types for backward compatibility
export type { DeviceInfo, ResponsiveBreakpoints, PlatformOptimizations, UIAdaptations };

/**
 * @deprecated Use the new PlatformOptimizer from './platform/PlatformOptimizer'
 */
class PlatformOptimizer {
  private newOptimizer: NewPlatformOptimizer;

  constructor() {
    console.warn('PlatformOptimizer: This class is deprecated. Use defaultPlatformOptimizer from "./platform" instead.');
    this.newOptimizer = defaultPlatformOptimizer;
  }

  // Delegate all methods to the new optimizer
  getDeviceInfo(): DeviceInfo {
    return this.newOptimizer.getDeviceInfo();
  }

  isBreakpoint(breakpoint: keyof ResponsiveBreakpoints): boolean {
    return this.newOptimizer.isBreakpoint(breakpoint);
  }

  getCurrentBreakpoint(): keyof ResponsiveBreakpoints {
    return this.newOptimizer.getCurrentBreakpoint();
  }

  onBreakpointChange(
    breakpoint: keyof ResponsiveBreakpoints | string,
    callback: (matches: boolean) => void
  ): () => void {
    return this.newOptimizer.onBreakpointChange(breakpoint, callback);
  }

  getPlatformOptimizations(): PlatformOptimizations {
    return this.newOptimizer.getPlatformOptimizations();
  }

  getUIAdaptations(): UIAdaptations {
    return this.newOptimizer.getUIAdaptations();
  }

  getOptimizedImageDimensions(
    originalWidth: number,
    originalHeight: number
  ): {
    width: number;
    height: number;
    quality: number;
  } {
    return this.newOptimizer.getOptimizedImageDimensions(originalWidth, originalHeight);
  }

  getPlatformClasses(): string[] {
    return this.newOptimizer.getPlatformClasses();
  }

  getResponsiveFontSize(baseSize: number): number {
    return this.newOptimizer.getResponsiveFontSize(baseSize);
  }

  applyPerformanceOptimizations(): void {
    return this.newOptimizer.applyPerformanceOptimizations();
  }

  supportsFeature(feature: keyof DeviceInfo["capabilities"]): boolean {
    return this.newOptimizer.supportsFeature(feature);
  }

  getOptimalDebounceDelay(inputType: "search" | "resize" | "scroll" | "input" = "input"): number {
    return this.newOptimizer.getOptimalDebounceDelay(inputType);
  }

  cleanup(): void {
    return this.newOptimizer.cleanup();
  }
}

// Create singleton instance for backward compatibility
export const platformOptimizer = new PlatformOptimizer();

// Re-export the new system for migration
export { defaultPlatformOptimizer } from './platform';

export default platformOptimizer;
