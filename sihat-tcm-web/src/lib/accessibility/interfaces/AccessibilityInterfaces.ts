/**
 * Accessibility System Interfaces
 *
 * Comprehensive type definitions for the modular accessibility system.
 * Defines contracts for WCAG 2.1 AA compliance and accessibility features.
 */

/**
 * Navigation direction for focus management
 */
export type NavigationDirection = "next" | "previous" | "first" | "last";

/**
 * Focus management options
 */
export interface FocusManagementOptions {
  initialFocus?: HTMLElement | string;
  restoreFocus?: boolean;
  trapFocus?: boolean;
  circular?: boolean;
}

/**
 * Accessibility preferences configuration
 */
export interface AccessibilityPreferences {
  highContrast: boolean;
  reducedMotion: boolean;
  screenReaderEnabled: boolean;
  keyboardNavigation: boolean;
  fontSize: "small" | "medium" | "large" | "extra-large";
  focusIndicatorStyle: "default" | "high-contrast" | "thick";
  announcements: boolean;
  colorBlindnessSupport: boolean;
  autoplayMedia: boolean;
  animationSpeed: "slow" | "normal" | "fast" | "disabled";
  textSpacing: "normal" | "increased" | "maximum";
}

/**
 * System accessibility preferences
 */
export interface SystemAccessibilityPreferences {
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  prefersColorScheme: "light" | "dark" | "no-preference";
}

/**
 * Screen reader detection result
 */
export interface ScreenReaderDetection {
  isDetected: boolean;
  detectionMethod: "userAgent" | "api" | "heuristic" | "none";
  confidence: "low" | "medium" | "high";
}

/**
 * Focusable element configuration
 */
export interface FocusableElement {
  element: HTMLElement;
  priority: number;
  group?: string;
  skipOnDisabled?: boolean;
  customFocusHandler?: () => void;
}

/**
 * Focus group configuration
 */
export interface FocusGroup {
  id: string;
  elements: FocusableElement[];
  circular: boolean;
  autoFocus: boolean;
  trapFocus: boolean;
  restoreFocus: boolean;
  onFocusEnter?: (element: HTMLElement) => void;
  onFocusLeave?: (element: HTMLElement) => void;
}

/**
 * Accessibility announcement
 */
export interface AccessibilityAnnouncement {
  message: string;
  priority: "polite" | "assertive";
  delay?: number;
  category?: string;
  persistent?: boolean;
}

/**
 * Keyboard navigation configuration
 */
export interface KeyboardNavigationConfig {
  enabled: boolean;
  skipLinks: boolean;
  customKeyBindings: Record<string, KeyboardHandler>;
  focusVisible: boolean;
  tabTrapEnabled: boolean;
}

/**
 * Keyboard event handler
 */
export interface KeyboardHandler {
  keys: string[];
  handler: (event: KeyboardEvent) => void;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  description?: string;
}

/**
 * WCAG compliance check result
 */
export interface WCAGComplianceResult {
  isCompliant: boolean;
  level: "A" | "AA" | "AAA";
  issues: WCAGIssue[];
  suggestions: WCAGSuggestion[];
  score: number; // 0-100
}

/**
 * WCAG issue
 */
export interface WCAGIssue {
  type: WCAGIssueType;
  severity: "low" | "medium" | "high" | "critical";
  element?: HTMLElement;
  description: string;
  guideline: string;
  successCriterion: string;
}

/**
 * WCAG suggestion
 */
export interface WCAGSuggestion {
  type: WCAGIssueType;
  description: string;
  implementation: string;
  priority: "low" | "medium" | "high";
  automated?: boolean;
}

/**
 * WCAG issue types
 */
export type WCAGIssueType =
  | "missing_alt_text"
  | "insufficient_contrast"
  | "missing_label"
  | "keyboard_inaccessible"
  | "missing_heading_structure"
  | "missing_landmarks"
  | "auto_playing_media"
  | "missing_focus_indicator"
  | "insufficient_target_size"
  | "missing_skip_links"
  | "improper_form_structure"
  | "missing_error_identification";

/**
 * Screen reader configuration
 */
