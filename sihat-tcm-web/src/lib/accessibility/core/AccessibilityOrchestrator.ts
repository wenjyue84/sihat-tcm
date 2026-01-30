/**
 * Accessibility Orchestrator
 * 
 * Central orchestrator for managing all accessibility features with
 * WCAG 2.1 AA compliance and comprehensive accessibility support.
 */

import { logger } from "@/lib/clientLogger";
import { FocusManager } from "./FocusManager";
import { PreferenceManager } from "./PreferenceManager";
import { AnnouncementManager } from "./AnnouncementManager";
import { KeyboardNavigationManager } from "./KeyboardNavigationManager";
import { WCAGValidator } from "./WCAGValidator";
import type {
  AccessibilityManager,
  AccessibilityPreferences,
  AccessibilityConfig,
  AccessibilityMetrics,
  AccessibilityEvent,
  WCAGComplianceResult,
  AccessibilityEventType
} from "../interfaces/AccessibilityInterfaces";

/**
 * Accessibility orchestrator implementation
 */
export class AccessibilityOrchestrator implements AccessibilityManager {
  private focusManager: FocusManager;
  private preferenceManager: PreferenceManager;
  private announcementManager: AnnouncementManager;
  private keyboardNavigationManager: KeyboardNavigationManager;
  private wcagValidator: WCAGValidator;
  private config: AccessibilityConfig;
  private metrics: AccessibilityMetrics;
  private eventHistory: AccessibilityEvent[] = [];
  private eventListeners: Map<AccessibilityEventType, ((event: AccessibilityEvent) => void)[]> = new Map();
  private initialized: boolean = false;

  constructor(config: Partial<AccessibilityConfig> = {}) {
    this.config = {
      enabled: true,
      autoDetectPreferences: true,
      persistPreferences: true,
      enableMetrics: true,
      enableValidation: true,
      validationInterval: 30000, // 30 seconds
      announcePageChanges: true,
      announceFormErrors: true,
      enableSkipLinks: true,
      enableFocusTrap: true,
      customCSS: '',
      ...config,
    };

    this.metrics = {
      complianceScore: 0,
      totalIssues: 0,
      criticalIssues: 0,
      keyboardNavigationUsage: 0,
      screenReaderUsage: 0,
      highContrastUsage: 0,
      reducedMotionUsage: 0,
      announcementsMade: 0,
      focusChanges: 0,
      skipLinkUsage: 0,
    };

    this.initializeManagers();
  }

  /**
   * Initialize all accessibility managers
   */
  private initializeManagers(): void {
    try {
      this.focusManager = new FocusManager();
      this.preferenceManager = new PreferenceManager();
      this.announcementManager = new AnnouncementManager();
      this.keyboardNavigationManager = new KeyboardNavigationManager();
      this.wcagValidator = new WCAGValidator();

      if (this.config.enabled) {
        logger.info("AccessibilityOrchestrator", "Managers initialized successfully");
      }
    } catch (error) {
      logger.error("AccessibilityOrchestrator", "Failed to initialize managers", error);
      throw error;
    }
  }

  /**
   * Initialize the accessibility system
   */
  public initialize(preferences?: Partial<AccessibilityPreferences>): void {
    if (this.initialized) {
      logger.warn("AccessibilityOrchestrator", "Already initialized");
      return;
    }

    if (!this.config.enabled) {
      logger.info("AccessibilityOrchestrator", "Accessibility system disabled");
      return;
    }

    try {
      // Initialize preference manager first
      if (preferences) {
        this.preferenceManager.updatePreferences(preferences);
      }

      // Initialize other managers
      this.setupKeyboardNavigation();
      this.setupFocusManagement();
      this.setupAnnouncements();
      this.setupValidation();
      this.setupEventTracking();
      this.applyInitialPreferences();

      this.initialized = true;

      this.emitEvent({
        type: "preference_changed",
        timestamp: Date.now(),
        data: { initialized: true },
        source: "AccessibilityOrchestrator",
      });

      logger.info("AccessibilityOrchestrator", "Accessibility system initialized");
    } catch (error) {
      logger.error("AccessibilityOrchestrator", "Failed to initialize accessibility system", error);
      throw error;
    }
  }

