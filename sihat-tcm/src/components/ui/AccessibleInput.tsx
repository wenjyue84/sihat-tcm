/**
 * AccessibleInput - WCAG 2.1 AA compliant input component
 * 
 * Features:
 * - Proper labeling and descriptions
 * - Error state management
 * - Screen reader support
 * - Keyboard navigation
 * - Validation feedback
 */

'use client'

import React, { forwardRef, useId } from 'react'
import { cn } from '@/lib/utils'
import { useAccessibilityContext } from '@/contexts/AccessibilityContext'
import { AlertCircle, CheckCircle } from 'lucide-react'

export interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  description?: string
  error?: string
  success?: string
  showValidation?: boolean
  focusGroup?: string
  announceChanges?: boolean
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({
    className,
    type = 'text',
    label,
    description,
    error,
    success,
    showValidation = true,
    focusGroup,
    announceChanges = false,
    id,
    onChange,
    onFocus,
    onBlur,
    ...props
  }, ref) => {
    const { announce } = useAccessibilityContext()
    const generatedId = useId()
    const inputId = id || generatedId
    const descriptionId = description ? `${inputId}-description` : undefined
    const errorId = error ? `${inputId}-error` : undefined
    const successId = success ? `${inputId}-success` : undefined

    const hasError = Boolean(error)
    const hasSuccess = Boolean(success) && !hasError
    const isInvalid = hasError

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (announceChanges) {
        const value = event.target.value
        announce(`Input value changed to: ${value}`, 'polite')
      }

      onChange?.(event)
    }

    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      if (description) {
        announce(description, 'polite')
      }

      onFocus?.(event)
    }

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      if (error && showValidation) {
        announce(`Error: ${error}`, 'assertive')
      } else if (success && showValidation) {
        announce(`Success: ${success}`, 'polite')
      }

      onBlur?.(event)
    }

    // Build aria-describedby
    const describedBy = [descriptionId, errorId, successId].filter(Boolean).join(' ') || undefined

    return (
      <div className="space-y-2">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {props.required && (
              <span className="text-red-500 ml-1" aria-label="required">
                *
              </span>
            )}
          </label>
        )}

        {/* Description */}
        {description && (
          <p
            id={descriptionId}
            className="text-sm text-gray-600 dark:text-gray-400"
          >
            {description}
          </p>
        )}

        {/* Input Container */}
        <div className="relative">
          <input
            ref={ref}
            type={type}
            id={inputId}
            className={cn(
              "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
              "ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium",
              "placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
              hasError && "border-red-500 focus-visible:ring-red-500",
              hasSuccess && "border-green-500 focus-visible:ring-green-500",
              className
            )}
            aria-invalid={isInvalid}
            aria-describedby={describedBy}
            data-focus-group={focusGroup}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            {...props}
          />

          {/* Validation Icons */}
          {showValidation && (hasError || hasSuccess) && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              {hasError && (
                <AlertCircle
                  className="h-5 w-5 text-red-500"
                  aria-hidden="true"
                />
              )}
              {hasSuccess && (
                <CheckCircle
                  className="h-5 w-5 text-green-500"
                  aria-hidden="true"
                />
              )}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && showValidation && (
          <p
            id={errorId}
            className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        {/* Success Message */}
        {success && showValidation && !error && (
          <p
            id={successId}
            className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1"
            role="status"
            aria-live="polite"
          >
            <CheckCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
            {success}
          </p>
        )}
      </div>
    )
  }
)

AccessibleInput.displayName = 'AccessibleInput'