export interface ScreenReaderConfig {
  enabled: boolean;
  verbosity: "minimal" | "normal" | "verbose";
  announceChanges: boolean;
  announceNavigation: boolean;
  announceErrors: boolean;
  customVoice?: SpeechSynthesisVoice;
  speechRate: number;
  speechPitch: number;
  speechVolume: number;
}

/**
 * Color blindness support configuration
 */
export interface ColorBlindnessConfig {
  type: "none" | "protanopia" | "deuteranopia" | "tritanopia" | "achromatopsia";
  severity: "mild" | "moderate" | "severe";
  simulationMode: boolean;
  alternativeIndicators: boolean;
}

/**
 * Focus manager interface
 */
export interface FocusManager {
  registerFocusGroup(group: FocusGroup): void;
  unregisterFocusGroup(groupId: string): void;
  setActiveFocusGroup(groupId: string): void;
  focusNext(groupId?: string): boolean;
  focusPrevious(groupId?: string): boolean;
  focusFirst(groupId?: string): boolean;
  focusLast(groupId?: string): boolean;
  trapFocus(groupId: string, enabled: boolean): void;
  restoreFocus(groupId?: string): void;
  getCurrentFocus(): { groupId: string | null; elementIndex: number };
}

/**
 * Announcement manager interface
 */
export interface AnnouncementManager {
  announce(announcement: AccessibilityAnnouncement): void;
  announceError(message: string, persistent?: boolean): void;
  announceSuccess(message: string): void;
  announceNavigation(message: string): void;
  clearAnnouncements(category?: string): void;
  setAnnouncementPreferences(config: Partial<ScreenReaderConfig>): void;
}

/**
 * Keyboard navigation manager interface
 */
export interface KeyboardNavigationManager {
  initialize(config: KeyboardNavigationConfig): void;
  addKeyBinding(binding: KeyboardHandler): void;
  removeKeyBinding(keys: string[]): void;
  enableSkipLinks(): void;
  disableSkipLinks(): void;
  createSkipLink(targetId: string, text: string): HTMLElement;
  handleTabTrap(container: HTMLElement, enabled: boolean): void;
}

/**
 * Preference manager interface
 */
export interface PreferenceManager {
  getPreferences(): AccessibilityPreferences;
  updatePreferences(preferences: Partial<AccessibilityPreferences>): void;
  resetPreferences(): void;
  detectSystemPreferences(): Partial<AccessibilityPreferences>;
  savePreferences(): void;
  loadPreferences(): void;
  onPreferenceChange(callback: (preferences: AccessibilityPreferences) => void): () => void;
}

/**
 * WCAG validator interface
 */
export interface WCAGValidator {
  validateElement(element: HTMLElement): WCAGComplianceResult;
  validatePage(): WCAGComplianceResult;
  validateSection(container: HTMLElement): WCAGComplianceResult;
  checkColorContrast(
    foreground: string,
    background: string
  ): {
    ratio: number;
    passesAA: boolean;
    passesAAA: boolean;
  };
  checkKeyboardAccessibility(element: HTMLElement): boolean;
  generateReport(): WCAGComplianceReport;
}

/**
 * WCAG compliance report
 */
export interface WCAGComplianceReport {
  timestamp: number;
  overallScore: number;
  level: "A" | "AA" | "AAA";
  totalIssues: number;
  issuesByType: Record<WCAGIssueType, number>;
  issuesBySeverity: Record<string, number>;
  suggestions: WCAGSuggestion[];
  passedCriteria: string[];
  failedCriteria: string[];
  elementsChecked: number;
}

/**
 * Accessibility manager interface
 */
export interface AccessibilityManager {
  initialize(preferences?: Partial<AccessibilityPreferences>): void;
  getFocusManager(): FocusManager;
  getAnnouncementManager(): AnnouncementManager;
  getKeyboardNavigationManager(): KeyboardNavigationManager;
  getPreferenceManager(): PreferenceManager;
  getWCAGValidator(): WCAGValidator;
  applyPreferences(preferences: Partial<AccessibilityPreferences>): void;
  enableHighContrastMode(enabled: boolean): void;
  enableReducedMotion(enabled: boolean): void;
  enableScreenReaderMode(enabled: boolean): void;
  validateCompliance(): WCAGComplianceResult;
  destroy(): void;
}

