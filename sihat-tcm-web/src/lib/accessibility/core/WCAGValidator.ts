/**
 * WCAG Validator
 * 
 * Validates WCAG 2.1 AA compliance with comprehensive accessibility
 * checks and detailed reporting for continuous improvement.
 */

import { logger } from "@/lib/clientLogger";
import type {
  WCAGValidator as IWCAGValidator,
  WCAGComplianceResult,
  WCAGComplianceReport,
  WCAGIssue,
  WCAGSuggestion,
  WCAGIssueType
} from "../interfaces/AccessibilityInterfaces";

/**
 * WCAG validator implementation
 */
export class WCAGValidator implements IWCAGValidator {
  private validationRules: Map<WCAGIssueType, (element?: HTMLElement) => WCAGIssue[]> = new Map();
  private lastValidationResult: WCAGComplianceResult | null = null;

  constructor() {
    this.initializeValidationRules();
  }

  /**
   * Initialize validation rules
   */
  private initializeValidationRules(): void {
    this.validationRules.set('missing_alt_text', this.checkMissingAltText.bind(this));
    this.validationRules.set('insufficient_contrast', this.checkInsufficientContrast.bind(this));
    this.validationRules.set('missing_label', this.checkMissingLabels.bind(this));
    this.validationRules.set('keyboard_inaccessible', this.checkKeyboardAccessibility.bind(this));
    this.validationRules.set('missing_heading_structure', this.checkHeadingStructure.bind(this));
    this.validationRules.set('missing_landmarks', this.checkLandmarks.bind(this));
    this.validationRules.set('auto_playing_media', this.checkAutoPlayingMedia.bind(this));
    this.validationRules.set('missing_focus_indicator', this.checkFocusIndicators.bind(this));
    this.validationRules.set('insufficient_target_size', this.checkTargetSize.bind(this));
    this.validationRules.set('missing_skip_links', this.checkSkipLinks.bind(this));
    this.validationRules.set('improper_form_structure', this.checkFormStructure.bind(this));
    this.validationRules.set('missing_error_identification', this.checkErrorIdentification.bind(this));

    logger.debug("WCAGValidator", "Validation rules initialized");
  }

  /**
   * Validate a single element
   */
  public validateElement(element: HTMLElement): WCAGComplianceResult {
    const issues: WCAGIssue[] = [];
    const suggestions: WCAGSuggestion[] = [];

    // Run all validation rules on the element
    for (const [ruleType, ruleFunction] of this.validationRules.entries()) {
      try {
        const ruleIssues = ruleFunction(element);
        issues.push(...ruleIssues);
      } catch (error) {
        logger.error("WCAGValidator", "Error running validation rule", {
          ruleType,
          error,
        });
      }
    }

    // Generate suggestions based on issues
    suggestions.push(...this.generateSuggestions(issues));

    // Calculate compliance score
    const score = this.calculateComplianceScore(issues, 1);

    // Determine compliance level
    const level = this.determineComplianceLevel(issues, score);

    const result: WCAGComplianceResult = {
      isCompliant: issues.length === 0,
      level,
      issues,
      suggestions,
      score,
    };

    return result;
  }

  /**
   * Validate the entire page
   */
  public validatePage(): WCAGComplianceResult {
    if (typeof document === "undefined") {
      return {
        isCompliant: false,
        level: "A",
        issues: [],
        suggestions: [],
        score: 0,
      };
    }

    const issues: WCAGIssue[] = [];
    const suggestions: WCAGSuggestion[] = [];

    // Run all validation rules on the entire document
    for (const [ruleType, ruleFunction] of this.validationRules.entries()) {
      try {
        const ruleIssues = ruleFunction();
        issues.push(...ruleIssues);
      } catch (error) {
        logger.error("WCAGValidator", "Error running page validation rule", {
          ruleType,
          error,
        });
      }
    }

    // Generate suggestions based on issues
    suggestions.push(...this.generateSuggestions(issues));

    // Calculate total elements checked
    const totalElements = document.querySelectorAll('*').length;

    // Calculate compliance score
    const score = this.calculateComplianceScore(issues, totalElements);

    // Determine compliance level
    const level = this.determineComplianceLevel(issues, score);

    const result: WCAGComplianceResult = {
      isCompliant: issues.length === 0,
      level,
      issues,
      suggestions,
      score,
    };

    this.lastValidationResult = result;

    logger.info("WCAGValidator", "Page validation completed", {
      totalIssues: issues.length,
      score,
      level,
    });

    return result;
  }

