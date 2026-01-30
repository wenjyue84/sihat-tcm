/**
 * Platform Styler
 * 
 * Handles platform-specific styling, CSS class generation,
 * and performance optimizations for visual elements.
 */

import { DeviceInfo, UIAdaptations, IPlatformStyler } from '../interfaces/PlatformInterfaces';
import { OptimizationProvider } from '../optimization/OptimizationProvider';

export class PlatformStyler implements IPlatformStyler {
  private optimizationProvider: OptimizationProvider;

  constructor() {
    this.optimizationProvider = new OptimizationProvider();
  }

  /**
   * Get platform-specific CSS classes
   */
  getPlatformClasses(device: DeviceInfo): string[] {
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

    // Connection-based classes
    const connectionInfo = this.optimizationProvider.getConnectionOptimizations();
    if (connectionInfo.isSlowConnection) {
      classes.push("slow-connection");
    }

    // Memory-based classes
    const memoryInfo = this.optimizationProvider.getMemoryOptimizations();
    if (memoryInfo.shouldReduceQuality) {
      classes.push("low-memory");
    }

    return classes;
  }

  /**
   * Get responsive font size based on device and user preferences
   */
  getResponsiveFontSize(baseSize: number, device: DeviceInfo): number {
    const adaptations = this.optimizationProvider.getUIAdaptations(device);

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
   * Apply platform-specific performance optimizations
   */
  applyPerformanceOptimizations(device: DeviceInfo): void {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const optimizations = this.optimizationProvider.getPlatformOptimizations(device);

    // Disable animations if reduced motion is preferred
    if (optimizations.prefersReducedMotion) {
      document.documentElement.style.setProperty("--animation-duration", "0s");
      document.documentElement.style.setProperty("--transition-duration", "0s");
    }

    // Apply image loading optimizations
    this.applyImageOptimizations(optimizations.lazyLoadingThreshold);

    // Apply connection-based optimizations
    this.applyConnectionOptimizations();

    // Apply memory-based optimizations
    this.applyMemoryOptimizations();

    // Apply platform classes to document
    const platformClasses = this.getPlatformClasses(device);
    document.documentElement.classList.add(...platformClasses);
  }

  /**
   * Get CSS custom properties for platform adaptations
   */
  getCSSCustomProperties(device: DeviceInfo): Record<string, string> {
    const adaptations = this.optimizationProvider.getUIAdaptations(device);
    const optimizations = this.optimizationProvider.getPlatformOptimizations(device);

    return {
      '--touch-target-size': `${adaptations.touchTargetSize}px`,
      '--font-size-multiplier': this.getFontSizeMultiplier(adaptations.fontSize).toString(),
      '--spacing-multiplier': this.getSpacingMultiplier(adaptations.spacing).toString(),
      '--animation-duration': optimizations.animationLevel === 'none' ? '0s' : '0.3s',
      '--transition-duration': optimizations.animationLevel === 'none' ? '0s' : '0.15s',
      '--border-radius': device.type === 'mobile' ? '8px' : '6px',
      '--shadow-intensity': device.type === 'mobile' ? '0.1' : '0.15',
    };
  }

  /**
   * Apply CSS custom properties to document
   */
  applyCSSCustomProperties(device: DeviceInfo): void {
    if (typeof document === "undefined") return;

    const properties = this.getCSSCustomProperties(device);
    
    Object.entries(properties).forEach(([property, value]) => {
      document.documentElement.style.setProperty(property, value);
    });
  }

  /**
   * Get platform-specific modal styles
   */
  getModalStyles(device: DeviceInfo): {
    maxWidth: string;
    maxHeight: string;
    borderRadius: string;
    padding: string;
  } {
    const adaptations = this.optimizationProvider.getUIAdaptations(device);

    if (adaptations.modalStyle === "fullscreen") {
      return {
        maxWidth: "100vw",
        maxHeight: "100vh",
        borderRadius: "0",
        padding: "1rem",
      };
    }

    if (device.type === "mobile") {
      return {
        maxWidth: "95vw",
        maxHeight: "90vh",
        borderRadius: "12px",
        padding: "1rem",
      };
    }

    return {
      maxWidth: "600px",
      maxHeight: "80vh",
      borderRadius: "8px",
      padding: "1.5rem",
    };
  }

  // Private helper methods

  private applyImageOptimizations(threshold: number): void {
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach((img) => {
      if (img instanceof HTMLImageElement) {
        img.style.setProperty("--loading-threshold", `${threshold}px`);
      }
    });
  }

  private applyConnectionOptimizations(): void {
    const connectionInfo = this.optimizationProvider.getConnectionOptimizations();
    
    if (connectionInfo.isSlowConnection) {
      document.documentElement.classList.add("slow-connection");
      
      // Reduce image quality for slow connections
      const images = document.querySelectorAll('img');
      images.forEach((img) => {
        if (img instanceof HTMLImageElement && img.src) {
          // Add quality parameter if supported
          const url = new URL(img.src, window.location.origin);
          if (!url.searchParams.has('q')) {
            url.searchParams.set('q', '70');
            img.src = url.toString();
          }
        }
      });
    }
  }

  private applyMemoryOptimizations(): void {
    const memoryInfo = this.optimizationProvider.getMemoryOptimizations();
    
    if (memoryInfo.shouldReduceQuality) {
      document.documentElement.classList.add("low-memory");
      
      // Reduce animation complexity
      document.documentElement.style.setProperty("--animation-complexity", "reduced");
    }
  }

  private getFontSizeMultiplier(fontSize: UIAdaptations["fontSize"]): number {
    switch (fontSize) {
      case "small": return 0.875;
      case "large": return 1.125;
      default: return 1;
    }
  }

  private getSpacingMultiplier(spacing: UIAdaptations["spacing"]): number {
    switch (spacing) {
      case "compact": return 0.75;
      case "comfortable": return 1.25;
      default: return 1;
    }
  }
}