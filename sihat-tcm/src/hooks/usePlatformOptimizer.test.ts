/**
 * Platform Optimizer Hooks Tests
 * 
 * Tests for React hooks that integrate with the PlatformOptimizer.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import {
  useDeviceInfo,
  useBreakpoint,
  useCurrentBreakpoint,
  useResponsive,
  usePlatformOptimizations,
  useUIAdaptations,
  usePlatformClasses,
  useMediaQuery,
  useTouch,
  useReducedMotion,
  useDarkMode,
  useOptimizedImageDimensions,
  useResponsiveFontSize,
  useOptimalDebounce,
  useFeatureSupport,
  useOrientation,
  useStandalone,
  usePlatform
} from './usePlatformOptimizer'

// Mock the platform optimizer
vi.mock('@/lib/platformOptimizer', () => ({
  default: {
    getDeviceInfo: vi.fn(() => ({
      type: 'desktop',
      platform: 'web',
      browser: 'chrome',
      hasTouch: false,
      isStandalone: false,
      screenSize: { width: 1024, height: 768 },
      pixelRatio: 1,
      orientation: 'landscape',
      capabilities: {
        webgl: true,
        webrtc: true,
        mediaDevices: true,
        geolocation: true,
        vibration: false,
        notifications: true,
        serviceWorker: true
      }
    })),
    isBreakpoint: vi.fn((bp: string) => bp === 'lg'),
    getCurrentBreakpoint: vi.fn(() => 'lg'),
    onBreakpointChange: vi.fn(() => () => {}),
    getPlatformOptimizations: vi.fn(() => ({
      imageQuality: 'high',
      animationLevel: 'full',
      prefersReducedMotion: false,
      maxConcurrentRequests: 6,
      cacheStrategy: 'moderate',
      lazyLoadingThreshold: 100,
      debounceDelay: 300
    })),
    getUIAdaptations: vi.fn(() => ({
      touchTargetSize: 44,
      fontSize: 'medium',
      spacing: 'normal',
      navigationStyle: 'sidebar',
      modalStyle: 'centered',
      inputStyle: 'custom'
    })),
    getPlatformClasses: vi.fn(() => ['device-desktop', 'platform-web', 'browser-chrome']),
    getOptimizedImageDimensions: vi.fn(() => ({ width: 800, height: 600, quality: 90 })),
    getResponsiveFontSize: vi.fn((size: number) => size),
    getOptimalDebounceDelay: vi.fn(() => 300),
    applyPerformanceOptimizations: vi.fn(),
    cleanup: vi.fn()
  }
}))

// Mock window.matchMedia
const mockMatchMedia = vi.fn()
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia
})

describe('Platform Optimizer Hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default matchMedia mock
    mockMatchMedia.mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    }))
  })

  describe('useDeviceInfo', () => {
    it('should return device information', () => {
      const { result } = renderHook(() => useDeviceInfo())
      
      expect(result.current.type).toBe('desktop')
      expect(result.current.platform).toBe('web')
      expect(result.current.hasTouch).toBe(false)
    })
  })

  describe('useBreakpoint', () => {
    it('should return breakpoint match status', () => {
      const { result } = renderHook(() => useBreakpoint('lg'))
      
      expect(result.current).toBe(true)
    })
  })

  describe('useCurrentBreakpoint', () => {
    it('should return current breakpoint', () => {
      const { result } = renderHook(() => useCurrentBreakpoint())
      
      expect(result.current).toBe('lg')
    })
  })

  describe('useResponsive', () => {
    it('should return responsive utilities', () => {
      const { result } = renderHook(() => useResponsive())
      
      expect(result.current).toHaveProperty('isLg', true)
      expect(result.current).toHaveProperty('currentBreakpoint', 'lg')
      expect(result.current).toHaveProperty('isDesktop', true)
      expect(result.current).toHaveProperty('isMobile', false)
    })
  })

  describe('usePlatformOptimizations', () => {
    it('should return platform optimizations', () => {
      const { result } = renderHook(() => usePlatformOptimizations())
      
      expect(result.current.imageQuality).toBe('high')
      expect(result.current.maxConcurrentRequests).toBe(6)
      expect(result.current.cacheStrategy).toBe('moderate')
    })
  })

  describe('useUIAdaptations', () => {
    it('should return UI adaptations', () => {
      const { result } = renderHook(() => useUIAdaptations())
      
      expect(result.current.navigationStyle).toBe('sidebar')
      expect(result.current.modalStyle).toBe('centered')
      expect(result.current.spacing).toBe('normal')
    })
  })

  describe('usePlatformClasses', () => {
    it('should return platform CSS classes', () => {
      const { result } = renderHook(() => usePlatformClasses())
      
      expect(result.current).toContain('device-desktop')
      expect(result.current).toContain('platform-web')
      expect(result.current).toContain('browser-chrome')
    })
  })

  describe('useMediaQuery', () => {
    it('should return media query match status', () => {
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: query === '(min-width: 768px)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }))
      
      const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
      
      expect(result.current).toBe(true)
    })
  })

  describe('useTouch', () => {
    it('should return touch capabilities', () => {
      const { result } = renderHook(() => useTouch())
      
      expect(result.current).toHaveProperty('hasTouch', false)
      expect(result.current).toHaveProperty('isTouch')
      expect(result.current).toHaveProperty('supportsHover')
    })
  })

  describe('useReducedMotion', () => {
    it('should detect reduced motion preference', () => {
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }))
      
      const { result } = renderHook(() => useReducedMotion())
      
      expect(result.current).toBe(true)
    })
  })

  describe('useDarkMode', () => {
    it('should detect dark mode preference', () => {
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }))
      
      const { result } = renderHook(() => useDarkMode())
      
      expect(result.current).toBe(true)
    })
  })

  describe('useOptimizedImageDimensions', () => {
    it('should return optimized image dimensions', () => {
      const { result } = renderHook(() => useOptimizedImageDimensions(1000, 800))
      
      expect(result.current.width).toBe(800)
      expect(result.current.height).toBe(600)
      expect(result.current.quality).toBe(90)
    })
  })

  describe('useResponsiveFontSize', () => {
    it('should return responsive font size', () => {
      const { result } = renderHook(() => useResponsiveFontSize(16))
      
      expect(result.current).toBe(16)
    })
  })

  describe('useOptimalDebounce', () => {
    it('should return optimal debounce delay', () => {
      const { result } = renderHook(() => useOptimalDebounce('search'))
      
      expect(result.current).toBe(300)
    })
  })

  describe('useFeatureSupport', () => {
    it('should return feature support status', () => {
      const { result } = renderHook(() => useFeatureSupport())
      
      expect(result.current.supportsWebGL).toBe(true)
      expect(result.current.supportsWebRTC).toBe(true)
      expect(result.current.supportsMediaDevices).toBe(true)
      expect(result.current.supportsGeolocation).toBe(true)
      expect(result.current.supportsVibration).toBe(false)
      expect(result.current.supportsNotifications).toBe(true)
      expect(result.current.supportsServiceWorker).toBe(true)
    })
  })

  describe('useOrientation', () => {
    it('should return orientation information', () => {
      const { result } = renderHook(() => useOrientation())
      
      expect(result.current.orientation).toBe('landscape')
      expect(result.current.isLandscape).toBe(true)
      expect(result.current.isPortrait).toBe(false)
    })
  })

  describe('useStandalone', () => {
    it('should return standalone app status', () => {
      const { result } = renderHook(() => useStandalone())
      
      expect(result.current).toBe(false)
    })
  })

  describe('usePlatform', () => {
    it('should return comprehensive platform information', () => {
      const { result } = renderHook(() => usePlatform())
      
      expect(result.current).toHaveProperty('device')
      expect(result.current).toHaveProperty('responsive')
      expect(result.current).toHaveProperty('optimizations')
      expect(result.current).toHaveProperty('adaptations')
      expect(result.current).toHaveProperty('platformClasses')
      expect(result.current).toHaveProperty('touch')
      expect(result.current).toHaveProperty('reducedMotion')
      expect(result.current).toHaveProperty('featureSupport')
      expect(result.current).toHaveProperty('orientation')
      expect(result.current).toHaveProperty('getOptimizedImageDimensions')
      expect(result.current).toHaveProperty('getResponsiveFontSize')
      expect(result.current).toHaveProperty('getOptimalDebounceDelay')
    })

    it('should provide utility functions', () => {
      const { result } = renderHook(() => usePlatform())
      
      expect(typeof result.current.getOptimizedImageDimensions).toBe('function')
      expect(typeof result.current.getResponsiveFontSize).toBe('function')
      expect(typeof result.current.getOptimalDebounceDelay).toBe('function')
    })
  })
})