  /**
   * Setup keyboard navigation
   */
  private setupKeyboardNavigation(): void {
    this.keyboardNavigationManager.initialize({
      enabled: true,
      skipLinks: this.config.enableSkipLinks,
      customKeyBindings: {},
      focusVisible: true,
      tabTrapEnabled: this.config.enableFocusTrap,
    });

    // Track keyboard navigation usage
    this.keyboardNavigationManager.addKeyBinding({
      keys: ['Tab'],
      handler: () => {
        this.metrics.keyboardNavigationUsage++;
        this.emitEvent({
          type: "navigation_occurred",
          timestamp: Date.now(),
          data: { method: 'keyboard', key: 'Tab' },
          source: "KeyboardNavigationManager",
        });
      },
      description: "Tab navigation tracking",
    });
  }

  /**
   * Setup focus management
   */
  private setupFocusManagement(): void {
    // Track focus changes
    if (typeof document !== "undefined") {
      document.addEventListener("focusin", () => {
        this.metrics.focusChanges++;
        this.emitEvent({
          type: "focus_changed",
          timestamp: Date.now(),
          data: { element: document.activeElement?.tagName },
          source: "FocusManager",
        });
      });
    }
  }

  /**
   * Setup announcements
   */
  private setupAnnouncements(): void {
    // Track announcements
    const originalAnnounce = this.announcementManager.announce.bind(this.announcementManager);
    this.announcementManager.announce = (announcement) => {
      this.metrics.announcementsMade++;
      this.emitEvent({
        type: "announcement_made",
        timestamp: Date.now(),
        data: { 
          message: announcement.message,
          priority: announcement.priority,
          category: announcement.category,
        },
        source: "AnnouncementManager",
      });
      return originalAnnounce(announcement);
    };
  }

  /**
   * Setup WCAG validation
   */
  private setupValidation(): void {
    if (!this.config.enableValidation) return;

    // Run periodic validation
    setInterval(() => {
      this.runComplianceCheck();
    }, this.config.validationInterval);

    // Run initial validation
    setTimeout(() => {
      this.runComplianceCheck();
    }, 1000);
  }

  /**
   * Setup event tracking
   */
  private setupEventTracking(): void {
    if (!this.config.enableMetrics) return;

    // Track preference changes
    this.preferenceManager.onPreferenceChange((preferences) => {
      this.updateMetricsFromPreferences(preferences);
      this.emitEvent({
        type: "preference_changed",
        timestamp: Date.now(),
        data: { preferences },
        source: "PreferenceManager",
      });
    });
  }

  /**
   * Apply initial preferences
   */
  private applyInitialPreferences(): void {
    const preferences = this.preferenceManager.getPreferences();
    this.applyPreferences(preferences);
    this.updateMetricsFromPreferences(preferences);
  }

  /**
   * Update metrics based on preferences
   */
  private updateMetricsFromPreferences(preferences: AccessibilityPreferences): void {
    if (preferences.screenReaderEnabled) {
      this.metrics.screenReaderUsage++;
    }
    if (preferences.highContrast) {
      this.metrics.highContrastUsage++;
    }
    if (preferences.reducedMotion) {
      this.metrics.reducedMotionUsage++;
    }
  }

  /**
   * Run compliance check
   */
  private runComplianceCheck(): void {
    try {
      const result = this.wcagValidator.validatePage();
      this.metrics.complianceScore = result.score;
      this.metrics.totalIssues = result.issues.length;
      this.metrics.criticalIssues = result.issues.filter(issue => issue.severity === 'critical').length;

      this.emitEvent({
        type: "compliance_checked",
        timestamp: Date.now(),
        data: { result },
        source: "WCAGValidator",
      });

      if (result.issues.length > 0) {
        logger.warn("AccessibilityOrchestrator", "WCAG compliance issues found", {
          totalIssues: result.issues.length,
          criticalIssues: this.metrics.criticalIssues,
          score: result.score,
        });
      }
    } catch (error) {
      this.emitEvent({
        type: "error_detected",
        timestamp: Date.now(),
        data: { error: error.message },
        source: "WCAGValidator",
      });

      logger.error("AccessibilityOrchestrator", "Failed to run compliance check", error);
    }
  }

