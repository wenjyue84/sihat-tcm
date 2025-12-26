/**
 * AccessibilityContext - React Context for Accessibility Management
 * 
 * This context provides:
 * - Global accessibility state management
 * - Accessibility preferences persistence
 * - Component-level accessibility features
 * - WCAG compliance utilities
 */

'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { 
  AccessibilityManager, 
  AccessibilityPreferences, 
  getAccessibilityManager 
} from '@/lib/accessibilityManager'

interface AccessibilityContextType {
  manager: AccessibilityManager | null
  preferences: AccessibilityPreferences
  updatePreferences: (prefs: Partial<AccessibilityPreferences>) => void
  announce: (message: string, priority?: 'polite' | 'assertive', delay?: number) => void
  isHighContrast: boolean
  isReducedMotion: boolean
  isScreenReaderEnabled: boolean
  fontSize: string
  focusIndicatorStyle: string
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined)

interface AccessibilityProviderProps {
  children: ReactNode
  initialPreferences?: Partial<AccessibilityPreferences>
  persistPreferences?: boolean
  storageKey?: string
}

const DEFAULT_STORAGE_KEY = 'sihat-tcm-accessibility-preferences'

export function AccessibilityProvider({
  children,
  initialPreferences = {},
  persistPreferences = true,
  storageKey = DEFAULT_STORAGE_KEY
}: AccessibilityProviderProps) {
  const [manager, setManager] = useState<AccessibilityManager | null>(null)
  const [preferences, setPreferences] = useState<AccessibilityPreferences>({
    highContrast: false,
    reducedMotion: false,
    screenReaderEnabled: false,
    keyboardNavigation: true,
    fontSize: 'medium',
    focusIndicatorStyle: 'default',
    announcements: true,
    ...initialPreferences
  })

  // Initialize accessibility manager
  useEffect(() => {
    if (manager) return // Prevent re-initialization

    // Load saved preferences
    let savedPreferences = {}
    if (persistPreferences && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey)
        if (saved) {
          savedPreferences = JSON.parse(saved)
        }
      } catch (error) {
        console.warn('Failed to load accessibility preferences:', error)
      }
    }

    // Merge preferences
    const mergedPreferences = {
      highContrast: false,
      reducedMotion: false,
      screenReaderEnabled: false,
      keyboardNavigation: true,
      fontSize: 'medium' as const,
      focusIndicatorStyle: 'default' as const,
      announcements: true,
      ...savedPreferences,
      ...initialPreferences
    }

    // Initialize manager
    const accessibilityManager = getAccessibilityManager(mergedPreferences)
    setManager(accessibilityManager)
    setPreferences(accessibilityManager.getPreferences())

    // Import accessibility styles
    if (typeof document !== 'undefined') {
      const styleId = 'accessibility-styles'
      if (!document.getElementById(styleId)) {
        const link = document.createElement('link')
        link.id = styleId
        link.rel = 'stylesheet'
        link.href = '/styles/accessibility.css'
        document.head.appendChild(link)
      }
    }
  }, []) // Empty dependency array - only run once

  // Update preferences function
  const updatePreferences = useCallback((newPreferences: Partial<AccessibilityPreferences>) => {
    if (!manager) return

    const updatedPreferences = { ...preferences, ...newPreferences }
    
    manager.updatePreferences(newPreferences)
    setPreferences(updatedPreferences)

    // Persist preferences
    if (persistPreferences && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(updatedPreferences))
      } catch (error) {
        console.warn('Failed to save accessibility preferences:', error)
      }
    }

    // Announce changes
    if (manager && preferences.announcements) {
      const changes = Object.keys(newPreferences)
        .map(key => {
          const value = newPreferences[key as keyof AccessibilityPreferences]
          return `${key.replace(/([A-Z])/g, ' $1').toLowerCase()}: ${value}`
        })
        .join(', ')
      
      manager.announce(`Accessibility settings updated: ${changes}`, 'polite', 500)
    }
  }, [manager, preferences, persistPreferences, storageKey])

  // Announce function
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite', delay: number = 0) => {
    if (manager) {
      manager.announce(message, priority, delay)
    }
  }, [manager])

  const contextValue: AccessibilityContextType = {
    manager,
    preferences,
    updatePreferences,
    announce,
    isHighContrast: preferences.highContrast,
    isReducedMotion: preferences.reducedMotion,
    isScreenReaderEnabled: preferences.screenReaderEnabled,
    fontSize: preferences.fontSize,
    focusIndicatorStyle: preferences.focusIndicatorStyle
  }

  return (
    <AccessibilityContext.Provider value={contextValue}>
      {children}
    </AccessibilityContext.Provider>
  )
}

/**
 * Hook to use accessibility context
 */
