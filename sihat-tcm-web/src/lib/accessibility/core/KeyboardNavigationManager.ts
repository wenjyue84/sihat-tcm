/**
 * Keyboard Navigation Manager
 *
 * Manages keyboard navigation, skip links, and keyboard accessibility
 * with comprehensive keyboard event handling and navigation patterns.
 */

import { logger } from "@/lib/clientLogger";
import type {
  KeyboardNavigationManager as IKeyboardNavigationManager,
  KeyboardNavigationConfig,
  KeyboardHandler,
} from "../interfaces/AccessibilityInterfaces";

/**
 * Keyboard navigation manager implementation
 */
export class KeyboardNavigationManager implements IKeyboardNavigationManager {
  private config: KeyboardNavigationConfig;
  private keyBindings: Map<string, KeyboardHandler> = new Map();
  private skipLinks: HTMLElement[] = [];
  private trapContainers: Map<HTMLElement, boolean> = new Map();
  private initialized: boolean = false;

  constructor() {
    this.config = {
      enabled: true,
      skipLinks: true,
      customKeyBindings: {},
      focusVisible: true,
      tabTrapEnabled: true,
    };
  }

  /**
   * Initialize keyboard navigation
   */
  public initialize(config: KeyboardNavigationConfig): void {
    if (this.initialized) {
      logger.warn("KeyboardNavigationManager", "Already initialized");
      return;
    }

    this.config = { ...this.config, ...config };

    if (!this.config.enabled) {
      logger.info("KeyboardNavigationManager", "Keyboard navigation disabled");
      return;
    }

    try {
      this.setupKeyboardEventListeners();
      this.setupDefaultKeyBindings();
      this.setupCustomKeyBindings();

      if (this.config.skipLinks) {
        this.enableSkipLinks();
      }

      if (this.config.focusVisible) {
        this.enableFocusVisible();
      }

      this.initialized = true;
      logger.info("KeyboardNavigationManager", "Initialized successfully");
    } catch (error) {
      logger.error("KeyboardNavigationManager", "Failed to initialize", error);
      throw error;
    }
  }

  /**
   * Setup keyboard event listeners
   */
  private setupKeyboardEventListeners(): void {
    if (typeof document === "undefined") return;

    // Global keydown handler
    document.addEventListener("keydown", this.handleGlobalKeyDown.bind(this));

    // Focus tracking for focus-visible
    document.addEventListener("mousedown", this.handleMouseDown.bind(this));
    document.addEventListener("keydown", this.handleKeyDownForFocus.bind(this));

    logger.debug("KeyboardNavigationManager", "Event listeners setup");
  }

  /**
   * Setup default key bindings
   */
  private setupDefaultKeyBindings(): void {
    // Escape key - close modals, cancel operations
    this.addKeyBinding({
      keys: ["Escape"],
      handler: this.handleEscapeKey.bind(this),
      description: "Close modals and cancel operations",
    });

    // Arrow keys for navigation
    this.addKeyBinding({
      keys: ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"],
      handler: this.handleArrowKeys.bind(this),
      description: "Navigate with arrow keys",
    });

    // Enter and Space for activation
    this.addKeyBinding({
      keys: ["Enter", " "],
      handler: this.handleActivationKeys.bind(this),
      description: "Activate buttons and links",
    });

    // Home and End keys
    this.addKeyBinding({
      keys: ["Home", "End"],
      handler: this.handleHomeEndKeys.bind(this),
      description: "Navigate to start/end",
    });

    logger.debug("KeyboardNavigationManager", "Default key bindings setup");
  }

  /**
   * Setup custom key bindings from config
   */
  private setupCustomKeyBindings(): void {
    Object.entries(this.config.customKeyBindings).forEach(([keys, handler]) => {
      this.addKeyBinding({
        keys: [keys],
        handler: handler.handler,
        preventDefault: handler.preventDefault,
        stopPropagation: handler.stopPropagation,
        description: handler.description,
      });
    });
  }

  /**
   * Add a key binding
   */
  public addKeyBinding(binding: KeyboardHandler): void {
    const keyString = binding.keys.join("+");
    this.keyBindings.set(keyString, binding);

    logger.debug("KeyboardNavigationManager", "Key binding added", {
      keys: binding.keys,
      description: binding.description,
    });
  }

  /**
   * Remove a key binding
   */
  public removeKeyBinding(keys: string[]): void {
    const keyString = keys.join("+");
    const removed = this.keyBindings.delete(keyString);

    if (removed) {
      logger.debug("KeyboardNavigationManager", "Key binding removed", { keys });
    }
  }

