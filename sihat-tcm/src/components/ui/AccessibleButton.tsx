/**
 * AccessibleButton - WCAG 2.1 AA compliant button component
 * 
 * Features:
 * - Proper ARIA attributes
 * - Keyboard navigation support
 * - Screen reader announcements
 * - Focus management
 * - Loading and disabled states
 */

'use client'

import React, { forwardRef, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useAccessibilityContext } from '@/stores/useAppStore'
import { Loader2 } from 'lucide-react'

export interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  loading?: boolean
  loadingText?: string
  announceOnClick?: string
  announceOnFocus?: string
  focusGroup?: string
  asChild?: boolean
}

const buttonVariants = {
  variant: {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
  },
  size: {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  },
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({
    className,
    variant = 'default',
    size = 'default',
    loading = false,
    loadingText = 'Loading...',
    announceOnClick,
    announceOnFocus,
    focusGroup,
    disabled,
    children,
    onClick,
    onFocus,
    ...props
  }, ref) => {
    const { announce, manager } = useAccessibilityContext()
    const buttonRef = useRef<HTMLButtonElement>(null)
    const combinedRef = (ref as React.RefObject<HTMLButtonElement>) || buttonRef

    // Register with focus group
    useEffect(() => {
      if (focusGroup && manager && combinedRef.current) {
        manager.registerFocusGroup(focusGroup, [combinedRef.current])
      }
    }, [focusGroup, manager])

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) {
        event.preventDefault()
        return
      }

      if (announceOnClick) {
        announce(announceOnClick, 'polite')
      }

      onClick?.(event)
    }

    const handleFocus = (event: React.FocusEvent<HTMLButtonElement>) => {
      if (announceOnFocus) {
        announce(announceOnFocus, 'polite')
      }

      onFocus?.(event)
    }

    const isDisabled = disabled || loading

    return (
      <button
        ref={combinedRef}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          "aria-disabled:pointer-events-none aria-disabled:opacity-50",
          buttonVariants.variant[variant],
          buttonVariants.size[size],
          className
        )}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        aria-describedby={loading ? `${props.id}-loading` : undefined}
        data-focus-group={focusGroup}
        data-activatable="true"
        role="button"
        onClick={handleClick}
        onFocus={handleFocus}
        {...props}
      >
        {loading && (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            <span className="sr-only">{loadingText}</span>
          </>
        )}
        {children}
        {loading && (
          <span id={`${props.id}-loading`} className="sr-only">
            {loadingText}
          </span>
        )}
      </button>
    )
  }
)

AccessibleButton.displayName = 'AccessibleButton'