/**
 * Accessibility System - Main Export
 *
 * Centralized export for the complete accessibility system with
 * WCAG 2.1 AA compliance and comprehensive accessibility features.
 */

// Core Accessibility System
export {
  AccessibilityOrchestrator,
  defaultAccessibilityOrchestrator,
  createAccessibilityOrchestrator,
} from "./core/AccessibilityOrchestrator";

export { FocusManager } from "./core/FocusManager";

export { PreferenceManager } from "./core/PreferenceManager";

export { AnnouncementManager } from "./core/AnnouncementManager";

export { KeyboardNavigationManager } from "./core/KeyboardNavigationManager";

export { WCAGValidator } from "./core/WCAGValidator";

// Accessibility Interfaces and Types
export type {
  // Core Interfaces
  AccessibilityManager,
  FocusManager as IFocusManager,
  AnnouncementManager as IAnnouncementManager,
  KeyboardNavigationManager as IKeyboardNavigationManager,
  PreferenceManager as IPreferenceManager,
  WCAGValidator as IWCAGValidator,

  // Configuration Interfaces
  AccessibilityPreferences,
  SystemAccessibilityPreferences,
  ScreenReaderDetection,
  AccessibilityConfig,
  KeyboardNavigationConfig,
  ScreenReaderConfig,
  ColorBlindnessConfig,
  TouchAccessibilityConfig,
  MediaAccessibilityConfig,
  FormAccessibilityConfig,
  NavigationAccessibilityConfig,

  // Focus Management
  FocusableElement,
  FocusGroup,
  FocusManagementOptions,
  NavigationDirection,

  // Announcements
  AccessibilityAnnouncement,

  // Keyboard Navigation
  KeyboardHandler,

  // WCAG Compliance
  WCAGComplianceResult,
  WCAGComplianceReport,
  WCAGIssue,
  WCAGSuggestion,
  WCAGIssueType,

  // Events and Metrics
  AccessibilityEvent,
  AccessibilityEventType,
  AccessibilityMetrics,
} from "./interfaces/AccessibilityInterfaces";

// Convenience Functions
export function initializeAccessibilitySystem(
  config?: Partial<import("./interfaces/AccessibilityInterfaces").AccessibilityConfig>
): typeof defaultAccessibilityOrchestrator {
  defaultAccessibilityOrchestrator.initialize(config);
  return defaultAccessibilityOrchestrator;
}

/**
 * Create a complete accessibility setup with all managers initialized
 */
export function createCompleteAccessibilitySetup(
  config?: Partial<import("./interfaces/AccessibilityInterfaces").AccessibilityConfig>
) {
  const orchestrator = createAccessibilityOrchestrator(config);

  orchestrator.initialize();

  return {
    orchestrator,
    focusManager: orchestrator.getFocusManager(),
    announcementManager: orchestrator.getAnnouncementManager(),
    keyboardNavigationManager: orchestrator.getKeyboardNavigationManager(),
    preferenceManager: orchestrator.getPreferenceManager(),
    wcagValidator: orchestrator.getWCAGValidator(),
  };
}

/**
 * Quick accessibility check for a page or element
 */
export function quickAccessibilityCheck(element?: HTMLElement): {
  isCompliant: boolean;
  score: number;
  criticalIssues: number;
  suggestions: string[];
} {
  const validator = new WCAGValidator();
  const result = element ? validator.validateElement(element) : validator.validatePage();

  const criticalIssues = result.issues.filter((issue) => issue.severity === "critical").length;
  const suggestions = result.suggestions.map((suggestion) => suggestion.description);

  return {
    isCompliant: result.isCompliant,
    score: result.score,
    criticalIssues,
    suggestions,
  };
}

/**
 * Apply accessibility preferences to the current page
 */
export function applyAccessibilityPreferences(
  preferences: Partial<import("./interfaces/AccessibilityInterfaces").AccessibilityPreferences>
): void {
  defaultAccessibilityOrchestrator.applyPreferences(preferences);
}

/**
 * Get current accessibility metrics
 */
export function getAccessibilityMetrics(): import("./interfaces/AccessibilityInterfaces").AccessibilityMetrics {
  return defaultAccessibilityOrchestrator.getMetrics();
}

/**
 * Announce a message to screen readers
 */
export function announce(
  message: string,
  priority: "polite" | "assertive" = "polite",
  category?: string
): void {
  const announcementManager = defaultAccessibilityOrchestrator.getAnnouncementManager();
  announcementManager.announce({
    message,
    priority,
    category,
  });
}

/**
 * Check if accessibility system is initialized
 */
export function isAccessibilityInitialized(): boolean {
  return defaultAccessibilityOrchestrator.isInitialized();
}

/**
 * Accessibility system health check
 */
export function checkAccessibilitySystemHealth(): {
  isHealthy: boolean;
  metrics: import("./interfaces/AccessibilityInterfaces").AccessibilityMetrics;
  issues: string[];
} {
  const metrics = getAccessibilityMetrics();
  const issues: string[] = [];

  // Check for basic health indicators
  if (!isAccessibilityInitialized()) {
    issues.push("Accessibility system not initialized");
  }

  if (metrics.criticalIssues > 0) {
    issues.push(`${metrics.criticalIssues} critical accessibility issues detected`);
  }

  if (metrics.complianceScore < 70) {
    issues.push(`Low compliance score: ${metrics.complianceScore}%`);
  }

  return {
    isHealthy: issues.length === 0,
    metrics,
    issues,
  };
}
