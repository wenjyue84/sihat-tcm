/**
 * Accessibility System Example
 * 
 * Comprehensive examples demonstrating the usage of the refactored
 * accessibility system with WCAG 2.1 AA compliance and comprehensive features.
 */

import {
  // Core Accessibility System
  defaultAccessibilityOrchestrator,
  createAccessibilityOrchestrator,
  initializeAccessibilitySystem,
  createCompleteAccessibilitySetup,
  quickAccessibilityCheck,
  applyAccessibilityPreferences,
  getAccessibilityMetrics,
  announce,
  isAccessibilityInitialized,
  checkAccessibilitySystemHealth,
  
  // Individual Managers
  FocusManager,
  PreferenceManager,
  AnnouncementManager,
  KeyboardNavigationManager,
  WCAGValidator,
  
  // Types
  type AccessibilityPreferences,
  type AccessibilityConfig,
  type WCAGComplianceResult,
  type AccessibilityMetrics,
} from '../lib/accessibility';

/**
 * Example 1: Basic Accessibility Setup
 * 
 * Demonstrates how to initialize and configure the accessibility system.
 */
export function basicAccessibilitySetupExample() {
  console.log("=== Basic Accessibility Setup Example ===");

  // Initialize with default configuration
  const orchestrator = initializeAccessibilitySystem({
    enabled: true,
    autoDetectPreferences: true,
    persistPreferences: true,
    enableMetrics: true,
    enableValidation: true,
    announcePageChanges: true,
    announceFormErrors: true,
    enableSkipLinks: true,
    enableFocusTrap: true,
  });

  console.log("Accessibility system initialized:", isAccessibilityInitialized());

  // Get initial metrics
  const metrics = getAccessibilityMetrics();
  console.log("Initial accessibility metrics:", metrics);

  // Apply some preferences
  applyAccessibilityPreferences({
    highContrast: false,
    reducedMotion: false,
    screenReaderEnabled: false,
    keyboardNavigation: true,
    fontSize: 'medium',
    focusIndicatorStyle: 'default',
    announcements: true,
  });

  console.log("Basic accessibility preferences applied");

  return orchestrator;
}

/**
 * Example 2: Focus Management
 * 
 * Demonstrates comprehensive focus management capabilities.
 */
export function focusManagementExample() {
  console.log("=== Focus Management Example ===");

  const focusManager = new FocusManager();

  // Create some example elements (in a real app, these would be actual DOM elements)
  if (typeof document !== "undefined") {
    // Create a test container
    const container = document.createElement('div');
    container.innerHTML = `
      <button id="btn1">Button 1</button>
      <button id="btn2">Button 2</button>
      <input id="input1" type="text" placeholder="Input 1" />
      <select id="select1">
        <option>Option 1</option>
        <option>Option 2</option>
      </select>
      <a id="link1" href="#" tabindex="0">Link 1</a>
    `;
    document.body.appendChild(container);

    // Get focusable elements
    const buttons = [
      document.getElementById('btn1'),
      document.getElementById('btn2'),
      document.getElementById('input1'),
      document.getElementById('select1'),
      document.getElementById('link1'),
    ].filter(Boolean) as HTMLElement[];

    // Register focus group
    focusManager.registerFocusGroup('example-group', buttons, [1, 2, 3, 4, 5]);
    focusManager.setFocusGroup('example-group');

    console.log("Focus group registered with", buttons.length, "elements");

    // Demonstrate navigation
    console.log("Focusing first element:", focusManager.focusFirst('example-group'));
    console.log("Navigating to next:", focusManager.navigate('next'));
    console.log("Navigating to last:", focusManager.focusLast('example-group'));

    // Demonstrate focus trap
    focusManager.trapFocus(container, {
      initialFocus: buttons[0],
      restoreFocus: true,
      trapFocus: true,
    });

    console.log("Focus trap enabled on container");

    // Get current focus info
    const currentFocus = focusManager.getCurrentFocus();
    console.log("Current focus:", currentFocus);

    // Cleanup
    setTimeout(() => {
      focusManager.releaseFocusTrap(true);
      focusManager.clearFocusGroup('example-group');
      document.body.removeChild(container);
      console.log("Focus management example cleanup completed");
    }, 2000);
  }
}

