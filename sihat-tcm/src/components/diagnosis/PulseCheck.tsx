'use client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useState, useRef, useEffect, useMemo } from 'react'
import { Heart } from 'lucide-react'
import { motion } from 'framer-motion'
import { ShowPromptButton } from './ShowPromptButton'
import { useLanguage } from '@/contexts/LanguageContext'
import { useDiagnosisProgress } from '@/contexts/DiagnosisProgressContext'

// Import sub-components and hook
import {
    PulseGuide,
    BpmInput,
    PulseQualitySelector,
    usePulseCheck,
    PulseCheckData
} from './pulse'

interface PulseCheckProps {
    onComplete: (data: PulseCheckData) => void;
    onBack?: () => void;
    initialData?: Partial<PulseCheckData>;
}

export function PulseCheck({ onComplete, onBack, initialData }: PulseCheckProps) {
    const { t } = useLanguage()
    const { setNavigationState } = useDiagnosisProgress()

    // Get guide steps from translations
    const guideSteps = (t.pulse?.guideSteps || []) as Array<{ title: string; description: string; tip: string }>

    // Local UI state
    const [showGuide, setShowGuide] = useState(false)
    const [guideStep, setGuideStep] = useState(0)
    const bpmInputRef = useRef<HTMLInputElement>(null)

    // Business logic from custom hook
    const {
        taps,
        bpm,
        manualBpm,
        inputMode,
        setInputMode,
        handleTap,
        resetTaps,
        handleManualInput,
        showCameraOption,
        handleCameraBpm,
        selectedPulseQualities,
        conflictWarning,
        togglePulseQuality,
        wizardStep,
        handleNext,
        handleBack,
        finish,
    } = usePulseCheck({
        initialData,
        onComplete,
        onBack,
        t
    })

    // Store callbacks in refs to avoid recreating on every render
    const handleNextRef = useRef(handleNext)
    const handleBackRef = useRef(handleBack)
    const finishRef = useRef(finish)
    const setInputModeRef = useRef(setInputMode)

    // Store reactive values in refs to access latest values without triggering effect
    const inputModeRef = useRef(inputMode)
    const manualBpmRef = useRef(manualBpm)
    const bpmValueRef = useRef(bpm)

    // Keep refs updated (no dependencies = runs on every render)
    useEffect(() => {
        handleNextRef.current = handleNext
        handleBackRef.current = handleBack
        finishRef.current = finish
        setInputModeRef.current = setInputMode
        inputModeRef.current = inputMode
        manualBpmRef.current = manualBpm
        bpmValueRef.current = bpm
    })

    // Update global navigation state - only depends on wizardStep to avoid infinite loop
    useEffect(() => {
        setNavigationState({
            onNext: () => {
                // Read current values from refs (always fresh)
                if (wizardStep === 'bpm') {
                    const isBpmComplete = inputModeRef.current === 'manual'
                        ? manualBpmRef.current !== ''
                        : bpmValueRef.current !== null
                    if (!isBpmComplete) {
                        setInputModeRef.current('manual')
                        setTimeout(() => {
                            if (bpmInputRef.current) {
                                bpmInputRef.current.focus()
                                bpmInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
                            }
                        }, 100)
                        return
                    }
                }
                handleNextRef.current()
            },
            onBack: () => handleBackRef.current(),
            onSkip: wizardStep === 'qualities' ? () => finishRef.current() : undefined,
            showNext: true,
            showBack: true,
            showSkip: wizardStep === 'qualities',
            canNext: true
        })
    }, [wizardStep, setNavigationState])

    return (
        <Card className="p-6 space-y-6 mb-20 md:mb-0">
            {/* Header with Animated Heart */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {/* Heart Icon with Multi-Layer Ripple Animation */}
                    {/* Heart Icon with Static Display */}
                    <div className="relative p-2">
                        {/* Heart Icon Container - Static */}
                        <div
                            className="relative bg-gradient-to-br from-rose-100 to-pink-100 rounded-xl p-2"
                        >
                            <Heart className="w-6 h-6 text-rose-500" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold">{t.pulse?.title || 'Pulse Check'}</h2>
                        <p className="text-sm text-slate-500">{t.pulse?.pulseDiagnosis || 'Pulse Diagnosis'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <ShowPromptButton promptType="final" />
                    {wizardStep === 'bpm' && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowGuide(!showGuide)}
                            className="text-emerald-600 hover:text-emerald-700"
                        >
                            {showGuide ? (t.pulse?.hideGuide || 'Hide Guide') : (t.pulse?.showGuide || 'Show Guide')}
                        </Button>
                    )}
                </div>
            </div>

            {/* BPM Step Content */}
            {wizardStep === 'bpm' && (
                <>
                    {showGuide && (
                        <PulseGuide
                            steps={guideSteps}
                            guideStep={guideStep}
                            setGuideStep={setGuideStep}
                        />
                    )}
                    <BpmInput
                        inputMode={inputMode}
                        setInputMode={setInputMode}
                        manualBpm={manualBpm}
                        handleManualInput={handleManualInput}
                        bpmInputRef={bpmInputRef}
                        taps={taps}
                        bpm={bpm}
                        handleTap={handleTap}
                        resetTaps={resetTaps}
                        showCameraOption={showCameraOption}
                        onCameraBpmDetected={handleCameraBpm}
                        t={t}
                    />
                </>
            )}

            {/* TCM Pulse Quality Step Content */}
            {wizardStep === 'qualities' && (
                <PulseQualitySelector
                    selectedPulseQualities={selectedPulseQualities}
                    togglePulseQuality={togglePulseQuality}
                    conflictWarning={conflictWarning}
                    t={t}
                />
            )}
        </Card>
    )
}
