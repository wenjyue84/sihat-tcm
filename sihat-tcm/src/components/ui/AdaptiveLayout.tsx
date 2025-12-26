/**
 * Adaptive Layout Component
 * 
 * A layout component that automatically adapts its structure and styling
 * based on platform, device type, and user preferences.
 */

import React from 'react'
import { useUIAdaptations, useResponsive, useDeviceInfo, usePlatformClasses } from '@/hooks/usePlatformOptimizer'
import { cn } from '@/lib/utils'

interface AdaptiveLayoutProps {
  children: React.ReactNode
  
  // Layout configuration
  enableAdaptiveSpacing?: boolean
  enableAdaptiveNavigation?: boolean
  enableAdaptiveTouchTargets?: boolean
  
  // Custom overrides
  forceNavigationStyle?: 'bottom' | 'sidebar' | 'top'
  forceSpacing?: 'compact' | 'normal' | 'comfortable'
  
  // Container options
  maxWidth?: string
  padding?: boolean
  
  // Styling
  className?: string
  containerClassName?: string
  
  // Navigation props
  showNavigation?: boolean
  navigationContent?: React.ReactNode
  
  // Header/Footer
  header?: React.ReactNode
  footer?: React.ReactNode
}

export function AdaptiveLayout({
  children,
  enableAdaptiveSpacing = true,
  enableAdaptiveNavigation = true,
  enableAdaptiveTouchTargets = true,
  forceNavigationStyle,
  forceSpacing,
  maxWidth = '1200px',
  padding = true,
  className,
  containerClassName,
  showNavigation = false,
  navigationContent,
  header,
  footer
}: AdaptiveLayoutProps) {
  const adaptations = useUIAdaptations()
  const responsive = useResponsive()
  const deviceInfo = useDeviceInfo()
  const platformClasses = usePlatformClasses()

  // Determine spacing
  const spacing = forceSpacing || (enableAdaptiveSpacing ? adaptations.spacing : 'normal')
  
  // Determine navigation style
  const navigationStyle = forceNavigationStyle || (enableAdaptiveNavigation ? adaptations.navigationStyle : 'top')
  
  // Generate spacing classes
  const spacingClasses = {
    compact: 'space-y-2 p-2',
    normal: 'space-y-4 p-4',
    comfortable: 'space-y-6 p-6'
  }
  
  // Generate touch target classes
  const touchTargetClasses = enableAdaptiveTouchTargets ? {
    mobile: 'min-h-[48px] min-w-[48px]',
    tablet: 'min-h-[44px] min-w-[44px]',
    desktop: deviceInfo.hasTouch ? 'min-h-[48px] min-w-[48px]' : 'min-h-[32px] min-w-[32px]'
  } : {}

  // Base layout classes
  const layoutClasses = cn(
    'adaptive-layout',
    platformClasses,
    // Spacing
    enableAdaptiveSpacing && spacingClasses[spacing],
    // Touch targets
    enableAdaptiveTouchTargets && touchTargetClasses[deviceInfo.type],
    // Platform-specific adjustments
    {
      // iOS specific
      'ios-safe-area': deviceInfo.platform === 'ios',
      // Android specific
      'android-navigation-bar': deviceInfo.platform === 'android',
      // Touch device adjustments
      'touch-friendly': deviceInfo.hasTouch,
      // High DPI adjustments
      'high-dpi': deviceInfo.pixelRatio >= 2,
    },
    className
  )

  // Container classes
  const containerClasses = cn(
    'adaptive-container mx-auto',
    padding && 'px-4 sm:px-6 lg:px-8',
    containerClassName
  )

  // Navigation wrapper classes
  const navigationClasses = cn(
    'adaptive-navigation',
    {
      'fixed bottom-0 left-0 right-0 z-50': navigationStyle === 'bottom',
      'fixed top-0 left-0 bottom-0 z-50 w-64': navigationStyle === 'sidebar',
      'sticky top-0 z-50': navigationStyle === 'top'
    }
  )

  // Main content classes with navigation adjustments
  const mainClasses = cn(
    'adaptive-main flex-1',
    {
      'pb-16': navigationStyle === 'bottom' && showNavigation,
      'ml-64': navigationStyle === 'sidebar' && showNavigation && responsive.isDesktop,
      'pt-16': navigationStyle === 'top' && showNavigation
    }
  )

  return (
    <div 
      className={layoutClasses}
      style={{ 
        maxWidth,
        // CSS custom properties for adaptive values
        '--touch-target-size': `${adaptations.touchTargetSize}px`,
        '--adaptive-spacing': spacing === 'compact' ? '0.5rem' : spacing === 'comfortable' ? '1.5rem' : '1rem'
      } as React.CSSProperties}
    >
      {/* Header */}
      {header && (
        <header className="adaptive-header">
          <div className={containerClasses}>
            {header}
          </div>
        </header>
      )}

      {/* Navigation */}
      {showNavigation && navigationContent && (
        <nav className={navigationClasses}>
          {navigationContent}
        </nav>
      )}

      {/* Main Content */}
      <main className={mainClasses}>
        <div className={containerClasses}>
          {children}
        </div>
      </main>

      {/* Footer */}
      {footer && (
        <footer className="adaptive-footer">
          <div className={containerClasses}>
            {footer}
          </div>
        </footer>
      )}
    </div>
  )
}

