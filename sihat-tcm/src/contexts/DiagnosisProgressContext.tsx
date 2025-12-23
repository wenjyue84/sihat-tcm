'use client'

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

/**
 * ============================================================================
 * DIAGNOSIS PROGRESS CONTEXT
 * ============================================================================
 * This context provides granular progress tracking for the diagnosis process.
 * 
 * Progress is calculated based on:
 * - Step completion (7 main steps, each ~12-14% of total)
 * - Within each step, form field completion provides granular updates
 * 
 * Steps and their approximate weights:
 * 1. Basic Info (0-14%) - ~7 fields
 * 2. Inquiry Chat (14-28%) - Chat completion
 * 3. Tongue Analysis (28-42%) - Image capture + analysis
 * 4. Face Analysis (42-56%) - Image capture + analysis
 * 5. Audio Analysis (56-70%) - Recording + analysis
 * 6. Pulse Check (70-84%) - Pulse data entry
 * 7. Smart Connect (84-100%) - IoT data or skip
 * ============================================================================
 */

interface DiagnosisProgressContextType {
    /** Current progress percentage (0-100) */
    progress: number
    /** Update progress to a specific value */
    setProgress: (value: number) => void
    /** Increment progress by a delta value */
    incrementProgress: (delta: number) => void
    /** Current step index (0-6) for main steps */
    currentStepIndex: number
    /** Set the current step index */
    setCurrentStepIndex: (index: number) => void
    /** Track form field completion for granular progress */
    updateFormProgress: (stepId: string, completedFields: number, totalFields: number) => void
    /** Reset progress to 0 */
    resetProgress: () => void
    /** Navigation state for bottom bar control */
    navigationState: {
        onNext?: () => void
        onBack?: () => void
        onSkip?: () => void
        showNext?: boolean
        showBack?: boolean
        showSkip?: boolean
        canNext?: boolean
        nextLabel?: string
        backLabel?: string
        hideBottomNav?: boolean
    }
    setNavigationState: (state: any) => void
}

const DiagnosisProgressContext = createContext<DiagnosisProgressContextType | undefined>(undefined)

// Step weights (how much each step contributes to total progress)
const STEP_WEIGHTS = {
    basic_info: 14,      // 0-14%
    wen_inquiry: 14,     // 14-28%
    wang_tongue: 14,     // 28-42%
    wang_face: 14,       // 42-56%
    wen_audio: 14,       // 56-70%
    qie: 14,             // 70-84%
    smart_connect: 16,   // 84-100%
}

const STEP_BASE_PROGRESS: { [key: string]: number } = {
    basic_info: 0,
    wen_inquiry: 14,
    wang_tongue: 28,
    wang_face: 42,
    wen_audio: 56,
    qie: 70,
    smart_connect: 84,
}

export function DiagnosisProgressProvider({ children }: { children: ReactNode }) {
    const [progress, setProgressState] = useState(0)
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [formProgress, setFormProgress] = useState<{ [stepId: string]: number }>({})

    const setProgress = useCallback((value: number) => {
        setProgressState(Math.min(100, Math.max(0, value)))
    }, [])

    const incrementProgress = useCallback((delta: number) => {
        setProgressState(prev => Math.min(100, Math.max(0, prev + delta)))
    }, [])

    const updateFormProgress = useCallback((stepId: string, completedFields: number, totalFields: number) => {
        if (totalFields === 0) return

        const stepWeight = STEP_WEIGHTS[stepId as keyof typeof STEP_WEIGHTS] || 14
        const baseProgress = STEP_BASE_PROGRESS[stepId] || 0
        const fieldProgress = (completedFields / totalFields) * stepWeight
        const newProgress = baseProgress + fieldProgress

        setFormProgress(prev => ({ ...prev, [stepId]: newProgress }))
        setProgressState(Math.round(newProgress))
    }, [])

    const resetProgress = useCallback(() => {
        setProgressState(0)
        setCurrentStepIndex(0)
        setFormProgress({})
    }, [])

    const [navigationState, setNavigationState] = useState<{
        onNext?: () => void
        onBack?: () => void
        onSkip?: () => void
        showNext?: boolean
        showBack?: boolean
        showSkip?: boolean
        canNext?: boolean
        nextLabel?: string
        backLabel?: string
        hideBottomNav?: boolean
    }>({})

    // Stable setter that doesn't cause re-renders in consumers that don't use navigationState
    const stableSetNavigationState = useCallback((state: typeof navigationState) => {
        setNavigationState(state)
    }, [])

    const contextValue = React.useMemo(() => ({
        progress,
        setProgress,
        incrementProgress,
        currentStepIndex,
        setCurrentStepIndex,
        updateFormProgress,
        resetProgress,
        navigationState,
        setNavigationState: stableSetNavigationState
    }), [progress, setProgress, incrementProgress, currentStepIndex, setCurrentStepIndex, updateFormProgress, resetProgress, navigationState, stableSetNavigationState])

    return (
        <DiagnosisProgressContext.Provider value={contextValue}>
            {children}
        </DiagnosisProgressContext.Provider>
    )
}

export function useDiagnosisProgress() {
    const context = useContext(DiagnosisProgressContext)
    if (context === undefined) {
        throw new Error('useDiagnosisProgress must be used within a DiagnosisProgressProvider')
    }
    return context
}

// Hook for optional use (returns null if not in provider)
export function useDiagnosisProgressOptional() {
    return useContext(DiagnosisProgressContext)
}
