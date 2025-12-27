/**
 * React hooks for Platform Optimizer
 *
 * Provides React hooks to easily integrate platform optimization
 * features into components with proper state management and cleanup.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import platformOptimizer, {
  type DeviceInfo,
  type ResponsiveBreakpoints,
  type PlatformOptimizations,
  type UIAdaptations,
} from "@/lib/platformOptimizer";

/**
 * Hook to get device information with automatic updates
 */
export function useDeviceInfo(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => platformOptimizer.getDeviceInfo());

  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo(platformOptimizer.getDeviceInfo());
    };

    const handleOrientationChange = () => {
      // Small delay to ensure screen dimensions are updated
      setTimeout(() => {
        setDeviceInfo(platformOptimizer.getDeviceInfo());
      }, 100);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleOrientationChange);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleOrientationChange);
    };
  }, []);

  return deviceInfo;
}

/**
 * Hook to check if current viewport matches a breakpoint
 */
export function useBreakpoint(breakpoint: keyof ResponsiveBreakpoints): boolean {
  const [matches, setMatches] = useState(() => platformOptimizer.isBreakpoint(breakpoint));

  useEffect(() => {
    const unsubscribe = platformOptimizer.onBreakpointChange(breakpoint, setMatches);
    return unsubscribe;
  }, [breakpoint]);

  return matches;
}

/**
 * Hook to get current active breakpoint
 */