  /**
   * Emit accessibility event
   */
  private emitEvent(event: Omit<AccessibilityEvent, "id">): void {
    const fullEvent: AccessibilityEvent = {
      ...event,
      id: `acc-event-${Date.now()}-${Math.random()}`,
    };

    // Add to history
    this.eventHistory.push(fullEvent);
    
    // Trim history if too long
    if (this.eventHistory.length > 1000) {
      this.eventHistory.shift();
    }

    // Notify listeners
    const listeners = this.eventListeners.get(event.type) || [];
    listeners.forEach(listener => {
      try {
        listener(fullEvent);
      } catch (error) {
        logger.error("AccessibilityOrchestrator", "Error in event listener", {
          eventType: event.type,
          error,
        });
      }
    });
  }

  /**
   * Get focus manager
   */
  public getFocusManager(): FocusManager {
    return this.focusManager;
  }

  /**
   * Get announcement manager
   */
  public getAnnouncementManager(): AnnouncementManager {
    return this.announcementManager;
  }

  /**
   * Get keyboard navigation manager
   */
  public getKeyboardNavigationManager(): KeyboardNavigationManager {
    return this.keyboardNavigationManager;
  }

  /**
   * Get preference manager
   */
  public getPreferenceManager(): PreferenceManager {
    return this.preferenceManager;
  }

  /**
   * Get WCAG validator
   */
  public getWCAGValidator(): WCAGValidator {
    return this.wcagValidator;
  }

  /**
   * Apply accessibility preferences
   */
  public applyPreferences(preferences: Partial<AccessibilityPreferences>): void {
    const currentPreferences = this.preferenceManager.getPreferences();
    const newPreferences = { ...currentPreferences, ...preferences };

    // Apply high contrast mode
    this.enableHighContrastMode(newPreferences.highContrast);

    // Apply reduced motion
    this.enableReducedMotion(newPreferences.reducedMotion);

    // Apply screen reader mode
    this.enableScreenReaderMode(newPreferences.screenReaderEnabled);

    // Apply font size
    this.applyFontSize(newPreferences.fontSize);

    // Apply focus indicator style
    this.applyFocusIndicatorStyle(newPreferences.focusIndicatorStyle);

    // Apply text spacing
    this.applyTextSpacing(newPreferences.textSpacing);

    // Apply animation speed
    this.applyAnimationSpeed(newPreferences.animationSpeed);

    // Update preferences
    this.preferenceManager.updatePreferences(preferences);

    logger.info("AccessibilityOrchestrator", "Preferences applied", { preferences });
  }

  /**
   * Enable high contrast mode
   */
  public enableHighContrastMode(enabled: boolean): void {
    if (typeof document === "undefined") return;

    if (enabled) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    logger.debug("AccessibilityOrchestrator", "High contrast mode", { enabled });
  }

  /**
   * Enable reduced motion
   */
  public enableReducedMotion(enabled: boolean): void {
    if (typeof document === "undefined") return;

    if (enabled) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }

