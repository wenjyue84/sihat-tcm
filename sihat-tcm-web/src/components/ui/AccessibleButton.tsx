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

"use client";

import React, { forwardRef, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useAccessibilityContext } from "@/stores/useAppStore";
import { Loader2 } from "lucide-react";

export interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  loading?: boolean;
  loadingText?: string;
  announceOnClick?: string;
  announceOnFocus?: string;
  focusGroup?: string;
  asChild?: boolean;
}

const buttonVariants = {
  variant: {
    default: "bg-primary text-primary-foreground hover:brightness-105 shadow-depth-1",
    destructive: "bg-destructive text-destructive-foreground hover:brightness-105 shadow-depth-1",
    outline:
      "border border-border bg-background hover:bg-accent hover:text-accent-foreground shadow-depth-1",
    secondary: "bg-secondary text-secondary-foreground hover:brightness-105 shadow-depth-1",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-primary underline-offset-4 hover:underline",
  },
  size: {
    default: "h-11 px-4 py-2 min-h-[44px]",
    sm: "h-9 rounded-[10px] px-3 min-h-[36px]",
    lg: "h-12 rounded-[10px] px-8 min-h-[48px]",
    icon: "h-11 w-11 min-w-[44px] min-h-[44px]",
  },
};

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      loading = false,
      loadingText = "Loading...",
      announceOnClick,
      announceOnFocus,
      focusGroup,
      disabled,
      children,
      onClick,
      onFocus,
      ...props
    },
    ref
  ) => {
    const { announce, manager } = useAccessibilityContext();
    const buttonRef = useRef<HTMLButtonElement>(null);
    const combinedRef = (ref as React.RefObject<HTMLButtonElement>) || buttonRef;

    // Register with focus group
    useEffect(() => {
      if (focusGroup && manager && combinedRef.current) {
        manager.registerFocusGroup(focusGroup, [combinedRef.current]);
      }
    }, [focusGroup, manager]);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) {
        event.preventDefault();
        return;
      }

      if (announceOnClick) {
        announce(announceOnClick, "polite");
      }

      onClick?.(event);
    };

    const handleFocus = (event: React.FocusEvent<HTMLButtonElement>) => {
      if (announceOnFocus) {
        announce(announceOnFocus, "polite");
      }

      onFocus?.(event);
    };

    const isDisabled = disabled || loading;

    return (
      <button
        ref={combinedRef}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-medium transition-apple-fast",
          "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/20 focus-visible:ring-offset-0",
          "disabled:pointer-events-none disabled:opacity-50",
          "aria-disabled:pointer-events-none aria-disabled:opacity-50",
          "active:scale-[0.97] active:opacity-80",
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
    );
  }
);

AccessibleButton.displayName = "AccessibleButton";
