/**
 * AccessibilityManager - Comprehensive WCAG 2.1 AA compliance and accessibility features
 *
 * This manager provides:
 * - WCAG 2.1 AA compliance features
 * - Keyboard navigation support
 * - Screen reader optimizations
 * - Focus management
 * - Accessibility announcements
 * - High contrast mode support
 * - Reduced motion preferences
 */

export interface AccessibilityPreferences {
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderEnabled: boolean;
  keyboardNavigation: boolean;
  fontSize: "small" | "medium" | "large" | "extra-large";
  focusIndicatorStyle: "default" | "high-contrast" | "thick";
  announcements: boolean;
}

export interface FocusableElement {
  element: HTMLElement;
  priority: number;
  group?: string;
}

export interface AccessibilityAnnouncement {
  message: string;
  priority: "polite" | "assertive";
  delay?: number;
}

export class AccessibilityManager {
  private preferences: AccessibilityPreferences;
  private initialPreferences: Partial<AccessibilityPreferences>;
  private focusableElements: Map<string, FocusableElement[]> = new Map();
  private currentFocusGroup: string | null = null;
  private currentFocusIndex: number = 0;
  private announcer: HTMLElement | null = null;
  private observers: Map<string, MutationObserver> = new Map();
  private keyboardListeners: Map<string, (event: KeyboardEvent) => void> = new Map();

  constructor(initialPreferences?: Partial<AccessibilityPreferences>) {
    this.initialPreferences = initialPreferences || {};
    this.preferences = {
      highContrast: false,
      reducedMotion: false,
      screenReaderEnabled: false,
      keyboardNavigation: true,
      fontSize: "medium",
      focusIndicatorStyle: "default",
      announcements: true,
      ...initialPreferences,
    };

    this.initialize();
  }

  /**
   * Initialize the accessibility manager
   */
  private initialize(): void {
    if (typeof window === "undefined") return;

    this.createAnnouncer();
    this.detectSystemPreferences();
    this.setupGlobalKeyboardHandlers();
    this.applyAccessibilityStyles();
    this.setupFocusManagement();
  }

  /**
   * Create screen reader announcer element
   */
  private createAnnouncer(): void {
    if (typeof document === "undefined") return;

    this.announcer = document.createElement("div");
    this.announcer.setAttribute("aria-live", "polite");
    this.announcer.setAttribute("aria-atomic", "true");
    this.announcer.setAttribute("aria-relevant", "text");
    this.announcer.className = "sr-only";
    this.announcer.style.cssText = `
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    `;
    document.body.appendChild(this.announcer);
  }

  /**
   * Detect system accessibility preferences
   */
  private detectSystemPreferences(): void {
    if (typeof window === "undefined") return;

    // Detect reduced motion preference (only if not explicitly set)
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!("reducedMotion" in this.initialPreferences)) {
      this.preferences.reducedMotion = prefersReducedMotion.matches;
    }

    prefersReducedMotion.addEventListener("change", (e) => {
      if (!("reducedMotion" in this.initialPreferences)) {
        this.preferences.reducedMotion = e.matches;
        this.applyAccessibilityStyles();
      }
    });

    // Detect high contrast preference (only if not explicitly set)
    const prefersHighContrast = window.matchMedia("(prefers-contrast: high)");
    if (!("highContrast" in this.initialPreferences)) {
      this.preferences.highContrast = prefersHighContrast.matches;
    }

    prefersHighContrast.addEventListener("change", (e) => {
      if (!("highContrast" in this.initialPreferences)) {
        this.preferences.highContrast = e.matches;
        this.applyAccessibilityStyles();
      }
    });