/**
 * Example 3: Announcement System
 * 
 * Demonstrates screen reader announcements and accessibility notifications.
 */
export function announcementSystemExample() {
  console.log("=== Announcement System Example ===");

  const announcementManager = new AnnouncementManager({
    enabled: true,
    verbosity: 'normal',
    announceChanges: true,
    announceNavigation: true,
    announceErrors: true,
  });

  // Basic announcements
  announce("Welcome to the Sihat TCM application", 'polite', 'welcome');
  
  announcementManager.announceSuccess("Profile updated successfully");
  announcementManager.announceError("Please fill in all required fields", false);
  announcementManager.announceNavigation("Diagnosis page");

  // Custom announcements with different priorities
  announcementManager.announce({
    message: "New health recommendation available",
    priority: 'polite',
    category: 'health',
    delay: 1000,
  });

  announcementManager.announce({
    message: "Critical: Emergency contact required",
    priority: 'assertive',
    category: 'emergency',
    persistent: true,
  });

  // Get announcement status
  const queueStatus = announcementManager.getQueueStatus();
  console.log("Announcement queue status:", queueStatus);

  // Get announcement history
  setTimeout(() => {
    const history = announcementManager.getAnnouncementHistory(5);
    console.log("Recent announcements:", history);
  }, 2000);

  // Clear announcements by category
  setTimeout(() => {
    announcementManager.clearAnnouncements('health');
    console.log("Health announcements cleared");
  }, 3000);
}

/**
 * Example 4: Keyboard Navigation
 * 
 * Demonstrates keyboard navigation and accessibility shortcuts.
 */
export function keyboardNavigationExample() {
  console.log("=== Keyboard Navigation Example ===");

  const keyboardManager = new KeyboardNavigationManager();

  // Initialize with configuration
  keyboardManager.initialize({
    enabled: true,
    skipLinks: true,
    customKeyBindings: {
      'Ctrl+h': {
        keys: ['Ctrl+h'],
        handler: (event) => {
          console.log("Help shortcut activated");
          announce("Help menu opened", 'polite', 'navigation');
        },
        preventDefault: true,
        description: 'Open help menu',
      },
      'Ctrl+/': {
        keys: ['Ctrl+/'],
        handler: (event) => {
          console.log("Search shortcut activated");
          announce("Search activated", 'polite', 'navigation');
        },
        preventDefault: true,
        description: 'Activate search',
      },
    },
    focusVisible: true,
    tabTrapEnabled: true,
  });

  // Add custom key bindings
  keyboardManager.addKeyBinding({
    keys: ['Alt+m'],
    handler: (event) => {
      console.log("Main menu shortcut activated");
      announce("Main menu opened", 'polite', 'navigation');
    },
    preventDefault: true,
    description: 'Open main menu',
  });

  // Enable skip links
  keyboardManager.enableSkipLinks();

  if (typeof document !== "undefined") {
    // Create skip link to main content
    const mainContent = document.createElement('main');
    mainContent.id = 'main-content';
    mainContent.innerHTML = '<h1>Main Content</h1><p>This is the main content area.</p>';
    document.body.appendChild(mainContent);

    const skipLink = keyboardManager.createSkipLink('main-content', 'Skip to main content');
    console.log("Skip link created:", skipLink.textContent);

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(mainContent);
      console.log("Keyboard navigation example cleanup completed");
    }, 5000);
  }

  console.log("Keyboard navigation initialized with custom shortcuts");
}

/**
 * Example 5: WCAG Compliance Validation
 * 
 * Demonstrates comprehensive accessibility validation and reporting.
 */
