/**
 * AccessibilityManager - Legacy Wrapper
 * 
 * @deprecated This file is maintained for backward compatibility.
 * Use the new modular system: import { AccessibilityOrchestrator } from './accessibility'
 * 
 * The new system provides:
 * - Modular architecture with focused components
 * - Better separation of concerns
 * - Enhanced testing capabilities
 * - Improved maintainability
 */

import {
  AccessibilityOrchestrator,
  defaultAccessibilityOrchestrator,
  announce as announceModular,
  applyAccessibilityPreferences,
  type AccessibilityPreferences,
  type FocusableElement,
  type AccessibilityAnnouncement,
} from './accessibility';

// Re-export types for backward compatibility
export type {
  AccessibilityPreferences,
  FocusableElement,
  AccessibilityAnnouncement
};

// Define AriaAttributes locally since it may not be exported from the modular system
export interface AriaAttributes {
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-expanded'?: boolean;
  'aria-hidden'?: boolean;
  'aria-disabled'?: boolean;
  'aria-live'?: 'polite' | 'assertive' | 'off';
  'aria-atomic'?: boolean;
  [key: string]: string | boolean | undefined;
}

/**
 * @deprecated Use the new modular AccessibilityOrchestrator from './accessibility'
 */
export class AccessibilityManager {
  private orchestrator: AccessibilityOrchestrator;

  constructor(_initialPreferences?: Partial<AccessibilityPreferences>) {
    console.warn('[AccessibilityManager] Using deprecated API. Please migrate to the new modular system.');
    this.orchestrator = new AccessibilityOrchestrator();
    this.orchestrator.initialize();
  }

  /**
   * @deprecated Use focusManager.registerGroup() from the new modular system
   */
  public registerFocusGroup(groupId: string, elements: HTMLElement[], priorities?: number[]): void {
    console.warn('[AccessibilityManager] Using deprecated API. Please migrate to the new modular system.');
    const focusManager = this.orchestrator.getFocusManager();
    if (focusManager) {
      focusManager.registerFocusGroup({
        id: groupId,
        elements: elements.map((element, index) => ({
          element,
          priority: priorities?.[index] ?? index,
          group: groupId
        })),
        circular: true,
        autoFocus: false,
        trapFocus: false,
        restoreFocus: true
      });
    }
  }

  /**
   * @deprecated Use focusManager.setActiveGroup() from the new modular system
   */
  public setFocusGroup(groupId: string): void {
    console.warn('[AccessibilityManager] Using deprecated API. Please migrate to the new modular system.');
    const focusManager = this.orchestrator.getFocusManager();
    if (focusManager) {
      focusManager.setActiveFocusGroup(groupId);
    }
  }

  /**
   * @deprecated Use focusManager.navigate() from the new modular system
   */
  public focusNext(): boolean {
    console.warn('[AccessibilityManager] Using deprecated API. Please migrate to the new modular system.');
    const focusManager = this.orchestrator.getFocusManager();
    if (focusManager) {
      return focusManager.focusNext();
    }
    return false;
  }

  /**
   * @deprecated Use focusManager.navigate() from the new modular system
   */
  public focusPrevious(): boolean {
    console.warn('[AccessibilityManager] Using deprecated API. Please migrate to the new modular system.');
    const focusManager = this.orchestrator.getFocusManager();
    if (focusManager) {
      return focusManager.focusPrevious();
    }
    return false;
  }

  /**
   * @deprecated Use focusManager.navigate() from the new modular system
   */
  public focusFirst(groupId?: string): boolean {
    console.warn('[AccessibilityManager] Using deprecated API. Please migrate to the new modular system.');
    const focusManager = this.orchestrator.getFocusManager();
    if (focusManager) {
      return focusManager.focusFirst(groupId);
    }
    return false;
  }

  /**
   * @deprecated Use focusManager.navigate() from the new modular system
   */
  public focusLast(groupId?: string): boolean {
    console.warn('[AccessibilityManager] Using deprecated API. Please migrate to the new modular system.');
    const focusManager = this.orchestrator.getFocusManager();
    if (focusManager) {
      return focusManager.focusLast(groupId);
    }
    return false;
  }

  /**
   * @deprecated Use announcementManager.announce() from the new modular system
   */
  public announce(
    message: string,
    priority: "polite" | "assertive" = "polite",
    delay: number = 0
  ): void {
    console.warn('[AccessibilityManager] Using deprecated API. Please migrate to the new modular system.');
    const announcementManager = this.orchestrator.getAnnouncementManager();
    if (announcementManager) {
      if (delay > 0) {
        setTimeout(() => {
          announcementManager.announce({ message, priority });
        }, delay);
      } else {
        announcementManager.announce({ message, priority });
      }
    }
  }

