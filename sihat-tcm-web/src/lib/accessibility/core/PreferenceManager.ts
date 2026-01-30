/**
 * Preference Manager
 * 
 * Manages accessibility preferences including system detection,
 * user customization, and preference persistence.
 */

import {
  AccessibilityPreferences,
  SystemAccessibilityPreferences,
  ScreenReaderDetection
} from "../interfaces/AccessibilityInterfaces";

export class PreferenceManager {
  private preferences: AccessibilityPreferences;
  private initialPreferences: Partial<AccessibilityPreferences>;
  private systemPreferences: SystemAccessibilityPreferences;

  private listeners: ((preferences: AccessibilityPreferences) => void)[] = [];

  constructor(initialPreferences?: Partial<AccessibilityPreferences>) {
    this.initialPreferences = initialPreferences || {};

    // Default preferences
    this.preferences = {
      highContrast: false,
      reducedMotion: false,
      screenReaderEnabled: false,
      keyboardNavigation: true,
      fontSize: "medium",
      focusIndicatorStyle: "default",
      announcements: true,
      colorBlindnessSupport: false,
      autoplayMedia: true,
      animationSpeed: "normal",
      textSpacing: "normal",
      ...initialPreferences
    };

    this.systemPreferences = {
      prefersReducedMotion: false,
      prefersHighContrast: false,
      prefersColorScheme: "no-preference"
    };

    this.initialize();
  }

  /**
   * Initialize preference detection and monitoring
   */
  private initialize(): void {
    if (typeof window === "undefined") return;

    this.detectSystemPreferences();
    this.setupPreferenceMonitoring();
    this.loadPreferences();
    this.applySystemPreferences();
  }

  /**
   * Detect system accessibility preferences
   */
  public detectSystemPreferences(): Partial<AccessibilityPreferences> {
    if (typeof window === "undefined") return {};

    // Detect reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    this.systemPreferences.prefersReducedMotion = prefersReducedMotion.matches;

    // Detect high contrast preference
    const prefersHighContrast = window.matchMedia("(prefers-contrast: high)");
    this.systemPreferences.prefersHighContrast = prefersHighContrast.matches;

    // Detect color scheme preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)");

    if (prefersDark.matches) {
      this.systemPreferences.prefersColorScheme = "dark";
    } else if (prefersLight.matches) {
      this.systemPreferences.prefersColorScheme = "light";
    } else {
      this.systemPreferences.prefersColorScheme = "no-preference";
    }

    // Detect screen reader
    const screenReaderDetection = this.detectScreenReader();
    this.preferences.screenReaderEnabled = screenReaderDetection.isDetected;

    return {
      reducedMotion: this.systemPreferences.prefersReducedMotion,
      highContrast: this.systemPreferences.prefersHighContrast,
      screenReaderEnabled: screenReaderDetection.isDetected,
    };
  }

  /**
   * Setup monitoring for system preference changes
   */
  private setupPreferenceMonitoring(): void {
    if (typeof window === "undefined") return;

    // Monitor reduced motion changes
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    prefersReducedMotion.addEventListener("change", (e) => {
      this.systemPreferences.prefersReducedMotion = e.matches;
      if (!("reducedMotion" in this.initialPreferences)) {
        this.updatePreferences({ reducedMotion: e.matches });
      }
    });

    // Monitor high contrast changes
    const prefersHighContrast = window.matchMedia("(prefers-contrast: high)");
    prefersHighContrast.addEventListener("change", (e) => {
      this.systemPreferences.prefersHighContrast = e.matches;
      if (!("highContrast" in this.initialPreferences)) {
        this.updatePreferences({ highContrast: e.matches });
      }
    });

    // Monitor color scheme changes
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
    prefersDark.addEventListener("change", () => {
      this.detectSystemPreferences();
    });
  }

  /**
   * Detect screen reader usage using heuristics
   */
  private detectScreenReader(): ScreenReaderDetection {
    if (typeof navigator === "undefined") {
      return { isDetected: false, detectionMethod: "none", confidence: "low" };
    }

    // Check for common screen reader user agents
    const userAgent = navigator.userAgent.toLowerCase();
    const screenReaderIndicators = [
      "nvda", "jaws", "dragon", "zoomtext", "magic", "supernova",
      "narrator", "voiceover", "talkback", "orca"
    ];

    const hasScreenReaderUA = screenReaderIndicators.some(indicator =>
      userAgent.includes(indicator)
    );

    if (hasScreenReaderUA) {
      return { isDetected: true, detectionMethod: "userAgent", confidence: "high" };
    }

    // Check for screen reader APIs
    const hasScreenReaderAPI = "speechSynthesis" in window || "webkitSpeechSynthesis" in window;

    if (hasScreenReaderAPI) {
      return { isDetected: true, detectionMethod: "api", confidence: "medium" };
    }

    // Heuristic detection based on navigation patterns
    const hasHighTabIndex = document.querySelectorAll('[tabindex]').length > 10;
    const hasAriaLabels = document.querySelectorAll('[aria-label]').length > 5;

    if (hasHighTabIndex && hasAriaLabels) {
      return { isDetected: true, detectionMethod: "heuristic", confidence: "low" };
    }

    return { isDetected: false, detectionMethod: "none", confidence: "low" };
  }