export function wcagValidationExample() {
  console.log("=== WCAG Validation Example ===");

  const validator = new WCAGValidator();

  if (typeof document !== "undefined") {
    // Create test content with various accessibility issues
    const testContainer = document.createElement('div');
    testContainer.innerHTML = `
      <h1>Test Page</h1>
      <img src="test.jpg" /> <!-- Missing alt text -->
      <input type="text" /> <!-- Missing label -->
      <button onclick="alert('clicked')" style="width: 20px; height: 20px;">Small</button> <!-- Too small -->
      <h3>Skipped Heading Level</h3> <!-- Should be h2 -->
      <video autoplay>Your browser does not support video.</video> <!-- Autoplay issue -->
      <div onclick="handleClick()" style="color: #ccc; background: #ddd;">Clickable div</div> <!-- Poor contrast, not keyboard accessible -->
    `;
    document.body.appendChild(testContainer);

    // Validate the test container
    const sectionResult = validator.validateSection(testContainer);
    console.log("Section validation result:", {
      isCompliant: sectionResult.isCompliant,
      level: sectionResult.level,
      score: sectionResult.score,
      totalIssues: sectionResult.issues.length,
    });

    // Show detailed issues
    sectionResult.issues.forEach((issue, index) => {
      console.log(`Issue ${index + 1}:`, {
        type: issue.type,
        severity: issue.severity,
        description: issue.description,
        element: issue.element?.tagName,
      });
    });

    // Show suggestions
    sectionResult.suggestions.forEach((suggestion, index) => {
      console.log(`Suggestion ${index + 1}:`, {
        type: suggestion.type,
        description: suggestion.description,
        implementation: suggestion.implementation,
        priority: suggestion.priority,
      });
    });

    // Test color contrast
    const contrastResult = validator.checkColorContrast('#cccccc', '#dddddd');
    console.log("Color contrast test:", contrastResult);

    // Generate full compliance report
    const report = validator.generateReport();
    console.log("WCAG Compliance Report:", {
      overallScore: report.overallScore,
      level: report.level,
      totalIssues: report.totalIssues,
      issuesBySeverity: report.issuesBySeverity,
      elementsChecked: report.elementsChecked,
    });

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(testContainer);
      console.log("WCAG validation example cleanup completed");
    }, 1000);
  }

  // Quick accessibility check
  const quickCheck = quickAccessibilityCheck();
  console.log("Quick accessibility check:", quickCheck);
}

/**
 * Example 6: Preference Management
 * 
 * Demonstrates accessibility preference detection and management.
 */
export function preferenceManagementExample() {
  console.log("=== Preference Management Example ===");

  const preferenceManager = new PreferenceManager({
    highContrast: false,
    reducedMotion: false,
    fontSize: 'medium',
  });

  // Get current preferences
  const currentPreferences = preferenceManager.getPreferences();
  console.log("Current preferences:", currentPreferences);

  // Get system preferences
  const systemPreferences = preferenceManager.getSystemPreferences();
  console.log("System preferences:", systemPreferences);

  // Update preferences
  preferenceManager.updatePreferences({
    highContrast: true,
    fontSize: 'large',
    screenReaderEnabled: true,
    announcements: true,
  });

  console.log("Preferences updated");

  // Check preference sources
  console.log("Preference sources:", {
    highContrast: preferenceManager.getPreferenceSource('highContrast'),
    reducedMotion: preferenceManager.getPreferenceSource('reducedMotion'),
    fontSize: preferenceManager.getPreferenceSource('fontSize'),
  });

  // Export and import preferences
  const exportedPreferences = preferenceManager.exportPreferences();
  console.log("Exported preferences length:", exportedPreferences.length);

  const importSuccess = preferenceManager.importPreferences(exportedPreferences);
  console.log("Import successful:", importSuccess);

  // Reset preferences
  setTimeout(() => {
    preferenceManager.resetPreferences();
    console.log("Preferences reset to defaults");
  }, 2000);
}

/**
 * Example 7: Complete Accessibility Setup
 * 
 * Demonstrates a complete accessibility setup for a real application.
 */
