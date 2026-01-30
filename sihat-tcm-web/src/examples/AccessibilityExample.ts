/**
 * Accessibility System Example
 * 
 * Demonstrates how to use the new modular accessibility system.
 * Shows various accessibility features and best practices.
 */

import {
  AccessibilityManager,
  createAccessibilityManager,
  updateAccessibilityPreferences,
  announce,
  registerFocusGroup,
  navigateFocus,
  createSkipLink,
  addAriaAttributes,
  validateColorContrast,
  registerShortcut,
  getAccessibilityPreferences,
  performAccessibilityAudit,
  type AccessibilityPreferences,
  type AriaAttributes
} from '../lib/accessibility';

/**
 * Example 1: Basic Accessibility Setup
 */
export function basicAccessibilitySetupExample(): void {
  console.log('=== Basic Accessibility Setup Example ===');

  // Create custom accessibility manager
  const accessibilityManager = createAccessibilityManager("ExampleApp", {
    highContrast: false,
    reducedMotion: false,
    fontSize: "medium",
    announcements: true,
    keyboardNavigation: true
  });

  // Get current preferences
  const preferences = accessibilityManager.getPreferences();
  console.log('Current preferences:', preferences);

  // Update preferences
  accessibilityManager.updatePreferences({
    fontSize: "large",
    highContrast: true
  });

  console.log('Updated preferences:', accessibilityManager.getPreferences());
}

/**
 * Example 2: Focus Management
 */
export function focusManagementExample(): void {
  console.log('\n=== Focus Management Example ===');

  // Create some example elements
  const container = document.createElement('div');
  const button1 = document.createElement('button');
  const button2 = document.createElement('button');
  const button3 = document.createElement('button');
  
  button1.textContent = 'Button 1';
  button2.textContent = 'Button 2';
  button3.textContent = 'Button 3';
  
  container.appendChild(button1);
  container.appendChild(button2);
  container.appendChild(button3);
  
  // Register focus group
  registerFocusGroup('example-buttons', [button1, button2, button3], [1, 2, 3]);
  
  // Navigate focus
  console.log('Navigating to first button:', navigateFocus('first'));
  console.log('Navigating to next button:', navigateFocus('next'));
  console.log('Navigating to last button:', navigateFocus('last'));
  
  // Setup focus trap
  const accessibilityManager = createAccessibilityManager("FocusExample");
  accessibilityManager.trapFocus(container, {
    initialFocus: button1,
    restoreFocus: true
  });
  
  console.log('Focus trap activated');
  
  // Release focus trap after 3 seconds
  setTimeout(() => {
    accessibilityManager.releaseFocusTrap();
    console.log('Focus trap released');
  }, 3000);
}

/**
 * Example 3: Screen Reader Announcements
 */
export function screenReaderAnnouncementsExample(): void {
  console.log('\n=== Screen Reader Announcements Example ===');

  // Basic announcements
  announce('Welcome to the accessibility example', 'polite');
  announce('Loading content...', 'polite', 500);
  announce('Error: Please check your input', 'assertive');

  // Form error announcements
  const accessibilityManager = createAccessibilityManager("AnnouncementExample");
  
  const formErrors = [
    'Email is required',
    'Password must be at least 8 characters',
    'Please accept the terms and conditions'
  ];
  
  accessibilityManager.announceFormErrors(formErrors);

  // Navigation announcements
  accessibilityManager.announceNavigation('Dashboard', 'main content');
  
  // Loading state announcements
  accessibilityManager.announceLoading(true, 'user data');
  
  setTimeout(() => {
    accessibilityManager.announceLoading(false, 'user data');
  }, 2000);

  // Create live region for dynamic content
  const liveRegion = accessibilityManager.createLiveRegion('status-updates', 'polite', true);
  
  // Update live region content
  setTimeout(() => {
    accessibilityManager.updateLiveRegion('status-updates', 'New message received');
  }, 1000);
}

/**
 * Example 4: Keyboard Navigation and Shortcuts
 */
