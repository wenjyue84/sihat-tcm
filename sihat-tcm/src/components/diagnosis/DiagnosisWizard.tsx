'use client'

import React, { useEffect } from 'react'
import { useDiagnosisWizard, DiagnosisStep, repairJSON, generateMockReport } from '@/hooks/useDiagnosisWizard'
import { useDeveloper } from '@/contexts/DeveloperContext'
import { MOCK_PROFILES } from '@/data/mockProfiles'
import { generateMockTestData } from '@/data/mockTestData'
import type { DiagnosisWizardData } from '@/types/diagnosis'

// UI Components
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ProgressStepper } from './ProgressStepper'
import { PhaseCompleteAnimation, DiagnosisPhase } from './PhaseCompleteAnimation'
import { AnalysisLoadingScreen } from './AnalysisLoadingScreen'
import { DiagnosisReport } from './DiagnosisReport'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

// Step Components
import { BasicInfoForm } from './BasicInfoForm'
import { InquiryWizard } from './InquiryWizard'
import { AudioRecorder } from './AudioRecorder'
import { PulseCheck } from './PulseCheck'
import { SmartConnectStep } from './SmartConnectStep'
import { DiagnosisSummary } from './DiagnosisSummary'
import { ResumeProgressDialog } from './ResumeProgressDialog'

// Extracted Wizard Sub-Components
import { DeveloperModePanel, TestProfilesModal, ImageAnalysisStepRenderer } from './wizard'

