/**
 * AccessibleModal - WCAG 2.1 AA compliant modal/dialog component
 * 
 * Features:
 * - Focus trapping
 * - Keyboard navigation (Escape to close)
 * - Screen reader announcements
 * - Proper ARIA attributes
 * - Background scroll prevention
 */

'use client'

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { useAccessibilityContext } from '@/contexts/AccessibilityContext'
import { useFocusTrap } from '@/hooks/useAccessibility'
import { X } from 'lucide-react'

export interface AccessibleModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnBackdropClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  className?: string
  overlayClassName?: string
  announceOnOpen?: string
  announceOnClose?: string
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full mx-4'
}

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className,
  overlayClassName,
  announceOnOpen,
  announceOnClose
}: AccessibleModalProps) {
  const { announce } = useAccessibilityContext()
  const modalRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  // Focus trap
  useFocusTrap(modalRef, isOpen)

  // Handle mounting for portal
  useEffect(() => {
    setMounted(true)
  }, [])

  // Handle open/close effects
  useEffect(() => {
    if (isOpen) {
      // Store previously focused element
      previousActiveElement.current = document.activeElement as HTMLElement

      // Prevent background scroll
      document.body.style.overflow = 'hidden'

      // Announce modal opening
      if (announceOnOpen) {
        announce(announceOnOpen, 'assertive', 100)
      } else {
        announce(`Dialog opened: ${title}`, 'assertive', 100)
      }
    } else {
      // Restore background scroll
      document.body.style.overflow = ''

      // Restore focus
      if (previousActiveElement.current) {
        previousActiveElement.current.focus()
      }

      // Announce modal closing
      if (announceOnClose) {
        announce(announceOnClose, 'polite')
      } else {
        announce('Dialog closed', 'polite')
      }
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, title, announceOnOpen, announceOnClose, announce])

  // Handle keyboard events
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeOnEscape, onClose])

  // Handle backdrop click
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (closeOnBackdropClick && event.target === event.currentTarget) {
      onClose()
    }
  }

  if (!mounted || !isOpen) {
    return null
  }

  const modal = (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4",
        "bg-black/50 backdrop-blur-sm",
        overlayClassName
      )}
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? "modal-description" : undefined}
        data-closeable="true"
        className={cn(
          "relative w-full bg-white dark:bg-gray-900 rounded-lg shadow-xl",
          "max-h-[90vh] overflow-y-auto",
          "focus:outline-none",
          sizeClasses[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2
              id="modal-title"
              className="text-lg font-semibold text-gray-900 dark:text-gray-100"
            >
              {title}
            </h2>
            {description && (
              <p
                id="modal-description"
                className="mt-1 text-sm text-gray-600 dark:text-gray-400"
              >
                {description}
              </p>
            )}
          </div>

          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              data-close-button="true"
              className={cn(
                "rounded-md p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200",
                "hover:bg-gray-100 dark:hover:bg-gray-800",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              )}
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

/**
 * Modal Footer component for consistent button layout
 */
export function ModalFooter({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 px-6 py-4",
        "border-t border-gray-200 dark:border-gray-700",
        "bg-gray-50 dark:bg-gray-800/50",
        className
      )}
    >
      {children}
    </div>
  )
}

/**
 * Confirmation Modal with accessible patterns
 */
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default'
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'destructive'
}) {
  const { announce } = useAccessibilityContext()

  const handleConfirm = () => {
    announce(`Action confirmed: ${title}`, 'assertive')
    onConfirm()
    onClose()
  }

  const handleCancel = () => {
    announce('Action cancelled', 'polite')
    onClose()
  }

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={handleCancel}
      title={title}
      size="sm"
      announceOnOpen={`Confirmation required: ${title}`}
    >
      <div className="space-y-4">
        <p className="text-gray-700 dark:text-gray-300">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={handleCancel}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md",
              "border border-gray-300 dark:border-gray-600",
              "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300",
              "hover:bg-gray-50 dark:hover:bg-gray-700",
              "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            )}
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md",
              "focus:outline-none focus:ring-2 focus:ring-offset-2",
              variant === 'destructive'
                ? "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
                : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
            )}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </AccessibleModal>
  )
}