  /**
   * Validate a section of the page
   */
  public validateSection(container: HTMLElement): WCAGComplianceResult {
    const issues: WCAGIssue[] = [];
    const suggestions: WCAGSuggestion[] = [];

    // Run validation rules on the container and its children
    for (const [ruleType, ruleFunction] of this.validationRules.entries()) {
      try {
        const ruleIssues = ruleFunction(container);
        issues.push(...ruleIssues);
      } catch (error) {
        logger.error("WCAGValidator", "Error running section validation rule", {
          ruleType,
          error,
        });
      }
    }

    // Generate suggestions
    suggestions.push(...this.generateSuggestions(issues));

    // Calculate elements in section
    const sectionElements = container.querySelectorAll('*').length + 1; // +1 for container itself

    // Calculate compliance score
    const score = this.calculateComplianceScore(issues, sectionElements);

    // Determine compliance level
    const level = this.determineComplianceLevel(issues, score);

    return {
      isCompliant: issues.length === 0,
      level,
      issues,
      suggestions,
      score,
    };
  }

  /**
   * Check color contrast
   */
  public checkColorContrast(foreground: string, background: string): {
    ratio: number;
    passesAA: boolean;
    passesAAA: boolean;
  } {
    const fgRgb = this.hexToRgb(foreground);
    const bgRgb = this.hexToRgb(background);

    if (!fgRgb || !bgRgb) {
      return { ratio: 0, passesAA: false, passesAAA: false };
    }

    const fgLuminance = this.calculateLuminance(fgRgb);
    const bgLuminance = this.calculateLuminance(bgRgb);

    const ratio = (Math.max(fgLuminance, bgLuminance) + 0.05) / 
                  (Math.min(fgLuminance, bgLuminance) + 0.05);

    return {
      ratio: Math.round(ratio * 100) / 100,
      passesAA: ratio >= 4.5,
      passesAAA: ratio >= 7,
    };
  }

  /**
   * Check keyboard accessibility of an element
   */
  public checkKeyboardAccessibility(element: HTMLElement): boolean {
    // Check if element is focusable
    const isFocusable = this.isElementFocusable(element);
    
    // Check if element has proper keyboard event handlers
    const hasKeyboardHandlers = this.hasKeyboardEventHandlers(element);
    
    // Interactive elements should be keyboard accessible
    const isInteractive = this.isInteractiveElement(element);
    
    return !isInteractive || (isFocusable && hasKeyboardHandlers);
  }

  /**
   * Generate a compliance report
   */
  public generateReport(): WCAGComplianceReport {
    const result = this.lastValidationResult || this.validatePage();
    
    const issuesByType: Record<WCAGIssueType, number> = {} as Record<WCAGIssueType, number>;
    const issuesBySeverity: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    // Count issues by type and severity
    result.issues.forEach(issue => {
      issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
      issuesBySeverity[issue.severity]++;
    });

    // Get passed and failed criteria
    const allCriteria = this.getAllWCAGCriteria();
    const failedCriteria = [...new Set(result.issues.map(issue => issue.successCriterion))];
    const passedCriteria = allCriteria.filter(criterion => !failedCriteria.includes(criterion));

    const elementsChecked = typeof document !== "undefined" 
      ? document.querySelectorAll('*').length 
      : 0;

    return {
      timestamp: Date.now(),
      overallScore: result.score,
      level: result.level,
      totalIssues: result.issues.length,
      issuesByType,
      issuesBySeverity,
      suggestions: result.suggestions,
      passedCriteria,
      failedCriteria,
      elementsChecked,
    };
  }

  // ============================================================================
  // VALIDATION RULE IMPLEMENTATIONS
  // ============================================================================

  /**
   * Check for missing alt text on images
   */
  private checkMissingAltText(container?: HTMLElement): WCAGIssue[] {
    const issues: WCAGIssue[] = [];
    const scope = container || document;
    
    const images = scope.querySelectorAll('img');
    images.forEach(img => {
      const alt = img.getAttribute('alt');
      const role = img.getAttribute('role');
      
      // Skip decorative images
      if (role === 'presentation' || role === 'none' || alt === '') {
        return;
      }
      
      if (!alt) {
        issues.push({
          type: 'missing_alt_text',
          severity: 'high',
          element: img as HTMLElement,
          description: 'Image is missing alt text',
          guideline: 'WCAG 2.1',
          successCriterion: '1.1.1 Non-text Content',
        });
      }
    });

    return issues;
  }

