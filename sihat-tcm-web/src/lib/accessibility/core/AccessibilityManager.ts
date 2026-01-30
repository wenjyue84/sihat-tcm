/**
 * Accessibility Manager - Main Orchestrator
 * 
 * Coordinates all accessibility functionality including preferences,
 * focus management, announcements, keyboard navigation, and styling.
 */

import {
  AccessibilityPreferences,
  AccessibilityEvent,
  AccessibilityEventType,
  AccessibilityEventListener,
  SkipLinkConfig,
  AriaAttributes
} from "../interfaces/AccessibilityInterfaces";

import { PreferenceManager } from "./PreferenceManager";
import { FocusManager } from "./FocusManager";
import { AnnouncementManager } from "./AnnouncementManager";
import { KeyboardNavigationManager } from "./KeyboardNavigationManager";
import { StyleManager } from "./StyleManager";

export class AccessibilityManager {
  private context: string;
  
  // Component managers
  private preferenceManager: PreferenceManager;
  private focusManager: FocusManager;
  private announcementManager: AnnouncementManager;
  private keyboardNavigationManager: KeyboardNavigationManager;
  private styleManager: StyleManager;

  // Event system
  private eventListeners: Map<AccessibilityEventType, Set<AccessibilityEventListener>> = new Map();

  constructor(
    context: string = "AccessibilityManager",
    initialPreferences?: Partial<AccessibilityPreferences>
  ) {
    this.context = context;
    
    // Initialize managers
    this.preferenceManager = new PreferenceManager(initialPreferences);
    this.focusManager = new FocusManager();
    this.announcementManager = new AnnouncementManager();
    this.keyboardNavigationManager = new KeyboardNavigationManager(this.focusManager);
    this.styleManager = new StyleManager(this.preferenceManager.getPreferences());

    this.initialize();
  }

  /**
   * Initialize accessibility manager
   */
  private initialize(): void {
    this.setupPreferenceUpdates();
    this.setupInitialState();
  }

  /**
   * Setup preference update handling
   */
  private setupPreferenceUpdates(): void {
    // Listen for preference changes and update all managers
    const originalUpdatePreferences = this.preferenceManager.updatePreferences.bind(this.preferenceManager);
    
    this.preferenceManager.updatePreferences = (newPreferences: Partial<AccessibilityPreferences>) => {
      originalUpdatePreferences(newPreferences);
      
      const updatedPreferences = this.preferenceManager.getPreferences();
      this.styleManager.updatePreferences(updatedPreferences);
      
      // Update keyboard navigation based on preferences
      this.keyboardNavigationManager.setFeatureEnabled(
        "enableTabNavigation", 
        updatedPreferences.keyboardNavigation
      );

      // Emit preference update event
      this.emitEvent("preferences-updated", updatedPreferences);
    };
  }

  /**
   * Setup initial accessibility state
   */
  private setupInitialState(): void {
    const preferences = this.preferenceManager.getPreferences();
    
    // Apply initial styles
    this.styleManager.applyAccessibilityStyles();
    
    // Setup announcements based on preferences
    this.announcementManager.setEnabled(preferences.announcements);
    
    // Announce system ready
    if (preferences.announcements) {
      this.announcementManager.announce("Accessibility system initialized", "polite", 1000);
    }
  }

  /**
   * Update accessibility preferences
   */
  public updatePreferences(newPreferences: Partial<AccessibilityPreferences>): void {
    this.preferenceManager.updatePreferences(newPreferences);
  }

  /**
   * Get current accessibility preferences
   */
  public getPreferences(): AccessibilityPreferences {
    return this.preferenceManager.getPreferences();
  }

  /**
   * Register focusable elements for a group
   */
  public registerFocusGroup(
    groupId: string, 
    elements: HTMLElement[], 
    priorities?: number[]
  ): void {
    this.focusManager.registerFocusGroup(groupId, elements, priorities);
  }

  /**
   * Set current focus group
   */
  public setFocusGroup(groupId: string): void {
    this.focusManager.setFocusGroup(groupId);
    this.emitEvent("group-changed", { groupId });
  }

  /**
   * Navigate focus within current group
   */
  public navigateFocus(direction: "next" | "previous" | "first" | "last"): boolean {
    const success = this.focusManager.navigate(direction);
    
    if (success) {
      const currentFocus = this.focusManager.getCurrentFocus();
      this.emitEvent("focus-changed", currentFocus);
    }
    
    return success;
  }

  /**
   * Setup focus trap
   */
  public trapFocus(container: HTMLElement, options?: any): void {
    this.focusManager.trapFocus(container, options);
  }

  /**
   * Release focus trap
   */
  public releaseFocusTrap(restoreFocus: boolean = true): void {
    this.focusManager.releaseFocusTrap(restoreFocus);
  }

  /**
   * Make announcement to screen readers
   */
  public announce(
    message: string, 
    priority: "polite" | "assertive" = "polite", 
    delay: number = 0
  ): void {
    this.announcementManager.announce(message, priority, delay);
    this.emitEvent("announcement-made", { message, priority, delay });
  }

