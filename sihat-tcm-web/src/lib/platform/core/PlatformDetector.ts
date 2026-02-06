/**
 * Platform Detector
 *
 * Handles device and platform detection with capability checking.
 * Provides comprehensive information about the user's device, browser,
 * and available features.
 */

import {
  DeviceInfo,
  IPlatformDetector,
  ResponsiveBreakpoints,
} from "../interfaces/PlatformInterfaces";

export class PlatformDetector implements IPlatformDetector {
  private breakpoints: ResponsiveBreakpoints;

  constructor(breakpoints: ResponsiveBreakpoints) {
    this.breakpoints = breakpoints;
  }

  /**
   * Detect comprehensive device information and capabilities
   */
  detectDevice(): DeviceInfo {
    if (typeof window === "undefined") {
      return this.getServerSideDefaults();
    }

    const userAgent = navigator.userAgent.toLowerCase();
    const screen = window.screen;

    return {
      type: this.detectDeviceType(userAgent),
      platform: this.detectPlatform(userAgent),
      browser: this.detectBrowser(userAgent),
      hasTouch: this.detectTouchCapability(),
      isStandalone: this.detectStandaloneMode(),
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      pixelRatio: window.devicePixelRatio || 1,
      orientation: this.detectOrientation(),
      capabilities: {
        webgl: this.checkWebGLSupport(),
        webrtc: this.checkWebRTCSupport(),
        mediaDevices: this.checkMediaDevicesSupport(),
        geolocation: this.checkGeolocationSupport(),
        vibration: this.checkVibrationSupport(),
        notifications: this.checkNotificationSupport(),
        serviceWorker: this.checkServiceWorkerSupport(),
      },
    };
  }

  /**
   * Check WebGL support
   */
  checkWebGLSupport(): boolean {
    if (typeof window === "undefined") return false;

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
  checkWebRTCSupport(): boolean {
    if (typeof window === "undefined") return false;

    return !!(
      window.RTCPeerConnection ||
      (window as any).webkitRTCPeerConnection ||
      (window as any).mozRTCPeerConnection
    );
  }

  // Private helper methods

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

  private detectDeviceType(userAgent: string): DeviceInfo["type"] {
    const width = Math.max(window.screen?.width || 0, window.innerWidth || 0);

    if (width < this.breakpoints.md || /mobile/.test(userAgent)) {
      return "mobile";
    } else if (width < this.breakpoints.lg || /tablet|ipad/.test(userAgent)) {
      return "tablet";
    }
    return "desktop";
  }

  private detectPlatform(userAgent: string): DeviceInfo["platform"] {
    if (/iphone|ipad|ipod/.test(userAgent)) {
      return "ios";
    } else if (/android/.test(userAgent)) {
      return "android";
    }
    return "web";
  }

  private detectBrowser(userAgent: string): DeviceInfo["browser"] {
    if (/chrome/.test(userAgent) && !/edge|edg/.test(userAgent)) {
      return "chrome";
    } else if (/safari/.test(userAgent) && !/chrome/.test(userAgent)) {
      return "safari";
    } else if (/firefox/.test(userAgent)) {
      return "firefox";
    } else if (/edge|edg/.test(userAgent)) {
      return "edge";
    }
    return "unknown";
  }

  private detectTouchCapability(): boolean {
    return "ontouchstart" in window || navigator.maxTouchPoints > 0;
  }

  private detectStandaloneMode(): boolean {
    return window.matchMedia("(display-mode: standalone)").matches;
  }

  private detectOrientation(): DeviceInfo["orientation"] {
    return window.innerWidth > window.innerHeight ? "landscape" : "portrait";
  }

  private checkMediaDevicesSupport(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
  }

  private checkGeolocationSupport(): boolean {
    return !!navigator.geolocation;
  }

  private checkVibrationSupport(): boolean {
    return !!navigator.vibrate;
  }

  private checkNotificationSupport(): boolean {
    return "Notification" in window;
  }

  private checkServiceWorkerSupport(): boolean {
    return "serviceWorker" in navigator;
  }
}