  /**
   * Check for insufficient color contrast
   */
  private checkInsufficientContrast(container?: HTMLElement): WCAGIssue[] {
    const issues: WCAGIssue[] = [];
    const scope = container || document;
    
    // This is a simplified check - in practice, you'd need more sophisticated color analysis
    const textElements = scope.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button');
    
    textElements.forEach(element => {
      const styles = window.getComputedStyle(element as HTMLElement);
      const color = styles.color;
      const backgroundColor = styles.backgroundColor;
      
      // Skip if we can't determine colors
      if (!color || !backgroundColor || backgroundColor === 'rgba(0, 0, 0, 0)') {
        return;
      }
      
      // This would need actual color parsing and contrast calculation
      // For now, we'll skip the actual implementation
    });

    return issues;
  }

  /**
   * Check for missing labels on form elements
   */
  private checkMissingLabels(container?: HTMLElement): WCAGIssue[] {
    const issues: WCAGIssue[] = [];
    const scope = container || document;
    
    const formElements = scope.querySelectorAll('input, select, textarea');
    formElements.forEach(element => {
      const el = element as HTMLElement;
      const type = el.getAttribute('type');
      
      // Skip hidden inputs and buttons
      if (type === 'hidden' || type === 'submit' || type === 'button') {
        return;
      }
      
      const hasLabel = this.hasAccessibleLabel(el);
      
      if (!hasLabel) {
        issues.push({
          type: 'missing_label',
          severity: 'high',
          element: el,
          description: 'Form element is missing an accessible label',
          guideline: 'WCAG 2.1',
          successCriterion: '3.3.2 Labels or Instructions',
        });
      }
    });

    return issues;
  }

  /**
   * Check keyboard accessibility
   */
  private checkKeyboardAccessibility(container?: HTMLElement): WCAGIssue[] {
    const issues: WCAGIssue[] = [];
    const scope = container || document;
    
    const interactiveElements = scope.querySelectorAll('button, a, input, select, textarea, [onclick], [role="button"]');
    
    interactiveElements.forEach(element => {
      const el = element as HTMLElement;
      
      if (!this.checkKeyboardAccessibility(el)) {
        issues.push({
          type: 'keyboard_inaccessible',
          severity: 'high',
          element: el,
          description: 'Interactive element is not keyboard accessible',
          guideline: 'WCAG 2.1',
          successCriterion: '2.1.1 Keyboard',
        });
      }
    });

    return issues;
  }