  /**
   * Apply system preferences to user preferences (if not overridden)
   */
  private applySystemPreferences(): void {
    const updates: Partial<AccessibilityPreferences> = {};

    if (!("reducedMotion" in this.initialPreferences)) {
      updates.reducedMotion = this.systemPreferences.prefersReducedMotion;
    }

    if (!("highContrast" in this.initialPreferences)) {
      updates.highContrast = this.systemPreferences.prefersHighContrast;
    }

    if (Object.keys(updates).length > 0) {
      this.updatePreferences(updates);
    }
  }

  /**
   * Load stored preferences from localStorage
   */
  public loadPreferences(): void {
    if (typeof localStorage === "undefined") return;

    try {
      const stored = localStorage.getItem("accessibility-preferences");
      if (stored) {
        const storedPreferences = JSON.parse(stored);
        this.preferences = { ...this.preferences, ...storedPreferences };
        this.notifyListeners();
      }
    } catch (error) {
      console.warn("Failed to load accessibility preferences:", error);
    }
  }

  /**
   * Save preferences to localStorage
   */
  public savePreferences(): void {
    if (typeof localStorage === "undefined") return;

    try {
      localStorage.setItem("accessibility-preferences", JSON.stringify(this.preferences));
    } catch (error) {
      console.warn("Failed to save accessibility preferences:", error);
    }
  }

  /**
   * Update accessibility preferences
   */
  public updatePreferences(newPreferences: Partial<AccessibilityPreferences>): void {
    this.preferences = { ...this.preferences, ...newPreferences };
    this.savePreferences();
    this.notifyListeners();
  }

  /**
   * Get current accessibility preferences
   */
  public getPreferences(): AccessibilityPreferences {
    return { ...this.preferences };
  }

  /**
   * Get system accessibility preferences
   */
  public getSystemPreferences(): SystemAccessibilityPreferences {
    return { ...this.systemPreferences };
  }

  /**
   * Reset preferences to defaults
   */
  public resetPreferences(): void {
    this.preferences = {
      highContrast: false,
      reducedMotion: false,
      screenReaderEnabled: false,
      keyboardNavigation: true,
      fontSize: "medium",
      focusIndicatorStyle: "default",
      announcements: true,
      colorBlindnessSupport: false,
      autoplayMedia: true,
      animationSpeed: "normal",
      textSpacing: "normal",
      ...this.initialPreferences
    };

    this.applySystemPreferences();
    this.savePreferences();
    this.notifyListeners();
  }

  /**
   * Register a preference change listener
   */
  public onPreferenceChange(callback: (preferences: AccessibilityPreferences) => void): () => void {
    this.listeners.push(callback);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Notify all listeners of preference changes
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.getPreferences());
      } catch (error) {
        console.error("Error in accessibility preference listener:", error);
      }
    });
  }

  /**
   * Check if preference is user-customized or system-derived
   */
  public isPreferenceCustomized(preference: keyof AccessibilityPreferences): boolean {
    return preference in this.initialPreferences;
  }

  /**
   * Get preference source information
   */
  public getPreferenceSource(preference: keyof AccessibilityPreferences): "user" | "system" | "default" {
    if (preference in this.initialPreferences) {
      return "user";
    }

    // Check if it matches system preference
    switch (preference) {
      case "reducedMotion":
        return this.preferences.reducedMotion === this.systemPreferences.prefersReducedMotion
          ? "system" : "default";
      case "highContrast":
        return this.preferences.highContrast === this.systemPreferences.prefersHighContrast
          ? "system" : "default";
      default:
        return "default";
    }
  }

  /**
   * Export preferences for backup/sync
   */
  public exportPreferences(): string {
    return JSON.stringify({
      preferences: this.preferences,
      timestamp: Date.now(),
      version: "1.0"
    });
  }

  /**
   * Import preferences from backup/sync
   */
  public importPreferences(data: string): boolean {
    try {
      const imported = JSON.parse(data);

      if (imported.preferences && typeof imported.preferences === "object") {
        this.updatePreferences(imported.preferences);
        return true;
      }

      return false;
    } catch (error) {
      console.warn("Failed to import accessibility preferences:", error);
      return false;
    }
  }
}