export default function DiagnosisWizard() {
    // 1. Controller Logic (Hook)
    const {
        step, setStep,
        data, setData,
        isAnalyzing,
        analysisResult, setAnalysisResult,
        completion, setCompletion,
        isLoading,
        error,
        isSaved, setIsSaved,
        maxStepReached,
        celebrationPhase, setCelebrationPhase,
        pendingResumeState,
        handleResumeProgress,
        handleStartNew,
        nextStep,
        prevStep,
        analyzeImage,
        handleSkipAnalysis,
        submitConsultation,
        STEPS,
        t,
        language
    } = useDiagnosisWizard()

    const { isDeveloperMode } = useDeveloper()
    const [showTestProfiles, setShowTestProfiles] = React.useState(false)

    /**
     * ============================================================================
     * FILL TEST DATA EVENT HANDLER
     * ============================================================================
     * Listens for 'fill-test-data' and 'clear-test-data' events dispatched from
     * the header's Test/Clear button. When Fill is clicked, populates all diagnosis
     * steps with mock data (PDF report, medicines, tongue/face/body images, audio,
     * and random BPM for pulse measurement).
     */
    useEffect(() => {
        const handleFillTestData = () => {
            const mockData = generateMockTestData()

            // Fill ALL diagnosis data across all steps
            setData((prev) => ({
                ...prev,
                basic_info: {
                    ...mockData.basic_info,
                    age: Number(mockData.basic_info.age) || undefined,
                    height: Number(mockData.basic_info.height) || undefined,
                    weight: Number(mockData.basic_info.weight) || undefined,
                },
                wen_inquiry: mockData.wen_inquiry,
                wang_tongue: mockData.wang_tongue,
                wang_face: mockData.wang_face,
                wang_part: mockData.wang_part,
                wen_audio: mockData.wen_audio,
                wen_chat: mockData.wen_inquiry.chatHistory.map((msg, idx) => ({
                    id: `mock-${idx}`,
                    role: msg.role as 'user' | 'assistant' | 'system',
                    content: msg.content
                })),
                qie: mockData.qie,
                smart_connect: {
                    connected: true,
                    device_type: 'wearable',
                    data: mockData.smart_connect
                }
            }))

            console.log('[DiagnosisWizard] Test data filled:', mockData)
        }

        const handleClearTestData = () => {
            // Reset all diagnosis data
            setData(() => ({
                basic_info: null,
                wen_inquiry: null,
                wang_tongue: null,
                wang_face: null,
                wang_part: null,
                wen_audio: null,
                wen_chat: [],
                qie: null,
                smart_connect: null
            }))

            // Reset to first step
            setStep('basic_info')
            setAnalysisResult(null)
            setCompletion('')

            console.log('[DiagnosisWizard] Test data cleared')
        }

        window.addEventListener('fill-test-data', handleFillTestData)
        window.addEventListener('clear-test-data', handleClearTestData)

        return () => {
            window.removeEventListener('fill-test-data', handleFillTestData)
            window.removeEventListener('clear-test-data', handleClearTestData)
        }
    }, [setData, setStep, setAnalysisResult, setCompletion])

    // Helper to determine current stepper ID (e.g., grouping face parts)
    const getCurrentStepperId = () => {
        if (step === 'wang_part') return 'wang_face'
        if (step === 'processing' || step === 'report') return 'smart_connect'
        return step
    }

    // Helper to create image step handlers
    const createImageStepHandlers = (stepKey: 'wang_tongue' | 'wang_face' | 'wang_part', type: 'tongue' | 'face' | 'part') => ({
        onCapture: (result: { image?: string }) => {
            setData((prev) => ({ ...prev, [stepKey]: result }))
            if (result.image) {
                analyzeImage(result.image, type)
            } else {
                setTimeout(() => nextStep(stepKey, true), 0)
            }
        },
        onRetake: () => {
            setAnalysisResult(null)
            setData((prev) => ({ ...prev, [stepKey]: null }))
        },
        onContinue: (editedData?: { observation: string, potentialIssues: string[] }) => {
            if (editedData) {
                setData((prev) => ({
                    ...prev,
                    [stepKey]: {
                        ...(prev[stepKey] as any),
                        observation: editedData.observation,
                        potential_issues: editedData.potentialIssues
                    }
                }))
            }
            setAnalysisResult(null)
            setTimeout(() => nextStep(stepKey), 0)
        },
        onSkip: () => handleSkipAnalysis(type),
        onBack: () => prevStep(stepKey)
    })

    // Handler for mock report viewing
    const handleFillAndViewMockReport = () => {
        const mockData = MOCK_PROFILES[0].data
        setData((prev) => ({
            ...prev,
            ...mockData,
            report_options: createDefaultReportOptions(),
            verified_summaries: {
                inquiry: (mockData.wen_inquiry as any)?.summary,
                tongue: (mockData.wang_tongue as any)?.observation,
                face: (mockData.wang_face as any)?.observation,
                pulse: "Pulse analysis completed"
            }
        }))

        const mockReport = generateMockReport(mockData as any)
        setCompletion(JSON.stringify(mockReport))
        setStep('processing')
    }

    // Handler for test profile selection
    const handleSelectTestProfile = (profileData: DiagnosisWizardData) => {
        const newData = {
            ...data,
            ...profileData,
            report_options: createDefaultReportOptions(),
            verified_summaries: {
                inquiry: (profileData.wen_inquiry as any)?.summary || "Inquiry completed",
                tongue: (profileData.wang_tongue as any)?.observation || "Tongue analysis completed",
                face: (profileData.wang_face as any)?.observation || "Face analysis completed",
                pulse: "Pulse analysis completed"
            }
        }
        setData(newData)
        if (step === 'processing' || step === 'report') {
            const mockReport = generateMockReport(profileData)
            setCompletion(JSON.stringify(mockReport))
        }
    }

    return (
        <div className="w-full px-5 md:px-6 md:max-w-4xl md:mx-auto p-3 md:p-6 pb-24">
            {/* Resume Progress Dialog */}
            <ResumeProgressDialog
                isOpen={pendingResumeState !== null}
                savedStep={pendingResumeState?.step || 'basic_info'}
                savedTimestamp={pendingResumeState?.timestamp || ''}
                onResume={handleResumeProgress}
                onStartNew={handleStartNew}
            />

            {/* Phase completion celebration animation */}
            <PhaseCompleteAnimation
                isVisible={celebrationPhase !== null}
                phase={(celebrationPhase as DiagnosisPhase) || 'basics'}
                onComplete={() => setCelebrationPhase(null)}
                duration={1500}
            />

            {/* Progress Stepper */}
            {step !== 'processing' && step !== 'report' && (
                <ProgressStepper
                    currentStep={getCurrentStepperId()}
                    steps={STEPS}
                    maxStepIndex={maxStepReached}
                    onStepClick={(stepId) => {
                        const targetIndex = STEPS.findIndex(s => s.id === stepId)
                        if (targetIndex !== -1 && targetIndex <= maxStepReached) {
                            setStep(stepId as DiagnosisStep)
                        }
                    }}
                    promptType={
                        step === 'wen_inquiry' ? 'chat' :
                            step === 'wang_tongue' || step === 'wang_face' || step === 'wang_part' ? 'image' :
                                step === 'wen_audio' ? 'audio' :
                                    step === 'summary' ? 'final' :
                                        undefined
                    }
                />
            )}

            {/* Main Content Render Switch */}
            <div className="relative min-h-[400px] md:min-h-[600px]">

                {/* 1. Basic Info */}
                {step === 'basic_info' && (
                    <div key="basic_info">
                        <BasicInfoForm
                            initialData={data.basic_info as any}
                            onComplete={(result) => {
                                setData((prev) => ({ 
                                    ...prev, 
                                    basic_info: {
                                        ...result,
                                        age: Number(result.age) || undefined,
                                        height: Number(result.height) || undefined,
                                        weight: Number(result.weight) || undefined,
                                    }
                                }));
                                setTimeout(() => nextStep('basic_info'), 0)
                            }} />
                    </div>
                )}

                {/* 2. Inquiry */}
                {step === 'wen_inquiry' && (
                    <div key="wen_inquiry">
                        <InquiryWizard
                            basicInfo={data.basic_info as any}
                            initialData={data.wen_inquiry as any}
                            onComplete={(result) => {
                                setData((prev) => ({
                                    ...prev,
                                    wen_inquiry: result,
                                    wen_chat: result.chatHistory || []
                                }));
                                setTimeout(() => nextStep('wen_inquiry'), 0)
                            }}
                            onBack={() => prevStep('wen_inquiry')}
                        />
                    </div>
                )}

                {/* 3. Tongue Analysis - Using extracted component */}
                {step === 'wang_tongue' && (
                    <div key="wang_tongue">
                        <ImageAnalysisStepRenderer
                            type="tongue"
                            title={t.tongue.title}
                            instruction={t.tongue.instructions}
                            isAnalyzing={isAnalyzing}
                            analysisResult={analysisResult as any}
                            existingData={data.wang_tongue as any | null}
                            {...createImageStepHandlers('wang_tongue', 'tongue')}
                        />
                    </div>
                )}

                {/* 4. Face Analysis - Using extracted component */}
                {step === 'wang_face' && (
                    <div key="wang_face">
                        <ImageAnalysisStepRenderer
                            type="face"
                            title={t.face.title}
                            instruction={t.face.instructions}
                            isAnalyzing={isAnalyzing}
                            analysisResult={analysisResult as any}
                            existingData={data.wang_face as any | null}
                            {...createImageStepHandlers('wang_face', 'face')}
                        />
                    </div>
                )}

                {/* 5. Body Part Analysis - Using extracted component */}
                {step === 'wang_part' && (
                    <div key="wang_part">
                        <ImageAnalysisStepRenderer
                            type="part"
                            title={t.bodyPart.title}
                            instruction={t.bodyPart.instructions}
                            required={false}
                            isAnalyzing={isAnalyzing}
                            analysisResult={analysisResult as any}
                            existingData={data.wang_part as any | null}
                            {...createImageStepHandlers('wang_part', 'part')}
                        />
                    </div>
                )}

                {/* 6. Audio Analysis */}
                {step === 'wen_audio' && (
                    <div key="wen_audio">
                        <AudioRecorder
                            initialData={data.wen_audio as any}
                            onComplete={(result) => {
                                setData((prev) => ({ ...prev, wen_audio: result }));
                                setTimeout(() => nextStep('wen_audio', result.skipCelebration), 0)
                            }}
                            onBack={() => prevStep('wen_audio')}
                        />
                    </div>
                )}

                {/* 7. Pulse Check */}
                {step === 'qie' && (
                    <div key="qie">
                        <PulseCheck
                            initialData={data.qie as any}
                            onComplete={(result) => {
                                setData((prev) => ({ ...prev, qie: result }));
                                nextStep('qie');
                            }}
                            onBack={() => prevStep('qie')}
                        />
                    </div>
                )}

                {/* 8. Smart Connect */}
                {step === 'smart_connect' && (
                    <div key="smart_connect">
                        <SmartConnectStep
                            initialData={(data.smart_connect as any) || {}}
                            onComplete={(result) => {
                                setData((prev) => ({ 
                                    ...prev, 
                                    smart_connect: {
                                        connected: true,
                                        device_type: 'wearable',
                                        data: result as Record<string, unknown>
                                    }
                                }));
                                nextStep('smart_connect');
                            }}
                            onBack={() => prevStep('smart_connect')}
                        />
                    </div>
                )}

                {/* 9. Summary Review */}
                {step === 'summary' && (
                    <div key="summary">
                        <ErrorBoundary
                            fallbackTitle={t.errors.componentError}
                            fallbackMessage={t.errors.componentErrorDesc}
                            onBack={() => prevStep('summary')}
                            onRetry={() => {
                                setStep('smart_connect');
                                setTimeout(() => setStep('summary'), 100);
                            }}
                            showBackButton={true}
                            showRetryButton={true}
                        >
                            <DiagnosisSummary
                                data={data}
                                onConfirm={(summaries, options, additionalInfo) => {
                                    setData((prev) => ({
                                        ...prev,
                                        verified_summaries: summaries,
                                        report_options: options,
                                        basic_info: {
                                            ...(prev.basic_info as any),
                                            ...additionalInfo
                                        }
                                    }));
                                    nextStep('summary');
                                }}
                                onBack={() => prevStep('summary')}
                            />
                        </ErrorBoundary>
                    </div>
                )}

                {/* 10. Processing & Report */}
                {step === 'processing' && (
                    <div key="processing">
                        <ProcessingStep
                            isLoading={isLoading}
                            error={error}
                            completion={completion}
                            data={data as any}
                            isSaved={isSaved}
                            setData={setData}
                            setStep={setStep}
                            setIsSaved={setIsSaved}
                            submitConsultation={submitConsultation}
                            t={t}
                        />
                    </div>
                )}
            </div>

            {/* Developer Mode Controls - Using extracted component */}
            {isDeveloperMode && (
                <DeveloperModePanel
                    currentStep={step}
                    steps={STEPS}
                    onStepChange={(stepId) => setStep(stepId as DiagnosisStep)}
                    onOpenTestProfiles={() => setShowTestProfiles(true)}
                    onFillAndViewMockReport={handleFillAndViewMockReport}
                    onOpenTestRunner={() => window.open('/test-runner', '_blank')}
                />
            )}

            {/* Test Profiles Modal - Using extracted component */}
            <TestProfilesModal
                isOpen={showTestProfiles}
                onClose={() => setShowTestProfiles(false)}
                onSelectProfile={(profileData) => handleSelectTestProfile(profileData as unknown as DiagnosisWizardData)}
            />
        </div>
    )
}

