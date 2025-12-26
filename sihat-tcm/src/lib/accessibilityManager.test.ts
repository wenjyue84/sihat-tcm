/**
 * AccessibilityManager Tests
 * 
 * Tests for WCAG 2.1 AA compliance features and functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AccessibilityManager, getAccessibilityManager } from './accessibilityManager'

// Mock DOM environment
const mockDocument = {
  createElement: vi.fn(() => ({
    setAttribute: vi.fn(),
    style: { cssText: '' },
    className: '',
    textContent: '',
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    parentNode: { removeChild: vi.fn() },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    tagName: 'A',
    href: '',
    focus: vi.fn()
  })),
  body: {
    appendChild: vi.fn(),
    removeChild: vi.fn()
  },
  documentElement: {
    classList: {
      add: vi.fn(),
      remove: vi.fn()
    },
    lang: 'en'
  },
  activeElement: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  querySelector: vi.fn(),
  querySelectorAll: vi.fn(() => [])
}

const mockWindow = {
  matchMedia: vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  })),
  getComputedStyle: vi.fn(() => ({
    display: 'block',
    visibility: 'visible'
  }))
}

// Setup global mocks
Object.defineProperty(global, 'document', {
  value: mockDocument,
  writable: true
})

Object.defineProperty(global, 'window', {
  value: mockWindow,
  writable: true
})

Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'test-browser'
  },
  writable: true
})

describe('AccessibilityManager', () => {
  let manager: AccessibilityManager

  beforeEach(() => {
    vi.clearAllMocks()
    manager = new AccessibilityManager()
  })

  afterEach(() => {
    manager.destroy()
  })

  describe('Initialization', () => {
    it('should initialize with default preferences', () => {
      const preferences = manager.getPreferences()
      
      expect(preferences.keyboardNavigation).toBe(true)
      expect(preferences.announcements).toBe(true)
      expect(preferences.fontSize).toBe('medium')
      expect(preferences.focusIndicatorStyle).toBe('default')
    })

    it('should initialize with custom preferences', () => {
      const customManager = new AccessibilityManager({
        highContrast: true,
        fontSize: 'large'
      })
      
      const preferences = customManager.getPreferences()
      
      expect(preferences.highContrast).toBe(true)
      expect(preferences.fontSize).toBe('large')
      expect(preferences.keyboardNavigation).toBe(true) // Should still have defaults
      
      customManager.destroy()
    })

    it('should create announcer element', () => {
      expect(mockDocument.createElement).toHaveBeenCalledWith('div')
      expect(mockDocument.body.appendChild).toHaveBeenCalled()
    })
  })

  describe('Preferences Management', () => {
    it('should update preferences', () => {
      manager.updatePreferences({
        highContrast: true,
        reducedMotion: true
      })
      
      const preferences = manager.getPreferences()
      
      expect(preferences.highContrast).toBe(true)
      expect(preferences.reducedMotion).toBe(true)
    })

    it('should apply accessibility styles when preferences change', () => {
      manager.updatePreferences({ highContrast: true })
      
      expect(mockDocument.documentElement.classList.add).toHaveBeenCalledWith('accessibility-high-contrast')
    })
  })

  describe('Focus Management', () => {
    let mockElements: HTMLElement[]

    beforeEach(() => {
      mockElements = [
        { 
          focus: vi.fn(), 
          tabIndex: 0, 
          tagName: 'BUTTON',
          offsetParent: {},
          hasAttribute: vi.fn(() => false),
          getAttribute: vi.fn(() => null)
        } as any,
        { 
          focus: vi.fn(), 
          tabIndex: 0, 
          tagName: 'INPUT',
          offsetParent: {},
          hasAttribute: vi.fn(() => false),
          getAttribute: vi.fn(() => null)
        } as any
      ]

      // Mock getComputedStyle for focusable elements
      mockWindow.getComputedStyle.mockReturnValue({
        display: 'block',
        visibility: 'visible'
      })
    })

    it('should register focus group', () => {
      manager.registerFocusGroup('test-group', mockElements)
      
      expect(() => manager.setFocusGroup('test-group')).not.toThrow()
    })

    it('should focus next element', () => {
      manager.registerFocusGroup('test-group', mockElements)
      manager.setFocusGroup('test-group')
      
      const result = manager.focusNext()
      
      expect(result).toBe(true)
      expect(mockElements[1].focus).toHaveBeenCalled()
    })

    it('should focus previous element', () => {
      manager.registerFocusGroup('test-group', mockElements)
      manager.setFocusGroup('test-group')
      
      // Move to second element first
      manager.focusNext()
      
      const result = manager.focusPrevious()
      
      expect(result).toBe(true)
      expect(mockElements[0].focus).toHaveBeenCalled()
    })

    it('should focus first element', () => {
      manager.registerFocusGroup('test-group', mockElements)
      
      const result = manager.focusFirst('test-group')
      
      expect(result).toBe(true)
      expect(mockElements[0].focus).toHaveBeenCalled()
    })

    it('should focus last element', () => {
      manager.registerFocusGroup('test-group', mockElements)
      
      const result = manager.focusLast('test-group')
      
      expect(result).toBe(true)
      expect(mockElements[1].focus).toHaveBeenCalled()
    })
  })

  describe('Announcements', () => {
    it('should announce messages', () => {
      const mockAnnouncer = {
        setAttribute: vi.fn(),
        textContent: ''
      }
      
      // Mock the announcer element
      manager['announcer'] = mockAnnouncer as any
      
      manager.announce('Test message', 'polite')
      
      expect(mockAnnouncer.setAttribute).toHaveBeenCalledWith('aria-live', 'polite')
      expect(mockAnnouncer.textContent).toBe('Test message')
    })

    it('should not announce when announcements are disabled', () => {
      manager.updatePreferences({ announcements: false })
      
      const mockAnnouncer = {
        setAttribute: vi.fn(),
        textContent: ''
      }
      
      manager['announcer'] = mockAnnouncer as any
      
      manager.announce('Test message')
      
      expect(mockAnnouncer.setAttribute).not.toHaveBeenCalled()
    })
  })

  describe('ARIA Attributes', () => {
    it('should add ARIA attributes to elements', () => {
      const mockElement = {
        setAttribute: vi.fn()
      } as any
      
      manager.addAriaAttributes(mockElement, {
        'label': 'Test label',
        'describedby': 'test-description'
      })
      
      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-label', 'Test label')
      expect(mockElement.setAttribute).toHaveBeenCalledWith('aria-describedby', 'test-description')
    })
  })

  describe('WCAG Compliance Validation', () => {
    it('should validate image alt text', () => {
      const mockImg = {
        tagName: 'IMG',
        getAttribute: vi.fn(() => null)
      } as any
      
      const result = manager.validateWCAGCompliance(mockImg)
      
      expect(result.isCompliant).toBe(false)
      expect(result.issues).toContain('Image missing alt attribute')
      expect(result.suggestions).toContain('Add descriptive alt text for the image')
    })

    it('should validate form control labels', () => {
      const mockInput = {
        tagName: 'INPUT',
        id: 'test-input',
        getAttribute: vi.fn(() => null)
      } as any
      
      mockDocument.querySelector.mockReturnValue(null)
      
      const result = manager.validateWCAGCompliance(mockInput)
      
      expect(result.isCompliant).toBe(false)
      expect(result.issues).toContain('Form control missing accessible label')
    })

    it('should validate keyboard accessibility', () => {
      const mockDiv = {
        tagName: 'DIV',
        onclick: vi.fn(),
        tabIndex: -1,
        hasAttribute: vi.fn(() => false),
        getAttribute: vi.fn(() => null)
      } as any
      
      const result = manager.validateWCAGCompliance(mockDiv)
      
      expect(result.isCompliant).toBe(false)
      expect(result.issues).toContain('Interactive element not keyboard accessible')
    })
  })

  describe('Skip Links', () => {
    it('should create skip link', () => {
      const skipLink = manager.createSkipLink('main-content', 'Skip to main content') as HTMLAnchorElement
      
      expect(skipLink.href).toContain('#main-content')
      expect(skipLink.textContent).toBe('Skip to main content')
      expect(skipLink.className).toBe('skip-link')
    })
  })

  describe('System Preference Detection', () => {
    it('should detect reduced motion preference', () => {
      mockWindow.matchMedia.mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      })
      
      const testManager = new AccessibilityManager()
      const preferences = testManager.getPreferences()
      
      expect(preferences.reducedMotion).toBe(true)
      
      testManager.destroy()
    })

    it('should detect high contrast preference', () => {
      mockWindow.matchMedia.mockImplementation((query: string) => ({
        matches: query.includes('prefers-contrast: high'),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }))
      
      const testManager = new AccessibilityManager()
      const preferences = testManager.getPreferences()
      
      expect(preferences.highContrast).toBe(true)
      
      testManager.destroy()
    })
  })

  describe('Singleton Pattern', () => {
    it('should return same instance from getAccessibilityManager', () => {
      const instance1 = getAccessibilityManager()
      const instance2 = getAccessibilityManager()
      
      expect(instance1).toBe(instance2)
    })
  })

  describe('Cleanup', () => {
    it('should cleanup resources on destroy', () => {
      const mockAnnouncer = {
        parentNode: {
          removeChild: vi.fn()
        }
      }
      
      manager['announcer'] = mockAnnouncer as any
      
      manager.destroy()
      
      expect(mockAnnouncer.parentNode.removeChild).toHaveBeenCalledWith(mockAnnouncer)
      expect(mockDocument.removeEventListener).toHaveBeenCalled()
    })
  })
})