export function completeAccessibilitySetupExample() {
  console.log("=== Complete Accessibility Setup Example ===");

  // Create complete setup with custom configuration
  const accessibilitySetup = createCompleteAccessibilitySetup({
    enabled: true,
    autoDetectPreferences: true,
    persistPreferences: true,
    enableMetrics: true,
    enableValidation: true,
    validationInterval: 30000,
    announcePageChanges: true,
    announceFormErrors: true,
    enableSkipLinks: true,
    enableFocusTrap: true,
    customCSS: `
      .high-contrast { filter: contrast(150%); }
      .reduced-motion * { animation-duration: 0.01ms !important; }
      .font-large { font-size: 1.2em; }
    `,
  });

  console.log("Complete accessibility setup created");

  // Apply comprehensive preferences
  accessibilitySetup.orchestrator.applyPreferences({
    highContrast: false,
    reducedMotion: false,
    screenReaderEnabled: true,
    keyboardNavigation: true,
    fontSize: 'medium',
    focusIndicatorStyle: 'high-contrast',
    announcements: true,
    colorBlindnessSupport: false,
    autoplayMedia: false,
    animationSpeed: 'normal',
    textSpacing: 'normal',
  });

  // Set up event monitoring
  const unsubscribeEvents = accessibilitySetup.orchestrator.addEventListener(
    'preference_changed',
    (event) => {
      console.log("Accessibility preference changed:", event.data);
    }
  );

  const unsubscribeCompliance = accessibilitySetup.orchestrator.addEventListener(
    'compliance_checked',
    (event) => {
      console.log("Compliance check completed:", {
        score: event.data.result.score,
        issues: event.data.result.issues.length,
      });
    }
  );

  // Monitor metrics
  const metricsInterval = setInterval(() => {
    const metrics = accessibilitySetup.orchestrator.getMetrics();
    console.log("Accessibility metrics:", {
      complianceScore: metrics.complianceScore,
      totalIssues: metrics.totalIssues,
      criticalIssues: metrics.criticalIssues,
      announcementsMade: metrics.announcementsMade,
      focusChanges: metrics.focusChanges,
    });
  }, 10000);

  // Cleanup after demonstration
  setTimeout(() => {
    unsubscribeEvents();
    unsubscribeCompliance();
    clearInterval(metricsInterval);
    accessibilitySetup.orchestrator.destroy();
    console.log("Complete accessibility setup cleanup completed");
  }, 30000);

  return accessibilitySetup;
}

/**
 * Example 8: Accessibility Health Monitoring
 * 
 * Demonstrates continuous accessibility monitoring and health checks.
 */
export function accessibilityHealthMonitoringExample() {
  console.log("=== Accessibility Health Monitoring Example ===");

  // Initialize accessibility system
  initializeAccessibilitySystem({
    enableMetrics: true,
    enableValidation: true,
    validationInterval: 5000, // Check every 5 seconds
  });

  // Perform initial health check
  const initialHealth = checkAccessibilitySystemHealth();
  console.log("Initial accessibility health:", initialHealth);

  // Monitor health over time
  const healthInterval = setInterval(() => {
    const health = checkAccessibilitySystemHealth();
    
    if (!health.isHealthy) {
      console.warn("Accessibility health issues detected:", health.issues);
      
      // Announce critical issues
      if (health.metrics.criticalIssues > 0) {
        announce(
          `${health.metrics.criticalIssues} critical accessibility issues detected`,
          'assertive',
          'system'
        );
      }
    } else {
      console.log("Accessibility system healthy - Score:", health.metrics.complianceScore);
    }
  }, 10000);

  // Simulate some accessibility issues and fixes
  if (typeof document !== "undefined") {
    setTimeout(() => {
      // Add problematic content
      const problemDiv = document.createElement('div');
      problemDiv.innerHTML = '<img src="test.jpg"><input type="text">';
      document.body.appendChild(problemDiv);
      console.log("Added problematic content for testing");
    }, 2000);

    setTimeout(() => {
      // Fix the issues
      const images = document.querySelectorAll('img:not([alt])');
      images.forEach(img => img.setAttribute('alt', 'Test image'));
      
      const inputs = document.querySelectorAll('input:not([aria-label]):not([id])');
      inputs.forEach((input, index) => {
        input.setAttribute('aria-label', `Input field ${index + 1}`);
      });
      
      console.log("Fixed accessibility issues");
    }, 15000);
  }

  // Cleanup
  setTimeout(() => {
    clearInterval(healthInterval);
    console.log("Accessibility health monitoring completed");
  }, 25000);
}

/**
 * Example 9: Real-world TCM Application Integration
 * 
 * Demonstrates how to integrate accessibility into the Sihat TCM application.
 */
