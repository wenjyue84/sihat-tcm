/**
 * VoiceInput - Voice-to-text input component
 * 
 * This component provides:
 * - Voice dictation for text input
 * - Visual feedback for voice recording
 * - Integration with form inputs
 * - Accessibility features
 * - Multi-language support
 */

'use client'

import React, { useState, useEffect, useRef, forwardRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useVoiceDictation } from '@/hooks/useVoiceCommand'
import { useLanguage } from '@/stores/useAppStore'
import { useAccessibilityContext } from '@/stores/useAppStore'
import { Mic, MicOff, Square, Play, Pause } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface VoiceInputProps {
  value?: string
  onChange?: (value: string) => void
  onVoiceStart?: () => void
  onVoiceStop?: () => void
  onVoiceResult?: (text: string) => void
  placeholder?: string
  disabled?: boolean
  multiline?: boolean
  rows?: number
  className?: string
  showVoiceButton?: boolean
  autoStart?: boolean
  clearOnStart?: boolean
  appendMode?: boolean
  language?: string
  'aria-label'?: string
  'aria-describedby'?: string
}

export const VoiceInput = forwardRef<HTMLInputElement | HTMLTextAreaElement, VoiceInputProps>(
  ({
    value = '',
    onChange,
    onVoiceStart,
    onVoiceStop,
    onVoiceResult,
    placeholder,
    disabled = false,
    multiline = false,
    rows = 3,
    className,
    showVoiceButton = true,
    autoStart = false,
    clearOnStart = false,
    appendMode = true,
    language,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedby,
    ...props
  }, ref) => {
    const { t } = useLanguage()
    const { announce } = useAccessibilityContext()
    const [inputValue, setInputValue] = useState(value)
    const [isRecording, setIsRecording] = useState(false)
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

    // Voice dictation hook
    const dictation = useVoiceDictation({
      language: language || t.language,
      enabled: !disabled,
      onResult: (text) => {
        const newValue = appendMode ? `${inputValue} ${text}`.trim() : text
        setInputValue(newValue)
        onChange?.(newValue)
        onVoiceResult?.(text)
      },
      onError: (error) => {
        console.error('Voice input error:', error)
        announce('Voice input error occurred', 'assertive')
      }
    })

    // Sync with external value changes
    useEffect(() => {
      setInputValue(value)
    }, [value])

    // Auto-start if enabled
    useEffect(() => {
      if (autoStart && dictation.isSupported && !disabled) {
        handleStartVoice()
      }
    }, [autoStart, dictation.isSupported, disabled])

    // Handle input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const newValue = e.target.value
      setInputValue(newValue)
      onChange?.(newValue)
    }

    // Start voice recording
    const handleStartVoice = () => {
      if (disabled || !dictation.isSupported) return

      if (clearOnStart) {
        setInputValue('')
        onChange?.('')
      }

      setIsRecording(true)
      dictation.start()
      onVoiceStart?.()
      announce('Voice input started. Speak now.', 'assertive')
    }

    // Stop voice recording
    const handleStopVoice = () => {
      setIsRecording(false)
      dictation.stop()
      onVoiceStop?.()
      announce('Voice input stopped.', 'polite')
    }

    // Toggle voice recording
    const handleToggleVoice = () => {
      if (isRecording || dictation.isActive) {
        handleStopVoice()
      } else {
        handleStartVoice()
      }
    }

    // Clear input
    const handleClear = () => {
      setInputValue('')
      onChange?.('')
      dictation.clear()
      announce('Input cleared', 'polite')
    }

    // Get voice button icon and state
    const getVoiceButtonState = () => {
      if (!dictation.isSupported) {
        return {
          icon: MicOff,
          variant: 'ghost' as const,
          disabled: true,
          title: 'Voice input not supported'
        }
      }

      if (isRecording || dictation.isActive) {
        return {
          icon: dictation.isListening ? Square : Pause,
          variant: 'destructive' as const,
          disabled: false,
          title: 'Stop voice input'
        }
      }

      return {
        icon: Mic,
        variant: 'outline' as const,
        disabled: disabled,
        title: 'Start voice input'
      }
    }

    const voiceButtonState = getVoiceButtonState()
    const VoiceIcon = voiceButtonState.icon

    // Render input component
    const renderInput = () => {
      const commonProps = {
        value: inputValue,
        onChange: handleInputChange,
        placeholder: placeholder || (multiline ? 'Type or speak your message...' : 'Type or speak...'),
        disabled,
        className: cn(
          'pr-12', // Space for voice button
          isRecording && 'ring-2 ring-red-500 ring-opacity-50',
          className
        ),
        'aria-label': ariaLabel,
        'aria-describedby': ariaDescribedby,
        ...props
      }

      if (multiline) {
        return (
          <Textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            rows={rows}
            {...commonProps}
          />
        )
      }

      return (
        <Input
          ref={ref as React.Ref<HTMLInputElement>}
          {...commonProps}
        />
      )
    }

    return (
      <div className="relative">
        {renderInput()}
        
        {/* Voice Controls */}
        {showVoiceButton && (
          <div className="absolute right-1 top-1 flex items-center gap-1">
            {/* Voice Recording Indicator */}
            {(isRecording || dictation.isActive) && (
              <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded-md text-xs">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span>Recording</span>
              </div>
            )}

            {/* Voice Button */}
            <Button
              type="button"
              size="sm"
              variant={voiceButtonState.variant}
              disabled={voiceButtonState.disabled}
              onClick={handleToggleVoice}
              title={voiceButtonState.title}
              className={cn(
                'h-8 w-8 p-0',
                isRecording && 'bg-red-500 hover:bg-red-600 text-white'
              )}
              aria-label={voiceButtonState.title}
            >
              <VoiceIcon className="h-4 w-4" />
            </Button>

            {/* Clear Button (when there's content) */}
            {inputValue && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleClear}
                title="Clear input"
                className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600"
                aria-label="Clear input"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            )}
          </div>
        )}

        {/* Voice Status */}
        {dictation.error && (
          <div className="mt-1 text-sm text-red-600" role="alert">
            Voice input error: {dictation.error}
          </div>
        )}

        {/* Voice Instructions */}
        {(isRecording || dictation.isActive) && (
          <div className="mt-1 text-sm text-gray-600" aria-live="polite">
            {dictation.isListening ? 'Listening... Speak now.' : 'Processing speech...'}
          </div>
        )}

        {/* Accessibility announcements */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {isRecording && 'Voice recording active'}
          {dictation.text && `Dictated text: ${dictation.text}`}
        </div>
      </div>
    )
  }
)

