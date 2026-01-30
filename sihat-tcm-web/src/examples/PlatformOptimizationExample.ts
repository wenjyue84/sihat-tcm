/**
 * Platform Optimization System Usage Examples
 * 
 * Demonstrates how to use the refactored platform optimization system
 * for device detection, responsive design, and performance optimizations.
 */

import { 
  PlatformOptimizer,
  defaultPlatformOptimizer,
  createPlatformOptimizer,
  isMobileDevice,
  isTabletDevice,
  hasTouchCapability,
  getScreenOrientation,
  getPlatformOptimizations,
  getUIAdaptations,
  supportsFeature
} from '../lib/platform';

/**
 * Example 1: Basic Platform Detection
 */
export function basicPlatformDetectionExample() {
  console.log('=== Basic Platform Detection ===');
  
  // Get device information
  const deviceInfo = defaultPlatformOptimizer.getDeviceInfo();
  console.log('Device Type:', deviceInfo.type);
  console.log('Platform:', deviceInfo.platform);
  console.log('Browser:', deviceInfo.browser);
  console.log('Has Touch:', deviceInfo.hasTouch);
  console.log('Screen Size:', deviceInfo.screenSize);
  console.log('Pixel Ratio:', deviceInfo.pixelRatio);
  
  // Use convenience functions
  console.log('Is Mobile:', isMobileDevice());
  console.log('Is Tablet:', isTabletDevice());
  console.log('Has Touch:', hasTouchCapability());
  console.log('Orientation:', getScreenOrientation());
}

/**
 * Example 2: Responsive Breakpoint Management
 */
export function responsiveBreakpointExample() {
  console.log('=== Responsive Breakpoint Management ===');
  
  // Check current breakpoint
  const currentBreakpoint = defaultPlatformOptimizer.getCurrentBreakpoint();
  console.log('Current Breakpoint:', currentBreakpoint);
  
  // Check specific breakpoints
  console.log('Is Mobile (sm):', defaultPlatformOptimizer.isBreakpoint('sm'));
  console.log('Is Desktop (lg):', defaultPlatformOptimizer.isBreakpoint('lg'));
  
  // Listen for breakpoint changes
  const unsubscribe = defaultPlatformOptimizer.onBreakpointChange('md', (matches) => {
    console.log('Medium breakpoint changed:', matches);
    if (matches) {
      console.log('Switched to tablet/desktop view');
    } else {
      console.log('Switched to mobile view');
    }
  });
  
  // Clean up listener when component unmounts
  // unsubscribe();
}

/**
 * Example 3: Platform-Specific Optimizations
 */
export function platformOptimizationsExample() {
  console.log('=== Platform-Specific Optimizations ===');
  
  // Get platform optimizations
  const optimizations = getPlatformOptimizations();
  console.log('Image Quality:', optimizations.imageQuality);
  console.log('Animation Level:', optimizations.animationLevel);
  console.log('Max Concurrent Requests:', optimizations.maxConcurrentRequests);
  console.log('Cache Strategy:', optimizations.cacheStrategy);
  console.log('Debounce Delay:', optimizations.debounceDelay);
  
  // Get UI adaptations
  const adaptations = getUIAdaptations();
  console.log('Touch Target Size:', adaptations.touchTargetSize);
  console.log('Font Size:', adaptations.fontSize);
  console.log('Navigation Style:', adaptations.navigationStyle);
  console.log('Modal Style:', adaptations.modalStyle);
}

/**
 * Example 4: Feature Detection
 */
export function featureDetectionExample() {
  console.log('=== Feature Detection ===');
  
  // Check device capabilities
  console.log('WebGL Support:', supportsFeature('webgl'));
  console.log('WebRTC Support:', supportsFeature('webrtc'));
  console.log('Media Devices:', supportsFeature('mediaDevices'));
  console.log('Geolocation:', supportsFeature('geolocation'));
  console.log('Vibration:', supportsFeature('vibration'));
  console.log('Notifications:', supportsFeature('notifications'));
  console.log('Service Worker:', supportsFeature('serviceWorker'));
}

/**
 * Example 5: Image Optimization
 */
export function imageOptimizationExample() {
  console.log('=== Image Optimization ===');
  
  // Original image dimensions
  const originalWidth = 1920;
  const originalHeight = 1080;
  
  // Get optimized dimensions for current device
  const optimized = defaultPlatformOptimizer.getOptimizedImageDimensions(
    originalWidth,
    originalHeight
  );
  
  console.log('Original:', `${originalWidth}x${originalHeight}`);
  console.log('Optimized:', `${optimized.width}x${optimized.height}`);
  console.log('Quality:', optimized.quality);
  
  // Use in image loading
  const imageUrl = `https://example.com/image.jpg?w=${optimized.width}&h=${optimized.height}&q=${Math.round(optimized.quality * 100)}`;
  console.log('Optimized URL:', imageUrl);
}

/**
 * Example 6: Performance Optimizations
 */