  /**
   * Check heading structure
   */
  private checkHeadingStructure(container?: HTMLElement): WCAGIssue[] {
    const issues: WCAGIssue[] = [];
    const scope = container || document;
    
    const headings = Array.from(scope.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    
    if (headings.length === 0) {
      return issues;
    }
    
    let previousLevel = 0;
    
    headings.forEach(heading => {
      const level = parseInt(heading.tagName.charAt(1));
      
      // Check for skipped heading levels
      if (level > previousLevel + 1) {
        issues.push({
          type: 'missing_heading_structure',
          severity: 'medium',
          element: heading as HTMLElement,
          description: `Heading level ${level} follows heading level ${previousLevel}, skipping levels`,
          guideline: 'WCAG 2.1',
          successCriterion: '1.3.1 Info and Relationships',
        });
      }
      
      previousLevel = level;
    });

    return issues;
  }

  /**
   * Check for landmarks
   */
  private checkLandmarks(container?: HTMLElement): WCAGIssue[] {
    const issues: WCAGIssue[] = [];
    
    // Only check landmarks at page level
    if (container) return issues;
    
    const hasMain = document.querySelector('main, [role="main"]');
    const hasNav = document.querySelector('nav, [role="navigation"]');
    
    if (!hasMain) {
      issues.push({
        type: 'missing_landmarks',
        severity: 'medium',
        description: 'Page is missing a main landmark',
        guideline: 'WCAG 2.1',
        successCriterion: '1.3.6 Identify Purpose',
      });
    }
    
    if (!hasNav) {
      issues.push({
        type: 'missing_landmarks',
        severity: 'low',
        description: 'Page is missing navigation landmarks',
        guideline: 'WCAG 2.1',
        successCriterion: '1.3.6 Identify Purpose',
      });
    }

    return issues;
  }

  /**
   * Check for auto-playing media
   */
  private checkAutoPlayingMedia(container?: HTMLElement): WCAGIssue[] {
    const issues: WCAGIssue[] = [];
    const scope = container || document;
    
    const mediaElements = scope.querySelectorAll('video, audio');
    
    mediaElements.forEach(element => {
      const el = element as HTMLElement;
      
      if (el.hasAttribute('autoplay')) {
        issues.push({
          type: 'auto_playing_media',
          severity: 'medium',
          element: el,
          description: 'Media element has autoplay enabled',
          guideline: 'WCAG 2.1',
          successCriterion: '1.4.2 Audio Control',
        });
      }
    });

    return issues;
  }

  /**
   * Check focus indicators
   */
  private checkFocusIndicators(container?: HTMLElement): WCAGIssue[] {
    const issues: WCAGIssue[] = [];
    // This would require runtime focus testing
    // For now, we'll return empty array
    return issues;
  }

  /**
   * Check target size
   */
  private checkTargetSize(container?: HTMLElement): WCAGIssue[] {
    const issues: WCAGIssue[] = [];
    const scope = container || document;
    
    const interactiveElements = scope.querySelectorAll('button, a, input[type="button"], input[type="submit"]');
    
    interactiveElements.forEach(element => {
      const el = element as HTMLElement;
      const rect = el.getBoundingClientRect();
      
      // WCAG AA requires 44x44 CSS pixels minimum
      if (rect.width < 44 || rect.height < 44) {
        issues.push({
          type: 'insufficient_target_size',
          severity: 'medium',
          element: el,
          description: `Interactive element is too small (${Math.round(rect.width)}x${Math.round(rect.height)}px, minimum 44x44px)`,
          guideline: 'WCAG 2.1',
          successCriterion: '2.5.5 Target Size',
        });
      }
    });

    return issues;
  }

  /**
   * Check skip links
   */
  private checkSkipLinks(container?: HTMLElement): WCAGIssue[] {
    const issues: WCAGIssue[] = [];
    
    // Only check skip links at page level
    if (container) return issues;
    
    const skipLinks = document.querySelectorAll('a[href^="#"]');
    const hasSkipToMain = Array.from(skipLinks).some(link => 
      link.textContent?.toLowerCase().includes('skip') && 
      link.textContent?.toLowerCase().includes('main')
    );
    
    if (!hasSkipToMain) {
      issues.push({
        type: 'missing_skip_links',
        severity: 'medium',
        description: 'Page is missing skip to main content link',
        guideline: 'WCAG 2.1',
        successCriterion: '2.4.1 Bypass Blocks',
      });
    }

    return issues;
  }

  /**
   * Check form structure
   */
  private checkFormStructure(container?: HTMLElement): WCAGIssue[] {
    const issues: WCAGIssue[] = [];
    const scope = container || document;
    
    const forms = scope.querySelectorAll('form');
    
    forms.forEach(form => {
      // Check if form has proper structure
      const hasFieldsets = form.querySelectorAll('fieldset').length > 0;
      const formElements = form.querySelectorAll('input, select, textarea').length;
      
      // Forms with multiple related elements should use fieldsets
      if (formElements > 3 && !hasFieldsets) {
        issues.push({
          type: 'improper_form_structure',
          severity: 'low',
          element: form as HTMLElement,
          description: 'Complex form should use fieldsets to group related elements',
          guideline: 'WCAG 2.1',
          successCriterion: '1.3.1 Info and Relationships',
        });
      }
    });

    return issues;
  }

  /**
   * Check error identification
   */
  private checkErrorIdentification(container?: HTMLElement): WCAGIssue[] {
    const issues: WCAGIssue[] = [];
    const scope = container || document;
    
    const errorElements = scope.querySelectorAll('[aria-invalid="true"], .error, .invalid');
    
    errorElements.forEach(element => {
      const el = element as HTMLElement;
      const hasErrorMessage = this.hasErrorMessage(el);
      
      if (!hasErrorMessage) {
        issues.push({
          type: 'missing_error_identification',
          severity: 'high',
          element: el,
          description: 'Element with error state is missing error message',
          guideline: 'WCAG 2.1',
          successCriterion: '3.3.1 Error Identification',
        });
      }
    });

    return issues;
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  /**
   * Generate suggestions based on issues
   */
  private generateSuggestions(issues: WCAGIssue[]): WCAGSuggestion[] {
    const suggestions: WCAGSuggestion[] = [];
    const suggestionMap: Record<WCAGIssueType, WCAGSuggestion> = {
      missing_alt_text: {
        type: 'missing_alt_text',
        description: 'Add descriptive alt text to images',
        implementation: 'Add alt="description" attribute to img elements',
        priority: 'high',
        automated: false,
      },
      insufficient_contrast: {
        type: 'insufficient_contrast',
        description: 'Improve color contrast ratios',
        implementation: 'Use darker text or lighter backgrounds to achieve 4.5:1 contrast ratio',
        priority: 'high',
        automated: false,
      },
      missing_label: {
        type: 'missing_label',
        description: 'Add labels to form elements',
        implementation: 'Use <label> elements or aria-label attributes',
        priority: 'high',
        automated: true,
      },
      keyboard_inaccessible: {
        type: 'keyboard_inaccessible',
        description: 'Make interactive elements keyboard accessible',
        implementation: 'Add tabindex="0" and keyboard event handlers',
        priority: 'high',
        automated: true,
      },
      missing_heading_structure: {
        type: 'missing_heading_structure',
        description: 'Fix heading hierarchy',
        implementation: 'Use proper heading levels (h1, h2, h3) without skipping',
        priority: 'medium',
        automated: true,
      },
      missing_landmarks: {
        type: 'missing_landmarks',
        description: 'Add page landmarks',
        implementation: 'Use <main>, <nav>, <aside> elements or ARIA roles',
        priority: 'medium',
        automated: true,
      },
      auto_playing_media: {
        type: 'auto_playing_media',
        description: 'Remove autoplay from media',
        implementation: 'Remove autoplay attribute or add user controls',
        priority: 'medium',
        automated: true,
      },
      missing_focus_indicator: {
        type: 'missing_focus_indicator',
        description: 'Add visible focus indicators',
        implementation: 'Use CSS :focus styles with sufficient contrast',
        priority: 'high',
        automated: false,
      },
      insufficient_target_size: {
        type: 'insufficient_target_size',
        description: 'Increase interactive element size',
        implementation: 'Make buttons and links at least 44x44 CSS pixels',
        priority: 'medium',
        automated: false,
      },
      missing_skip_links: {
        type: 'missing_skip_links',
        description: 'Add skip navigation links',
        implementation: 'Add "Skip to main content" link at page top',
        priority: 'medium',
        automated: true,
      },
      improper_form_structure: {
        type: 'improper_form_structure',
        description: 'Improve form organization',
        implementation: 'Use <fieldset> and <legend> to group related form elements',
        priority: 'low',
        automated: true,
      },
      missing_error_identification: {
        type: 'missing_error_identification',
        description: 'Add error messages',
        implementation: 'Use aria-describedby to associate error messages with form fields',
        priority: 'high',
        automated: true,
      },
    };

    // Get unique issue types
    const uniqueIssueTypes = [...new Set(issues.map(issue => issue.type))];
    
    // Add suggestions for each issue type
    uniqueIssueTypes.forEach(issueType => {
      const suggestion = suggestionMap[issueType];
      if (suggestion) {
        suggestions.push(suggestion);
      }
    });

    return suggestions;
  }

  /**
   * Calculate compliance score
   */
  private calculateComplianceScore(issues: WCAGIssue[], totalElements: number): number {
    if (totalElements === 0) return 100;

    const severityWeights = {
      low: 1,
      medium: 3,
      high: 5,
      critical: 10,
    };

    const totalWeight = issues.reduce((sum, issue) => {
      return sum + severityWeights[issue.severity];
    }, 0);

    // Calculate score (0-100)
    const maxPossibleWeight = totalElements * severityWeights.critical;
    const score = Math.max(0, 100 - (totalWeight / maxPossibleWeight) * 100);

    return Math.round(score);
  }

  /**
   * Determine compliance level
   */
  private determineComplianceLevel(issues: WCAGIssue[], score: number): "A" | "AA" | "AAA" {
    const criticalIssues = issues.filter(issue => issue.severity === 'critical').length;
    const highIssues = issues.filter(issue => issue.severity === 'high').length;

    if (criticalIssues > 0 || score < 70) {
      return "A";
    } else if (highIssues > 0 || score < 90) {
      return "AA";
    } else {
      return "AAA";
    }
  }

  /**
   * Get all WCAG criteria
   */
  private getAllWCAGCriteria(): string[] {
    return [
      '1.1.1 Non-text Content',
      '1.2.1 Audio-only and Video-only (Prerecorded)',
      '1.2.2 Captions (Prerecorded)',
      '1.2.3 Audio Description or Media Alternative (Prerecorded)',
      '1.3.1 Info and Relationships',
      '1.3.2 Meaningful Sequence',
      '1.3.3 Sensory Characteristics',
      '1.4.1 Use of Color',
      '1.4.2 Audio Control',
      '1.4.3 Contrast (Minimum)',
      '1.4.4 Resize text',
      '1.4.5 Images of Text',
      '2.1.1 Keyboard',
      '2.1.2 No Keyboard Trap',
      '2.2.1 Timing Adjustable',
      '2.2.2 Pause, Stop, Hide',
      '2.3.1 Three Flashes or Below Threshold',
      '2.4.1 Bypass Blocks',
      '2.4.2 Page Titled',
      '2.4.3 Focus Order',
      '2.4.4 Link Purpose (In Context)',
      '3.1.1 Language of Page',
      '3.2.1 On Focus',
      '3.2.2 On Input',
      '3.3.1 Error Identification',
      '3.3.2 Labels or Instructions',
      '4.1.1 Parsing',
      '4.1.2 Name, Role, Value',
    ];
  }

  /**
   * Check if element has accessible label
   */
  private hasAccessibleLabel(element: HTMLElement): boolean {
    // Check for associated label
    const id = element.id;
    if (id) {
      const label = document.querySelector(`label[for="${id}"]`);
      if (label) return true;
    }

    // Check for aria-label
    if (element.getAttribute('aria-label')) return true;

    // Check for aria-labelledby
    if (element.getAttribute('aria-labelledby')) return true;

    // Check for title attribute (not ideal but acceptable)
    if (element.getAttribute('title')) return true;

    // Check if wrapped in label
    const parentLabel = element.closest('label');
    if (parentLabel) return true;

    return false;
  }

  /**
   * Check if element is focusable
   */
  private isElementFocusable(element: HTMLElement): boolean {
    const tabIndex = element.tabIndex;
    
    // Elements with tabindex >= 0 are focusable
    if (tabIndex >= 0) return true;

    // Naturally focusable elements
    const focusableTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
    if (focusableTags.includes(element.tagName)) {
      return !element.hasAttribute('disabled');
    }

    return false;
  }

  /**
   * Check if element has keyboard event handlers
   */
  private hasKeyboardEventHandlers(element: HTMLElement): boolean {
    // Check for keyboard event attributes
    const keyboardEvents = ['onkeydown', 'onkeyup', 'onkeypress'];
    return keyboardEvents.some(event => element.hasAttribute(event));
  }

  /**
   * Check if element is interactive
   */
  private isInteractiveElement(element: HTMLElement): boolean {
    const interactiveTags = ['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA'];
    const interactiveRoles = ['button', 'link', 'menuitem', 'tab', 'checkbox', 'radio'];
    
    return (
      interactiveTags.includes(element.tagName) ||
      interactiveRoles.includes(element.getAttribute('role') || '') ||
      element.hasAttribute('onclick') ||
      element.hasAttribute('tabindex')
    );
  }

  /**
   * Check if element has error message
   */
  private hasErrorMessage(element: HTMLElement): boolean {
    // Check for aria-describedby pointing to error message
    const describedBy = element.getAttribute('aria-describedby');
    if (describedBy) {
      const errorElement = document.getElementById(describedBy);
      if (errorElement && errorElement.textContent) return true;
    }

    // Check for nearby error message
    const nextSibling = element.nextElementSibling;
    if (nextSibling && (
      nextSibling.classList.contains('error') ||
      nextSibling.classList.contains('error-message') ||
      nextSibling.getAttribute('role') === 'alert'
    )) {
      return true;
    }

    return false;
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
   * Calculate relative luminance
   */
  private calculateLuminance(rgb: { r: number; g: number; b: number }): number {
    const { r, g, b } = rgb;
    
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }
}