/**
 * Accessibility Module - Comprehensive WCAG 2.1 AA compliance system
 *
 * This module provides a complete accessibility solution including:
 * - AccessibilityManager for core functionality
 * - React hooks for easy integration
 * - Context providers for global state
 * - Accessible UI components
 * - WCAG compliance utilities
 */

import { getAccessibilityManager } from "../accessibilityManager";

import { getAccessibilityManager } from "../accessibilityManager";

import { getAccessibilityManager } from "../accessibilityManager";

// Core accessibility manager
export {
  AccessibilityManager,
  getAccessibilityManager,
  type AccessibilityPreferences,
  type FocusableElement,
  type AccessibilityAnnouncement,
} from "../accessibilityManager";

// React hooks
export {
  useAccessibility,
  useKeyboardNavigation,
  useFocusTrap,
  useLiveRegion,
  useWCAGCompliance,
  type UseAccessibilityOptions,
  type UseAccessibilityReturn,
} from "../../hooks/useAccessibility";

// Context providers
export {
  AccessibilityProvider,
  useAccessibilityContext,
  withAccessibility,
  AccessibilitySettings,
  SkipNavigation,
  LiveRegion,
} from "../../contexts/AccessibilityContext";

// Accessible UI components
export { AccessibleButton } from "../../components/ui/AccessibleButton";
export { AccessibleInput } from "../../components/ui/AccessibleInput";
export {
  AccessibleModal,
  ModalFooter,
  ConfirmationModal,
} from "../../components/ui/AccessibleModal";

// Demo component
export { AccessibilityDemo } from "../../components/examples/AccessibilityDemo";

/**
 * Quick setup function for basic accessibility features
 */
export function setupAccessibility(options?: {
  enableHighContrast?: boolean;
  enableReducedMotion?: boolean;
  fontSize?: "small" | "medium" | "large" | "extra-large";
  enableAnnouncements?: boolean;
}) {
  const manager = getAccessibilityManager({
    highContrast: options?.enableHighContrast ?? false,
    reducedMotion: options?.enableReducedMotion ?? false,
    fontSize: options?.fontSize ?? "medium",
    announcements: options?.enableAnnouncements ?? true,
    keyboardNavigation: true,
    focusIndicatorStyle: "default",
    screenReaderEnabled: false,
  });

  // Add skip links to the page
  if (typeof document !== "undefined") {
    const skipLinks = [
      { targetId: "main-content", text: "Skip to main content" },
      { targetId: "navigation", text: "Skip to navigation" },
    ];

    skipLinks.forEach(({ targetId, text }) => {
      const skipLink = manager.createSkipLink(targetId, text);
      document.body.insertBefore(skipLink, document.body.firstChild);
    });
  }

  return manager;
}

/**
 * Utility function to validate WCAG compliance for multiple elements
 */
export function validatePageCompliance(elements?: HTMLElement[]) {
  const manager = getAccessibilityManager();
  const elementsToCheck = elements || (Array.from(document.querySelectorAll("*")) as HTMLElement[]);

  const results = elementsToCheck.map((element) => ({
    element,
    ...manager.validateWCAGCompliance(element),
  }));

  const issues = results.filter((result) => !result.isCompliant);

  return {
    totalElements: results.length,
    compliantElements: results.length - issues.length,
    issues: issues.map((issue) => ({
      element:
        issue.element.tagName.toLowerCase() + (issue.element.id ? `#${issue.element.id}` : ""),
      issues: issue.issues,
      suggestions: issue.suggestions,
    })),
    compliancePercentage: Math.round(((results.length - issues.length) / results.length) * 100),
  };
}

/**
 * Utility to add basic accessibility attributes to an element
 */
export function makeElementAccessible(
  element: HTMLElement,
  options: {
    label?: string;
    description?: string;
    role?: string;
    focusable?: boolean;
    announceOnFocus?: string;
  }
) {
  const manager = getAccessibilityManager();

  const attributes: Record<string, string> = {};

  if (options.label) {
    attributes["aria-label"] = options.label;
  }

  if (options.description) {
    const descId = `desc-${Math.random().toString(36).substr(2, 9)}`;
    const descElement = document.createElement("div");
    descElement.id = descId;
    descElement.textContent = options.description;
    descElement.className = "sr-only";
    element.parentNode?.insertBefore(descElement, element.nextSibling);
    attributes["aria-describedby"] = descId;
  }

  if (options.role) {
    attributes["role"] = options.role;
  }

  if (options.focusable) {
    element.tabIndex = 0;
  }

  manager.addAriaAttributes(element, attributes);

  if (options.announceOnFocus) {
    element.addEventListener("focus", () => {
      manager.announce(options.announceOnFocus!, "polite");
    });
  }

  return element;
}
