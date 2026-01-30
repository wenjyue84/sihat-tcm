/**
 * Style Manager
 * 
 * Manages accessibility-related styling including high contrast,
 * reduced motion, font sizes, and focus indicators.
 */

import {
  AccessibilityPreferences,
  FontSize,
  FocusIndicatorStyle
} from "../interfaces/AccessibilityInterfaces";

export class StyleManager {
  private preferences: AccessibilityPreferences;
  private styleElement: HTMLStyleElement | null = null;

  constructor(preferences: AccessibilityPreferences) {
    this.preferences = preferences;
    this.initialize();
  }

  /**
   * Initialize style management
   */
  private initialize(): void {
    if (typeof document === "undefined") return;

    this.createStyleElement();
    this.applyAccessibilityStyles();
  }

  /**
   * Create style element for accessibility styles
   */
  private createStyleElement(): void {
    if (typeof document === "undefined") return;

    this.styleElement = document.createElement("style");
    this.styleElement.id = "accessibility-styles";
    document.head.appendChild(this.styleElement);
  }

  /**
   * Apply accessibility styles based on preferences
   */
  public applyAccessibilityStyles(): void {
    if (typeof document === "undefined") return;

    const root = document.documentElement;

    // Apply CSS classes
    this.applyRootClasses(root);
    
    // Apply custom CSS
    this.applyCustomStyles();
  }

  /**
   * Apply root CSS classes
   */
  private applyRootClasses(root: HTMLElement): void {
    // High contrast mode
    if (this.preferences.highContrast) {
      root.classList.add("accessibility-high-contrast");
    } else {
      root.classList.remove("accessibility-high-contrast");
    }

    // Reduced motion
    if (this.preferences.reducedMotion) {
      root.classList.add("accessibility-reduced-motion");
    } else {
      root.classList.remove("accessibility-reduced-motion");
    }

    // Font size
    root.classList.remove(
      "accessibility-font-small",
      "accessibility-font-medium",
      "accessibility-font-large",
      "accessibility-font-extra-large"
    );
    root.classList.add(`accessibility-font-${this.preferences.fontSize}`);

    // Focus indicator style
    root.classList.remove(
      "accessibility-focus-default",
      "accessibility-focus-high-contrast",
      "accessibility-focus-thick"
    );
    root.classList.add(`accessibility-focus-${this.preferences.focusIndicatorStyle}`);

    // Screen reader mode
    if (this.preferences.screenReaderEnabled) {
      root.classList.add("accessibility-screen-reader");
    } else {
      root.classList.remove("accessibility-screen-reader");
    }
  }

  /**
   * Apply custom CSS styles
   */
  private applyCustomStyles(): void {
    if (!this.styleElement) return;

    const styles = this.generateAccessibilityCSS();
    this.styleElement.textContent = styles;
  }

  /**
   * Generate accessibility CSS
   */
  private generateAccessibilityCSS(): string {
    const styles: string[] = [];

    // High contrast styles
    if (this.preferences.highContrast) {
      styles.push(`
        .accessibility-high-contrast {
          --color-background: #000000;
          --color-foreground: #ffffff;
          --color-primary: #ffff00;
          --color-secondary: #00ffff;
          --color-accent: #ff00ff;
          --color-border: #ffffff;
          --color-focus: #ffff00;
        }
        
        .accessibility-high-contrast * {
          background-color: var(--color-background) !important;
          color: var(--color-foreground) !important;
          border-color: var(--color-border) !important;
        }
        
        .accessibility-high-contrast a,
        .accessibility-high-contrast button {
          color: var(--color-primary) !important;
        }
        
        .accessibility-high-contrast :focus {
          outline: 3px solid var(--color-focus) !important;
          outline-offset: 2px !important;
        }
      `);
    }

    // Reduced motion styles
    if (this.preferences.reducedMotion) {
      styles.push(`
        .accessibility-reduced-motion *,
        .accessibility-reduced-motion *::before,
        .accessibility-reduced-motion *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      `);
    }

    // Font size styles
    styles.push(this.getFontSizeStyles());

    // Focus indicator styles
    styles.push(this.getFocusIndicatorStyles());

    // Screen reader styles
    styles.push(`
      .sr-only {
        position: absolute !important;
        width: 1px !important;
        height: 1px !important;
        padding: 0 !important;
        margin: -1px !important;
        overflow: hidden !important;
        clip: rect(0, 0, 0, 0) !important;
        white-space: nowrap !important;
        border: 0 !important;
      }
      
      .sr-only-focusable:focus {
        position: static !important;
        width: auto !important;
        height: auto !important;
        padding: inherit !important;
        margin: inherit !important;
        overflow: visible !important;
        clip: auto !important;
        white-space: normal !important;
      }
    `);

    return styles.join('\n');
  }

