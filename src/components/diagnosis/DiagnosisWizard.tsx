'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { CameraCapture } from './CameraCapture'
import { AudioRecorder } from './AudioRecorder'

import { BasicInfoForm } from './BasicInfoForm'
import { PulseCheck } from './PulseCheck'
import { InquiryStep } from './InquiryStep'
import { Card } from '@/components/ui/card'
import { DiagnosisReport } from './DiagnosisReport'
import { AnalysisLoadingScreen } from './AnalysisLoadingScreen'
import { ProgressStepper } from './ProgressStepper'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { useDoctorLevel } from '@/contexts/DoctorContext'
import { ObservationResult } from './ObservationResult'
import { ImageAnalysisLoader } from './ImageAnalysisLoader'
import { DiagnosisSummary } from './DiagnosisSummary'
import { SmartConnectStep, SmartConnectData } from './SmartConnectStep'
import { Loader2 } from 'lucide-react'

/**
 * Repairs common JSON formatting issues from AI responses
 * Specifically handles the case where AI adds extra string paragraphs without keys in objects
 */
function repairJSON(jsonString: string): string {
    // First, try to find where the analysis object has malformed entries
    // The pattern is: "summary": "...", "Some text without key", "More text"...
    // We need to find these and either remove them or incorporate them into summary

    try {
        // Try to find the analysis section and fix it
        const analysisMatch = jsonString.match(/"analysis"\s*:\s*\{[\s\S]*?"summary"\s*:\s*"((?:[^"\\]|\\.)*)"/);
        if (analysisMatch) {
            // Find all the orphan strings after summary (strings without a key before them)
            // Pattern: end of a string value, comma, then another string that's not followed by :
            let fixed = jsonString;

            // This regex finds strings that appear to be value-only (no key) in the analysis object
            // Look for pattern: ", "text without colon after the next quote"
            const orphanPattern = /("analysis"\s*:\s*\{[\s\S]*?"summary"\s*:\s*"(?:[^"\\]|\\.)*")\s*,\s*"(?:[^"\\]|\\.)*"(?=\s*,\s*"(?:[^"\\]|\\.)*"(?:\s*,\s*"(?:[^"\\]|\\.)*")*\s*,\s*"key_findings")/g;

            // Simpler approach: find the analysis object and look for any string values not preceded by key:
            // We'll do this by finding entries that match `,"string"` pattern where the string doesn't have : after it

            // Find the analysis block
            const analysisStart = fixed.indexOf('"analysis"');
            if (analysisStart !== -1) {
                // Find where key_findings starts
                const keyFindingsPos = fixed.indexOf('"key_findings"', analysisStart);
                if (keyFindingsPos !== -1) {
                    // Get the substring between summary and key_findings
                    const summaryEnd = fixed.indexOf('"summary"', analysisStart);
                    if (summaryEnd !== -1) {
                        // Find the end of the summary value
                        let pos = summaryEnd + '"summary"'.length;
                        // Skip whitespace and colon
                        while (pos < keyFindingsPos && /[\s:]/.test(fixed[pos])) pos++;
                        // Now we should be at the opening quote of summary value
                        if (fixed[pos] === '"') {
                            // Find the closing quote (accounting for escapes)
                            let inEscape = false;
                            pos++;
                            while (pos < keyFindingsPos) {
                                if (inEscape) {
                                    inEscape = false;
                                } else if (fixed[pos] === '\\') {
                                    inEscape = true;
                                } else if (fixed[pos] === '"') {
                                    break;
                                }
                                pos++;
                            }
                            // pos is now at the closing quote of summary
                            const summaryEndPos = pos + 1;

                            // Extract what's between summary end and key_findings
                            const betweenContent = fixed.substring(summaryEndPos, keyFindingsPos);

                            // Check if there are orphan strings (strings not part of key: value)
                            // Look for pattern: , "something" where the something doesn't have : after quotes
                            const orphanStringPattern = /,\s*"((?:[^"\\]|\\.)*)"\s*(?=[,}]|$)/g;
                            const orphanStrings: string[] = [];
                            let match;
                            let cleanedBetween = betweenContent;

                            while ((match = orphanStringPattern.exec(betweenContent)) !== null) {
                                // Check if this is truly an orphan (no : after it in a reasonable distance)
                                const afterMatch = betweenContent.substring(match.index + match[0].length, match.index + match[0].length + 5);
                                if (!afterMatch.includes(':')) {
                                    orphanStrings.push(match[1]);
                                }
                            }

                            if (orphanStrings.length > 0) {
                                // We found orphan strings - remove them from between section
                                for (const orphan of orphanStrings) {
                                    const escapedOrphan = orphan.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                                    cleanedBetween = cleanedBetween.replace(new RegExp(',\\s*"' + escapedOrphan + '"\\s*', 'g'), '');
                                }

                                // Reconstruct the JSON with cleaned between section
                                // Make sure we have proper comma before key_findings
                                cleanedBetween = cleanedBetween.replace(/,\s*,/g, ',').trim();
                                if (!cleanedBetween.endsWith(',')) {
                                    cleanedBetween = cleanedBetween + ',';
                                }
                                if (cleanedBetween === ',') {
                                    cleanedBetween = ',\n    ';
                                }

                                fixed = fixed.substring(0, summaryEndPos) + cleanedBetween + fixed.substring(keyFindingsPos);
                            }
                        }
                    }
                }
            }

            return fixed;
        }
    } catch (e) {
        console.error('[repairJSON] Error during repair attempt:', e);
    }

    return jsonString;
}


