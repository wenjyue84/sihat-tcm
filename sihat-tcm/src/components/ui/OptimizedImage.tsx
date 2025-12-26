/**
 * Optimized Image Component
 * 
 * A platform-aware image component that automatically optimizes
 * image loading, dimensions, and quality based on device capabilities.
 */

import React, { useState, useCallback, useMemo } from 'react'
import Image, { type ImageProps } from 'next/image'
import { useOptimizedImageDimensions, usePlatformOptimizations, useDeviceInfo } from '@/hooks/usePlatformOptimizer'
import { cn } from '@/lib/utils'

interface OptimizedImageProps extends Omit<ImageProps, 'width' | 'height' | 'onError'> {
  // Original dimensions
  originalWidth: number
  originalHeight: number
  
  // Platform optimization options
  enableOptimization?: boolean
  forceHighQuality?: boolean
  adaptiveLoading?: boolean
  
  // Responsive behavior
  maxWidth?: number
  maxHeight?: number
  maintainAspectRatio?: boolean
  
  // Loading states
  showLoadingPlaceholder?: boolean
  loadingClassName?: string
  errorClassName?: string
  
  // Performance options
  priority?: boolean
  preload?: boolean
  
  // Callbacks
  onLoadStart?: () => void
  onLoadComplete?: () => void
  onError?: (error: Error) => void
}

