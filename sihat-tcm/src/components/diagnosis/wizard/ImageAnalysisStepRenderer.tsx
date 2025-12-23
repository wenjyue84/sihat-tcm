'use client'

import { ImageAnalysisLoader } from '../ImageAnalysisLoader'
import { ObservationResult } from '../ObservationResult'
import { CameraCapture } from '../CameraCapture'

interface AnalysisResult {
    observation?: string
    potential_issues?: string[]
    status?: 'success' | 'error' | 'partial'
    message?: string
    confidence?: number
    image_description?: string
}

interface ImageData {
    image?: string
    observation?: string
    potential_issues?: string[]
}

interface CaptureResult {
    image?: string
    [key: string]: unknown
}

interface ImageAnalysisStepRendererProps {
    /** Type of image analysis: tongue, face, or body part */
    type: 'tongue' | 'face' | 'part'
    /** Title to display in camera capture */
    title: string
    /** Instruction text for camera capture */
    instruction: string
    /** Whether this step is required (default: true for tongue/face, false for part) */
    required?: boolean
    /** Current analyzing state */
    isAnalyzing: boolean
    /** Result from AI analysis */
    analysisResult: AnalysisResult | null
    /** Existing data from previous capture */
    existingData: ImageData | null
    /** Callback when image is captured */
    onCapture: (result: CaptureResult) => void
    /** Callback to retake photo */
    onRetake: () => void
    /** Callback to continue to next step */
    onContinue: () => void
    /** Callback to skip analysis */
    onSkip: () => void
    /** Callback to go back */
    onBack: () => void
}

/**
 * ImageAnalysisStepRenderer - Reusable component for image analysis steps
 * 
 * Handles the 3-state flow:
 * 1. Camera Capture - User takes photo
 * 2. Analysis Loading - AI processes image
 * 3. Observation Result - Display analysis results
 * 
 * Used for: Tongue, Face, and Body Part analysis steps
 */
export function ImageAnalysisStepRenderer({
    type,
    title,
    instruction,
    required = true,
    isAnalyzing,
    analysisResult,
    existingData,
    onCapture,
    onRetake,
    onContinue,
    onSkip,
    onBack
}: ImageAnalysisStepRendererProps) {
    // Map type to camera mode
    const cameraMode = type === 'tongue' ? 'tongue' : type === 'face' ? 'face' : 'body'

    // Determine current state
    const hasResult = analysisResult || existingData

    // 1. Analyzing state - show loader
    if (isAnalyzing) {
        return (
            <ImageAnalysisLoader
                type={type}
                onSkip={onSkip}
            />
        )
    }

    // 2. Has result - show observation
    if (hasResult) {
        return (
            <ObservationResult
                image={existingData?.image || ''}
                observation={analysisResult?.observation || existingData?.observation || ''}
                potentialIssues={analysisResult?.potential_issues || existingData?.potential_issues || []}
                type={type}
                status={analysisResult?.status || 'success'}
                message={analysisResult?.message}
                confidence={analysisResult?.confidence}
                imageDescription={analysisResult?.image_description}
                onRetake={onRetake}
                onContinue={onContinue}
                onBack={onBack}
            />
        )
    }

    // 3. Default - show camera capture
    return (
        <CameraCapture
            title={title}
            instruction={instruction}
            required={required}
            mode={cameraMode}
            onComplete={onCapture}
            onBack={onBack}
        />
    )
}
