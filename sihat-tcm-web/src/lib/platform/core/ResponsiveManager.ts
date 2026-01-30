/**
 * Responsive Manager
 * 
 * Handles responsive breakpoint management and media query monitoring.
 * Provides reactive breakpoint detection and change notifications.
 */

import { 
  ResponsiveBreakpoints, 
  IResponsiveManager, 
  MediaQueryListener 
} from '../interfaces/PlatformInterfaces';

export class ResponsiveManager implements IResponsiveManager {
  private breakpoints: ResponsiveBreakpoints;
  private mediaQueries: Map<string, MediaQueryList> = new Map();
  private listeners: Map<string, Set<MediaQueryListener>> = new Map();
  private isInitialized = false;

  constructor(breakpoints: ResponsiveBreakpoints) {
    this.breakpoints = breakpoints;
    
    if (typeof window !== "undefined") {
      this.initialize();
    }
  }

  /**
   * Check if current viewport matches a breakpoint
   */
  isBreakpoint(breakpoint: keyof ResponsiveBreakpoints): boolean {
    if (typeof window === "undefined") return false;

    if (!this.isInitialized) {
      this.initialize();
    }

    if (breakpoint === "xs") {
      return window.innerWidth >= this.breakpoints.xs;
    }

    const mediaQuery = this.mediaQueries.get(breakpoint);
    return mediaQuery ? mediaQuery.matches : false;
  }

  /**
   * Get current active breakpoint
   */
  getCurrentBreakpoint(): keyof ResponsiveBreakpoints {
    if (typeof window === "undefined") return "lg";

    if (!this.isInitialized) {
      this.initialize();
    }

    const width = window.innerWidth;

    if (width >= this.breakpoints["2xl"]) return "2xl";
    if (width >= this.breakpoints.xl) return "xl";
    if (width >= this.breakpoints.lg) return "lg";
    if (width >= this.breakpoints.md) return "md";
    if (width >= this.breakpoints.sm) return "sm";
    return "xs";
  }

  /**
   * Subscribe to breakpoint changes
   */
  onBreakpointChange(
    breakpoint: keyof ResponsiveBreakpoints | string,
    callback: MediaQueryListener
  ): () => void {
    if (typeof window === "undefined") return () => {};

    if (!this.isInitialized) {
      this.initialize();
    }

    const mediaQuery = this.mediaQueries.get(breakpoint);
    if (!mediaQuery) return () => {};

    let listeners = this.listeners.get(breakpoint);
    if (!listeners) {
      listeners = new Set();
      this.listeners.set(breakpoint, listeners);
    }

    listeners.add(callback);

    // Add event listener if this is the first callback for this breakpoint
    if (listeners.size === 1) {
      const handler = (e: MediaQueryListEvent) => {
        const currentListeners = this.listeners.get(breakpoint);
        if (currentListeners) {
          currentListeners.forEach((cb) => cb(e.matches));
        }
      };
      
      try {
        mediaQuery.addEventListener("change", handler);
        // Store handler for cleanup
        (mediaQuery as any)._handler = handler;
      } catch (error) {
        console.warn(`Failed to add event listener for ${breakpoint}:`, error);
      }
    }

    // Return unsubscribe function
    return () => {
      listeners?.delete(callback);
      if (listeners?.size === 0) {
        try {
          const handler = (mediaQuery as any)._handler;
          if (handler) {
            mediaQuery.removeEventListener("change", handler);
            delete (mediaQuery as any)._handler;
          }
        } catch (error) {
          console.warn(`Failed to remove event listener for ${breakpoint}:`, error);
        }
      }
    };
  }

  /**
   * Check if a specific media query matches
   */
  matchesQuery(query: string): boolean {
    if (typeof window === "undefined") return false;

    try {
      return window.matchMedia(query).matches;
    } catch (error) {
      console.warn(`Failed to match media query: ${query}`, error);
      return false;
    }
  }

  /**
   * Get all active breakpoints
   */
  getActiveBreakpoints(): Array<keyof ResponsiveBreakpoints> {
    const active: Array<keyof ResponsiveBreakpoints> = [];
    
    Object.keys(this.breakpoints).forEach((breakpoint) => {
      if (this.isBreakpoint(breakpoint as keyof ResponsiveBreakpoints)) {
        active.push(breakpoint as keyof ResponsiveBreakpoints);
      }
    });

    return active;
  }

  /**
   * Cleanup method to remove event listeners
   */
  cleanup(): void {
    this.mediaQueries.forEach((mediaQuery, key) => {
      try {
        const handler = (mediaQuery as any)._handler;
        if (handler) {
          mediaQuery.removeEventListener("change", handler);
          delete (mediaQuery as any)._handler;
        }
      } catch (error) {
        console.warn(`Failed to cleanup listener for ${key}:`, error);
      }
    });

    this.listeners.clear();
    this.mediaQueries.clear();
    this.isInitialized = false;
  }

  // Private methods

  private initialize(): void {
    if (this.isInitialized || typeof window === "undefined") return;

    try {
      this.initializeMediaQueries();
      this.isInitialized = true;
    } catch (error) {
      console.warn("ResponsiveManager initialization failed:", error);
    }
  }

  private initializeMediaQueries(): void {
    if (typeof window === "undefined" || !window.matchMedia) return;

    // Initialize breakpoint queries
    Object.entries(this.breakpoints).forEach(([key, value]) => {
      if (key !== "xs") {
        // xs is default (0px and up)
        const query = `(min-width: ${value}px)`;
        try {
          const mediaQuery = window.matchMedia(query);
          this.mediaQueries.set(key, mediaQuery);
        } catch (error) {
          console.warn(`Failed to create media query for ${key}:`, error);
        }
      }
    });

    // Initialize additional useful queries
    const additionalQueries = {
      touch: "(pointer: coarse)",
      hover: "(hover: hover)",
      "reduced-motion": "(prefers-reduced-motion: reduce)",
      dark: "(prefers-color-scheme: dark)",
      "high-contrast": "(prefers-contrast: high)",
      landscape: "(orientation: landscape)",
      portrait: "(orientation: portrait)",
    };

    Object.entries(additionalQueries).forEach(([key, query]) => {
      try {
        const mediaQuery = window.matchMedia(query);
        this.mediaQueries.set(key, mediaQuery);
      } catch (error) {
        console.warn(`Failed to create media query for ${key}:`, error);
      }
    });
  }
}