export function tcmApplicationIntegrationExample() {
  console.log("=== TCM Application Integration Example ===");

  // Initialize accessibility for TCM application
  const tcmAccessibility = createCompleteAccessibilitySetup({
    enabled: true,
    autoDetectPreferences: true,
    persistPreferences: true,
    enableMetrics: true,
    enableValidation: true,
    announcePageChanges: true,
    announceFormErrors: true,
    enableSkipLinks: true,
    enableFocusTrap: true,
  });

  // TCM-specific accessibility features
  const setupTCMAccessibility = () => {
    // Announce diagnosis progress
    const announceProgress = (progress: number, step: string) => {
      announce(
        `Diagnosis progress: ${progress}% complete. Current step: ${step}`,
        'polite',
        'diagnosis'
      );
    };

    // Announce health recommendations
    const announceRecommendation = (type: string, message: string) => {
      announce(
        `New ${type} recommendation: ${message}`,
        'polite',
        'health'
      );
    };

    // Announce AI analysis results
    const announceAIResult = (analysis: string) => {
      announce(
        `AI analysis complete: ${analysis}`,
        'polite',
        'ai'
      );
    };

    // Setup keyboard shortcuts for TCM features
    tcmAccessibility.keyboardNavigationManager.addKeyBinding({
      keys: ['Alt+d'],
      handler: () => {
        announce("Diagnosis menu opened", 'polite', 'navigation');
        console.log("Diagnosis menu shortcut activated");
      },
      preventDefault: true,
      description: 'Open diagnosis menu',
    });

    tcmAccessibility.keyboardNavigationManager.addKeyBinding({
      keys: ['Alt+r'],
      handler: () => {
        announce("Recommendations panel opened", 'polite', 'navigation');
        console.log("Recommendations shortcut activated");
      },
      preventDefault: true,
      description: 'Open recommendations panel',
    });

    return {
      announceProgress,
      announceRecommendation,
      announceAIResult,
    };
  };

  const tcmFeatures = setupTCMAccessibility();

  // Simulate TCM application workflow
  setTimeout(() => {
    tcmFeatures.announceProgress(25, "Basic Information");
  }, 1000);

  setTimeout(() => {
    tcmFeatures.announceProgress(50, "Tongue Analysis");
  }, 3000);

  setTimeout(() => {
    tcmFeatures.announceAIResult("Constitution type: Yang deficiency detected");
  }, 5000);

  setTimeout(() => {
    tcmFeatures.announceRecommendation(
      "dietary",
      "Increase warm foods and avoid cold beverages"
    );
  }, 7000);

  // Monitor TCM-specific accessibility metrics
  const tcmMetricsInterval = setInterval(() => {
    const metrics = tcmAccessibility.orchestrator.getMetrics();
    console.log("TCM Accessibility Metrics:", {
      complianceScore: metrics.complianceScore,
      announcementsMade: metrics.announcementsMade,
      keyboardNavigationUsage: metrics.keyboardNavigationUsage,
      screenReaderUsage: metrics.screenReaderUsage,
    });
  }, 5000);

  // Cleanup
  setTimeout(() => {
    clearInterval(tcmMetricsInterval);
    tcmAccessibility.orchestrator.destroy();
    console.log("TCM application accessibility integration completed");
  }, 15000);
}

/**
 * Run all accessibility system examples
 */
export function runAllAccessibilityExamples() {
  console.log("♿ Running Accessibility System Examples");
  console.log("======================================");

  try {
    // Run all examples
    basicAccessibilitySetupExample();
    focusManagementExample();
    announcementSystemExample();
    keyboardNavigationExample();
    wcagValidationExample();
    preferenceManagementExample();
    completeAccessibilitySetupExample();
    accessibilityHealthMonitoringExample();
    tcmApplicationIntegrationExample();

    console.log("✅ All accessibility system examples completed successfully");

  } catch (error) {
    console.error("❌ Error running accessibility system examples:", error);
  }
}

// Export for easy testing
export const accessibilitySystemExamples = {
  basicAccessibilitySetupExample,
  focusManagementExample,
  announcementSystemExample,
  keyboardNavigationExample,
  wcagValidationExample,
  preferenceManagementExample,
  completeAccessibilitySetupExample,
  accessibilityHealthMonitoringExample,
  tcmApplicationIntegrationExample,
  runAllAccessibilityExamples,
};