  /**
   * Announce form errors
   */
  public announceFormErrors(errors: string[]): void {
    this.announcementManager.announceFormErrors(errors);
  }

  /**
   * Announce navigation changes
   */
  public announceNavigation(pageName: string, landmark?: string): void {
    this.announcementManager.announceNavigation(pageName, landmark);
  }

  /**
   * Announce loading states
   */
  public announceLoading(isLoading: boolean, context?: string): void {
    this.announcementManager.announceLoading(isLoading, context);
  }

  /**
   * Register keyboard shortcut
   */
  public registerShortcut(shortcut: string, handler: () => void): void {
    this.keyboardNavigationManager.registerShortcut(shortcut, handler);
  }

  /**
   * Unregister keyboard shortcut
   */
  public unregisterShortcut(shortcut: string): void {
    this.keyboardNavigationManager.unregisterShortcut(shortcut);
  }

  /**
   * Create skip link
   */
  public createSkipLink(config: SkipLinkConfig): HTMLElement {
    return this.styleManager.createSkipLink(config.targetId, config.text);
  }

  /**
   * Add ARIA attributes to element
   */
  public addAriaAttributes(element: HTMLElement, attributes: AriaAttributes): void {
    const ariaMap: Record<string, string> = {};
    
    Object.entries(attributes).forEach(([key, value]) => {
      if (value !== undefined) {
        ariaMap[key] = String(value);
      }
    });
    
    this.styleManager.addAriaAttributes(element, ariaMap);
  }

  /**
   * Validate color contrast
   */
  public validateColorContrast(foreground: string, background: string) {
    return this.styleManager.validateColorContrast(foreground, background);
  }

  /**
   * Create live region for dynamic content
   */
  public createLiveRegion(
    id: string, 
    priority: "polite" | "assertive" = "polite", 
    atomic: boolean = true
  ): HTMLElement {
    return this.announcementManager.createLiveRegion(id, priority, atomic);
  }

  /**
   * Update live region content
   */
  public updateLiveRegion(id: string, content: string): void {
    this.announcementManager.updateLiveRegion(id, content);
  }

  /**
   * Get system status
   */
  public getSystemStatus(): {
    preferences: AccessibilityPreferences;
    focusInfo: ReturnType<FocusManager["getCurrentFocus"]>;
    queueStatus: ReturnType<AnnouncementManager["getQueueStatus"]>;
    shortcuts: number;
    isInitialized: boolean;
  } {
    return {
      preferences: this.getPreferences(),
      focusInfo: this.focusManager.getCurrentFocus(),
      queueStatus: this.announcementManager.getQueueStatus(),
      shortcuts: this.keyboardNavigationManager.getShortcuts().size,
      isInitialized: true
    };
  }

  /**
   * Export accessibility settings
   */
  public exportSettings(): string {
    return this.preferenceManager.exportPreferences();
  }

  /**
   * Import accessibility settings
   */
  public importSettings(data: string): boolean {
    return this.preferenceManager.importPreferences(data);
  }

  /**
   * Add event listener
   */
  public addEventListener(type: AccessibilityEventType, listener: AccessibilityEventListener): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(listener);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(type: AccessibilityEventType, listener: AccessibilityEventListener): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  /**
   * Emit accessibility event
   */
  private emitEvent(type: AccessibilityEventType, data?: any): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      const event: AccessibilityEvent = {
        type,
        data,
        timestamp: Date.now()
      };

      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`[${this.context}] Event listener error:`, error);
        }
      });
    }
  }

  /**
   * Perform accessibility audit
   */
  public performAudit(): Promise<any> {
    // This would integrate with accessibility testing tools
    // For now, return basic validation
    return Promise.resolve({
      score: 85,
      issues: [],
      recommendations: [
        "Consider adding more ARIA labels",
        "Ensure all interactive elements are keyboard accessible",
        "Verify color contrast ratios meet WCAG guidelines"
      ]
    });
  }

  /**
   * Cleanup accessibility manager
   */
  public destroy(): void {
    // Cleanup all managers
    this.announcementManager.destroy();
    this.keyboardNavigationManager.destroy();
    this.styleManager.destroy();
    
    // Clear event listeners
    this.eventListeners.clear();
    
    // Announce cleanup
    if (this.preferenceManager.getPreferences().announcements) {
      // Create temporary announcer for final message
      const tempAnnouncer = document.createElement("div");
      tempAnnouncer.setAttribute("aria-live", "polite");
      tempAnnouncer.className = "sr-only";
      document.body.appendChild(tempAnnouncer);
      
      setTimeout(() => {
        tempAnnouncer.textContent = "Accessibility system disabled";
        setTimeout(() => tempAnnouncer.remove(), 1000);
      }, 100);
    }
  }
}

// Create default instance
export const defaultAccessibilityManager = new AccessibilityManager("DefaultAccessibility");

/**
 * Create accessibility manager instance
 */
export function createAccessibilityManager(
  context?: string,
  initialPreferences?: Partial<AccessibilityPreferences>
): AccessibilityManager {
  return new AccessibilityManager(context, initialPreferences);
}