export function performanceOptimizationsExample() {
  console.log('=== Performance Optimizations ===');
  
  // Apply platform-specific performance optimizations
  defaultPlatformOptimizer.applyPerformanceOptimizations();
  
  // Get optimal debounce delays for different input types
  const searchDelay = defaultPlatformOptimizer.getOptimalDebounceDelay('search');
  const scrollDelay = defaultPlatformOptimizer.getOptimalDebounceDelay('scroll');
  const resizeDelay = defaultPlatformOptimizer.getOptimalDebounceDelay('resize');
  
  console.log('Search Debounce:', searchDelay + 'ms');
  console.log('Scroll Debounce:', scrollDelay + 'ms');
  console.log('Resize Debounce:', resizeDelay + 'ms');
  
  // Get platform-specific CSS classes
  const cssClasses = defaultPlatformOptimizer.getPlatformClasses();
  console.log('Platform CSS Classes:', cssClasses);
  
  // Apply CSS custom properties
  defaultPlatformOptimizer.applyCSSCustomProperties();
}

/**
 * Example 7: Custom Platform Optimizer Configuration
 */
export function customConfigurationExample() {
  console.log('=== Custom Configuration ===');
  
  // Create a custom platform optimizer with specific configuration
  const customOptimizer = createPlatformOptimizer({
    breakpoints: {
      xs: 0,
      sm: 576,
      md: 768,
      lg: 992,
      xl: 1200,
      "2xl": 1400,
    },
    enableAutoDetection: true,
    enablePerformanceOptimizations: true,
    enableAccessibilityFeatures: true,
  });
  
  // Use the custom optimizer
  const deviceInfo = customOptimizer.getDeviceInfo();
  console.log('Custom Optimizer Device Info:', deviceInfo.type);
  
  // Get system information
  const systemInfo = customOptimizer.getSystemInfo();
  console.log('System Info:', {
    device: systemInfo.device.type,
    activeBreakpoints: systemInfo.activeBreakpoints,
    optimizations: systemInfo.optimizations.imageQuality,
  });
}

/**
 * Example 8: React Component Integration
 */
export function reactComponentExample() {
  console.log('=== React Component Integration ===');
  
  // Example of how to use in a React component
  const componentCode = `
import { useEffect, useState } from 'react';
import { defaultPlatformOptimizer } from '@/lib/platform';

export function ResponsiveComponent() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    // Initial check
    const deviceInfo = defaultPlatformOptimizer.getDeviceInfo();
    setIsMobile(deviceInfo.type === 'mobile');
    
    // Listen for breakpoint changes
    const unsubscribe = defaultPlatformOptimizer.onBreakpointChange('md', (matches) => {
      setIsMobile(!matches);
    });
    
    // Apply platform optimizations
    defaultPlatformOptimizer.applyPerformanceOptimizations();
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Get platform-specific styles
  const modalStyles = defaultPlatformOptimizer.getModalStyles();
  const platformClasses = defaultPlatformOptimizer.getPlatformClasses();
  
  return (
    <div className={platformClasses.join(' ')}>
      {isMobile ? (
        <MobileLayout />
      ) : (
        <DesktopLayout />
      )}
      <Modal style={modalStyles}>
        Modal content
      </Modal>
    </div>
  );
}
  `;
  
  console.log('React Component Example:');
  console.log(componentCode);
}

/**
 * Example 9: CSS Integration
 */
export function cssIntegrationExample() {
  console.log('=== CSS Integration ===');
  
  // Get CSS custom properties
  const cssProperties = defaultPlatformOptimizer.getCSSCustomProperties();
  console.log('CSS Custom Properties:', cssProperties);
  
  // Example CSS that uses the custom properties
  const cssCode = `
/* Platform-adaptive styles using custom properties */
.button {
  min-height: var(--touch-target-size);
  font-size: calc(1rem * var(--font-size-multiplier));
  padding: calc(0.5rem * var(--spacing-multiplier));
  border-radius: var(--border-radius);
  transition-duration: var(--transition-duration);
}

/* Platform-specific styles */
.device-mobile .button {
  width: 100%;
}

.device-desktop .button {
  width: auto;
}

.has-touch .button {
  min-height: 48px;
}

.slow-connection .image {
  filter: blur(2px);
  transition: filter 0.3s ease;
}

.slow-connection .image.loaded {
  filter: none;
}
  `;
  
  console.log('CSS Integration Example:');
  console.log(cssCode);
}

/**
 * Run all examples
 */
export function runAllPlatformExamples() {
  console.log('🚀 Platform Optimization System Examples\n');
  
  basicPlatformDetectionExample();
  console.log('\n');
  
  responsiveBreakpointExample();
  console.log('\n');
  
  platformOptimizationsExample();
  console.log('\n');
  
  featureDetectionExample();
  console.log('\n');
  
  imageOptimizationExample();
  console.log('\n');
  
  performanceOptimizationsExample();
  console.log('\n');
  
  customConfigurationExample();
  console.log('\n');
  
  reactComponentExample();
  console.log('\n');
  
  cssIntegrationExample();
  
  console.log('\n✅ All platform optimization examples completed!');
}

// Export for use in development/testing
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).platformExamples = {
    runAll: runAllPlatformExamples,
    basic: basicPlatformDetectionExample,
    responsive: responsiveBreakpointExample,
    optimizations: platformOptimizationsExample,
    features: featureDetectionExample,
    images: imageOptimizationExample,
    performance: performanceOptimizationsExample,
    custom: customConfigurationExample,
    react: reactComponentExample,
    css: cssIntegrationExample,
  };
}