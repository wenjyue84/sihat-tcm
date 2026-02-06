/**
 * useAccessibility Hook - React integration for AccessibilityManager
 *
 * This hook provides:
 * - Easy access to accessibility manager
 * - React-friendly API for accessibility features
 * - Automatic cleanup on unmount
 * - State management for accessibility preferences
 */

import { useEffect, useRef, useState, useCallback } from "react";
import {
  AccessibilityManager,
  AccessibilityPreferences,
  getAccessibilityManager,
} from "@/lib/accessibilityManager";

export interface UseAccessibilityOptions {
  focusGroup?: string;
  autoRegisterFocusables?: boolean;
  announceChanges?: boolean;
}

export interface UseAccessibilityReturn {
  manager: AccessibilityManager;
  preferences: AccessibilityPreferences;
  updatePreferences: (prefs: Partial<AccessibilityPreferences>) => void;
  registerFocusGroup: (elements: HTMLElement[], priorities?: number[]) => void;
  setFocusGroup: (groupId: string) => void;
  focusNext: () => boolean;
  focusPrevious: () => boolean;
  focusFirst: () => boolean;
  focusLast: () => boolean;
  announce: (message: string, priority?: "polite" | "assertive", delay?: number) => void;
  addAriaAttributes: (element: HTMLElement, attributes: Record<string, string>) => void;
  validateWCAGCompliance: (element: HTMLElement) => {
    isCompliant: boolean;
    issues: string[];
    suggestions: string[];
  };
}

/**
 * Hook for using accessibility features in React components
 */
export function useAccessibility(options: UseAccessibilityOptions = {}): UseAccessibilityReturn {
  const { focusGroup, autoRegisterFocusables = true, announceChanges = true } = options;

  const managerRef = useRef<AccessibilityManager | null>(null);
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
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
  });

  // Initialize accessibility manager
  useEffect(() => {
    if (!managerRef.current) {
      managerRef.current = getAccessibilityManager();
      setPreferences((prev) => ({ ...prev, ...managerRef.current!.getPreferences() }));
    }
  }, []);

  // Set focus group if provided
  useEffect(() => {
    if (focusGroup && managerRef.current) {
      managerRef.current.setFocusGroup(focusGroup);
    }
  }, [focusGroup]);

  // Auto-register focusable elements in the component
  useEffect(() => {
    if (!autoRegisterFocusables || !focusGroup || !managerRef.current) return;

    const registerFocusables = () => {
      const focusableElements = document.querySelectorAll(
        `[data-focus-group="${focusGroup}"] button, ` +
          `[data-focus-group="${focusGroup}"] [href], ` +
          `[data-focus-group="${focusGroup}"] input, ` +
          `[data-focus-group="${focusGroup}"] select, ` +
          `[data-focus-group="${focusGroup}"] textarea, ` +
          `[data-focus-group="${focusGroup}"] [tabindex]:not([tabindex="-1"])`
      ) as NodeListOf<HTMLElement>;

      if (focusableElements.length > 0 && managerRef.current) {
        managerRef.current.registerFocusGroup(focusGroup, Array.from(focusableElements));
      }
    };

    // Register immediately
    registerFocusables();

    // Re-register when DOM changes
    const observer = new MutationObserver(registerFocusables);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-focus-group"],
    });

    return () => observer.disconnect();
  }, [focusGroup, autoRegisterFocusables]);

  // Update preferences callback
  const updatePreferences = useCallback(
    (newPreferences: Partial<AccessibilityPreferences>) => {
      if (managerRef.current) {
        managerRef.current.updatePreferences(newPreferences);
        setPreferences((prev) => ({ ...prev, ...managerRef.current!.getPreferences() }));

        if (announceChanges) {
          const changes = Object.keys(newPreferences).join(", ");
          managerRef.current.announce(`Accessibility settings updated: ${changes}`);
        }
      }
    },
    [announceChanges]
  );

  // Register focus group callback
  const registerFocusGroup = useCallback(
    (elements: HTMLElement[], priorities?: number[]) => {
      if (focusGroup && managerRef.current) {
        managerRef.current.registerFocusGroup(focusGroup, elements, priorities);
      }
    },
    [focusGroup]
  );

  // Set focus group callback
  const setFocusGroup = useCallback((groupId: string) => {
    if (managerRef.current) {
      managerRef.current.setFocusGroup(groupId);
    }
  }, []);

  // Focus navigation callbacks
  const focusNext = useCallback(() => {
    return managerRef.current?.focusNext() ?? false;
  }, []);

  const focusPrevious = useCallback(() => {
    return managerRef.current?.focusPrevious() ?? false;
  }, []);

  const focusFirst = useCallback(() => {
    return managerRef.current?.focusFirst() ?? false;
  }, []);

  const focusLast = useCallback(() => {
    return managerRef.current?.focusLast() ?? false;
  }, []);

  // Announce callback
  const announce = useCallback(
    (message: string, priority: "polite" | "assertive" = "polite", delay: number = 0) => {
      if (managerRef.current) {
        managerRef.current.announce(message, priority, delay);
      }
    },
    []
  );

  // Add ARIA attributes callback
  const addAriaAttributes = useCallback(
    (element: HTMLElement, attributes: Record<string, string>) => {
      if (managerRef.current) {
        managerRef.current.addAriaAttributes(element, attributes);
      }
    },
    []
  );

  // WCAG compliance validation callback
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const validateWCAGCompliance = useCallback((_element: HTMLElement) => {
    // AccessibilityManager doesn't expose validateWCAGCompliance directly
    // Use performAudit for full validation or validateColorContrast for specific checks
    return {
      isCompliant: false,
      issues: ["Use performAudit() for full WCAG validation"],
      suggestions: [],
    };
  }, []);

  return {
    manager: managerRef.current!,
    preferences,
    updatePreferences,
    registerFocusGroup,
    setFocusGroup,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
    announce,
    addAriaAttributes,
    validateWCAGCompliance,
  };
}