VoiceInput.displayName = 'VoiceInput'

/**
 * Voice-enabled textarea component
 */
export function VoiceTextarea(props: Omit<VoiceInputProps, 'multiline'>) {
  return <VoiceInput {...props} multiline={true} />
}

/**
 * Simple voice button component for existing inputs
 */
export function VoiceButton({
  onResult,
  disabled = false,
  language,
  className,
  size = 'sm',
  variant = 'outline'
}: {
  onResult?: (text: string) => void
  disabled?: boolean
  language?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'outline' | 'ghost' | 'default'
}) {
  const { announce } = useAccessibilityContext()
  const [isRecording, setIsRecording] = useState(false)

  const dictation = useVoiceDictation({
    language,
    enabled: !disabled,
    onResult: (text) => {
      onResult?.(text)
      setIsRecording(false)
    },
    onError: (error) => {
      console.error('Voice button error:', error)
      announce('Voice input error', 'assertive')
      setIsRecording(false)
    }
  })

  const handleToggle = () => {
    if (isRecording || dictation.isActive) {
      dictation.stop()
      setIsRecording(false)
      announce('Voice input stopped', 'polite')
    } else {
      dictation.start()
      setIsRecording(true)
      announce('Voice input started', 'assertive')
    }
  }

  if (!dictation.isSupported) {
    return null
  }

  return (
    <Button
      type="button"
      size={size}
      variant={isRecording ? 'destructive' : variant}
      disabled={disabled}
      onClick={handleToggle}
      className={cn(
        isRecording && 'animate-pulse',
        className
      )}
      aria-label={isRecording ? 'Stop voice input' : 'Start voice input'}
    >
      {isRecording ? (
        <Square className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
      {isRecording && (
        <span className="ml-2 text-xs">Recording...</span>
      )}
    </Button>
  )
}

/**
 * Voice command status indicator
 */
export function VoiceStatus({
  isListening,
  isSupported,
  error,
  className
}: {
  isListening?: boolean
  isSupported?: boolean
  error?: string | null
  className?: string
}) {
  if (!isSupported) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-gray-500', className)}>
        <MicOff className="h-4 w-4" />
        <span>Voice not supported</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-red-600', className)} role="alert">
        <MicOff className="h-4 w-4" />
        <span>Voice error: {error}</span>
      </div>
    )
  }

  if (isListening) {
    return (
      <div className={cn('flex items-center gap-2 text-sm text-green-600', className)}>
        <div className="w-4 h-4 relative">
          <Mic className="h-4 w-4" />
          <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-25" />
        </div>
        <span>Listening...</span>
      </div>
    )
  }

  return (
    <div className={cn('flex items-center gap-2 text-sm text-gray-600', className)}>
      <Mic className="h-4 w-4" />
      <span>Voice ready</span>
    </div>
  )
}