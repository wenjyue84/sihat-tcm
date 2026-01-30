/**
 * Focus Manager
 * 
 * Manages keyboard focus, focus groups, and focus restoration.
 * Provides comprehensive focus management for accessibility.
 */

import {
  FocusableElement,
  FocusGroup,
  FocusManagementOptions,
  NavigationDirection
} from "../interfaces/AccessibilityInterfaces";

export class FocusManager {
  private focusableElements: Map<string, FocusableElement[]> = new Map();
  private currentFocusGroup: string | null = null;
  private currentFocusIndex: number = 0;
  private focusHistory: HTMLElement[] = [];
  private focusTrapActive: boolean = false;
  private focusTrapContainer: HTMLElement | null = null;

  constructor() {
    this.initialize();
  }

  /**
   * Initialize focus management
   */
  private initialize(): void {
    if (typeof document === "undefined") return;

    this.setupFocusTracking();
    this.setupFocusRestoration();
  }

  /**
   * Setup focus tracking
   */
  private setupFocusTracking(): void {
    if (typeof document === "undefined") return;

    // Track focus changes
    document.addEventListener("focusin", (event) => {
      const target = event.target as HTMLElement;
      this.updateFocusContext(target);
      this.addToFocusHistory(target);
    });

    // Handle focus loss
    document.addEventListener("focusout", (event) => {
      // Delay to allow for focus to move to new element
      setTimeout(() => {
        if (!document.activeElement || document.activeElement === document.body) {
          this.handleFocusLoss();
        }
      }, 10);
    });
  }