  /**
   * Get font size styles
   */
  private getFontSizeStyles(): string {
    const fontSizeMap: Record<FontSize, string> = {
      small: "0.875rem",
      medium: "1rem",
      large: "1.125rem",
      "extra-large": "1.25rem"
    };

    const fontSize = fontSizeMap[this.preferences.fontSize];

    return `
      .accessibility-font-${this.preferences.fontSize} {
        font-size: ${fontSize} !important;
      }
      
      .accessibility-font-${this.preferences.fontSize} h1 {
        font-size: calc(${fontSize} * 2.5) !important;
      }
      
      .accessibility-font-${this.preferences.fontSize} h2 {
        font-size: calc(${fontSize} * 2) !important;
      }
      
      .accessibility-font-${this.preferences.fontSize} h3 {
        font-size: calc(${fontSize} * 1.75) !important;
      }
      
      .accessibility-font-${this.preferences.fontSize} h4 {
        font-size: calc(${fontSize} * 1.5) !important;
      }
      
      .accessibility-font-${this.preferences.fontSize} h5 {
        font-size: calc(${fontSize} * 1.25) !important;
      }
      
      .accessibility-font-${this.preferences.fontSize} h6 {
        font-size: calc(${fontSize} * 1.125) !important;
      }
    `;
  }

  /**
   * Get focus indicator styles
   */
  private getFocusIndicatorStyles(): string {
    const focusStyles: Record<FocusIndicatorStyle, string> = {
      default: `
        .accessibility-focus-default :focus {
          outline: 2px solid #0066cc;
          outline-offset: 2px;
        }
      `,
      "high-contrast": `
        .accessibility-focus-high-contrast :focus {
          outline: 3px solid #ffff00;
          outline-offset: 2px;
          background-color: #000000 !important;
          color: #ffff00 !important;
        }
      `,
      thick: `
        .accessibility-focus-thick :focus {
          outline: 4px solid #0066cc;
          outline-offset: 3px;
          box-shadow: 0 0 0 2px #ffffff, 0 0 0 6px #0066cc;
        }
      `
    };

    return focusStyles[this.preferences.focusIndicatorStyle];
  }

  /**
   * Update preferences and reapply styles
   */
  public updatePreferences(newPreferences: AccessibilityPreferences): void {
    this.preferences = newPreferences;
    this.applyAccessibilityStyles();
  }

  /**
   * Create skip link
   */
  public createSkipLink(targetId: string, text: string): HTMLElement {
    const skipLink = document.createElement("a");
    skipLink.href = `#${targetId}`;
    skipLink.textContent = text;
    skipLink.className = "skip-link sr-only-focusable";
    
    // Apply skip link styles
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px 16px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 9999;
      transition: top 0.3s;
      font-weight: bold;
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
   * Add ARIA attributes to element
   */
  public addAriaAttributes(element: HTMLElement, attributes: Record<string, string>): void {
    Object.entries(attributes).forEach(([key, value]) => {
      const ariaKey = key.startsWith("aria-") ? key : `aria-${key}`;
      element.setAttribute(ariaKey, value);
    });
  }

  /**
   * Create accessible button
   */
  public createAccessibleButton(
    text: string,
    onClick: () => void,
    options: {
      ariaLabel?: string;
      ariaDescribedBy?: string;
      disabled?: boolean;
    } = {}
  ): HTMLButtonElement {
    const button = document.createElement("button");
    button.textContent = text;
    button.addEventListener("click", onClick);

    if (options.ariaLabel) {
      button.setAttribute("aria-label", options.ariaLabel);
    }

    if (options.ariaDescribedBy) {
      button.setAttribute("aria-describedby", options.ariaDescribedBy);
    }

    if (options.disabled) {
      button.disabled = true;
      button.setAttribute("aria-disabled", "true");
    }

    return button;
  }

  /**
   * Validate color contrast
   */
  public validateColorContrast(
    foreground: string,
    background: string
  ): { ratio: number; passes: boolean; level: "AA" | "AAA" | "fail" } {
    const fgLuminance = this.getLuminance(foreground);
    const bgLuminance = this.getLuminance(background);
    
    const ratio = (Math.max(fgLuminance, bgLuminance) + 0.05) / 
                  (Math.min(fgLuminance, bgLuminance) + 0.05);

    let level: "AA" | "AAA" | "fail";
    let passes: boolean;

    if (ratio >= 7) {
      level = "AAA";
      passes = true;
    } else if (ratio >= 4.5) {
      level = "AA";
      passes = true;
    } else {
      level = "fail";
      passes = false;
    }

    return { ratio, passes, level };
  }

  /**
   * Get luminance of a color
   */
  private getLuminance(color: string): number {
    // Convert color to RGB values
    const rgb = this.hexToRgb(color);
    if (!rgb) return 0;

    // Convert to relative luminance
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  /**
   * Convert hex color to RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Cleanup styles
   */
  public destroy(): void {
    if (this.styleElement) {
      this.styleElement.remove();
      this.styleElement = null;
    }

    // Remove accessibility classes
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      const accessibilityClasses = Array.from(root.classList).filter(
        className => className.startsWith("accessibility-")
      );
      root.classList.remove(...accessibilityClasses);
    }
  }
}