/**
 * Accessibility event types
 */
export type AccessibilityEventType =
  | "preference_changed"
  | "preferences-updated"
  | "focus_changed"
  | "focus-changed"
  | "announcement_made"
  | "announcement-made"
  | "group-changed"
  | "compliance_checked"
  | "error_detected"
  | "navigation_occurred";

/**
 * Accessibility event
 */
export interface AccessibilityEvent {
  type: AccessibilityEventType;
  timestamp: number;
  data?: any;
  source?: string;
  id?: string;
}

/**
 * Accessibility event listener function
 */
export type AccessibilityEventListener = (event: AccessibilityEvent) => void;

/**
 * Skip link configuration
 */
export interface SkipLinkConfig {
  targetId: string;
  text: string;
  className?: string;
}

/**
 * ARIA attributes configuration
 */
export interface AriaAttributes {
  role?: string;
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  hidden?: boolean;
  expanded?: boolean;
  selected?: boolean;
  checked?: boolean | "mixed";
  disabled?: boolean;
  required?: boolean;
  invalid?: boolean | "grammar" | "spelling";
  live?: "polite" | "assertive" | "off";
  atomic?: boolean;
  busy?: boolean;
  controls?: string;
  current?: boolean | "page" | "step" | "location" | "date" | "time";
  hasPopup?: boolean | "menu" | "listbox" | "tree" | "grid" | "dialog";
  level?: number;
  multiLine?: boolean;
  multiSelectable?: boolean;
  orientation?: "horizontal" | "vertical";
  placeholder?: string;
  pressed?: boolean | "mixed";
  readOnly?: boolean;
  valueMax?: number;
  valueMin?: number;
  valueNow?: number;
  valueText?: string;
  [key: string]: unknown;
}

/**
 * Accessibility metrics
 */
export interface AccessibilityMetrics {
  complianceScore: number;
  totalIssues: number;
  criticalIssues: number;
  keyboardNavigationUsage: number;
  screenReaderUsage: number;
  highContrastUsage: number;
  reducedMotionUsage: number;
  announcementsMade: number;
  focusChanges: number;
  skipLinkUsage: number;
}

/**
 * Accessibility configuration
 */
export interface AccessibilityConfig {
  enabled: boolean;
  autoDetectPreferences: boolean;
  persistPreferences: boolean;
  enableMetrics: boolean;
  enableValidation: boolean;
  validationInterval: number;
  announcePageChanges: boolean;
  announceFormErrors: boolean;
  enableSkipLinks: boolean;
  enableFocusTrap: boolean;
  customCSS: string;
}

/**
 * Touch accessibility configuration (for mobile)
 */
export interface TouchAccessibilityConfig {
  enabled: boolean;
  minimumTargetSize: number; // in pixels
  touchFeedback: boolean;
  gestureAlternatives: boolean;
  voiceOverSupport: boolean;
  talkBackSupport: boolean;
  switchControlSupport: boolean;
}

/**
 * Media accessibility configuration
 */
export interface MediaAccessibilityConfig {
  autoplay: boolean;
  showCaptions: boolean;
  showTranscripts: boolean;
  audioDescriptions: boolean;
  signLanguage: boolean;
  reducedMotion: boolean;
  pauseOnFocusLoss: boolean;
}

/**
 * Form accessibility configuration
 */
export interface FormAccessibilityConfig {
  enableLiveValidation: boolean;
  announceErrors: boolean;
  announceSuccess: boolean;
  groupRelatedFields: boolean;
  provideClearInstructions: boolean;
  enableAutocomplete: boolean;
  timeoutWarnings: boolean;
}

/**
 * Navigation accessibility configuration
 */
export interface NavigationAccessibilityConfig {
  enableSkipLinks: boolean;
  enableLandmarks: boolean;
  enableBreadcrumbs: boolean;
  announcePageChanges: boolean;
  enableSitemap: boolean;
  enableSearch: boolean;
  consistentNavigation: boolean;
}