// Helper: Default report options
function createDefaultReportOptions() {
    return {
        includePatientName: true,
        includePatientAge: true,
        includePatientGender: true,
        includePatientContact: true,
        includePatientAddress: true,
        includeEmergencyContact: true,
        includeVitalSigns: true,
        includeBMI: true,
        includeSmartConnectData: true,
        suggestMedicine: true,
        suggestDoctor: true,
        includeDietary: true,
        includeLifestyle: true,
        includeAcupuncture: true,
        includeExercise: true,
        includeSleepAdvice: true,
        includeEmotionalWellness: true,
        includePrecautions: true,
        includeFollowUp: true,
        includeTimestamp: true,
        includeQRCode: true,
        includeDoctorSignature: true
    }
}

// Extracted Processing Step Component
interface ProcessingStepProps {
    isLoading: boolean
    error: Error | null
    completion: string
    data: Record<string, unknown>
    isSaved: boolean
    setData: (fn: (prev: DiagnosisWizardData) => DiagnosisWizardData) => void
    setStep: (step: DiagnosisStep) => void
    setIsSaved: (saved: boolean) => void
    submitConsultation: () => void
    t: Record<string, unknown>
}

function ProcessingStep({
    isLoading,
    error,
    completion,
    data,
    isSaved,
    setData,
    setStep,
    setIsSaved,
    submitConsultation,
    t
}: ProcessingStepProps) {
    const errors = t.errors as Record<string, string>
    const common = t.common as Record<string, string>
    if (isLoading || (!error && !completion)) {
        return <AnalysisLoadingScreen basicInfo={data.basic_info as any} />
    }

    if (error) {
        return (
            <Card className="p-8 border-none shadow-xl bg-white/80 backdrop-blur-sm">
                <div className="p-6 bg-red-50 text-red-800 rounded-xl border border-red-100">
                    <h3 className="font-bold text-lg mb-2">{errors.apiError}</h3>
                    <p className="mb-2">{errors.connectionFailed}</p>
                    <p className="text-sm text-red-600 mb-4">{error.message}</p>
                    <Button
                        onClick={() => {
                            setStep('processing');
                            submitConsultation();
                        }}
                        className="mr-2 bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                        {common.retry}
                    </Button>
                    <Button
                        onClick={() => setStep('basic_info')}
                        variant="outline"
                        className="bg-red-100 text-red-800 hover:bg-red-200 border-none"
                    >
                        {common.reset}
                    </Button>
                </div>
            </Card>
        )
    }

    // Parse and render report
    try {
        let cleanJson = completion.replace(/```json\n?|\n?```/g, '').trim();
        let resultData;
        try {
            resultData = JSON.parse(cleanJson);
        } catch {
            console.log('[DiagnosisWizard] Initial parse failed, repairing...');
            const repairedJson = repairJSON(cleanJson);
            resultData = JSON.parse(repairedJson);
        }

        // Normalize data
        const normalizedData = {
            diagnosis: resultData.diagnosis || 'Diagnosis pending',
            constitution: resultData.constitution || 'Not determined',
            analysis: resultData.analysis || '',
            recommendations: {
                food: resultData.recommendations?.food || [],
                avoid: resultData.recommendations?.avoid || [],
                lifestyle: resultData.recommendations?.lifestyle || [],
                food_therapy: resultData.recommendations?.food_therapy,
                acupoints: resultData.recommendations?.acupoints || [],
                exercise: resultData.recommendations?.exercise || [],
                sleep_guidance: resultData.recommendations?.sleep_guidance,
                emotional_care: resultData.recommendations?.emotional_care,
                herbal_formulas: resultData.recommendations?.herbal_formulas || [],
                doctor_consultation: resultData.recommendations?.doctor_consultation,
                general: resultData.recommendations?.general || []
            },
            patient_summary: resultData.patient_summary,
            precautions: resultData.precautions,
            follow_up: resultData.follow_up,
            disclaimer: resultData.disclaimer,
            timestamp: resultData.timestamp
        };

        return (
            <Card className="p-8 border-none shadow-xl bg-white/80 backdrop-blur-sm">
                <div className="text-left w-full">
                    <DiagnosisReport
                        data={normalizedData}
                        saved={isSaved}
                        patientInfo={data.basic_info as any}
                        reportOptions={data.report_options as Record<string, boolean>}
                        smartConnectData={data.smart_connect as any}
                        onRestart={() => {
                            setData(() => ({
                                basic_info: null,
                                wen_inquiry: null,
                                wang_tongue: null,
                                wang_face: null,
                                wang_part: null,
                                wen_audio: null,
                                wen_chat: [],
                                qie: null,
                                smart_connect: null
                            }));
                            setStep('basic_info');
                            setIsSaved(false);
                        }}
                    />
                </div>
            </Card>
        );
    } catch (e) {
        console.error("Failed to parse diagnosis result:", e);
        return (
            <Card className="p-8 border-none shadow-xl bg-white/80 backdrop-blur-sm">
                <div className="p-6 bg-red-50 text-red-800 rounded-xl border border-red-100">
                    <h3 className="font-bold text-lg mb-2">{errors.analysisError}</h3>
                    <p className="mb-2">{errors.parseError}</p>
                    <details className="text-sm text-red-600 mb-4">
                        <summary className="cursor-pointer">View raw response</summary>
                        <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto max-h-40">{completion}</pre>
                    </details>
                    <Button
                        onClick={() => {
                            setStep('processing');
                            submitConsultation();
                        }}
                        className="mr-2 bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                        {common.retry}
                    </Button>
                </div>
            </Card>
        );
    }
}
