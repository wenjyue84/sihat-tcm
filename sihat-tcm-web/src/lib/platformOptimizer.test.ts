/**
 * Platform Optimizer Tests
 *
 * Comprehensive tests for the PlatformOptimizer utility and its features.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// Mock window and navigator before importing the module
const mockMatchMedia = vi.fn();
const mockWindow = {
  innerWidth: 1024,
  innerHeight: 768,
  devicePixelRatio: 1,
  matchMedia: mockMatchMedia,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  isSecureContext: true,
  location: { protocol: "https:", hostname: "localhost" },
};

const mockNavigator = {
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
  maxTouchPoints: 0,
  mediaDevices: { getUserMedia: vi.fn() },
  geolocation: {},
  vibrate: vi.fn(),
  language: "en-US",
};

const mockScreen = {
  width: 1920,
  height: 1080,
};

const mockDocument = {
  createElement: vi.fn(() => ({
    getContext: vi.fn(() => ({})),
  })),
  documentElement: {
    style: { setProperty: vi.fn() },
    classList: { add: vi.fn() },
  },
  querySelectorAll: vi.fn(() => []),
};

// Setup globals before importing
Object.defineProperty(global, "window", { writable: true, value: mockWindow });
Object.defineProperty(global, "navigator", { writable: true, value: mockNavigator });
Object.defineProperty(global, "screen", { writable: true, value: mockScreen });
Object.defineProperty(global, "document", { writable: true, value: mockDocument });

// Now import the module
import platformOptimizer from "./platformOptimizer";

describe("PlatformOptimizer", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default matchMedia mock
    mockMatchMedia.mockImplementation((query: string) => ({
      matches: query.includes("1024px") || query.includes("min-width: 1024px"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  afterEach(() => {
    platformOptimizer.cleanup();
  });

  describe("Device Detection", () => {
    it("should detect desktop device correctly", () => {
      const deviceInfo = platformOptimizer.getDeviceInfo();

      expect(deviceInfo.type).toBe("desktop");
      expect(deviceInfo.platform).toBe("web");
      expect(deviceInfo.hasTouch).toBe(false);
    });

    it("should detect mobile device from user agent", () => {
      mockNavigator.userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)";
      mockWindow.innerWidth = 375;
      mockWindow.innerHeight = 812;

      const deviceInfo = platformOptimizer.getDeviceInfo();

      expect(deviceInfo.type).toBe("mobile");
      expect(deviceInfo.platform).toBe("ios");
    });

    it("should detect touch capability", () => {
      mockNavigator.maxTouchPoints = 5;
      Object.defineProperty(window, "ontouchstart", {
        writable: true,
        value: true,
      });

      const deviceInfo = platformOptimizer.getDeviceInfo();

      expect(deviceInfo.hasTouch).toBe(true);
    });
  });

  describe("Breakpoint Management", () => {
    it("should check breakpoints correctly", () => {
      mockWindow.innerWidth = 1024;

      expect(platformOptimizer.isBreakpoint("lg")).toBe(true);
      expect(platformOptimizer.isBreakpoint("xl")).toBe(false);
    });

    it("should get current breakpoint correctly", () => {
      mockWindow.innerWidth = 768;

      expect(platformOptimizer.getCurrentBreakpoint()).toBe("md");
    });

    it("should handle xs breakpoint correctly", () => {
      mockWindow.innerWidth = 320;

      expect(platformOptimizer.getCurrentBreakpoint()).toBe("xs");
      expect(platformOptimizer.isBreakpoint("xs")).toBe(true);
    });
  });

  describe("Platform Optimizations", () => {
    it("should provide desktop optimizations", () => {
      mockWindow.innerWidth = 1920;
      mockWindow.innerHeight = 1080;

      const optimizations = platformOptimizer.getPlatformOptimizations();

      expect(optimizations.imageQuality).toBe("high");
      expect(optimizations.maxConcurrentRequests).toBe(6);
      expect(optimizations.cacheStrategy).toBe("moderate");
    });

    it("should provide mobile optimizations", () => {
      mockNavigator.userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)";
      mockWindow.innerWidth = 375;
      mockWindow.innerHeight = 812;

      const optimizations = platformOptimizer.getPlatformOptimizations();

      expect(optimizations.imageQuality).toBe("low");
      expect(optimizations.maxConcurrentRequests).toBe(3);
      expect(optimizations.cacheStrategy).toBe("aggressive");
    });
  });

  describe("Image Optimization", () => {
    it("should optimize image dimensions for desktop", () => {
      mockWindow.devicePixelRatio = 2;

      const optimized = platformOptimizer.getOptimizedImageDimensions(800, 600);

      expect(optimized.width).toBe(1600);
      expect(optimized.height).toBe(1200);
      expect(optimized.quality).toBeGreaterThan(0.8);
    });

    it("should maintain aspect ratio", () => {
      const originalRatio = 800 / 600;
      const optimized = platformOptimizer.getOptimizedImageDimensions(800, 600);
      const optimizedRatio = optimized.width / optimized.height;

      expect(Math.abs(originalRatio - optimizedRatio)).toBeLessThan(0.01);
    });
  });

  describe("Feature Support", () => {
    it("should detect WebGL support", () => {
      mockDocument.createElement.mockReturnValue({
        getContext: vi.fn(() => ({})), // Mock WebGL context
      });

      expect(platformOptimizer.supportsFeature("webgl")).toBe(true);
    });

    it("should detect media devices support", () => {
      expect(platformOptimizer.supportsFeature("mediaDevices")).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle missing window gracefully", () => {
      // Temporarily remove window
      const originalWindow = global.window;
      delete (global as any).window;

      const deviceInfo = platformOptimizer.getDeviceInfo();

      expect(deviceInfo.type).toBe("desktop");
      expect(deviceInfo.platform).toBe("unknown");

      // Restore window
      global.window = originalWindow;
    });
  });
});