export function useCurrentBreakpoint(): keyof ResponsiveBreakpoints {
  const [currentBreakpoint, setCurrentBreakpoint] = useState<keyof ResponsiveBreakpoints>(() =>
    platformOptimizer.getCurrentBreakpoint()
  );

  useEffect(() => {
    const handleResize = () => {
      setCurrentBreakpoint(platformOptimizer.getCurrentBreakpoint());
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return currentBreakpoint;
}

/**
 * Hook for responsive breakpoint utilities
 */
export function useResponsive() {
  const isXs = useBreakpoint("xs");
  const isSm = useBreakpoint("sm");
  const isMd = useBreakpoint("md");
  const isLg = useBreakpoint("lg");
  const isXl = useBreakpoint("xl");
  const is2Xl = useBreakpoint("2xl");
  const currentBreakpoint = useCurrentBreakpoint();

  const isMobile = useMemo(() => !isMd, [isMd]);
  const isTablet = useMemo(() => isMd && !isLg, [isMd, isLg]);
  const isDesktop = useMemo(() => isLg, [isLg]);

  return {
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    is2Xl,
    currentBreakpoint,
    isMobile,
    isTablet,
    isDesktop,
  };
}

/**
 * Hook to get platform-specific optimizations
 */
export function usePlatformOptimizations(): PlatformOptimizations {
  const deviceInfo = useDeviceInfo();

  return useMemo(
    () => platformOptimizer.getPlatformOptimizations(),
    [deviceInfo.type, deviceInfo.platform, deviceInfo.pixelRatio]
  );
}

/**
 * Hook to get UI adaptations
 */
export function useUIAdaptations(): UIAdaptations {
  const deviceInfo = useDeviceInfo();

  return useMemo(
    () => platformOptimizer.getUIAdaptations(),
    [deviceInfo.type, deviceInfo.platform, deviceInfo.orientation, deviceInfo.hasTouch]
  );
}

/**
 * Hook to get platform-specific CSS classes
 */
export function usePlatformClasses(): string[] {
  const deviceInfo = useDeviceInfo();

  return useMemo(
    () => platformOptimizer.getPlatformClasses(),
    [
      deviceInfo.type,
      deviceInfo.platform,
      deviceInfo.browser,
      deviceInfo.hasTouch,
      deviceInfo.isStandalone,
    ]
  );
}

/**
 * Hook for media query matching
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [query]);

  return matches;
}

/**
 * Hook for touch device detection
 */
export function useTouch(): {
  hasTouch: boolean;
  isTouch: boolean;
  supportsHover: boolean;
} {
  const hasTouch = useMediaQuery("(pointer: coarse)");
  const supportsHover = useMediaQuery("(hover: hover)");
  const deviceInfo = useDeviceInfo();

  return {
    hasTouch: deviceInfo.hasTouch,
    isTouch: hasTouch,
    supportsHover,
  };
}

/**
 * Hook for reduced motion preference
 */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/**
 * Hook for dark mode preference
 */
export function useDarkMode(): boolean {
  return useMediaQuery("(prefers-color-scheme: dark)");
}

/**
 * Hook for high contrast preference
 */
export function useHighContrast(): boolean {
  return useMediaQuery("(prefers-contrast: high)");
}

/**
 * Hook to get optimized image dimensions
 */
export function useOptimizedImageDimensions(
  originalWidth: number,
  originalHeight: number
): { width: number; height: number; quality: number } {
  const deviceInfo = useDeviceInfo();

  return useMemo(
    () => platformOptimizer.getOptimizedImageDimensions(originalWidth, originalHeight),
    [originalWidth, originalHeight, deviceInfo.type, deviceInfo.pixelRatio]
  );
}

/**
 * Hook to get responsive font size
 */
export function useResponsiveFontSize(baseSize: number): number {
  const deviceInfo = useDeviceInfo();

  return useMemo(
    () => platformOptimizer.getResponsiveFontSize(baseSize),
    [baseSize, deviceInfo.type]
  );
}

/**
 * Hook to get optimal debounce delay
 */
export function useOptimalDebounce(
  inputType: "search" | "resize" | "scroll" | "input" = "input"
): number {
  const optimizations = usePlatformOptimizations();

  return useMemo(
    () => platformOptimizer.getOptimalDebounceDelay(inputType),
    [inputType, optimizations.debounceDelay]
  );
}

/**
 * Hook for feature support detection
 */
export function useFeatureSupport(): {
  supportsWebGL: boolean;
  supportsWebRTC: boolean;
  supportsMediaDevices: boolean;
  supportsGeolocation: boolean;
  supportsVibration: boolean;
  supportsNotifications: boolean;
  supportsServiceWorker: boolean;
} {
  const deviceInfo = useDeviceInfo();

  return useMemo(
    () => ({
      supportsWebGL: deviceInfo.capabilities.webgl,
      supportsWebRTC: deviceInfo.capabilities.webrtc,
      supportsMediaDevices: deviceInfo.capabilities.mediaDevices,
      supportsGeolocation: deviceInfo.capabilities.geolocation,
      supportsVibration: deviceInfo.capabilities.vibration,
      supportsNotifications: deviceInfo.capabilities.notifications,
      supportsServiceWorker: deviceInfo.capabilities.serviceWorker,
    }),
    [deviceInfo.capabilities]
  );
}

/**
 * Hook to apply platform optimizations on mount
 */
export function usePlatformOptimizationEffect(): void {
  useEffect(() => {
    platformOptimizer.applyPerformanceOptimizations();
  }, []);
}

/**
 * Hook for orientation detection
 */
export function useOrientation(): {
  orientation: "portrait" | "landscape";
  isPortrait: boolean;
  isLandscape: boolean;
} {
  const deviceInfo = useDeviceInfo();

  return useMemo(
    () => ({
      orientation: deviceInfo.orientation,
      isPortrait: deviceInfo.orientation === "portrait",
      isLandscape: deviceInfo.orientation === "landscape",
    }),
    [deviceInfo.orientation]
  );
}

/**
 * Hook for standalone app detection (PWA)
 */
export function useStandalone(): boolean {
  const deviceInfo = useDeviceInfo();
  return deviceInfo.isStandalone;
}

/**
 * Comprehensive platform hook that combines multiple platform features
 */
export function usePlatform() {
  const deviceInfo = useDeviceInfo();
  const responsive = useResponsive();
  const optimizations = usePlatformOptimizations();
  const adaptations = useUIAdaptations();
  const platformClasses = usePlatformClasses();
  const touch = useTouch();
  const reducedMotion = useReducedMotion();
  const featureSupport = useFeatureSupport();
  const orientation = useOrientation();

  return {
    device: deviceInfo,
    responsive,
    optimizations,
    adaptations,
    platformClasses,
    touch,
    reducedMotion,
    featureSupport,
    orientation,
    // Utility functions
    getOptimizedImageDimensions: useCallback(
      (width: number, height: number) =>
        platformOptimizer.getOptimizedImageDimensions(width, height),
      [deviceInfo.type, deviceInfo.pixelRatio]
    ),
    getResponsiveFontSize: useCallback(
      (baseSize: number) => platformOptimizer.getResponsiveFontSize(baseSize),
      [deviceInfo.type]
    ),
    getOptimalDebounceDelay: useCallback(
      (inputType: "search" | "resize" | "scroll" | "input" = "input") =>
        platformOptimizer.getOptimalDebounceDelay(inputType),
      [optimizations.debounceDelay]
    ),
  };
}