    // Detect screen reader usage (heuristic)
    this.detectScreenReader();
  }

  /**
   * Heuristic detection of screen reader usage
   */
  private detectScreenReader(): void {
    if (typeof navigator === "undefined") return;

    // Check for common screen reader user agents
    const userAgent = navigator.userAgent.toLowerCase();
    const screenReaderIndicators = [
      "nvda",
      "jaws",
      "dragon",
      "zoomtext",
      "magic",
      "supernova",
      "narrator",
      "voiceover",
      "talkback",
      "orca",
    ];

    const hasScreenReaderUA = screenReaderIndicators.some((indicator) =>
      userAgent.includes(indicator)
    );

    // Check for screen reader specific APIs
    const hasScreenReaderAPI = "speechSynthesis" in window || "webkitSpeechSynthesis" in window;

    this.preferences.screenReaderEnabled = hasScreenReaderUA || hasScreenReaderAPI;
  }

  /**
   * Setup global keyboard event handlers
   */
  private setupGlobalKeyboardHandlers(): void {
    if (typeof document === "undefined") return;

    const globalKeyHandler = (event: KeyboardEvent) => {
      if (!this.preferences.keyboardNavigation) return;

      switch (event.key) {
        case "Tab":
          this.handleTabNavigation(event);
          break;
        case "Escape":
          this.handleEscapeKey(event);
          break;
        case "Enter":
        case " ":
          this.handleActivation(event);
          break;
        case "ArrowUp":
        case "ArrowDown":
        case "ArrowLeft":
        case "ArrowRight":
          this.handleArrowNavigation(event);
          break;
        case "Home":
        case "End":
          this.handleHomeEndNavigation(event);
          break;
      }
    };

    document.addEventListener("keydown", globalKeyHandler);
    this.keyboardListeners.set("global", globalKeyHandler);
  }

  /**
   * Apply accessibility styles based on preferences
   */
  private applyAccessibilityStyles(): void {
    if (typeof document === "undefined") return;

    const root = document.documentElement;

    // Apply high contrast mode
    if (this.preferences.highContrast) {
      root.classList.add("accessibility-high-contrast");
    } else {
      root.classList.remove("accessibility-high-contrast");
    }

    // Apply reduced motion
    if (this.preferences.reducedMotion) {
      root.classList.add("accessibility-reduced-motion");
    } else {
      root.classList.remove("accessibility-reduced-motion");
    }

    // Apply font size
    root.classList.remove(
      "accessibility-font-small",
      "accessibility-font-medium",
      "accessibility-font-large",
      "accessibility-font-extra-large"
    );
    root.classList.add(`accessibility-font-${this.preferences.fontSize}`);

    // Apply focus indicator style
    root.classList.remove(
      "accessibility-focus-default",
      "accessibility-focus-high-contrast",
      "accessibility-focus-thick"
    );
    root.classList.add(`accessibility-focus-${this.preferences.focusIndicatorStyle}`);
  }

  /**
   * Setup focus management system
   */
  private setupFocusManagement(): void {
    if (typeof document === "undefined") return;

    // Track focus changes
    document.addEventListener("focusin", (event) => {
      const target = event.target as HTMLElement;
      this.updateFocusContext(target);
    });

    // Handle focus loss
    document.addEventListener("focusout", (event) => {
      // Delay to allow for focus to move to new element
      setTimeout(() => {
        if (!document.activeElement || document.activeElement === document.body) {
          this.restoreFocus();
        }
      }, 10);
    });
  }

  /**
   * Register focusable elements for a specific group
   */
  public registerFocusGroup(groupId: string, elements: HTMLElement[], priorities?: number[]): void {
    const focusableElements: FocusableElement[] = elements.map((element, index) => ({
      element,
      priority: priorities?.[index] ?? index,
      group: groupId,
    }));

    // Sort by priority
    focusableElements.sort((a, b) => a.priority - b.priority);

    this.focusableElements.set(groupId, focusableElements);
  }

  /**
   * Set the current focus group
   */
  public setFocusGroup(groupId: string): void {
    this.currentFocusGroup = groupId;
    this.currentFocusIndex = 0;
  }

  /**
   * Move focus to the next element in the current group
   */
  public focusNext(): boolean {
    if (!this.currentFocusGroup) return false;

    const elements = this.focusableElements.get(this.currentFocusGroup);
    if (!elements || elements.length === 0) return false;

    this.currentFocusIndex = (this.currentFocusIndex + 1) % elements.length;
    const targetElement = elements[this.currentFocusIndex];

    if (targetElement && this.isElementFocusable(targetElement.element)) {
      targetElement.element.focus();
      return true;
    }

    return false;
  }

  /**
   * Move focus to the previous element in the current group
   */
  public focusPrevious(): boolean {
    if (!this.currentFocusGroup) return false;

    const elements = this.focusableElements.get(this.currentFocusGroup);
    if (!elements || elements.length === 0) return false;

    this.currentFocusIndex =
      this.currentFocusIndex === 0 ? elements.length - 1 : this.currentFocusIndex - 1;

    const targetElement = elements[this.currentFocusIndex];

    if (targetElement && this.isElementFocusable(targetElement.element)) {
      targetElement.element.focus();
      return true;
    }

    return false;
  }

  /**
   * Focus the first element in a group
   */
  public focusFirst(groupId?: string): boolean {
    const targetGroup = groupId || this.currentFocusGroup;
    if (!targetGroup) return false;

    const elements = this.focusableElements.get(targetGroup);
    if (!elements || elements.length === 0) return false;

    this.currentFocusGroup = targetGroup;
    this.currentFocusIndex = 0;

    const firstElement = elements[0];
    if (firstElement && this.isElementFocusable(firstElement.element)) {
      firstElement.element.focus();
      return true;
    }

    return false;
  }

  /**
   * Focus the last element in a group
   */
  public focusLast(groupId?: string): boolean {
    const targetGroup = groupId || this.currentFocusGroup;
    if (!targetGroup) return false;

    const elements = this.focusableElements.get(targetGroup);
    if (!elements || elements.length === 0) return false;

    this.currentFocusGroup = targetGroup;
    this.currentFocusIndex = elements.length - 1;

    const lastElement = elements[this.currentFocusIndex];
    if (lastElement && this.isElementFocusable(lastElement.element)) {
      lastElement.element.focus();
      return true;
    }

    return false;
  }

  /**
   * Check if an element is focusable
   */
  private isElementFocusable(element: HTMLElement): boolean {
    if (!element || element.offsetParent === null) return false;

    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden") return false;

    if (element.hasAttribute("disabled") || element.getAttribute("aria-disabled") === "true") {
      return false;
    }

    return (
      element.tabIndex >= 0 ||
      element.tagName === "A" ||
      element.tagName === "BUTTON" ||
      element.tagName === "INPUT" ||
      element.tagName === "SELECT" ||
      element.tagName === "TEXTAREA" ||
      element.hasAttribute("contenteditable")
    );
  }

  /**
   * Announce message to screen readers
   */
  public announce(
    message: string,
    priority: "polite" | "assertive" = "polite",
    delay: number = 0
  ): void {
    if (!this.preferences.announcements || !this.announcer) return;

    const announce = () => {
      if (this.announcer) {
        this.announcer.setAttribute("aria-live", priority);
        this.announcer.textContent = message;

        // Clear after announcement
        setTimeout(() => {
          if (this.announcer) {
            this.announcer.textContent = "";
          }
        }, 1000);
      }
    };

    if (delay > 0) {
      setTimeout(announce, delay);
    } else {
      announce();
    }
  }

  /**
   * Handle tab navigation
   */
  private handleTabNavigation(event: KeyboardEvent): void {
    if (!this.currentFocusGroup) return;

    const elements = this.focusableElements.get(this.currentFocusGroup);
    if (!elements || elements.length === 0) return;

    // Let browser handle normal tab navigation within the group
    // This method can be extended for custom tab behavior
  }

  /**
   * Handle escape key
   */
  private handleEscapeKey(event: KeyboardEvent): void {
    // Close modals, dropdowns, etc.
    const activeElement = document.activeElement as HTMLElement;

    // Look for closeable containers
    const closeable = activeElement?.closest('[data-closeable="true"]') as HTMLElement;
    if (closeable) {
      const closeButton = closeable.querySelector('[data-close-button="true"]') as HTMLElement;
      if (closeButton) {
        closeButton.click();
        event.preventDefault();
      }
    }
  }

  /**
   * Handle activation (Enter/Space)
   */
  private handleActivation(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;

    // Handle custom activatable elements
    if (target.hasAttribute("data-activatable") && target.getAttribute("role") === "button") {
      target.click();
      event.preventDefault();
    }
  }

  /**
   * Handle arrow key navigation
   */
  private handleArrowNavigation(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;

    // Check if element supports arrow navigation
    if (target.hasAttribute("data-arrow-navigation")) {
      switch (event.key) {
        case "ArrowUp":
          this.focusPrevious();
          event.preventDefault();
          break;
        case "ArrowDown":
          this.focusNext();
          event.preventDefault();
          break;
        case "ArrowLeft":
          if (document.dir === "rtl") {
            this.focusNext();
          } else {
            this.focusPrevious();
          }
          event.preventDefault();
          break;
        case "ArrowRight":
          if (document.dir === "rtl") {
            this.focusPrevious();
          } else {
            this.focusNext();
          }
          event.preventDefault();
          break;
      }
    }
  }

  /**
   * Handle Home/End navigation
   */
  private handleHomeEndNavigation(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;

    if (target.hasAttribute("data-arrow-navigation")) {
      switch (event.key) {
        case "Home":
          this.focusFirst();
          event.preventDefault();
          break;
        case "End":
          this.focusLast();
          event.preventDefault();
          break;
      }
    }
  }

  /**
   * Update focus context based on current focused element
   */
  private updateFocusContext(element: HTMLElement): void {
    // Find the focus group this element belongs to
    for (const [groupId, elements] of this.focusableElements.entries()) {
      const index = elements.findIndex((item) => item.element === element);
      if (index !== -1) {
        this.currentFocusGroup = groupId;
        this.currentFocusIndex = index;
        break;
      }
    }
  }

  /**
   * Restore focus to a safe element
   */
  private restoreFocus(): void {
    // Try to focus the first focusable element in the current group
    if (this.currentFocusGroup) {
      this.focusFirst(this.currentFocusGroup);
    } else {
      // Fallback to first focusable element on page
      const firstFocusable = document.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement;

      if (firstFocusable) {
        firstFocusable.focus();
      }
    }
  }

  /**
   * Update accessibility preferences
   */
  public updatePreferences(newPreferences: Partial<AccessibilityPreferences>): void {
    this.preferences = { ...this.preferences, ...newPreferences };
    this.applyAccessibilityStyles();
  }

  /**
   * Get current accessibility preferences
   */
  public getPreferences(): AccessibilityPreferences {
    return { ...this.preferences };
  }

  /**
   * Add ARIA attributes to an element
   */
  public addAriaAttributes(element: HTMLElement, attributes: Record<string, string>): void {
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key.startsWith("aria-") ? key : `aria-${key}`, value);
    });
  }

  /**
   * Create skip link for keyboard navigation
   */
  public createSkipLink(targetId: string, text: string): HTMLElement {
    const skipLink = document.createElement("a");
    skipLink.href = `#${targetId}`;
    skipLink.textContent = text;
    skipLink.className = "skip-link";
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 9999;
      transition: top 0.3s;
    `;

    skipLink.addEventListener("focus", () => {
      skipLink.style.top = "6px";
    });

    skipLink.addEventListener("blur", () => {
      skipLink.style.top = "-40px";
    });

    return skipLink;
  }

  /**
   * Validate WCAG compliance for an element
   */
  public validateWCAGCompliance(element: HTMLElement): {
    isCompliant: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    // Check for missing alt text on images
    if (element.tagName === "IMG" && !element.getAttribute("alt")) {
      issues.push("Image missing alt attribute");
      suggestions.push("Add descriptive alt text for the image");
    }

    // Check for missing labels on form controls
    if (["INPUT", "SELECT", "TEXTAREA"].includes(element.tagName)) {
      const hasLabel =
        element.getAttribute("aria-label") ||
        element.getAttribute("aria-labelledby") ||
        document.querySelector(`label[for="${element.id}"]`);

      if (!hasLabel) {
        issues.push("Form control missing accessible label");
        suggestions.push("Add aria-label, aria-labelledby, or associate with a label element");
      }
    }

    // Check for sufficient color contrast (simplified check)
    const style = window.getComputedStyle(element);
    const backgroundColor = style.backgroundColor;
    const color = style.color;

    if (backgroundColor !== "rgba(0, 0, 0, 0)" && color !== "rgba(0, 0, 0, 0)") {
      // This is a simplified check - in production, you'd use a proper contrast ratio calculator
      suggestions.push("Verify color contrast meets WCAG AA standards (4.5:1 for normal text)");
    }

    // Check for keyboard accessibility
    if (
      element.onclick &&
      element.tabIndex < 0 &&
      !["A", "BUTTON", "INPUT"].includes(element.tagName)
    ) {
      issues.push("Interactive element not keyboard accessible");
      suggestions.push('Add tabindex="0" and keyboard event handlers');
    }

    return {
      isCompliant: issues.length === 0,
      issues,
      suggestions,
    };
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    // Remove event listeners
    this.keyboardListeners.forEach((listener, key) => {
      if (key === "global") {
        document.removeEventListener("keydown", listener);
      }
    });

    // Disconnect observers
    this.observers.forEach((observer) => observer.disconnect());

    // Remove announcer
    if (this.announcer && this.announcer.parentNode) {
      this.announcer.parentNode.removeChild(this.announcer);
    }

    // Clear maps
    this.focusableElements.clear();
    this.observers.clear();
    this.keyboardListeners.clear();
  }
}

// Singleton instance for global use
let globalAccessibilityManager: AccessibilityManager | null = null;

/**
 * Get or create the global accessibility manager instance
 */
export function getAccessibilityManager(
  preferences?: Partial<AccessibilityPreferences>
): AccessibilityManager {
  if (!globalAccessibilityManager) {
    globalAccessibilityManager = new AccessibilityManager(preferences);
  }
  return globalAccessibilityManager;
}

/**
 * Hook for React components to use accessibility manager
 */
export function useAccessibilityManager() {
  return getAccessibilityManager();
}
