/**
 * Image Quality Overlay Component
 * 
 * Provides real-time visual feedback for image quality during capture
 */

import React from 'react'
import { AlertTriangle, CheckCircle, Camera, Lightbulb, Focus, Move } from 'lucide-react'
import { ImageQualityResult, QualityIssue } from '@/lib/imageQualityValidator'
import { useLanguage } from '@/contexts/LanguageContext'

interface ImageQualityOverlayProps {
  qualityResult: ImageQualityResult | null
  isVisible: boolean
  mode: 'tongue' | 'face' | 'body'
  className?: string
}

export function ImageQualityOverlay({ 
  qualityResult, 
  isVisible, 
  mode, 
  className = '' 
}: ImageQualityOverlayProps) {
  const { t } = useLanguage()

  if (!isVisible || !qualityResult) {
    return null
  }

  const getQualityColor = (overall: string) => {
    switch (overall) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200'
      case 'good': return 'text-emerald-600 bg-emerald-50 border-emerald-200'
      case 'fair': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'poor': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getQualityIcon = (overall: string) => {
    switch (overall) {
      case 'excellent':
      case 'good':
        return <CheckCircle className="w-4 h-4" />
      case 'fair':
      case 'poor':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <Camera className="w-4 h-4" />
    }
  }

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'blur': return <Focus className="w-3 h-3" />
      case 'lighting': return <Lightbulb className="w-3 h-3" />
      case 'composition': return <Move className="w-3 h-3" />
      case 'resolution': return <Camera className="w-3 h-3" />
      default: return <AlertTriangle className="w-3 h-3" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const highPriorityIssues = qualityResult.issues.filter(issue => issue.severity === 'high')
  const otherIssues = qualityResult.issues.filter(issue => issue.severity !== 'high')

  return (
    <div className={`absolute top-2 left-2 right-2 z-20 pointer-events-none ${className}`}>
      {/* Main Quality Indicator */}
      <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border backdrop-blur-sm ${getQualityColor(qualityResult.overall)}`}>
        {getQualityIcon(qualityResult.overall)}
        <span className="text-sm font-medium">
          {qualityResult.overall === 'excellent' && 'Excellent Quality'}
          {qualityResult.overall === 'good' && 'Good Quality'}
          {qualityResult.overall === 'fair' && 'Fair Quality'}
          {qualityResult.overall === 'poor' && 'Poor Quality'}
        </span>
        <span className="text-xs opacity-75">
          {qualityResult.score}%
        </span>
      </div>

      {/* High Priority Issues */}
      {highPriorityIssues.length > 0 && (
        <div className="mt-2 space-y-1">
          {highPriorityIssues.slice(0, 2).map((issue, index) => (
            <div
              key={index}
              className={`inline-flex items-center gap-2 px-2 py-1 rounded text-xs font-medium ${getSeverityColor(issue.severity)} backdrop-blur-sm`}
            >
              {getIssueIcon(issue.type)}
              <span>{issue.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Suggestions for Poor Quality */}
      {qualityResult.overall === 'poor' && qualityResult.suggestions.length > 0 && (
        <div className="mt-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 border border-gray-200">
          <div className="text-xs font-medium text-gray-700 mb-1">Quick Tips:</div>
          <div className="text-xs text-gray-600 space-y-1">
            {qualityResult.suggestions.slice(0, 2).map((suggestion, index) => (
              <div key={index} className="flex items-start gap-1">
                <span className="text-emerald-600 mt-0.5">•</span>
                <span>{suggestion}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Composition Guide Overlay
 * Shows visual guides for better subject positioning
 */
interface CompositionGuideOverlayProps {
  isVisible: boolean
  mode: 'tongue' | 'face' | 'body'
  className?: string
}

export function CompositionGuideOverlay({ 
  isVisible, 
  mode, 
  className = '' 
}: CompositionGuideOverlayProps) {
  if (!isVisible) {
    return null
  }

  const getGuideForMode = () => {
    switch (mode) {
      case 'tongue':
        return {
          shape: 'oval',
          width: '30%',
          height: '20%',
          top: '40%',
          left: '35%',
          label: 'Position tongue here'
        }
      case 'face':
        return {
          shape: 'oval',
          width: '40%',
          height: '50%',
          top: '25%',
          left: '30%',
          label: 'Center your face here'
        }
      case 'body':
        return {
          shape: 'rectangle',
          width: '60%',
          height: '60%',
          top: '20%',
          left: '20%',
          label: 'Position body area here'
        }
    }
  }

  const guide = getGuideForMode()

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      {/* Overlay with cutout */}
      <div className="absolute inset-0 bg-black/20">
        <div
          className="absolute border-2 border-white/80 border-dashed"
          style={{
            width: guide.width,
            height: guide.height,
            top: guide.top,
            left: guide.left,
            borderRadius: guide.shape === 'oval' ? '50%' : '8px',
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.3)'
          }}
        />
      </div>

      {/* Guide Label */}
      <div
        className="absolute bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-700 border border-white/50"
        style={{
          top: `calc(${guide.top} + ${guide.height} + 8px)`,
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      >
        {guide.label}
      </div>

      {/* Center crosshair */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <div className="w-4 h-4 border-2 border-white/60 rounded-full bg-white/20" />
        <div className="absolute top-1/2 left-1/2 w-8 h-0.5 bg-white/60 transform -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute top-1/2 left-1/2 w-0.5 h-8 bg-white/60 transform -translate-x-1/2 -translate-y-1/2" />
      </div>
    </div>
  )
}

/**
 * Accessibility Feedback Component
 * Provides audio and haptic feedback for vision-impaired users
 */
interface AccessibilityFeedbackProps {
  qualityResult: ImageQualityResult | null
  isEnabled: boolean
}

export function AccessibilityFeedback({ qualityResult, isEnabled }: AccessibilityFeedbackProps) {
  const { t } = useLanguage()

  React.useEffect(() => {
    if (!isEnabled || !qualityResult) return

    // Provide audio feedback for quality changes
    const announceQuality = () => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance()
        
        switch (qualityResult.overall) {
          case 'excellent':
            utterance.text = 'Excellent image quality detected'
            break
          case 'good':
            utterance.text = 'Good image quality'
            break
          case 'fair':
            utterance.text = 'Fair quality, consider adjusting position'
            break
          case 'poor':
            utterance.text = `Poor quality. ${qualityResult.suggestions[0] || 'Please adjust camera position'}`
            break
        }
        
        utterance.volume = 0.7
        utterance.rate = 1.1
        speechSynthesis.speak(utterance)
      }
    }

    // Debounce announcements
    const timeoutId = setTimeout(announceQuality, 1000)
    return () => clearTimeout(timeoutId)
  }, [qualityResult?.overall, isEnabled])

  React.useEffect(() => {
    if (!isEnabled || !qualityResult) return

    // Provide haptic feedback on mobile devices
    if ('vibrate' in navigator && qualityResult.overall === 'excellent') {
      navigator.vibrate([50, 100, 50]) // Short success pattern
    }
  }, [qualityResult?.overall, isEnabled])

  return null // This component only provides non-visual feedback
}