  /**
   * @deprecated Use preferenceManager.updatePreferences() from the new modular system
   */
  public updatePreferences(newPreferences: Partial<AccessibilityPreferences>): void {
    console.warn('[AccessibilityManager] Using deprecated API. Please migrate to the new modular system.');
    this.orchestrator.applyPreferences(newPreferences);
  }

  /**
   * @deprecated Use preferenceManager.getPreferences() from the new modular system
   */
  public getPreferences(): Partial<AccessibilityPreferences> {
    console.warn('[AccessibilityManager] Using deprecated API. Please migrate to the new modular system.');
    const preferenceManager = this.orchestrator.getPreferenceManager();
    if (preferenceManager) {
      return preferenceManager.getPreferences();
    }
    // Return default preferences
    return {
      reducedMotion: false,
      highContrast: false,
      fontSize: 'medium',
      focusIndicatorStyle: 'default',
      announcements: true,
      keyboardNavigation: true,
      screenReaderEnabled: false,
    };
  }

  /**
   * @deprecated Use addAriaAttributes utility function
   */
  public addAriaAttributes(element: HTMLElement, attributes: Record<string, string>): void {
    console.warn('[AccessibilityManager] Using deprecated API. Please migrate to the new modular system.');
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key.startsWith("aria-") ? key : `aria-${key}`, value);
    });
  }

  /**
   * @deprecated Use focusManager.createSkipLink() from the new modular system
   */
  public createSkipLink(targetId: string, text: string): HTMLElement {
    console.warn('[AccessibilityManager] Using deprecated API. Please migrate to the new modular system.');
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
}

// Singleton instance for global use
let globalAccessibilityManager: AccessibilityManager | null = null;

/**
 * Get or create the global accessibility manager instance
 * @deprecated Use defaultAccessibilityOrchestrator from './accessibility'
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
 * Create a singleton instance for the application
 * @deprecated Use defaultAccessibilityOrchestrator from './accessibility'
 */
export const defaultAccessibilityManagerInstance = new AccessibilityManager();

/**
 * Convenience functions for backward compatibility
 * @deprecated Use functions from './accessibility'
 */
export function updateAccessibilityPreferences(preferences: Partial<AccessibilityPreferences>): void {
  console.warn('[updateAccessibilityPreferences] Using deprecated API. Please migrate to the new modular system.');
  applyAccessibilityPreferences(preferences);
}

export function announce(message: string, priority?: "polite" | "assertive", delay?: number): void {
  console.warn('[announce] Using deprecated API. Please migrate to the new modular system.');
  if (delay && delay > 0) {
    setTimeout(() => {
      announceModular(message, priority || 'polite');
    }, delay);
  } else {
    announceModular(message, priority || 'polite');
  }
}

export function registerFocusGroup(groupId: string, elements: HTMLElement[], priorities?: number[]): void {
  console.warn('[registerFocusGroup] Using deprecated API. Please migrate to the new modular system.');
  const focusManager = defaultAccessibilityOrchestrator.getFocusManager();
  if (focusManager) {
    focusManager.registerFocusGroup({
      id: groupId,
      elements: elements.map((element, index) => ({
        element,
        priority: priorities?.[index] ?? index,
        group: groupId
      })),
      circular: true,
      autoFocus: false,
      trapFocus: false,
      restoreFocus: true
    });
  }
}

export function createSkipLink(targetId: string, text: string): HTMLElement {
  console.warn('[createSkipLink] Using deprecated API. Please migrate to the new modular system.');
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

export function addAriaAttributes(element: HTMLElement, attributes: Record<string, string>): void {
  console.warn('[addAriaAttributes] Using deprecated API. Please migrate to the new modular system.');
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key.startsWith("aria-") ? key : `aria-${key}`, value);
  });
}

export function validateColorContrast(foreground: string, background: string): { ratio: number; passes: { AA: boolean; AAA: boolean } } {
  console.warn('[validateColorContrast] Using deprecated API. Please migrate to the new modular system.');
  // Basic implementation - delegates to WCAG validator
  const validator = defaultAccessibilityOrchestrator.getWCAGValidator();
  if (validator) {
    const result = validator.checkColorContrast(foreground, background);
    return {
      ratio: result.ratio,
      passes: { AA: result.passesAA, AAA: result.passesAAA }
    };
  }
  // Fallback implementation
  return { ratio: 1, passes: { AA: false, AAA: false } };
}

/**
 * Hook for React components to use accessibility manager
 * @deprecated Use the modular accessibility system
 */
export function useAccessibilityManager() {
  return getAccessibilityManager();
}