export function keyboardNavigationExample(): void {
  console.log('\n=== Keyboard Navigation Example ===');

  const accessibilityManager = createAccessibilityManager("KeyboardExample");

  // Register custom shortcuts
  registerShortcut('Ctrl+KeyH', () => {
    announce('Help dialog opened', 'polite');
    console.log('Help shortcut activated');
  });

  registerShortcut('Alt+KeyM', () => {
    announce('Navigated to main content', 'polite');
    console.log('Main content shortcut activated');
  });

  registerShortcut('Escape', () => {
    announce('Dialog closed', 'polite');
    console.log('Escape shortcut activated');
  });

  // Create navigation elements with arrow key support
  const navContainer = document.createElement('nav');
  navContainer.setAttribute('data-arrow-navigation', 'true');
  
  const navItems = ['Home', 'About', 'Services', 'Contact'].map(text => {
    const link = document.createElement('a');
    link.href = `#${text.toLowerCase()}`;
    link.textContent = text;
    link.setAttribute('data-arrow-navigation', 'true');
    return link;
  });

  navItems.forEach(item => navContainer.appendChild(item));
  
  // Register navigation focus group
  accessibilityManager.registerFocusGroup('main-nav', navItems);
  accessibilityManager.setFocusGroup('main-nav');

  console.log('Keyboard navigation setup complete');
}

/**
 * Example 5: ARIA Attributes and Semantic HTML
 */
export function ariaAttributesExample(): void {
  console.log('\n=== ARIA Attributes Example ===');

  // Create accessible button with ARIA attributes
  const button = document.createElement('button');
  button.textContent = 'Toggle Menu';
  
  const ariaAttributes: AriaAttributes = {
    expanded: false,
    controls: 'main-menu',
    haspopup: 'menu',
    label: 'Toggle main navigation menu'
  };
  
  addAriaAttributes(button, ariaAttributes);

  // Create accessible form with labels and descriptions
  const form = document.createElement('form');
  
  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.id = 'email';
  
  const emailLabel = document.createElement('label');
  emailLabel.htmlFor = 'email';
  emailLabel.textContent = 'Email Address';
  
  const emailHelp = document.createElement('div');
  emailHelp.id = 'email-help';
  emailHelp.textContent = 'We will never share your email address';
  
  addAriaAttributes(emailInput, {
    required: true,
    describedby: 'email-help',
    invalid: false
  });

  form.appendChild(emailLabel);
  form.appendChild(emailInput);
  form.appendChild(emailHelp);

  // Create accessible modal dialog
  const modal = document.createElement('div');
  modal.setAttribute('role', 'dialog');
  
  addAriaAttributes(modal, {
    modal: true,
    labelledby: 'modal-title',
    describedby: 'modal-description'
  });

  const modalTitle = document.createElement('h2');
  modalTitle.id = 'modal-title';
  modalTitle.textContent = 'Confirmation Required';
  
  const modalDescription = document.createElement('p');
  modalDescription.id = 'modal-description';
  modalDescription.textContent = 'Are you sure you want to delete this item?';

  modal.appendChild(modalTitle);
  modal.appendChild(modalDescription);

  console.log('ARIA attributes applied to form elements');
}

/**
 * Example 6: Color Contrast Validation
 */
export function colorContrastExample(): void {
  console.log('\n=== Color Contrast Validation Example ===');

  // Test various color combinations
  const colorTests = [
    { fg: '#000000', bg: '#ffffff', name: 'Black on White' },
    { fg: '#ffffff', bg: '#000000', name: 'White on Black' },
    { fg: '#0066cc', bg: '#ffffff', name: 'Blue on White' },
    { fg: '#666666', bg: '#ffffff', name: 'Gray on White' },
    { fg: '#ff0000', bg: '#ffffff', name: 'Red on White' },
    { fg: '#00ff00', bg: '#ffffff', name: 'Green on White' }
  ];

  colorTests.forEach(test => {
    const result = validateColorContrast(test.fg, test.bg);
    console.log(`${test.name}:`, {
      ratio: result.ratio.toFixed(2),
      level: result.level,
      passes: result.passes
    });
  });
}

/**
 * Example 7: Skip Links and Navigation Aids
 */
export function skipLinksExample(): void {
  console.log('\n=== Skip Links Example ===');

  // Create skip links for main content areas
  const skipToMain = createSkipLink('main-content', 'Skip to main content');
  const skipToNav = createSkipLink('main-navigation', 'Skip to navigation');
  const skipToSearch = createSkipLink('search', 'Skip to search');

  // Add skip links to page
  document.body.insertBefore(skipToMain, document.body.firstChild);
  document.body.insertBefore(skipToNav, document.body.firstChild);
  document.body.insertBefore(skipToSearch, document.body.firstChild);

  // Create landmark elements
  const main = document.createElement('main');
  main.id = 'main-content';
  
  const nav = document.createElement('nav');
  nav.id = 'main-navigation';
  
  const search = document.createElement('div');
  search.id = 'search';
  search.setAttribute('role', 'search');

  console.log('Skip links created and added to page');
}