// Specialized layout components

export function MobileFirstLayout({ children, ...props }: Omit<AdaptiveLayoutProps, 'enableAdaptiveNavigation'>) {
  return (
    <AdaptiveLayout
      {...props}
      enableAdaptiveNavigation={true}
      forceNavigationStyle="bottom"
    >
      {children}
    </AdaptiveLayout>
  )
}

export function DesktopFirstLayout({ children, ...props }: Omit<AdaptiveLayoutProps, 'enableAdaptiveNavigation'>) {
  return (
    <AdaptiveLayout
      {...props}
      enableAdaptiveNavigation={true}
      forceNavigationStyle="sidebar"
    >
      {children}
    </AdaptiveLayout>
  )
}

export function CompactLayout({ children, ...props }: Omit<AdaptiveLayoutProps, 'forceSpacing'>) {
  return (
    <AdaptiveLayout
      {...props}
      forceSpacing="compact"
      maxWidth="800px"
    >
      {children}
    </AdaptiveLayout>
  )
}

export function ComfortableLayout({ children, ...props }: Omit<AdaptiveLayoutProps, 'forceSpacing'>) {
  return (
    <AdaptiveLayout
      {...props}
      forceSpacing="comfortable"
      maxWidth="1400px"
    >
      {children}
    </AdaptiveLayout>
  )
}

// Grid layout with adaptive columns
interface AdaptiveGridProps {
  children: React.ReactNode
  minItemWidth?: number
  gap?: number
  className?: string
}

export function AdaptiveGrid({
  children,
  minItemWidth = 250,
  gap = 16,
  className
}: AdaptiveGridProps) {
  const deviceInfo = useDeviceInfo()
  const responsive = useResponsive()

  // Adjust minimum width based on device
  const adjustedMinWidth = deviceInfo.type === 'mobile' 
    ? Math.max(minItemWidth * 0.8, 200)
    : minItemWidth

  return (
    <div
      className={cn(
        'adaptive-grid',
        className
      )}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fit, minmax(${adjustedMinWidth}px, 1fr))`,
        gap: `${gap}px`,
        // Reduce gap on mobile
        ...(deviceInfo.type === 'mobile' && {
          gap: `${gap * 0.75}px`
        })
      }}
    >
      {children}
    </div>
  )
}

// Adaptive card component
interface AdaptiveCardProps {
  children: React.ReactNode
  className?: string
  padding?: boolean
  shadow?: boolean
  border?: boolean
}

export function AdaptiveCard({
  children,
  className,
  padding = true,
  shadow = true,
  border = true
}: AdaptiveCardProps) {
  const adaptations = useUIAdaptations()
  const deviceInfo = useDeviceInfo()

  return (
    <div
      className={cn(
        'adaptive-card rounded-lg',
        // Conditional styling based on platform
        {
          // Padding
          'p-2': padding && adaptations.spacing === 'compact',
          'p-4': padding && adaptations.spacing === 'normal',
          'p-6': padding && adaptations.spacing === 'comfortable',
          
          // Shadow
          'shadow-sm': shadow && deviceInfo.type === 'mobile',
          'shadow-md': shadow && deviceInfo.type === 'tablet',
          'shadow-lg': shadow && deviceInfo.type === 'desktop',
          
          // Border
          'border border-gray-200 dark:border-gray-700': border,
          
          // Background
          'bg-white dark:bg-gray-800': true,
          
          // Touch-friendly on mobile
          'active:scale-[0.98] transition-transform': deviceInfo.hasTouch
        },
        className
      )}
      style={{
        // Ensure minimum touch target size
        minHeight: deviceInfo.hasTouch ? `${adaptations.touchTargetSize}px` : undefined
      }}
    >
      {children}
    </div>
  )
}