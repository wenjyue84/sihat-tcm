'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { tcmPulseQualities, pulseQualityConflicts, PulseCheckData } from './types'

interface UsePulseCheckOptions {
    initialData?: Partial<PulseCheckData>;
    onComplete: (data: PulseCheckData) => void;
    onBack?: () => void;
    t: any; // Language translations
}

export function usePulseCheck({ initialData, onComplete, onBack, t }: UsePulseCheckOptions) {
    // BPM State
    const [taps, setTaps] = useState<number[]>([])
    const [bpm, setBpm] = useState<number | null>(initialData?.bpm || null)
    const [manualBpm, setManualBpm] = useState<string>(initialData?.bpm ? String(initialData.bpm) : '')
    const [inputMode, setInputMode] = useState<'tap' | 'manual'>('manual')

    // TCM Qualities State
    const [selectedPulseQualities, setSelectedPulseQualities] = useState<string[]>(
        initialData?.pulseQualities?.map((q) => q.id) || []
    )
    const [conflictWarning, setConflictWarning] = useState<string | null>(null)

    // Wizard State
    const [wizardStep, setWizardStep] = useState<'bpm' | 'qualities'>('bpm')

    // Refs for stable callbacks (avoid stale closures in navigation handlers)
    const bpmRef = useRef(bpm)
    const manualBpmRef = useRef(manualBpm)
    const inputModeRef = useRef(inputMode)
    const selectedPulseQualitiesRef = useRef(selectedPulseQualities)
    const wizardStepRef = useRef(wizardStep)

    useEffect(() => {
        bpmRef.current = bpm
        manualBpmRef.current = manualBpm
        inputModeRef.current = inputMode
        selectedPulseQualitiesRef.current = selectedPulseQualities
        wizardStepRef.current = wizardStep
    }, [bpm, manualBpm, inputMode, selectedPulseQualities, wizardStep])

    // Tap Handler for BPM calculation
    const handleTap = useCallback(() => {
        const now = Date.now()
        setTaps(prev => {
            const newTaps = [...prev, now]
            if (newTaps.length > 2) {
                const intervals: number[] = []
                for (let i = 1; i < newTaps.length; i++) {
                    intervals.push(newTaps[i] - newTaps[i - 1])
                }
                const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
                setBpm(Math.round(60000 / avgInterval))
            }
            return newTaps
        })
    }, [])

    const resetTaps = useCallback(() => {
        setTaps([])
        setBpm(null)
    }, [])

    const handleManualInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        if (value === '' || (/^\d+$/.test(value) && parseInt(value) <= 200)) {
            setManualBpm(value)
        }
    }, [])

    // Pulse Quality Toggle with Conflict Detection
    const togglePulseQuality = useCallback((id: string) => {
        setConflictWarning(null)

        setSelectedPulseQualities(prev => {
            if (prev.includes(id)) {
                return prev.filter(q => q !== id)
            }

            const conflictingId = pulseQualityConflicts[id]?.find(c => prev.includes(c))

            if (conflictingId) {
                // Generate warning message
                const warningKey = [id, conflictingId].sort().join('_')
                const warningMsg = t.pulse?.conflicts?.[warningKey] || `Cannot select conflicting pulse qualities.`
                setConflictWarning(warningMsg)
                return prev
            }

            return [...prev, id]
        })
    }, [t])

    // Finish handler - submits final data
    const finish = useCallback(() => {
        const inputMode = inputModeRef.current
        const manualBpm = manualBpmRef.current
        const bpm = bpmRef.current
        const selectedPulseQualities = selectedPulseQualitiesRef.current

        const finalBpm = inputMode === 'manual' ? parseInt(manualBpm) || 70 : bpm || 70
        const qualities = selectedPulseQualities.map(id => {
            const quality = tcmPulseQualities.find(q => q.id === id)
            return quality ? { id, nameZh: quality.nameZh, nameEn: quality.nameEn } : null
        }).filter(Boolean) as { id: string; nameZh: string; nameEn: string }[]

        onComplete({
            bpm: finalBpm,
            pulseQualities: qualities
        })
    }, [onComplete])

    // Navigation handlers
    const handleNext = useCallback(() => {
        const wizardStep = wizardStepRef.current
        const inputMode = inputModeRef.current
        const manualBpm = manualBpmRef.current
        const bpm = bpmRef.current

        if (wizardStep === 'bpm') {
            const isBpmComplete = inputMode === 'manual' ? manualBpm !== '' : bpm !== null
            if (isBpmComplete) {
                setWizardStep('qualities')
            } else {
                setInputMode('manual')
            }
        } else {
            finish()
        }
    }, [finish])

    const handleBack = useCallback(() => {
        const wizardStep = wizardStepRef.current
        if (wizardStep === 'qualities') {
            setWizardStep('bpm')
        } else {
            onBack?.()
        }
    }, [onBack])

    return {
        // BPM State
        taps,
        bpm,
        manualBpm,
        inputMode,
        setInputMode,
        handleTap,
        resetTaps,
        handleManualInput,

        // Qualities State
        selectedPulseQualities,
        conflictWarning,
        togglePulseQuality,

        // Wizard State
        wizardStep,
        setWizardStep,

        // Navigation
        handleNext,
        handleBack,
        finish,
    }
}