export function OptimizedImage({
  originalWidth,
  originalHeight,
  enableOptimization = true,
  forceHighQuality = false,
  adaptiveLoading = true,
  maxWidth,
  maxHeight,
  maintainAspectRatio = true,
  showLoadingPlaceholder = true,
  loadingClassName,
  errorClassName,
  priority = false,
  preload = false,
  onLoadStart,
  onLoadComplete,
  onError,
  className,
  alt,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [loadStartTime, setLoadStartTime] = useState<number | null>(null)

  const deviceInfo = useDeviceInfo()
  const optimizations = usePlatformOptimizations()
  
  // Calculate optimized dimensions
  const optimizedDimensions = useOptimizedImageDimensions(originalWidth, originalHeight)
  
  // Apply constraints if provided
  const finalDimensions = useMemo(() => {
    let { width, height, quality } = optimizedDimensions
    
    // Apply maximum constraints
    if (maxWidth && width > maxWidth) {
      if (maintainAspectRatio) {
        height = (height * maxWidth) / width
      }
      width = maxWidth
    }
    
    if (maxHeight && height > maxHeight) {
      if (maintainAspectRatio) {
        width = (width * maxHeight) / height
      }
      height = maxHeight
    }
    
    // Override quality if forced
    if (forceHighQuality) {
      quality = 0.95
    } else if (optimizations.imageQuality === 'low') {
      quality = Math.min(quality, 0.7)
    } else if (optimizations.imageQuality === 'medium') {
      quality = Math.min(quality, 0.85)
    }
    
    return {
      width: Math.round(width),
      height: Math.round(height),
      quality: Math.round(quality * 100)
    }
  }, [optimizedDimensions, maxWidth, maxHeight, maintainAspectRatio, forceHighQuality, optimizations.imageQuality])

  // Determine loading strategy
  const loadingStrategy = useMemo(() => {
    if (!adaptiveLoading) return 'lazy'
    
    // Use eager loading for above-the-fold content on fast devices
    if (priority || preload) return 'eager'
    
    // Use lazy loading for mobile devices to save bandwidth
    if (deviceInfo.type === 'mobile') return 'lazy'
    
    return 'lazy'
  }, [adaptiveLoading, priority, preload, deviceInfo.type])

  // Handle load start
  const handleLoadStart = useCallback(() => {
    setLoadStartTime(Date.now())
    setIsLoading(true)
    setHasError(false)
    onLoadStart?.()
  }, [onLoadStart])

  // Handle successful load
  const handleLoad = useCallback(() => {
    setIsLoading(false)
    
    // Log performance metrics for optimization
    if (loadStartTime) {
      const loadTime = Date.now() - loadStartTime
      console.debug(`Image loaded in ${loadTime}ms`, {
        dimensions: finalDimensions,
        deviceType: deviceInfo.type,
        quality: finalDimensions.quality
      })
    }
    
    onLoadComplete?.()
  }, [loadStartTime, finalDimensions, deviceInfo.type, onLoadComplete])

  // Handle load error
  const handleError = useCallback(() => {
    setIsLoading(false)
    setHasError(true)
    
    const error = new Error(`Failed to load image: ${props.src}`)
    onError?.(error)
  }, [props.src, onError])

  // Generate srcSet for responsive images
  const generateSrcSet = useCallback(() => {
    if (!enableOptimization || typeof props.src !== 'string') return undefined
    
    const baseSrc = props.src
    const sizes = [1, 1.5, 2, 3] // Different pixel ratios
    
    return sizes
      .map(ratio => {
        const scaledWidth = Math.round(finalDimensions.width * ratio)
        const scaledHeight = Math.round(finalDimensions.height * ratio)
        
        // For Next.js Image component, we rely on its built-in optimization
        return `${baseSrc}?w=${scaledWidth}&q=${finalDimensions.quality} ${ratio}x`
      })
      .join(', ')
  }, [enableOptimization, props.src, finalDimensions])

  // Generate sizes attribute for responsive behavior
  const generateSizes = useCallback(() => {
    if (!adaptiveLoading) return undefined
    
    // Responsive sizes based on breakpoints
    const sizes = [
      '(max-width: 640px) 100vw',
      '(max-width: 768px) 50vw',
      '(max-width: 1024px) 33vw',
      '25vw'
    ]
    
    return sizes.join(', ')
  }, [adaptiveLoading])

  // Loading placeholder
  const LoadingPlaceholder = () => (
    <div
      className={cn(
        'animate-pulse bg-gray-200 dark:bg-gray-700 rounded',
        loadingClassName
      )}
      style={{
        width: finalDimensions.width,
        height: finalDimensions.height
      }}
    />
  )

  // Error placeholder
  const ErrorPlaceholder = () => (
    <div
      className={cn(
        'flex items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 rounded border-2 border-dashed border-gray-300 dark:border-gray-600',
        errorClassName
      )}
      style={{
        width: finalDimensions.width,
        height: finalDimensions.height
      }}
    >
      <span className="text-sm">Failed to load image</span>
    </div>
  )

  // Show error state
  if (hasError) {
    return <ErrorPlaceholder />
  }

  return (
    <div className="relative">
      {/* Loading placeholder */}
      {isLoading && showLoadingPlaceholder && (
        <div className="absolute inset-0 z-10">
          <LoadingPlaceholder />
        </div>
      )}
      
      {/* Optimized image */}
      <Image
        {...props}
        width={finalDimensions.width}
        height={finalDimensions.height}
        quality={finalDimensions.quality}
        loading={loadingStrategy}
        priority={priority}
        sizes={generateSizes()}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        onLoadingComplete={handleLoad}
        onError={handleError}
        onLoad={handleLoadStart}
        // Add platform-specific optimizations
        style={{
          ...props.style,
          // Improve rendering performance on mobile
          ...(deviceInfo.type === 'mobile' && {
            imageRendering: optimizations.imageQuality === 'low' ? 'pixelated' : 'auto'
          })
        }}
      />
    </div>
  )
}

// Specialized components for common use cases

export function AvatarImage({
  size = 40,
  ...props
}: Omit<OptimizedImageProps, 'originalWidth' | 'originalHeight'> & {
  size?: number
}) {
  return (
    <OptimizedImage
      {...props}
      originalWidth={size}
      originalHeight={size}
      className={cn('rounded-full', props.className)}
      maxWidth={size * 3} // Allow up to 3x for high DPI
      maxHeight={size * 3}
    />
  )
}

export function HeroImage({
  ...props
}: OptimizedImageProps) {
  return (
    <OptimizedImage
      {...props}
      priority={true}
      forceHighQuality={true}
      adaptiveLoading={true}
      className={cn('w-full h-auto', props.className)}
    />
  )
}

export function ThumbnailImage({
  size = 150,
  ...props
}: Omit<OptimizedImageProps, 'originalWidth' | 'originalHeight'> & {
  size?: number
}) {
  return (
    <OptimizedImage
      {...props}
      originalWidth={size}
      originalHeight={size}
      enableOptimization={true}
      adaptiveLoading={true}
      className={cn('rounded-lg', props.className)}
    />
  )
}

export function MedicalImage({
  ...props
}: OptimizedImageProps) {
  return (
    <OptimizedImage
      {...props}
      forceHighQuality={true}
      enableOptimization={false} // Preserve medical image quality
      className={cn('border border-gray-200 dark:border-gray-700 rounded-lg', props.className)}
    />
  )
}