  /**
   * Setup focus restoration on page visibility change
   */
  private setupFocusRestoration(): void {
    if (typeof document === "undefined") return;

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && this.focusHistory.length > 0) {
        // Restore focus when page becomes visible
        const lastFocused = this.focusHistory[this.focusHistory.length - 1];
        if (lastFocused && this.isElementFocusable(lastFocused)) {
          setTimeout(() => lastFocused.focus(), 100);
        }
      }
    });
  }

  /**
   * Register focusable elements for a specific group
   */
  public registerFocusGroup(group: FocusGroup): void {
    const focusableElements: FocusableElement[] = group.elements;

    // Sort by priority
    focusableElements.sort((a, b) => a.priority - b.priority);

    this.focusableElements.set(group.id, focusableElements);

    if (group.autoFocus && focusableElements.length > 0) {
      this.setActiveFocusGroup(group.id);
      this.focusFirst(group.id);
    }
  }

  /**
   * Unregister a focus group
   */
  public unregisterFocusGroup(groupId: string): void {
    this.focusableElements.delete(groupId);

    if (this.currentFocusGroup === groupId) {
      this.currentFocusGroup = null;
      this.currentFocusIndex = 0;
    }
  }

  /**
   * Set the current active focus group
   */
  public setActiveFocusGroup(groupId: string): void {
    this.currentFocusGroup = groupId;
    this.currentFocusIndex = 0;
  }

  /**
   * Focus the next element in the group
   */
  public focusNext(groupId?: string): boolean {
    if (groupId) this.setActiveFocusGroup(groupId);
    return this.navigate("next");
  }

  /**
   * Focus the previous element in the group
   */
  public focusPrevious(groupId?: string): boolean {
    if (groupId) this.setActiveFocusGroup(groupId);
    return this.navigate("previous");
  }

  /**
   * Navigate focus within current group
   */
  private navigate(direction: NavigationDirection): boolean {
    if (!this.currentFocusGroup) return false;

    const elements = this.focusableElements.get(this.currentFocusGroup);
    if (!elements || elements.length === 0) return false;

    let targetIndex: number;

    switch (direction) {
      case "next":
        targetIndex = (this.currentFocusIndex + 1) % elements.length;
        break;
      case "previous":
        targetIndex = this.currentFocusIndex === 0
          ? elements.length - 1
          : this.currentFocusIndex - 1;
        break;
      case "first":
        targetIndex = 0;
        break;
      case "last":
        targetIndex = elements.length - 1;
        break;
      default:
        return false;
    }

    return this.focusElementAtIndex(targetIndex);
  }

  /**
   * Focus element at specific index in current group
   */
  private focusElementAtIndex(index: number): boolean {
    if (!this.currentFocusGroup) return false;

    const elements = this.focusableElements.get(this.currentFocusGroup);
    if (!elements || index < 0 || index >= elements.length) return false;

    const targetElement = elements[index];
    if (targetElement && this.isElementFocusable(targetElement.element)) {
      this.currentFocusIndex = index;
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

    this.setActiveFocusGroup(targetGroup);
    return this.navigate("first");
  }

  /**
   * Focus the last element in a group
   */
  public focusLast(groupId?: string): boolean {
    const targetGroup = groupId || this.currentFocusGroup;
    if (!targetGroup) return false;

    this.setActiveFocusGroup(targetGroup);
    return this.navigate("last");
  }

  /**
   * Setup focus trap within a group or container
   */
  public trapFocus(groupId: string, enabled: boolean): void {
    this.focusTrapActive = enabled;

    if (enabled) {
      const elements = this.focusableElements.get(groupId);
      if (elements && elements.length > 0) {
        this.currentFocusGroup = groupId;
        this.focusTrapContainer = elements[0].element.parentElement;
        if (this.focusTrapContainer) {
          this.setupFocusTrapHandlers(this.focusTrapContainer, elements.map(e => e.element));
        }
      }
    } else {
      this.releaseFocusTrap();
    }
  }

  /**
   * Release focus trap
   */
  public releaseFocusTrap(restoreFocus: boolean = true): void {
    this.focusTrapActive = false;

    if (restoreFocus && this.focusHistory.length > 0) {
      // Restore focus to element that had focus before trap
      const previousFocus = this.focusHistory[this.focusHistory.length - 2];
      if (previousFocus && this.isElementFocusable(previousFocus)) {
        previousFocus.focus();
      }
    }

    this.removeFocusTrapHandlers();
    this.focusTrapContainer = null;
  }

  /**
   * Setup focus trap event handlers
   */
  private setupFocusTrapHandlers(container: HTMLElement, focusableElements: HTMLElement[]): void {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

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
      }
    };

    container.addEventListener("keydown", handleKeyDown);
    container.setAttribute("data-focus-trap-handler", "true");
  }

  /**
   * Remove focus trap event handlers
   */
  private removeFocusTrapHandlers(): void {
    if (this.focusTrapContainer) {
      const handlers = this.focusTrapContainer.querySelectorAll("[data-focus-trap-handler]");
      handlers.forEach(element => {
        element.removeAttribute("data-focus-trap-handler");
      });
    }
  }

  /**
   * Find all focusable elements within a container
   */
  private findFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'button:not([disabled])',
      '[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ');

    const elements = Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];

    return elements.filter(element => this.isElementFocusable(element));
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
   * Update focus context based on current focused element
   */
  private updateFocusContext(element: HTMLElement): void {
    // Find the focus group this element belongs to
    for (const [groupId, elements] of this.focusableElements.entries()) {
      const index = elements.findIndex(item => item.element === element);
      if (index !== -1) {
        this.currentFocusGroup = groupId;
        this.currentFocusIndex = index;
        break;
      }
    }
  }

  /**
   * Add element to focus history
   */
  private addToFocusHistory(element: HTMLElement): void {
    // Remove element if it already exists in history
    this.focusHistory = this.focusHistory.filter(el => el !== element);

    // Add to end of history
    this.focusHistory.push(element);

    // Limit history size
    if (this.focusHistory.length > 10) {
      this.focusHistory.shift();
    }
  }

  /**
   * Handle focus loss
   */
  private handleFocusLoss(): void {
    if (this.focusTrapActive) {
      // If focus trap is active, restore focus within trap
      if (this.currentFocusGroup) {
        this.focusFirst(this.currentFocusGroup);
      }
    } else {
      // Try to restore focus to a safe element
      this.restoreFocus();
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

      if (firstFocusable && this.isElementFocusable(firstFocusable)) {
        firstFocusable.focus();
      }
    }
  }

  /**
   * Get current focus information
   */
  public getCurrentFocus(): {
    group: string | null;
    index: number;
    element: HTMLElement | null;
  } {
    const elements = this.currentFocusGroup
      ? this.focusableElements.get(this.currentFocusGroup)
      : null;

    const element = elements && elements[this.currentFocusIndex]
      ? elements[this.currentFocusIndex].element
      : null;

    return {
      group: this.currentFocusGroup,
      index: this.currentFocusIndex,
      element
    };
  }

  /**
   * Get focus history
   */
  public getFocusHistory(): HTMLElement[] {
    return [...this.focusHistory];
  }

  /**
   * Clear focus group
   */
  public clearFocusGroup(groupId: string): void {
    this.focusableElements.delete(groupId);

    if (this.currentFocusGroup === groupId) {
      this.currentFocusGroup = null;
      this.currentFocusIndex = 0;
    }
  }

  /**
   * Get all registered focus groups
   */
  public getFocusGroups(): string[] {
    return Array.from(this.focusableElements.keys());
  }

  /**
   * Check if focus trap is active
   */
  public isFocusTrapped(): boolean {
    return this.focusTrapActive;
  }
}