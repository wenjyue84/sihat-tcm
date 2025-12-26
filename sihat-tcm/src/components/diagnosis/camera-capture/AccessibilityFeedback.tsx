
import React from 'react'
import { ImageQualityResult } from '@/lib/imageQualityValidator'

interface AccessibilityFeedbackProps {
    qualityResult: ImageQualityResult | null
    isEnabled: boolean
}

export function AccessibilityFeedback({ qualityResult, isEnabled }: AccessibilityFeedbackProps) {
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
    }, [qualityResult?.overall, isEnabled, qualityResult?.suggestions])

    React.useEffect(() => {
        if (!isEnabled || !qualityResult) return

        // Provide haptic feedback on mobile devices
        if ('vibrate' in navigator && qualityResult.overall === 'excellent') {
            navigator.vibrate([50, 100, 50]) // Short success pattern
        }
    }, [qualityResult?.overall, isEnabled])

    return null // This component only provides non-visual feedback
}
