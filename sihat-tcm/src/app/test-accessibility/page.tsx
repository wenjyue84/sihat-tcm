/**
 * Accessibility Testing Page
 * 
 * This page provides a comprehensive testing environment for all accessibility features.
 * Use this page to manually test WCAG compliance, keyboard navigation, screen reader support, etc.
 */

import { AccessibilityDemo } from '@/components/examples/AccessibilityDemo'

export default function AccessibilityTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            🔍 Accessibility Testing Environment
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            This page demonstrates and allows you to test all accessibility features implemented in the Sihat TCM platform. 
            Use keyboard navigation, screen readers, and browser accessibility tools to verify WCAG 2.1 AA compliance.
          </p>
        </div>

        {/* Testing Instructions */}
        <div className="mb-8 bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-blue-900 dark:text-blue-100">
            🧪 How to Test Accessibility Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-semibold mb-2">Keyboard Navigation</h3>
              <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                <li>• Press <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Tab</kbd> to navigate between elements</li>
                <li>• Use <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Arrow Keys</kbd> within focus groups</li>
                <li>• Press <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Enter</kbd> or <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Space</kbd> to activate</li>
                <li>• Press <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Escape</kbd> to close modals</li>
                <li>• Use <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Home</kbd>/<kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">End</kbd> to jump to first/last</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Screen Reader Testing</h3>
              <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                <li>• Enable NVDA, JAWS, or VoiceOver</li>
                <li>• Navigate with screen reader shortcuts</li>
                <li>• Listen for announcements when interacting</li>
                <li>• Check ARIA labels and descriptions</li>
                <li>• Verify live region updates</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Browser Testing Tools */}
        <div className="mb-8 bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-green-900 dark:text-green-100">
            🛠️ Browser Accessibility Tools
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h3 className="font-semibold mb-2">Chrome DevTools</h3>
              <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                <li>• F12 → Lighthouse → Accessibility</li>
                <li>• Elements → Accessibility pane</li>
                <li>• Console → Check for a11y warnings</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Firefox DevTools</h3>
              <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                <li>• F12 → Accessibility tab</li>
                <li>• Inspector → Accessibility properties</li>
                <li>• Simulate color blindness</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Extensions</h3>
              <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                <li>• axe DevTools</li>
                <li>• WAVE Web Accessibility Evaluator</li>
                <li>• Accessibility Insights</li>
              </ul>
            </div>
          </div>
        </div>

        {/* System Preferences Testing */}
        <div className="mb-8 bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-purple-900 dark:text-purple-100">
            ⚙️ System Preferences to Test
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-semibold mb-2">Windows</h3>
              <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                <li>• Settings → Ease of Access → High contrast</li>
                <li>• Settings → Ease of Access → Animation effects</li>
                <li>• Settings → Ease of Access → Narrator</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">macOS</h3>
              <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                <li>• System Preferences → Accessibility → Display</li>
                <li>• System Preferences → Accessibility → Reduce Motion</li>
                <li>• System Preferences → Accessibility → VoiceOver</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Demo Component */}
        <AccessibilityDemo />

        {/* Testing Checklist */}
        <div className="mt-8 bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-yellow-900 dark:text-yellow-100">
            ✅ Accessibility Testing Checklist
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-semibold mb-2">Keyboard Navigation</h3>
              <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                <li>□ All interactive elements are focusable</li>
                <li>□ Focus order is logical and predictable</li>
                <li>□ Focus indicators are clearly visible</li>
                <li>□ No keyboard traps exist</li>
                <li>□ Skip links work correctly</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Screen Reader</h3>
              <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                <li>□ All content is announced correctly</li>
                <li>□ Form labels are properly associated</li>
                <li>□ Error messages are announced</li>
                <li>□ Live regions update appropriately</li>
                <li>□ ARIA attributes are correct</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Visual</h3>
              <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                <li>□ High contrast mode works</li>
                <li>□ Text is readable at 200% zoom</li>
                <li>□ Color is not the only indicator</li>
                <li>□ Focus indicators are visible</li>
                <li>□ Reduced motion is respected</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Interaction</h3>
              <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                <li>□ Touch targets are at least 44px</li>
                <li>□ Hover states don't break functionality</li>
                <li>□ Timeouts can be extended</li>
                <li>□ Error recovery is possible</li>
                <li>□ Help text is available</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}