  /**
   * Handle global keydown events
   */
  private handleGlobalKeyDown(event: KeyboardEvent): void {
    const key = event.key;
    const modifiers = [];

    if (event.ctrlKey) modifiers.push("Ctrl");
    if (event.altKey) modifiers.push("Alt");
    if (event.shiftKey) modifiers.push("Shift");
    if (event.metaKey) modifiers.push("Meta");

    // Check for exact key match first
    const exactMatch = this.keyBindings.get(key);
    if (exactMatch) {
      this.executeKeyBinding(exactMatch, event);
      return;
    }

    // Check for key with modifiers
    const keyWithModifiers = [...modifiers, key].join("+");
    const modifierMatch = this.keyBindings.get(keyWithModifiers);
    if (modifierMatch) {
      this.executeKeyBinding(modifierMatch, event);
      return;
    }

    // Check for any key that matches
    for (const [keyString, binding] of this.keyBindings.entries()) {
      if (binding.keys.includes(key)) {
        this.executeKeyBinding(binding, event);
        break;
      }
    }
  }

  /**
   * Execute a key binding
   */
  private executeKeyBinding(binding: KeyboardHandler, event: KeyboardEvent): void {
    try {
      if (binding.preventDefault) {
        event.preventDefault();
      }

      if (binding.stopPropagation) {
        event.stopPropagation();
      }

      binding.handler(event);
    } catch (error) {
      logger.error("KeyboardNavigationManager", "Error executing key binding", {
        keys: binding.keys,
        error,
      });
    }
  }

  /**
   * Handle escape key
   */
  private handleEscapeKey(event: KeyboardEvent): void {
    // Close any open modals
    const modals = document.querySelectorAll('[role="dialog"][aria-modal="true"]');
    if (modals.length > 0) {
      const lastModal = modals[modals.length - 1] as HTMLElement;
      const closeButton = lastModal.querySelector(
        '[aria-label*="close"], [aria-label*="Close"], .close-button'
      ) as HTMLElement;

      if (closeButton) {
        closeButton.click();
        event.preventDefault();
      }
    }

    // Clear any active focus traps
    this.trapContainers.forEach((isActive, container) => {
      if (isActive) {
        this.handleTabTrap(container, false);
      }
    });
  }

  /**
   * Handle arrow keys
   */
  private handleArrowKeys(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;

    // Handle arrow key navigation in specific contexts
    if (target.getAttribute("role") === "tablist") {
      this.handleTabListNavigation(event);
    } else if (target.getAttribute("role") === "menu" || target.closest('[role="menu"]')) {
      this.handleMenuNavigation(event);
    } else if (target.getAttribute("role") === "grid" || target.closest('[role="grid"]')) {
      this.handleGridNavigation(event);
    }
  }

  /**
   * Handle activation keys (Enter, Space)
   */
  private handleActivationKeys(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;

    // Only handle if the element is not naturally activatable
    if (target.tagName === "BUTTON" || target.tagName === "A") {
      return; // Let browser handle naturally
    }

    // Handle custom interactive elements
    if (
      target.getAttribute("role") === "button" ||
      target.getAttribute("tabindex") === "0" ||
      target.classList.contains("clickable")
    ) {
      target.click();
      event.preventDefault();
    }
  }

  /**
   * Handle Home/End keys
   */
  private handleHomeEndKeys(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    const container = target.closest('[role="tablist"], [role="menu"], [role="grid"]');

    if (container) {
      const focusableElements = this.getFocusableElements(container as HTMLElement);

      if (focusableElements.length > 0) {
        if (event.key === "Home") {
          focusableElements[0].focus();
        } else if (event.key === "End") {
          focusableElements[focusableElements.length - 1].focus();
        }
        event.preventDefault();
      }
    }
  }

