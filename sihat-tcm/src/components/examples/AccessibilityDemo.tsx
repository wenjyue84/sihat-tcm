/**
 * AccessibilityDemo - Demonstration component for AccessibilityManager features
 * 
 * This component showcases:
 * - WCAG 2.1 AA compliant components
 * - Keyboard navigation
 * - Screen reader support
 * - Focus management
 * - Accessibility settings
 */

'use client'

import React, { useState, useRef } from 'react'
import { useAccessibility, useKeyboardNavigation } from '@/hooks/useAccessibility'
import { useAccessibilityContext } from '@/stores/useAppStore'
import { AccessibilitySettings, SkipNavigation } from '@/components/accessibility/AccessibilityComponents'
import { AccessibleButton } from '@/components/ui/AccessibleButton'
import { AccessibleInput } from '@/components/ui/AccessibleInput'
import { AccessibleModal } from '@/components/ui/AccessibleModal'
import { Settings, Eye, Keyboard, Volume2 } from 'lucide-react'

export function AccessibilityDemo() {
  const { preferences, announce } = useAccessibilityContext()
  const [showSettings, setShowSettings] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [inputError, setInputError] = useState('')
  
  const navigationRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLDivElement>(null)
  
  // Setup keyboard navigation for the demo sections
  useKeyboardNavigation(navigationRef, {
    groupId: 'demo-navigation',
    enableArrowKeys: true,
    enableHomeEnd: true
  })

  useKeyboardNavigation(formRef, {
    groupId: 'demo-form',
    enableArrowKeys: true
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    
    // Simple validation for demo
    if (value.length > 0 && value.length < 3) {
      setInputError('Input must be at least 3 characters long')
    } else {
      setInputError('')
    }
  }

  const handleDemoAction = (action: string) => {
    announce(`Demo action performed: ${action}`, 'polite')
  }

  const skipLinks = [
    { href: '#main-content', text: 'Skip to main content' },
    { href: '#navigation', text: 'Skip to navigation' },
    { href: '#settings', text: 'Skip to accessibility settings' }
  ]

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Skip Navigation */}
      <SkipNavigation links={skipLinks} />

      {/* Header */}
      <header className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Accessibility Features Demo
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Demonstrating WCAG 2.1 AA compliant components and features
        </p>
      </header>

      {/* Current Accessibility Status */}
      <section 
        id="accessibility-status" 
        className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg"
        role="region"
        aria-labelledby="status-heading"
      >
        <h2 id="status-heading" className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5" aria-hidden="true" />
          Current Accessibility Settings
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">High Contrast:</span>
            <span className={preferences.highContrast ? 'text-green-600' : 'text-gray-600'}>
              {preferences.highContrast ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Reduced Motion:</span>
            <span className={preferences.reducedMotion ? 'text-green-600' : 'text-gray-600'}>
              {preferences.reducedMotion ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Font Size:</span>
            <span className="capitalize">{preferences.fontSize}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Screen Reader:</span>
            <span className={preferences.screenReaderEnabled ? 'text-green-600' : 'text-gray-600'}>
              {preferences.screenReaderEnabled ? 'Detected' : 'Not Detected'}
            </span>
          </div>
        </div>
      </section>

      {/* Navigation Demo */}
      <section 
        id="navigation"
        className="space-y-4"
        role="region"
        aria-labelledby="nav-heading"
      >
        <h2 id="nav-heading" className="text-xl font-semibold flex items-center gap-2">
          <Keyboard className="w-5 h-5" aria-hidden="true" />
          Keyboard Navigation Demo
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Use arrow keys, Tab, or Home/End to navigate between buttons. Press Enter or Space to activate.
        </p>
        
        <div 
          ref={navigationRef}
          className="flex flex-wrap gap-4 p-4 border-2 border-dashed border-gray-300 rounded-lg"
          data-focus-group="demo-navigation"
          role="toolbar"
          aria-label="Demo navigation buttons"
        >
          <AccessibleButton
            variant="default"
            focusGroup="demo-navigation"
            announceOnClick="First button activated"
            onClick={() => handleDemoAction('First Button')}
          >
            First Button
          </AccessibleButton>
          
          <AccessibleButton
            variant="outline"
            focusGroup="demo-navigation"
            announceOnClick="Second button activated"
            onClick={() => handleDemoAction('Second Button')}
          >
            Second Button
          </AccessibleButton>
          
          <AccessibleButton
            variant="secondary"
            focusGroup="demo-navigation"
            announceOnClick="Third button activated"
            onClick={() => handleDemoAction('Third Button')}
          >
            Third Button
          </AccessibleButton>
          
          <AccessibleButton
            variant="ghost"
            focusGroup="demo-navigation"
            announceOnClick="Settings opened"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="w-4 h-4" aria-hidden="true" />
            Settings
          </AccessibleButton>
        </div>
      </section>

      {/* Form Demo */}
      <section 
        id="form-demo"
        className="space-y-4"
        role="region"
        aria-labelledby="form-heading"
      >
        <h2 id="form-heading" className="text-xl font-semibold">
          Accessible Form Demo
        </h2>
        
        <div 
          ref={formRef}
          className="space-y-4 p-4 border border-gray-300 rounded-lg"
          data-focus-group="demo-form"
        >
          <AccessibleInput
            label="Demo Input Field"
            description="Enter at least 3 characters to see validation in action"
            placeholder="Type something here..."
            value={inputValue}
            onChange={handleInputChange}
            error={inputError}
            success={inputValue.length >= 3 && !inputError ? 'Input is valid!' : undefined}
            focusGroup="demo-form"
            announceChanges={false}
            required
          />
          
          <AccessibleInput
            label="Email Address"
            type="email"
            description="We'll never share your email with anyone else"
            placeholder="your.email@example.com"
            focusGroup="demo-form"
          />
          
          <div className="flex gap-4">
            <AccessibleButton
              type="submit"
              focusGroup="demo-form"
              announceOnClick="Form submitted successfully"
              onClick={() => handleDemoAction('Form Submit')}
            >
              Submit Form
            </AccessibleButton>
            
            <AccessibleButton
              type="button"
              variant="outline"
              focusGroup="demo-form"
              announceOnClick="Modal dialog opened"
              onClick={() => setShowModal(true)}
            >
              Open Modal
            </AccessibleButton>
          </div>
        </div>
      </section>

      {/* Announcements Demo */}
      <section 
        id="announcements"
        className="space-y-4"
        role="region"
        aria-labelledby="announce-heading"
      >
        <h2 id="announce-heading" className="text-xl font-semibold flex items-center gap-2">
          <Volume2 className="w-5 h-5" aria-hidden="true" />
          Screen Reader Announcements
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          These buttons demonstrate different types of announcements for screen readers.
        </p>
        
        <div className="flex flex-wrap gap-4">
          <AccessibleButton
            variant="outline"
            onClick={() => announce('This is a polite announcement', 'polite')}
          >
            Polite Announcement
          </AccessibleButton>
          
          <AccessibleButton
            variant="outline"
            onClick={() => announce('This is an assertive announcement!', 'assertive')}
          >
            Assertive Announcement
          </AccessibleButton>
          
          <AccessibleButton
            variant="outline"
            onClick={() => announce('This announcement has a delay', 'polite', 1000)}
          >
            Delayed Announcement
          </AccessibleButton>
        </div>
      </section>

      {/* Accessibility Settings Modal */}
      <AccessibleModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Accessibility Settings"
        description="Customize your accessibility preferences"
        size="md"
      >
        <AccessibilitySettings />
      </AccessibleModal>

      {/* Demo Modal */}
      <AccessibleModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Demo Modal"
        description="This is a demonstration of an accessible modal dialog"
        size="sm"
      >
        <div className="space-y-4">
          <p>
            This modal demonstrates proper focus trapping, keyboard navigation, 
            and screen reader announcements. Try pressing Tab to navigate between 
            focusable elements, or Escape to close.
          </p>
          
          <div className="flex justify-end gap-3">
            <AccessibleButton
              variant="outline"
              onClick={() => setShowModal(false)}
            >
              Cancel
            </AccessibleButton>
            <AccessibleButton
              onClick={() => {
                announce('Action confirmed in modal', 'assertive')
                setShowModal(false)
              }}
            >
              Confirm
            </AccessibleButton>
          </div>
        </div>
      </AccessibleModal>

      {/* Live Region for Announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="live-region"
      />
    </div>
  )
}