export type DiagnosisStep = 'basic_info' | 'wen_inquiry' | 'wang_tongue' | 'wang_face' | 'wang_part' | 'wen_audio' | 'qie' | 'smart_connect' | 'summary' | 'processing' | 'report'

export default function DiagnosisWizard() {
    const { getModel } = useDoctorLevel()
    const { t, language } = useLanguage()
    const [step, setStep] = useState<DiagnosisStep>('basic_info')

    // Steps with translated labels
    const STEPS = [
        { id: 'basic_info', label: t.steps.basics },
        { id: 'wen_inquiry', label: t.steps.inquiry },
        { id: 'wang_tongue', label: t.steps.tongue },
        { id: 'wang_face', label: t.steps.face },
        { id: 'wen_audio', label: t.steps.audio },
        { id: 'qie', label: t.steps.pulse },
        { id: 'smart_connect', label: t.steps.smartConnect },
    ]
    const [data, setData] = useState<any>({
        basic_info: null,
        wen_inquiry: null,
        wang_tongue: null,
        wang_face: null,
        wang_part: null,
        wen_audio: null,
        wen_chat: [],
        qie: null,
        smart_connect: null
    })
    const [analysisResult, setAnalysisResult] = useState<any>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [currentAnalysisType, setCurrentAnalysisType] = useState<'tongue' | 'face' | 'part'>('tongue')
    const [pendingAnalysis, setPendingAnalysis] = useState<{ type: 'tongue' | 'face' | 'part', image: string } | null>(null)
    const { user, profile } = useAuth()
    const [isSaved, setIsSaved] = useState(false)

    useEffect(() => {
        // Check localStorage first for data passed from dashboard
        const localData = localStorage.getItem('patientProfileData')
        if (localData && !data.basic_info) {
            try {
                const parsed = JSON.parse(localData)
                setData((prev: any) => ({
                    ...prev,
                    basic_info: parsed
                }))
                // We don't remove it here because BasicInfoForm might also need to read it 
                // if it mounts before this effect runs or if it needs to merge.
                // But since we pass it as initialData, BasicInfoForm should be fine.
                // Let's leave it for BasicInfoForm to clean up or keep it as backup.
            } catch (e) {
                console.error('Error parsing local profile data', e)
            }
        } else if (profile && !data.basic_info) {
            setData((prev: any) => ({
                ...prev,
                basic_info: {
                    name: profile.full_name,
                    age: profile.age,
                    gender: profile.gender,
                    height: profile.height,
                    weight: profile.weight,
                    // medical_history: profile.medical_history // BasicInfoForm might not have this field yet, but good to have
                }
            }))
        }
    }, [profile])

    // Manual state management instead of useCompletion
    const [completion, setCompletion] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<Error | null>(null)

    const nextStep = (current: DiagnosisStep) => {
        switch (current) {
            case 'basic_info': setStep('wen_inquiry'); break;
            case 'wen_inquiry': setStep('wang_tongue'); break;
            case 'wang_tongue': setStep('wang_face'); break;
            case 'wang_face': setStep('wang_part'); break;
            case 'wang_part': setStep('wen_audio'); break;
            case 'wen_audio': setStep('qie'); break;
            case 'qie': setStep('smart_connect'); break;
            case 'smart_connect': setStep('summary'); break;
            case 'summary':
                setStep('processing');
                submitConsultation();
                break;
            default: break;
        }
    }

    const prevStep = (current: DiagnosisStep) => {
        switch (current) {
            case 'wen_inquiry': setStep('basic_info'); break;
            case 'wang_tongue': setStep('wen_inquiry'); break;
            case 'wang_face': setStep('wang_tongue'); break;
            case 'wang_part': setStep('wang_face'); break;
            case 'wen_audio': setStep('wang_part'); break;
            case 'qie': setStep('wen_audio'); break;
            case 'smart_connect': setStep('qie'); break;
            case 'summary': setStep('smart_connect'); break;
            default: break;
        }
    }

    const analyzeImage = async (image: string, type: 'tongue' | 'face' | 'part') => {
        setIsAnalyzing(true)
        setAnalysisResult(null)
        setCurrentAnalysisType(type)
        setPendingAnalysis({ type, image })
        try {
            const response = await fetch('/api/analyze-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image, type })
            })
            const result = await response.json()
            console.log('[DiagnosisWizard] Analysis result:', result)

            // Store the observation in the data for final report
            const dataKey = type === 'tongue' ? 'wang_tongue' : type === 'face' ? 'wang_face' : 'wang_part'
            setData((prev: any) => ({
                ...prev,
                [dataKey]: {
                    ...prev[dataKey],
                    observation: result.observation,
                    potential_issues: result.potential_issues || []
                }
            }))

            // Ensure we always have an observation
            if (!result.observation && result.error) {
                setAnalysisResult({
                    observation: `Analysis will be reviewed later. You may proceed.`,
                    potential_issues: []
                })
            } else if (!result.observation) {
                setAnalysisResult({
                    observation: "Analysis pending. You may proceed or retake the photo.",
                    potential_issues: []
                })
            } else {
                setAnalysisResult(result)
            }
        } catch (error) {
            console.error('Analysis failed:', error)
            setAnalysisResult({
                observation: "Analysis will be available in the final report. You may proceed.",
                potential_issues: []
            })
        } finally {
            setIsAnalyzing(false)
            setPendingAnalysis(null)
        }
    }

    const handleSkipAnalysis = (currentStep: 'wang_tongue' | 'wang_face' | 'wang_part') => {
        setIsAnalyzing(false)
        setAnalysisResult(null)
        setPendingAnalysis(null)
        // Mark as skipped but keep the image
        const dataKey = currentStep === 'wang_tongue' ? 'wang_tongue' : currentStep === 'wang_face' ? 'wang_face' : 'wang_part'
        setData((prev: any) => ({
            ...prev,
            [dataKey]: {
                ...prev[dataKey],
                observation: 'Analysis skipped - will be processed with final report',
                skipped: true
            }
        }))
        nextStep(currentStep)
    }

    const submitConsultation = async () => {
        console.log('[DiagnosisWizard] Submitting consultation with data:', data)
        setIsLoading(true)
        setError(null)
        setCompletion('')

        try {
            const response = await fetch('/api/consult', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: 'Analyze this patient data and provide TCM diagnosis',
                    data: data,
                    model: getModel(),
                    language: language // Pass language for multilingual AI response
                })
            })

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`)
            }

            // Read the streaming response
            const reader = response.body?.getReader()
            const decoder = new TextDecoder()
            let fullText = ''

            if (reader) {
                console.log('[DiagnosisWizard] Starting to read stream...')
                while (true) {
                    const { done, value } = await reader.read()
                    if (done) {
                        console.log('[DiagnosisWizard] Stream complete!')
                        break
                    }
                    const chunk = decoder.decode(value, { stream: true })
                    fullText += chunk
                    console.log('[DiagnosisWizard] Received chunk, total length:', fullText.length)
                }
            }

            console.log('[DiagnosisWizard] Final text length:', fullText.length)
            console.log('[DiagnosisWizard] Preview:', fullText.substring(0, 300))
            setCompletion(fullText)

            // Auto-save to Supabase if valid JSON
            try {
                let cleanJson = fullText.replace(/```json\n?|\n?```/g, '').trim();
                let resultData;
                try {
                    resultData = JSON.parse(cleanJson);
                } catch (parseError) {
                    // Try to repair the JSON before saving
                    const repairedJson = repairJSON(cleanJson);
                    resultData = JSON.parse(repairedJson);
                }
                // Inject patient profile into the report data for persistence
                // This ensures we capture the actual patient details entered in the form
                // rather than just the logged-in user's profile
                const reportWithProfile = {
                    ...resultData,
                    patient_profile: {
                        name: data.basic_info?.name || 'Anonymous',
                        age: data.basic_info?.age,
                        gender: data.basic_info?.gender,
                        height: data.basic_info?.height,
                        weight: data.basic_info?.weight
                    }
                };

                if (user) {
                    await supabase.from('inquiries').insert({
                        user_id: user.id,
                        symptoms: data.basic_info?.symptoms || 'Not provided',
                        diagnosis_report: reportWithProfile,
                        created_at: new Date().toISOString()
                    });
                    console.log('[DiagnosisWizard] Saved to Supabase');
                    setIsSaved(true);
                }
            } catch (e) {
                console.error('[DiagnosisWizard] Failed to auto-save:', e);
            }
        } catch (err: any) {
            console.error('[DiagnosisWizard] Error:', err)
            setError(err)
        } finally {
            setIsLoading(false)
        }
    }

    // Map current step to stepper ID (handling sub-steps)
    const getCurrentStepperId = () => {
        if (step === 'wang_part') return 'wang_face' // Group part with face for stepper
        if (step === 'processing' || step === 'report') return 'smart_connect' // Show last step as active or completed
        return step
    }

    return (
        <div className="max-w-4xl mx-auto p-3 md:p-6 pb-8">
            {step !== 'processing' && step !== 'report' && (
                <ProgressStepper currentStep={getCurrentStepperId()} steps={STEPS} />
            )}

            <div className="relative min-h-[400px] md:min-h-[600px]">


                <AnimatePresence mode="wait">
                    {step === 'basic_info' && (
                        <motion.div key="basic_info" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.3 }}>
                            <BasicInfoForm
                                initialData={data.basic_info}
                                onComplete={(result) => {
                                    setData((prev: any) => ({ ...prev, basic_info: result }));
                                    setTimeout(() => nextStep('basic_info'), 0)
                                }} />
                        </motion.div>
                    )}
                    {step === 'wen_inquiry' && (
                        <motion.div key="wen_inquiry" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                            <InquiryStep
                                basicInfo={data.basic_info}
                                onComplete={(result) => {
                                    setData((prev: any) => ({
                                        ...prev,
                                        wen_inquiry: result,
                                        wen_chat: { chat: result.chatHistory }
                                    }));
                                    setTimeout(() => nextStep('wen_inquiry'), 0)
                                }}
                                onBack={() => prevStep('wen_inquiry')}
                            />
                        </motion.div>
                    )}
                    {step === 'wang_tongue' && (
                        <motion.div key="wang_tongue" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                            {isAnalyzing ? (
                                <ImageAnalysisLoader
                                    type="tongue"
                                    onSkip={() => handleSkipAnalysis('wang_tongue')}
                                />
                            ) : analysisResult ? (
                                <ObservationResult
                                    image={data.wang_tongue.image}
                                    observation={analysisResult.observation}
                                    potentialIssues={analysisResult.potential_issues}
                                    type="tongue"
                                    status={analysisResult.status}
                                    message={analysisResult.message}
                                    confidence={analysisResult.confidence}
                                    imageDescription={analysisResult.image_description}
                                    onRetake={() => {
                                        setAnalysisResult(null)
                                        setData((prev: any) => ({ ...prev, wang_tongue: null }))
                                    }}
                                    onContinue={() => {
                                        setAnalysisResult(null)
                                        setTimeout(() => nextStep('wang_tongue'), 0)
                                    }}
                                    onBack={() => prevStep('wang_tongue')}
                                />
                            ) : (
                                <CameraCapture
                                    title={t.tongue.title}
                                    instruction={t.tongue.instructions}
                                    onComplete={(result) => {
                                        setData((prev: any) => ({ ...prev, wang_tongue: result }));
                                        if (result.image) {
                                            analyzeImage(result.image, 'tongue')
                                        } else {
                                            setTimeout(() => nextStep('wang_tongue'), 0)
                                        }
                                    }}
                                    onBack={() => prevStep('wang_tongue')}
                                />
                            )}
                        </motion.div>
                    )}
                    {step === 'wang_face' && (
                        <motion.div key="wang_face" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                            {isAnalyzing ? (
                                <ImageAnalysisLoader
                                    type="face"
                                    onSkip={() => handleSkipAnalysis('wang_face')}
                                />
                            ) : analysisResult ? (
                                <ObservationResult
                                    image={data.wang_face.image}
                                    observation={analysisResult.observation}
                                    potentialIssues={analysisResult.potential_issues}
                                    type="face"
                                    status={analysisResult.status}
                                    message={analysisResult.message}
                                    confidence={analysisResult.confidence}
                                    imageDescription={analysisResult.image_description}
                                    onRetake={() => {
                                        setAnalysisResult(null)
                                        setData((prev: any) => ({ ...prev, wang_face: null }))
                                    }}
                                    onContinue={() => {
                                        setAnalysisResult(null)
                                        setTimeout(() => nextStep('wang_face'), 0)
                                    }}
                                    onBack={() => prevStep('wang_face')}
                                />
                            ) : (
                                <CameraCapture
                                    title={t.face.title}
                                    instruction={t.face.instructions}
                                    onComplete={(result) => {
                                        setData((prev: any) => ({ ...prev, wang_face: result }));
                                        if (result.image) {
                                            analyzeImage(result.image, 'face')
                                        } else {
                                            setTimeout(() => nextStep('wang_face'), 0)
                                        }
                                    }}
                                    onBack={() => prevStep('wang_face')}
                                />
                            )}
                        </motion.div>
                    )}
                    {step === 'wang_part' && (
                        <motion.div key="wang_part" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                            {isAnalyzing ? (
                                <ImageAnalysisLoader
                                    type="part"
                                    onSkip={() => handleSkipAnalysis('wang_part')}
                                />
                            ) : analysisResult ? (
                                <ObservationResult
                                    image={data.wang_part.image}
                                    observation={analysisResult.observation}
                                    potentialIssues={analysisResult.potential_issues}
                                    type="part"
                                    status={analysisResult.status}
                                    message={analysisResult.message}
                                    confidence={analysisResult.confidence}
                                    imageDescription={analysisResult.image_description}
                                    onRetake={() => {
                                        setAnalysisResult(null)
                                        setData((prev: any) => ({ ...prev, wang_part: null }))
                                    }}
                                    onContinue={() => {
                                        setAnalysisResult(null)
                                        setTimeout(() => nextStep('wang_part'), 0)
                                    }}
                                    onBack={() => prevStep('wang_part')}
                                />
                            ) : (
                                <CameraCapture
                                    title={t.bodyPart.title}
                                    instruction={t.bodyPart.instructions}
                                    required={false}
                                    onComplete={(result) => {
                                        setData((prev: any) => ({ ...prev, wang_part: result }));
                                        if (result.image) {
                                            analyzeImage(result.image, 'part')
                                        } else {
                                            setTimeout(() => nextStep('wang_part'), 0)
                                        }
                                    }}
                                    onBack={() => prevStep('wang_part')}
                                />
                            )}
                        </motion.div>
                    )}
                    {step === 'wen_audio' && (
                        <motion.div key="wen_audio" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                            <AudioRecorder
                                onComplete={(result) => {
                                    setData((prev: any) => ({ ...prev, wen_audio: result }));
                                    setTimeout(() => nextStep('wen_audio'), 0)
                                }}
                                onBack={() => prevStep('wen_audio')}
                            />
                        </motion.div>
                    )}

                    {step === 'qie' && (
                        <motion.div key="qie" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                            <PulseCheck
                                onComplete={(result) => {
                                    setData((prev: any) => ({ ...prev, qie: result }));
                                    nextStep('qie');
                                }}
                                onBack={() => prevStep('qie')}
                            />
                        </motion.div>
                    )}
                    {step === 'smart_connect' && (
                        <motion.div key="smart_connect" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                            <SmartConnectStep
                                initialData={data.smart_connect || {}}
                                onComplete={(result) => {
                                    setData((prev: any) => ({ ...prev, smart_connect: result }));
                                    nextStep('smart_connect');
                                }}
                                onBack={() => prevStep('smart_connect')}
                            />
                        </motion.div>
                    )}
                    {step === 'summary' && (
                        <motion.div key="summary" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                            <DiagnosisSummary
                                data={data}
                                onConfirm={(summaries, options) => {
                                    setData((prev: any) => ({
                                        ...prev,
                                        verified_summaries: summaries,
                                        report_options: options
                                    }));
                                    nextStep('summary');
                                }}
                                onBack={() => prevStep('summary')}
                            />
                        </motion.div>
                    )}
                    {step === 'processing' && (
                        <motion.div key="processing" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                            {/* Show loading screen while waiting for completion, or if there's no response yet */}
                            {(isLoading || (!error && !completion)) ? (
                                <AnalysisLoadingScreen basicInfo={data.basic_info} />
                            ) : error ? (
                                <Card className="p-8 border-none shadow-xl bg-white/80 backdrop-blur-sm">
                                    <div className="p-6 bg-red-50 text-red-800 rounded-xl border border-red-100">
                                        <h3 className="font-bold text-lg mb-2">API Error</h3>
                                        <p className="mb-2">Failed to connect to the analysis service.</p>
                                        <p className="text-sm text-red-600 mb-4">{error.message}</p>
                                        <Button
                                            onClick={() => {
                                                setStep('processing');
                                                submitConsultation();
                                            }}
                                            className="mr-2 bg-emerald-600 text-white hover:bg-emerald-700"
                                        >
                                            Retry Analysis
                                        </Button>
                                        <Button
                                            onClick={() => setStep('basic_info')}
                                            variant="outline"
                                            className="bg-red-100 text-red-800 hover:bg-red-200 border-none"
                                        >
                                            Start Over
                                        </Button>
                                    </div>
                                </Card>
                            ) : (
                                <Card className="p-8 border-none shadow-xl bg-white/80 backdrop-blur-sm">
                                    <div className="text-left w-full">
                                        {(() => {
                                            try {
                                                let cleanJson = completion.replace(/```json\n?|\n?```/g, '').trim();
                                                // First attempt: try parsing directly
                                                let resultData;
                                                try {
                                                    resultData = JSON.parse(cleanJson);
                                                } catch (parseError) {
                                                    // Second attempt: try to repair the JSON
                                                    console.log('[DiagnosisWizard] Initial parse failed, attempting JSON repair...');
                                                    const repairedJson = repairJSON(cleanJson);
                                                    resultData = JSON.parse(repairedJson);
                                                    console.log('[DiagnosisWizard] JSON repair successful!');
                                                }

                                                // Normalize data structure - now keeping the full structure
                                                const normalizedData = {
                                                    diagnosis: resultData.diagnosis || 'Diagnosis pending',
                                                    constitution: resultData.constitution || 'Not determined',
                                                    analysis: resultData.analysis || '',
                                                    recommendations: {
                                                        food: resultData.recommendations?.food || resultData.recommendations?.food_therapy?.beneficial || [],
                                                        avoid: resultData.recommendations?.avoid || resultData.recommendations?.food_therapy?.avoid || [],
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
                                                    <DiagnosisReport
                                                        data={normalizedData}
                                                        saved={isSaved}
                                                        patientInfo={data.basic_info}
                                                        reportOptions={data.report_options}
                                                        smartConnectData={data.smart_connect}
                                                        onRestart={() => {
                                                            setData({
                                                                basic_info: null,
                                                                wen_inquiry: null,
                                                                wang_tongue: null,
                                                                wang_face: null,
                                                                wang_part: null,
                                                                wen_audio: null,
                                                                wen_chat: [],
                                                                qie: null,
                                                                smart_connect: null
                                                            });
                                                            setStep('basic_info');
                                                            setIsSaved(false);
                                                        }}
                                                    />
                                                );
                                            } catch (e) {
                                                console.error("Failed to parse diagnosis result:", e);
                                                console.error("Raw completion:", completion);
                                                return (
                                                    <div className="p-6 bg-red-50 text-red-800 rounded-xl border border-red-100">
                                                        <h3 className="font-bold text-lg mb-2">Analysis Error</h3>
                                                        <p className="mb-2">We encountered an issue parsing the diagnosis result.</p>
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
                                                            Retry
                                                        </Button>
                                                        <Button
                                                            onClick={() => setStep('basic_info')}
                                                            variant="outline"
                                                            className="bg-red-100 text-red-800 hover:bg-red-200 border-none"
                                                        >
                                                            Restart Diagnosis
                                                        </Button>
                                                    </div>
                                                );
                                            }
                                        })()}
                                    </div>
                                </Card>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