  /**
   * Handle tab list navigation
   */
  private handleTabListNavigation(event: KeyboardEvent): void {
    const tabList = event.target as HTMLElement;
    const tabs = Array.from(tabList.querySelectorAll('[role="tab"]')) as HTMLElement[];
    const currentIndex = tabs.indexOf(event.target as HTMLElement);

    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
    } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
    }

    if (nextIndex !== currentIndex) {
      tabs[nextIndex].focus();
      event.preventDefault();
    }
  }

  /**
   * Handle menu navigation
   */
  private handleMenuNavigation(event: KeyboardEvent): void {
    const menu = (event.target as HTMLElement).closest('[role="menu"]') as HTMLElement;
    if (!menu) return;

    const menuItems = Array.from(menu.querySelectorAll('[role="menuitem"]')) as HTMLElement[];
    const currentIndex = menuItems.indexOf(event.target as HTMLElement);

    if (currentIndex === -1) return;

    let nextIndex = currentIndex;

    if (event.key === "ArrowUp") {
      nextIndex = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
    } else if (event.key === "ArrowDown") {
      nextIndex = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
    }

    if (nextIndex !== currentIndex) {
      menuItems[nextIndex].focus();
      event.preventDefault();
    }
  }

  /**
   * Handle grid navigation
   */
  private handleGridNavigation(event: KeyboardEvent): void {
    // Implementation for grid navigation would go here
    // This is a simplified version
    event.preventDefault();
  }

  /**
   * Handle mouse down for focus-visible
   */
  private handleMouseDown(): void {
    if (typeof document !== "undefined") {
      document.body.classList.add("using-mouse");
    }
  }

  /**
   * Handle key down for focus-visible
   */
  private handleKeyDownForFocus(event: KeyboardEvent): void {
    if (event.key === "Tab") {
      if (typeof document !== "undefined") {
        document.body.classList.remove("using-mouse");
      }
    }
  }

  /**
   * Enable skip links
   */
  public enableSkipLinks(): void {
    if (typeof document === "undefined") return;

    // Create main content skip link if it doesn't exist
    const existingSkipLink = document.querySelector(".skip-link");
    if (!existingSkipLink) {
      const mainContent = document.querySelector('main, #main, [role="main"]');
      if (mainContent) {
        const skipLink = this.createSkipLink("main", "Skip to main content");
        document.body.insertBefore(skipLink, document.body.firstChild);
      }
    }

    logger.debug("KeyboardNavigationManager", "Skip links enabled");
  }

  /**
   * Disable skip links
   */
  public disableSkipLinks(): void {
    this.skipLinks.forEach((link) => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    });
    this.skipLinks = [];

    logger.debug("KeyboardNavigationManager", "Skip links disabled");
  }

  /**
   * Create a skip link
   */
  public createSkipLink(targetId: string, text: string): HTMLElement {
    const skipLink = document.createElement("a");
    skipLink.href = `#${targetId}`;
    skipLink.textContent = text;
    skipLink.className = "skip-link";

    // Style the skip link
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 9999;
      border-radius: 4px;
      transition: top 0.3s;
    `;

    // Show on focus
    skipLink.addEventListener("focus", () => {
      skipLink.style.top = "6px";
    });

    skipLink.addEventListener("blur", () => {
      skipLink.style.top = "-40px";
    });

    this.skipLinks.push(skipLink);
    return skipLink;
  }

  /**
   * Handle tab trap
   */
  public handleTabTrap(container: HTMLElement, enabled: boolean): void {
    this.trapContainers.set(container, enabled);

    if (enabled) {
      container.addEventListener("keydown", this.handleTabTrapKeyDown.bind(this));
    } else {
      container.removeEventListener("keydown", this.handleTabTrapKeyDown.bind(this));
    }

    logger.debug("KeyboardNavigationManager", "Tab trap", {
      enabled,
      container: container.tagName,
    });
  }

  /**
   * Handle tab trap keydown
   */
  private handleTabTrapKeyDown(event: KeyboardEvent): void {
    if (event.key !== "Tab") return;

    const container = event.currentTarget as HTMLElement;
    const focusableElements = this.getFocusableElements(container);

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        lastElement.focus();
        event.preventDefault();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        firstElement.focus();
        event.preventDefault();
      }
    }
  }

  /**
   * Get focusable elements within a container
   */
  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      "button:not([disabled])",
      "[href]",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(", ");

    const elements = Array.from(container.querySelectorAll(focusableSelectors)) as HTMLElement[];

    return elements.filter((element) => {
      const style = window.getComputedStyle(element);
      return (
        style.display !== "none" && style.visibility !== "hidden" && element.offsetParent !== null
      );
    });
  }

  /**
   * Enable focus-visible behavior
   */
  private enableFocusVisible(): void {
    if (typeof document === "undefined") return;

    // Add CSS for focus-visible
    const style = document.createElement("style");
    style.textContent = `
      .using-mouse *:focus {
        outline: none;
      }
      
      :not(.using-mouse) *:focus,
      *:focus-visible {
        outline: 2px solid #005fcc;
        outline-offset: 2px;
      }
      
      .focus-high-contrast *:focus,
      .focus-high-contrast *:focus-visible {
        outline: 3px solid #ffff00;
        outline-offset: 2px;
      }
      
      .focus-thick *:focus,
      .focus-thick *:focus-visible {
        outline: 4px solid #005fcc;
        outline-offset: 3px;
      }
    `;

    document.head.appendChild(style);

    logger.debug("KeyboardNavigationManager", "Focus-visible enabled");
  }

  /**
   * Get all key bindings
   */
  public getKeyBindings(): Map<string, KeyboardHandler> {
    return new Map(this.keyBindings);
  }

  /**
   * Check if initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Destroy the keyboard navigation manager
   */
  public destroy(): void {
    if (!this.initialized) return;

    // Remove event listeners
    if (typeof document !== "undefined") {
      document.removeEventListener("keydown", this.handleGlobalKeyDown.bind(this));
      document.removeEventListener("mousedown", this.handleMouseDown.bind(this));
      document.removeEventListener("keydown", this.handleKeyDownForFocus.bind(this));
    }

    // Clear key bindings
    this.keyBindings.clear();

    // Remove skip links
    this.disableSkipLinks();

    // Clear tab traps
    this.trapContainers.clear();

    this.initialized = false;

    logger.info("KeyboardNavigationManager", "Destroyed successfully");
  }
}