    logger.debug("AccessibilityOrchestrator", "Reduced motion", { enabled });
  }

  /**
   * Enable screen reader mode
   */
  public enableScreenReaderMode(enabled: boolean): void {
    if (typeof document === "undefined") return;

    if (enabled) {
      document.documentElement.classList.add('screen-reader');
      // Configure announcement manager for screen reader
      this.announcementManager.setAnnouncementPreferences({
        enabled: true,
        verbosity: 'verbose',
        announceChanges: true,
        announceNavigation: true,
        announceErrors: true,
      });
    } else {
      document.documentElement.classList.remove('screen-reader');
    }

    logger.debug("AccessibilityOrchestrator", "Screen reader mode", { enabled });
  }

  /**
   * Apply font size
   */
  private applyFontSize(fontSize: AccessibilityPreferences['fontSize']): void {
    if (typeof document === "undefined") return;

    // Remove existing font size classes
    document.documentElement.classList.remove('font-small', 'font-medium', 'font-large', 'font-extra-large');
    
    // Add new font size class
    document.documentElement.classList.add(`font-${fontSize}`);
  }

  /**
   * Apply focus indicator style
   */
  private applyFocusIndicatorStyle(style: AccessibilityPreferences['focusIndicatorStyle']): void {
    if (typeof document === "undefined") return;

    // Remove existing focus indicator classes
    document.documentElement.classList.remove('focus-default', 'focus-high-contrast', 'focus-thick');
    
    // Add new focus indicator class
    document.documentElement.classList.add(`focus-${style}`);
  }

  /**
   * Apply text spacing
   */
  private applyTextSpacing(spacing: AccessibilityPreferences['textSpacing']): void {
    if (typeof document === "undefined") return;

    // Remove existing text spacing classes
    document.documentElement.classList.remove('text-spacing-normal', 'text-spacing-increased', 'text-spacing-maximum');
    
    // Add new text spacing class
    document.documentElement.classList.add(`text-spacing-${spacing}`);
  }

  /**
   * Apply animation speed
   */
  private applyAnimationSpeed(speed: AccessibilityPreferences['animationSpeed']): void {
    if (typeof document === "undefined") return;

    // Remove existing animation speed classes
    document.documentElement.classList.remove('animation-slow', 'animation-normal', 'animation-fast', 'animation-disabled');
    
    // Add new animation speed class
    document.documentElement.classList.add(`animation-${speed}`);
  }

  /**
   * Validate WCAG compliance
   */
  public validateCompliance(): WCAGComplianceResult {
    return this.wcagValidator.validatePage();
  }

  /**
   * Get accessibility metrics
   */
  public getMetrics(): AccessibilityMetrics {
    return { ...this.metrics };
  }

  /**
   * Get event history
   */
  public getEventHistory(limit?: number): AccessibilityEvent[] {
    const history = [...this.eventHistory];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Add event listener
   */
  public addEventListener(
    type: AccessibilityEventType,
    listener: (event: AccessibilityEvent) => void
  ): () => void {
    const listeners = this.eventListeners.get(type) || [];
    listeners.push(listener);
    this.eventListeners.set(type, listeners);

    // Return unsubscribe function
    return () => {
      const currentListeners = this.eventListeners.get(type) || [];
      const index = currentListeners.indexOf(listener);
      if (index !== -1) {
        currentListeners.splice(index, 1);
        this.eventListeners.set(type, currentListeners);
      }
    };
  }

  /**
   * Check if system is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Destroy the accessibility system
   */
  public destroy(): void {
    if (!this.initialized) return;

    try {
      // Clean up managers
      if (this.focusManager && typeof this.focusManager.destroy === 'function') {
        this.focusManager.destroy();
      }
      
      if (this.keyboardNavigationManager && typeof this.keyboardNavigationManager.destroy === 'function') {
        this.keyboardNavigationManager.destroy();
      }

      // Clear event listeners
      this.eventListeners.clear();
      this.eventHistory = [];

      // Reset metrics
      this.metrics = {
        complianceScore: 0,
        totalIssues: 0,
        criticalIssues: 0,
        keyboardNavigationUsage: 0,
        screenReaderUsage: 0,
        highContrastUsage: 0,
        reducedMotionUsage: 0,
        announcementsMade: 0,
        focusChanges: 0,
        skipLinkUsage: 0,
      };

      this.initialized = false;

      logger.info("AccessibilityOrchestrator", "Accessibility system destroyed");
    } catch (error) {
      logger.error("AccessibilityOrchestrator", "Error during cleanup", error);
    }
  }
}

/**
 * Default accessibility orchestrator instance
 */
export const defaultAccessibilityOrchestrator = new AccessibilityOrchestrator({
  enabled: true,
  autoDetectPreferences: true,
  persistPreferences: true,
  enableMetrics: true,
  enableValidation: true,
  validationInterval: 30000,
  announcePageChanges: true,
  announceFormErrors: true,
  enableSkipLinks: true,
  enableFocusTrap: true,
});

/**
 * Create a new accessibility orchestrator with custom configuration
 */
export function createAccessibilityOrchestrator(
  config: Partial<AccessibilityConfig> = {}
): AccessibilityOrchestrator {
  return new AccessibilityOrchestrator(config);
}