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
import { InquiryWizard } from './InquiryWizard'
import { Card } from '@/components/ui/card'
import { DiagnosisReport } from './DiagnosisReport'
import { AnalysisLoadingScreen } from './AnalysisLoadingScreen'
import { ProgressStepper } from './ProgressStepper'
import { Button } from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import { useDoctorLevel } from '@/contexts/DoctorContext'
import { useDeveloper } from '@/contexts/DeveloperContext'
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

const MOCK_IMAGE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
const MOCK_AUDIO = "data:audio/webm;base64,UklGRi4AAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";

const MOCK_PROFILES = [
    {
        id: 'profile1',
        name: 'Elderly Woman (Kidney Disease)',
        description: '72yo female, chronic kidney disease, lower back pain, edema.',
        data: {
            basic_info: {
                name: "Zhang Wei",
                age: "72",
                gender: "female",
                height: "160",
                weight: "55",
                symptoms: "Lower back pain, fatigue, swelling in ankles, frequent urination at night."
            },
            wen_inquiry: {
                summary: "Patient reports chronic lower back pain and fatigue. Experiences edema in lower extremities and nocturia. Tongue diagnosis suggests Kidney Yang deficiency.",
                chatHistory: [
                    { role: 'assistant', content: 'Hello, I see you are experiencing lower back pain. Can you tell me more about it?' },
                    { role: 'user', content: 'It hurts mostly at night and feels cold.' },
                    { role: 'assistant', content: 'Do you have any other symptoms like frequent urination?' },
                    { role: 'user', content: 'Yes, I wake up 3-4 times a night.' }
                ],
                reportFiles: [
                    { name: "Blood_Test_2023.pdf", type: "application/pdf", data: "", extractedText: "Kidney function test shows slightly elevated creatinine." }
                ],
                medicineFiles: [
                    { name: "Blood_Pressure_Meds.jpg", type: "image/jpeg", data: MOCK_IMAGE, extractedText: "Amlodipine 5mg" }
                ],
                files: [] // Will be populated by merging reportFiles and medicineFiles if needed, but InquiryWizard handles separation
            },
            wang_tongue: {
                observation: "Pale, swollen tongue with tooth marks. White, slippery coating.",
                potential_issues: ["Kidney Yang Deficiency", "Dampness accumulation"],
                image: MOCK_IMAGE
            },
            wang_face: {
                observation: "Pale complexion, dark circles under eyes, puffiness.",
                potential_issues: ["Kidney Deficiency"],
                image: MOCK_IMAGE
            },
            wang_part: {
                observation: "Swelling in ankles (Edema).",
                potential_issues: ["Water retention"],
                image: MOCK_IMAGE
            },
            wen_audio: {
                audio: MOCK_AUDIO,
                analysis: {
                    overall_observation: "Low, weak voice.",
                    voice_quality_analysis: { observation: "Weak", severity: "warning", tcm_indicators: ["Qi Deficiency"] },
                    confidence: "high",
                    status: "success"
                }
            },
            qie: {
                bpm: 62,
                pulseQualities: [
                    { id: 'chen', nameZh: '沉脉', nameEn: 'Deep (Chen)' },
                    { id: 'ruo', nameZh: '弱脉', nameEn: 'Weak (Ruo)' },
                    { id: 'chi', nameZh: '迟脉', nameEn: 'Slow (Chi)' }
                ]
            },
            smart_connect: {
                pulseRate: 62,
                bloodPressure: "140/90",
                bloodOxygen: 96,
                bodyTemp: 36.2,
                hrv: 35,
                stressLevel: "High"
            }
        }
    },
    {
        id: 'profile2',
        name: 'Woman 30+ (Stomach Issues)',
        description: '34yo female, persistent stomachache, bloating, stress.',
        data: {
            basic_info: {
                name: "Li Na",
                age: "34",
                gender: "female",
                height: "165",
                weight: "58",
                symptoms: "Stomach pain, bloating, acid reflux, worse when stressed."
            },
            wen_inquiry: {
                summary: "Patient complains of epigastric pain and distension, aggravated by emotional stress. Reports acid regurgitation.",
                chatHistory: [
                    { role: 'assistant', content: 'When does the stomach pain usually occur?' },
                    { role: 'user', content: 'Usually after eating or when I am stressed at work.' }
                ],
                reportFiles: [],
                medicineFiles: [
                    { name: "Gastric_Relief.jpg", type: "image/jpeg", data: MOCK_IMAGE, extractedText: "Omeprazole 20mg" }
                ],
                files: []
            },
            wang_tongue: {
                observation: "Red sides, thin white or yellow coating.",
                potential_issues: ["Liver Qi Stagnation", "Stomach Heat"],
                image: MOCK_IMAGE
            },
            wang_face: {
                observation: "Sallow complexion.",
                potential_issues: ["Spleen Deficiency"],
                image: MOCK_IMAGE
            },
            wang_part: {
                observation: "Abdominal tenderness.",
                potential_issues: ["Qi Stagnation"],
                image: MOCK_IMAGE
            },
            wen_audio: {
                audio: MOCK_AUDIO,
                analysis: {
                    overall_observation: "Normal voice, frequent sighing.",
                    voice_quality_analysis: { observation: "Sighing", severity: "normal", tcm_indicators: ["Liver Qi Stagnation"] },
                    confidence: "high",
                    status: "success"
                }
            },
            qie: {
                bpm: 78,
                pulseQualities: [
                    { id: 'xian', nameZh: '弦脉', nameEn: 'Wiry (Xian)' }
                ]
            },
            smart_connect: {
                pulseRate: 78,
                bloodPressure: "110/70",
                bloodOxygen: 98,
                bodyTemp: 36.6,
                hrv: 65,
                stressLevel: "Moderate"
            }
        }
    },
    {
        id: 'profile3',
        name: 'Elderly Man (Stroke/Hypertension)',
        description: '68yo male, recent stroke, high blood pressure, dizziness.',
        data: {
            basic_info: {
                name: "Wang Qiang",
                age: "68",
                gender: "male",
                height: "172",
                weight: "75",
                symptoms: "Dizziness, numbness in right arm, difficulty speaking clearly, history of hypertension."
            },
            wen_inquiry: {
                summary: "Patient recovering from recent stroke. Reports dizziness and hemiparesthesia. History of hypertension.",
                chatHistory: [
                    { role: 'assistant', content: 'How long have you had high blood pressure?' },
                    { role: 'user', content: 'For about 10 years.' }
                ],
                reportFiles: [
                    { name: "Hospital_Discharge.pdf", type: "application/pdf", data: "", extractedText: "Ischemic stroke, hypertension stage 2." }
                ],
                medicineFiles: [
                    { name: "Aspirin.jpg", type: "image/jpeg", data: MOCK_IMAGE, extractedText: "Aspirin 100mg" }
                ],
                files: []
            },
            wang_tongue: {
                observation: "Deviated, purple spots, greasy coating.",
                potential_issues: ["Blood Stasis", "Wind-Phlegm"],
                image: MOCK_IMAGE
            },
            wang_face: {
                observation: "Red face, facial asymmetry.",
                potential_issues: ["Liver Yang Rising", "Wind Stroke"],
                image: MOCK_IMAGE
            },
            wang_part: {
                observation: "Numbness in limbs.",
                potential_issues: ["Meridian blockage"],
                image: MOCK_IMAGE
            },
            wen_audio: {
                audio: MOCK_AUDIO,
                analysis: {
                    overall_observation: "Slurred speech.",
                    voice_quality_analysis: { observation: "Slurred", severity: "high", tcm_indicators: ["Wind-Phlegm blocking orifices"] },
                    confidence: "high",
                    status: "success"
                }
            },
            qie: {
                bpm: 85,
                pulseQualities: [
                    { id: 'xian', nameZh: '弦脉', nameEn: 'Wiry (Xian)' },
                    { id: 'hua', nameZh: '滑脉', nameEn: 'Slippery (Hua)' }
                ]
            },
            smart_connect: {
                pulseRate: 85,
                bloodPressure: "150/95",
                bloodOxygen: 95,
                bodyTemp: 36.8,
                hrv: 40,
                stressLevel: "High"
            }
        }
    }
]