/**
 * Hook for keyboard navigation within a specific element
 */
export function useKeyboardNavigation(
  containerRef: React.RefObject<HTMLElement | null>,
  options: {
    groupId?: string;
    enableArrowKeys?: boolean;
    enableHomeEnd?: boolean;
    circular?: boolean;
  } = {}
) {
  const {
    groupId = "keyboard-nav",
    enableArrowKeys = true,
    enableHomeEnd = true,
    circular = true,
  } = options;
  const { manager, focusNext, focusPrevious, focusFirst, focusLast } = useAccessibility({
    focusGroup: groupId,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Add keyboard navigation attributes
    container.setAttribute("data-arrow-navigation", "true");
    container.setAttribute("data-keyboard-navigation", "true");

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!enableArrowKeys && !enableHomeEnd) return;

      let handled = false;

      switch (event.key) {
        case "ArrowUp":
          if (enableArrowKeys) {
            handled = focusPrevious();
          }
          break;
        case "ArrowDown":
          if (enableArrowKeys) {
            handled = focusNext();
          }
          break;
        case "ArrowLeft":
          if (enableArrowKeys) {
            handled = document.dir === "rtl" ? focusNext() : focusPrevious();
          }
          break;
        case "ArrowRight":
          if (enableArrowKeys) {
            handled = document.dir === "rtl" ? focusPrevious() : focusNext();
          }
          break;
        case "Home":
          if (enableHomeEnd) {
            handled = focusFirst();
          }
          break;
        case "End":
          if (enableHomeEnd) {
            handled = focusLast();
          }
          break;
      }

      if (handled) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      container.removeAttribute("data-arrow-navigation");
      container.removeAttribute("data-keyboard-navigation");
    };
  }, [
    containerRef,
    enableArrowKeys,
    enableHomeEnd,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
  ]);

  return {
    manager,
    focusNext,
    focusPrevious,
    focusFirst,
    focusLast,
  };
}

/**
 * Hook for managing focus trapping within a modal or dialog
 */
export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  isActive: boolean = true
) {
  const { manager } = useAccessibility();

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    firstElement.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
    };
  }, [isActive, containerRef]);

  return { manager };
}

/**
 * Hook for announcing live region updates
 */
export function useLiveRegion(initialMessage: string = "") {
  const { announce } = useAccessibility();
  const [message, setMessage] = useState(initialMessage);

  const announceMessage = useCallback(
    (newMessage: string, priority: "polite" | "assertive" = "polite", delay: number = 0) => {
      setMessage(newMessage);
      announce(newMessage, priority, delay);
    },
    [announce]
  );

  const clearMessage = useCallback(() => {
    setMessage("");
  }, []);

  return {
    message,
    announceMessage,
    clearMessage,
  };
}

/**
 * Hook for WCAG compliance checking
 */
export function useWCAGCompliance(elementRef: React.RefObject<HTMLElement | null>) {
  const { validateWCAGCompliance } = useAccessibility();
  const [compliance, setCompliance] = useState<{
    isCompliant: boolean;
    issues: string[];
    suggestions: string[];
  } | null>(null);

  const checkCompliance = useCallback(() => {
    if (elementRef.current) {
      const result = validateWCAGCompliance(elementRef.current);
      setCompliance(result);
      return result;
    }
    return null;
  }, [elementRef, validateWCAGCompliance]);

  useEffect(() => {
    checkCompliance();
  }, [checkCompliance]);

  return {
    compliance,
    checkCompliance,
  };
}