export function useAccessibilityContext(): AccessibilityContextType {
  const context = useContext(AccessibilityContext)
  if (context === undefined) {
    throw new Error('useAccessibilityContext must be used within an AccessibilityProvider')
  }
  return context
}

/**
 * HOC to wrap components with accessibility features
 */
export function withAccessibility<P extends object>(
  Component: React.ComponentType<P>,
  options: {
    focusGroup?: string
    announceMount?: string
    announceUnmount?: string
  } = {}
) {
  const { focusGroup, announceMount, announceUnmount } = options

  return function AccessibilityWrappedComponent(props: P) {
    const { manager, announce } = useAccessibilityContext()

    useEffect(() => {
      if (announceMount) {
        announce(announceMount, 'polite', 100)
      }

      return () => {
        if (announceUnmount) {
          announce(announceUnmount, 'polite')
        }
      }
    }, [announce])

    useEffect(() => {
      if (focusGroup && manager) {
        manager.setFocusGroup(focusGroup)
      }
    }, [focusGroup, manager])

    return <Component {...props} />
  }
}

/**
 * Component for accessibility settings panel
 */
export function AccessibilitySettings() {
  const { preferences, updatePreferences, announce } = useAccessibilityContext()

  const handleToggle = (key: keyof AccessibilityPreferences, value: boolean) => {
    updatePreferences({ [key]: value })
  }

  const handleSelect = (key: keyof AccessibilityPreferences, value: string) => {
    updatePreferences({ [key]: value })
  }

  return (
    <div className="accessibility-settings p-6 bg-white rounded-lg shadow-lg max-w-md">
      <h2 className="text-xl font-semibold mb-4">Accessibility Settings</h2>
      
      <div className="space-y-4">
        {/* High Contrast */}
        <div className="flex items-center justify-between">
          <label htmlFor="high-contrast" className="text-sm font-medium">
            High Contrast Mode
          </label>
          <button
            id="high-contrast"
            role="switch"
            aria-checked={preferences.highContrast}
            onClick={() => handleToggle('highContrast', !preferences.highContrast)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.highContrast ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.highContrast ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Reduced Motion */}
        <div className="flex items-center justify-between">
          <label htmlFor="reduced-motion" className="text-sm font-medium">
            Reduce Motion
          </label>
          <button
            id="reduced-motion"
            role="switch"
            aria-checked={preferences.reducedMotion}
            onClick={() => handleToggle('reducedMotion', !preferences.reducedMotion)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.reducedMotion ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.reducedMotion ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Font Size */}
        <div>
          <label htmlFor="font-size" className="block text-sm font-medium mb-2">
            Font Size
          </label>
          <select
            id="font-size"
            value={preferences.fontSize}
            onChange={(e) => handleSelect('fontSize', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
            <option value="extra-large">Extra Large</option>
          </select>
        </div>

        {/* Focus Indicator Style */}
        <div>
          <label htmlFor="focus-style" className="block text-sm font-medium mb-2">
            Focus Indicator Style
          </label>
          <select
            id="focus-style"
            value={preferences.focusIndicatorStyle}
            onChange={(e) => handleSelect('focusIndicatorStyle', e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="default">Default</option>
            <option value="high-contrast">High Contrast</option>
            <option value="thick">Thick</option>
          </select>
        </div>

        {/* Keyboard Navigation */}
        <div className="flex items-center justify-between">
          <label htmlFor="keyboard-nav" className="text-sm font-medium">
            Keyboard Navigation
          </label>
          <button
            id="keyboard-nav"
            role="switch"
            aria-checked={preferences.keyboardNavigation}
            onClick={() => handleToggle('keyboardNavigation', !preferences.keyboardNavigation)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.keyboardNavigation ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.keyboardNavigation ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Announcements */}
        <div className="flex items-center justify-between">
          <label htmlFor="announcements" className="text-sm font-medium">
            Screen Reader Announcements
          </label>
          <button
            id="announcements"
            role="switch"
            aria-checked={preferences.announcements}
            onClick={() => handleToggle('announcements', !preferences.announcements)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              preferences.announcements ? 'bg-blue-600' : 'bg-gray-200'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                preferences.announcements ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      <button
        onClick={() => announce('Accessibility settings saved', 'assertive')}
        className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Save Settings
      </button>
    </div>
  )
}

/**
 * Skip navigation component
 */
export function SkipNavigation({ links }: { links: Array<{ href: string; text: string }> }) {
  return (
    <nav aria-label="Skip navigation" className="skip-navigation">
      {links.map((link, index) => (
        <a
          key={index}
          href={link.href}
          className="skip-link"
        >
          {link.text}
        </a>
      ))}
    </nav>
  )
}

/**
 * Live region component for announcements
 */
export function LiveRegion({ 
  message, 
  priority = 'polite' 
}: { 
  message: string
  priority?: 'polite' | 'assertive' 
}) {
  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  )
}