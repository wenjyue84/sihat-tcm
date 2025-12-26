/**
 * Responsive Wrapper Component
 * 
 * A utility component that provides conditional rendering based on
 * platform, device type, breakpoints, and other responsive criteria.
 */

import React from 'react'
import { useResponsive, useDeviceInfo, usePlatformClasses } from '@/hooks/usePlatformOptimizer'
import type { DeviceInfo, ResponsiveBreakpoints } from '@/lib/platformOptimizer'
import { cn } from '@/lib/utils'

interface ResponsiveWrapperProps {
  children: React.ReactNode
  
  // Breakpoint conditions
  showOn?: (keyof ResponsiveBreakpoints)[]
  hideOn?: (keyof ResponsiveBreakpoints)[]
  
  // Device type conditions
  showOnDevice?: DeviceInfo['type'][]
  hideOnDevice?: DeviceInfo['type'][]
  
  // Platform conditions
  showOnPlatform?: DeviceInfo['platform'][]
  hideOnPlatform?: DeviceInfo['platform'][]
  
  // Feature conditions
  requiresTouch?: boolean
  requiresHover?: boolean
  requiresFeatures?: (keyof DeviceInfo['capabilities'])[]
  
  // Orientation conditions
  showOnOrientation?: DeviceInfo['orientation'][]
  
  // Custom condition function
  when?: (deviceInfo: DeviceInfo) => boolean
  
  // Styling
  className?: string
  as?: React.ElementType
  
  // Fallback content when conditions don't match
  fallback?: React.ReactNode
}

export function ResponsiveWrapper({
  children,
  showOn,
  hideOn,
  showOnDevice,
  hideOnDevice,
  showOnPlatform,
  hideOnPlatform,
  requiresTouch,
  requiresHover,
  requiresFeatures,
  showOnOrientation,
  when,
  className,
  as: Component = 'div',
  fallback = null
}: ResponsiveWrapperProps) {
  const responsive = useResponsive()
  const deviceInfo = useDeviceInfo()
  const platformClasses = usePlatformClasses()

  // Check breakpoint conditions
  if (showOn && !showOn.some(bp => responsive[`is${bp.charAt(0).toUpperCase() + bp.slice(1)}` as keyof typeof responsive])) {
    return <>{fallback}</>
  }
  
  if (hideOn && hideOn.some(bp => responsive[`is${bp.charAt(0).toUpperCase() + bp.slice(1)}` as keyof typeof responsive])) {
    return <>{fallback}</>
  }

  // Check device type conditions
  if (showOnDevice && !showOnDevice.includes(deviceInfo.type)) {
    return <>{fallback}</>
  }
  
  if (hideOnDevice && hideOnDevice.includes(deviceInfo.type)) {
    return <>{fallback}</>
  }

  // Check platform conditions
  if (showOnPlatform && !showOnPlatform.includes(deviceInfo.platform)) {
    return <>{fallback}</>
  }
  
  if (hideOnPlatform && hideOnPlatform.includes(deviceInfo.platform)) {
    return <>{fallback}</>
  }

  // Check touch/hover requirements
  if (requiresTouch !== undefined && deviceInfo.hasTouch !== requiresTouch) {
    return <>{fallback}</>
  }

  // Check feature requirements
  if (requiresFeatures && !requiresFeatures.every(feature => deviceInfo.capabilities[feature])) {
    return <>{fallback}</>
  }

  // Check orientation conditions
  if (showOnOrientation && !showOnOrientation.includes(deviceInfo.orientation)) {
    return <>{fallback}</>
  }

  // Check custom condition
  if (when && !when(deviceInfo)) {
    return <>{fallback}</>
  }

  // All conditions passed, render children
  return (
    <Component className={cn(platformClasses, className)}>
      {children}
    </Component>
  )
}

// Convenience components for common use cases

export function MobileOnly({ children, fallback, className }: {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}) {
  return (
    <ResponsiveWrapper
      showOnDevice={['mobile']}
      fallback={fallback}
      className={className}
    >
      {children}
    </ResponsiveWrapper>
  )
}

export function TabletOnly({ children, fallback, className }: {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}) {
  return (
    <ResponsiveWrapper
      showOnDevice={['tablet']}
      fallback={fallback}
      className={className}
    >
      {children}
    </ResponsiveWrapper>
  )
}

export function DesktopOnly({ children, fallback, className }: {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}) {
  return (
    <ResponsiveWrapper
      showOnDevice={['desktop']}
      fallback={fallback}
      className={className}
    >
      {children}
    </ResponsiveWrapper>
  )
}

export function TouchOnly({ children, fallback, className }: {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}) {
  return (
    <ResponsiveWrapper
      requiresTouch={true}
      fallback={fallback}
      className={className}
    >
      {children}
    </ResponsiveWrapper>
  )
}

export function NonTouchOnly({ children, fallback, className }: {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}) {
  return (
    <ResponsiveWrapper
      requiresTouch={false}
      fallback={fallback}
      className={className}
    >
      {children}
    </ResponsiveWrapper>
  )
}

export function IOSOnly({ children, fallback, className }: {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}) {
  return (
    <ResponsiveWrapper
      showOnPlatform={['ios']}
      fallback={fallback}
      className={className}
    >
      {children}
    </ResponsiveWrapper>
  )
}

export function AndroidOnly({ children, fallback, className }: {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}) {
  return (
    <ResponsiveWrapper
      showOnPlatform={['android']}
      fallback={fallback}
      className={className}
    >
      {children}
    </ResponsiveWrapper>
  )
}

export function WebOnly({ children, fallback, className }: {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}) {
  return (
    <ResponsiveWrapper
      showOnPlatform={['web']}
      fallback={fallback}
      className={className}
    >
      {children}
    </ResponsiveWrapper>
  )
}

export function PortraitOnly({ children, fallback, className }: {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}) {
  return (
    <ResponsiveWrapper
      showOnOrientation={['portrait']}
      fallback={fallback}
      className={className}
    >
      {children}
    </ResponsiveWrapper>
  )
}

export function LandscapeOnly({ children, fallback, className }: {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}) {
  return (
    <ResponsiveWrapper
      showOnOrientation={['landscape']}
      fallback={fallback}
      className={className}
    >
      {children}
    </ResponsiveWrapper>
  )
}

// Higher-order component for platform-aware components
export function withPlatformOptimization<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function PlatformOptimizedComponent(props: P) {
    const platformClasses = usePlatformClasses()
    
    return (
      <div className={cn(platformClasses)}>
        <WrappedComponent {...props} />
      </div>
    )
  }
}