export default function DiagnosisWizard() {
    const { getModel } = useDoctorLevel()
    const { t, language } = useLanguage()
    const { isDeveloperMode } = useDeveloper()
    const [step, setStep] = useState<DiagnosisStep>('basic_info')
    const [showTestProfiles, setShowTestProfiles] = useState(false)

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

            {/* Developer Mode Controls */}
            {isDeveloperMode && (
                <>
                    <div className="fixed bottom-4 right-4 z-50 p-4 bg-slate-800 text-white rounded-xl shadow-2xl border border-slate-700 max-w-xs opacity-90 hover:opacity-100 transition-opacity">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400">Developer Mode</h3>
                            <span className="text-[10px] bg-slate-700 px-2 py-0.5 rounded text-slate-300">Active</span>
                        </div>

                        <div className="space-y-2">
                            <div>
                                <label className="text-[10px] text-slate-400 block mb-1">Jump to Step</label>
                                <select
                                    value={step}
                                    onChange={(e) => setStep(e.target.value as DiagnosisStep)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                                >
                                    <option value="basic_info">Basic Info</option>
                                    <option value="wen_inquiry">Inquiry</option>
                                    <option value="wang_tongue">Tongue Analysis</option>
                                    <option value="wang_face">Face Analysis</option>
                                    <option value="wang_part">Body Part</option>
                                    <option value="wen_audio">Audio</option>
                                    <option value="qie">Pulse</option>
                                    <option value="smart_connect">Smart Connect</option>
                                    <option value="summary">Summary</option>
                                    <option value="processing">Processing</option>
                                    <option value="report">Report</option>
                                </select>
                            </div>

                            <button
                                onClick={() => setShowTestProfiles(true)}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs py-1.5 rounded transition-colors font-medium"
                            >
                                Test Scenarios (Fill Data)
                            </button>

                            <button
                                onClick={() => {
                                    // Use the first mock profile for data
                                    const mockData = MOCK_PROFILES[0].data;
                                    setData((prev: any) => ({
                                        ...prev,
                                        ...mockData,
                                        report_options: {
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
                                        },
                                        verified_summaries: {
                                            inquiry: mockData.wen_inquiry.summary,
                                            tongue: mockData.wang_tongue.observation,
                                            face: mockData.wang_face.observation,
                                            pulse: "Pulse analysis completed"
                                        }
                                    }));

                                    const mockReport = {
                                        diagnosis: {
                                            primary_pattern: "Kidney Yang Deficiency",
                                            secondary_patterns: ["Dampness Accumulation"],
                                            affected_organs: ["Kidney", "Spleen"],
                                            pathomechanism: "Kidney Yang deficiency failing to transform water, leading to dampness and edema."
                                        },
                                        constitution: {
                                            type: "Yang Deficiency",
                                            description: "Tendency to be cold, fatigue, and water retention."
                                        },
                                        analysis: {
                                            summary: "Patient presents with classic signs of Kidney Yang Deficiency.",
                                            key_findings: {
                                                from_inquiry: "Lower back pain, nocturia",
                                                from_visual: "Pale swollen tongue",
                                                from_pulse: "Deep, weak"
                                            }
                                        },
                                        recommendations: {
                                            food: ["Walnuts", "Lamb", "Ginger", "Cinnamon"],
                                            avoid: ["Raw foods", "Cold drinks", "Salads"],
                                            lifestyle: ["Keep warm", "Moxa therapy", "Gentle exercise"],
                                            acupoints: ["KI3 (Taixi)", "BL23 (Shenshu)", "CV4 (Guanyuan)"],
                                            herbal_formulas: [
                                                { "name": "Jin Gui Shen Qi Wan", "purpose": "Warm Kidney Yang" }
                                            ],
                                            exercise: ["Tai Chi", "Qigong"],
                                            sleep_guidance: "Sleep early, keep feet warm.",
                                            emotional_care: "Avoid fear and anxiety."
                                        },
                                        patient_summary: {
                                            name: mockData.basic_info.name,
                                            age: mockData.basic_info.age,
                                            gender: mockData.basic_info.gender
                                        },
                                        timestamp: new Date().toISOString()
                                    };
                                    setCompletion(JSON.stringify(mockReport));
                                    setStep('processing');
                                }}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs py-1.5 rounded transition-colors font-medium mt-2"
                            >
                                Fill & View Mock Report
                            </button>

                            <div className="pt-2 border-t border-slate-700">
                                <p className="text-[10px] text-slate-500">Current Step: {step}</p>
                            </div>
                        </div>
                    </div>

                    {/* Test Profiles Modal */}
                    {showTestProfiles && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden">
                                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                    <h3 className="font-bold text-slate-800">Select Test Profile</h3>
                                    <button
                                        onClick={() => setShowTestProfiles(false)}
                                        className="text-slate-400 hover:text-slate-600"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
                                    {MOCK_PROFILES.map((profile) => (
                                        <button
                                            key={profile.id}
                                            onClick={() => {
                                                setData((prev: any) => ({
                                                    ...prev,
                                                    ...profile.data
                                                }))
                                                setShowTestProfiles(false)
                                                // Optional: Alert user
                                                // alert(`Loaded profile: ${profile.name}`)
                                            }}
                                            className="w-full text-left p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-bold text-slate-800 group-hover:text-emerald-700">{profile.name}</h4>
                                                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full group-hover:bg-emerald-100 group-hover:text-emerald-600">
                                                    Full Data
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500">{profile.description}</p>
                                        </button>
                                    ))}
                                </div>
                                <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 text-center">
                                    Selecting a profile will overwrite current diagnosis data.
                                </div>
                            </div>
                        </div>
                    )}
                </>
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
                            <InquiryWizard
                                basicInfo={data.basic_info}
                                initialData={data.wen_inquiry}
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
                            ) : (analysisResult || data.wang_tongue) ? (
                                <ObservationResult
                                    image={data.wang_tongue?.image}
                                    observation={analysisResult?.observation || data.wang_tongue?.observation}
                                    potentialIssues={analysisResult?.potential_issues || data.wang_tongue?.potential_issues}
                                    type="tongue"
                                    status={analysisResult?.status || 'success'}
                                    message={analysisResult?.message}
                                    confidence={analysisResult?.confidence}
                                    imageDescription={analysisResult?.image_description}
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
                            ) : (analysisResult || data.wang_face) ? (
                                <ObservationResult
                                    image={data.wang_face?.image}
                                    observation={analysisResult?.observation || data.wang_face?.observation}
                                    potentialIssues={analysisResult?.potential_issues || data.wang_face?.potential_issues}
                                    type="face"
                                    status={analysisResult?.status || 'success'}
                                    message={analysisResult?.message}
                                    confidence={analysisResult?.confidence}
                                    imageDescription={analysisResult?.image_description}
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
                            ) : (analysisResult || data.wang_part) ? (
                                <ObservationResult
                                    image={data.wang_part?.image}
                                    observation={analysisResult?.observation || data.wang_part?.observation}
                                    potentialIssues={analysisResult?.potential_issues || data.wang_part?.potential_issues}
                                    type="part"
                                    status={analysisResult?.status || 'success'}
                                    message={analysisResult?.message}
                                    confidence={analysisResult?.confidence}
                                    imageDescription={analysisResult?.image_description}
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
                                onConfirm={(summaries, options, additionalInfo) => {
                                    setData((prev: any) => ({
                                        ...prev,
                                        verified_summaries: summaries,
                                        report_options: options,
                                        basic_info: {
                                            ...prev.basic_info,
                                            ...additionalInfo
                                        }
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