/**
 * Example 8: Accessibility Preferences Management
 */
export function preferencesManagementExample(): void {
  console.log('\n=== Accessibility Preferences Management Example ===');

  // Get current system preferences
  const currentPreferences = getAccessibilityPreferences();
  console.log('Current preferences:', currentPreferences);

  // Update multiple preferences
  updateAccessibilityPreferences({
    highContrast: true,
    reducedMotion: true,
    fontSize: 'large',
    focusIndicatorStyle: 'thick'
  });

  console.log('Updated preferences:', getAccessibilityPreferences());

  // Create accessibility manager with custom preferences
  const customManager = createAccessibilityManager('CustomPreferences', {
    announcements: false,
    keyboardNavigation: true,
    screenReaderEnabled: true
  });

  // Export preferences for backup
  const exportedSettings = customManager.exportSettings();
  console.log('Exported settings length:', exportedSettings.length);

  // Import preferences
  const importSuccess = customManager.importSettings(exportedSettings);
  console.log('Import successful:', importSuccess);
}

/**
 * Example 9: Accessibility Audit
 */
export async function accessibilityAuditExample(): Promise<void> {
  console.log('\n=== Accessibility Audit Example ===');

  try {
    const auditResult = await performAccessibilityAudit();
    
    console.log('Accessibility Audit Results:');
    console.log(`Score: ${auditResult.score}/100`);
    console.log(`Issues found: ${auditResult.issues?.length || 0}`);
    console.log('Recommendations:', auditResult.recommendations);
    
    if (auditResult.issues && auditResult.issues.length > 0) {
      console.log('Issues:');
      auditResult.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.description} (${issue.severity})`);
      });
    }
  } catch (error) {
    console.error('Accessibility audit failed:', error);
  }
}

/**
 * Example 10: Advanced Accessibility Manager Usage
 */
export function advancedAccessibilityExample(): void {
  console.log('\n=== Advanced Accessibility Manager Example ===');

  // Create accessibility manager with event listeners
  const manager = createAccessibilityManager('AdvancedExample');

  // Listen for accessibility events
  manager.addEventListener('preferences-updated', (event) => {
    console.log('Preferences updated:', event.data);
  });

  manager.addEventListener('focus-changed', (event) => {
    console.log('Focus changed:', event.data);
  });

  manager.addEventListener('announcement-made', (event) => {
    console.log('Announcement made:', event.data.message);
  });

  // Get system status
  const status = manager.getSystemStatus();
  console.log('System status:', {
    isInitialized: status.isInitialized,
    shortcutsRegistered: status.shortcuts,
    queueLength: status.queueStatus.queueLength
  });

  // Update preferences and trigger events
  manager.updatePreferences({
    fontSize: 'extra-large',
    announcements: true
  });

  // Make announcements
  manager.announce('Advanced accessibility system initialized');
  
  // Test focus navigation
  const testElements = [1, 2, 3].map(i => {
    const button = document.createElement('button');
    button.textContent = `Test Button ${i}`;
    return button;
  });

  manager.registerFocusGroup('test-group', testElements);
  manager.setFocusGroup('test-group');
  manager.navigateFocus('first');
}

/**
 * Run all accessibility examples
 */
export async function runAllAccessibilityExamples(): Promise<void> {
  console.log('♿ Accessibility System Examples\n');

  try {
    basicAccessibilitySetupExample();
    focusManagementExample();
    screenReaderAnnouncementsExample();
    keyboardNavigationExample();
    ariaAttributesExample();
    colorContrastExample();
    skipLinksExample();
    preferencesManagementExample();
    await accessibilityAuditExample();
    advancedAccessibilityExample();
    
    console.log('\n✅ All accessibility examples completed successfully!');
  } catch (error) {
    console.error('❌ Error running accessibility examples:', error);
  }
}

// Export for use in other files
export const accessibilityExamples = {
  basicAccessibilitySetupExample,
  focusManagementExample,
  screenReaderAnnouncementsExample,
  keyboardNavigationExample,
  ariaAttributesExample,
  colorContrastExample,
  skipLinksExample,
  preferencesManagementExample,
  accessibilityAuditExample,
  advancedAccessibilityExample,
  runAllAccessibilityExamples
};