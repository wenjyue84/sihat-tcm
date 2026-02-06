import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateMockPPGSignal, testBPMCalculation } from "./useCameraHeartRate";

describe("useCameraHeartRate", () => {
  describe("generateMockPPGSignal", () => {
    it("should generate a signal with the correct length", () => {
      const signal = generateMockPPGSignal(72, 30, 10);
      expect(signal.length).toBe(300); // 30 fps * 10 seconds
    });

    it("should generate values in a reasonable range (around 128)", () => {
      const signal = generateMockPPGSignal(72, 30, 10, 0.1);

      // Check all values are in a reasonable range
      signal.forEach((val) => {
        expect(val).toBeGreaterThan(100);
        expect(val).toBeLessThan(160);
      });
    });

    it("should produce different signals with different noise levels", () => {
      const lowNoise = generateMockPPGSignal(72, 30, 5, 0.01);
      const highNoise = generateMockPPGSignal(72, 30, 5, 0.5);

      // Calculate variance to compare
      const variance = (arr: number[]) => {
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        return arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / arr.length;
      };

      // High noise should have higher variance
      expect(variance(highNoise)).toBeGreaterThan(variance(lowNoise));
    });
  });

  describe("testBPMCalculation", () => {
    it("should calculate 60 BPM accurately", () => {
      const result = testBPMCalculation(60);

      expect(result.calculatedBpm).not.toBeNull();
      if (result.calculatedBpm !== null) {
        // Allow for small error due to FFT resolution
        expect(result.error).toBeLessThanOrEqual(5);
      }
    });

    it("should calculate 72 BPM (common resting rate) accurately", () => {
      const result = testBPMCalculation(72);

      expect(result.calculatedBpm).not.toBeNull();
      if (result.calculatedBpm !== null) {
        expect(result.error).toBeLessThanOrEqual(5);
      }
    });

    it("should calculate 90 BPM accurately", () => {
      const result = testBPMCalculation(90);

      expect(result.calculatedBpm).not.toBeNull();
      if (result.calculatedBpm !== null) {
        expect(result.error).toBeLessThanOrEqual(5);
      }
    });

    it("should calculate 120 BPM (high rate) accurately", () => {
      const result = testBPMCalculation(120);

      expect(result.calculatedBpm).not.toBeNull();
      if (result.calculatedBpm !== null) {
        expect(result.error).toBeLessThanOrEqual(6);
      }
    });

    it("should return quality score above 50 for valid signals", () => {
      const result = testBPMCalculation(72);

      expect(result.quality).toBeGreaterThanOrEqual(50);
    });

    it("should work across the normal heart rate range (50-180 BPM)", () => {
      const testBpms = [50, 60, 80, 100, 120, 150, 180];

      testBpms.forEach((targetBpm) => {
        const result = testBPMCalculation(targetBpm);

        // Log for debugging
        console.log(
          `Target: ${targetBpm}, Calculated: ${result.calculatedBpm}, Error: ${result.error}`
        );

        expect(result.calculatedBpm).not.toBeNull();
        if (result.calculatedBpm !== null) {
          // Higher BPMs may have slightly more error
          const allowedError = targetBpm > 120 ? 8 : 5;
          expect(result.error).toBeLessThanOrEqual(allowedError);
        }
      });
    });
  });

  describe("Signal Processing Edge Cases", () => {
    it("should handle very low BPM (bradycardia range)", () => {
      const result = testBPMCalculation(45);

      // Should still calculate, even at edge of valid range
      expect(result.calculatedBpm).not.toBeNull();
    });

    it("should handle high BPM (tachycardia range)", () => {
      const result = testBPMCalculation(180);

      expect(result.calculatedBpm).not.toBeNull();
    });
  });
});

// Mock tests for browser APIs (these would need jsdom environment)
describe("useCameraHeartRate Hook (Browser Environment)", () => {
  // These tests require a browser environment with MediaDevices API
  // In a real test setup, you would mock navigator.mediaDevices

  beforeEach(() => {
    // Mock navigator.mediaDevices
    Object.defineProperty(global.navigator, "mediaDevices", {
      writable: true,
      value: {
        getUserMedia: vi.fn(),
      },
    });

    Object.defineProperty(global.navigator, "userAgent", {
      writable: true,
      value:
        "Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 Chrome/91.0.4472.77 Mobile Safari/537.36",
    });
  });

  it("should detect Android Chrome correctly", () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = /android/.test(userAgent);
    const isChrome = /chrome/.test(userAgent) && !/edge|edg/.test(userAgent);

    expect(isAndroid).toBe(true);
    expect(isChrome).toBe(true);
  });

  it("should detect iOS Safari as unsupported", () => {
    Object.defineProperty(global.navigator, "userAgent", {
      writable: true,
      value:
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
    });

    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);

    expect(isIOS).toBe(true);
  });

  it("should detect desktop browsers as unsupported", () => {
    Object.defineProperty(global.navigator, "userAgent", {
      writable: true,
      value:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/91.0.4472.124 Safari/537.36",
    });

    const userAgent = navigator.userAgent.toLowerCase();
    const isAndroid = /android/.test(userAgent);
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isMobile = isAndroid || isIOS;

    expect(isMobile).toBe(false);
  });
});
