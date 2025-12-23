'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    Check,
    User,
    FileText,
    Activity,
    Stethoscope,
    ClipboardList,
    FileOutput
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { motion, AnimatePresence } from 'framer-motion'
import { useDiagnosisProgress } from '@/contexts/DiagnosisProgressContext'

// Extracted Sub-Components
import { CollapsibleOptionsSection, CheckboxOption, SummaryEditCard } from './summary'

interface DiagnosisSummaryProps {
    data: any
    onConfirm: (confirmedData: any, options: any, additionalInfo?: any) => void
    onBack: () => void
}

// Comprehensive report options interface
interface ReportOptions {
    // Patient Information Section
    includePatientName: boolean
    includePatientAge: boolean
    includePatientGender: boolean
    includePatientContact: boolean
    includePatientAddress: boolean
    includeEmergencyContact: boolean

    // Vital Signs & Measurements
    includeVitalSigns: boolean
    includeBMI: boolean
    includeSmartConnectData: boolean

    // Medical History
    includeMedicalHistory: boolean
    includeAllergies: boolean
    includeCurrentMedications: boolean
    includePastDiagnoses: boolean
    includeFamilyHistory: boolean

    // TCM Recommendations
    suggestMedicine: boolean
    suggestDoctor: boolean
    includeDietary: boolean
    includeLifestyle: boolean
    includeAcupuncture: boolean
    includeExercise: boolean
    includeSleepAdvice: boolean
    includeEmotionalWellness: boolean

    // Report Extras
    includePrecautions: boolean
    includeFollowUp: boolean
    includeQRCode: boolean
    includeTimestamp: boolean
    includeDoctorSignature: boolean
}

type WizardStep = 'observations' | 'inquiry' | 'options'

/**
 * STABILITY NOTE: This component interacts with DiagnosisProgressContext
 * which can trigger parent re-renders. ALL objects/arrays used in
 * useEffect dependencies or passed to Context MUST be memoized.
 * See fix.md for the infinite loop incident (Dec 14, 2025).
 */
export function DiagnosisSummary({ data, onConfirm, onBack }: DiagnosisSummaryProps) {
    const { t } = useLanguage()
    const { setNavigationState } = useDiagnosisProgress()
    const [currentStep, setCurrentStep] = useState<WizardStep>('observations')
    const [summaries, setSummaries] = useState<Record<string, string>>({})
    const [additionalInfo, setAdditionalInfo] = useState({
        address: '',
        contact: '',
        emergencyContact: ''
    })
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        patientInfo: true,
        vitalSigns: false,
        medicalHistory: false,
        recommendations: true,
        reportExtras: false
    })
    const [options, setOptions] = useState<ReportOptions>({
        // Patient Information - defaults
        includePatientName: true,
        includePatientAge: true,
        includePatientGender: true,
        includePatientContact: false,
        includePatientAddress: false,
        includeEmergencyContact: false,

        // Vital Signs & Measurements
        includeVitalSigns: true,
        includeBMI: true,
        includeSmartConnectData: true,

        // Medical History
        includeMedicalHistory: false,
        includeAllergies: false,
        includeCurrentMedications: false,
        includePastDiagnoses: false,
        includeFamilyHistory: false,

        // TCM Recommendations
        suggestMedicine: true,
        suggestDoctor: true,
        includeDietary: true,
        includeLifestyle: true,
        includeAcupuncture: true,
        includeExercise: true,
        includeSleepAdvice: true,
        includeEmotionalWellness: false,

        // Report Extras
        includePrecautions: true,
        includeFollowUp: true,
        includeQRCode: false,
        includeTimestamp: true,
        includeDoctorSignature: false
    })

    useEffect(() => {
        // Initialize summaries from data
        const initialSummaries: Record<string, string> = {}

        // Basic Info
        if (data.basic_info) {
            const info = data.basic_info

            // Format symptoms display
            let symptomDisplay = ''
            if (info.mainComplaint) {
                symptomDisplay += `${t.basicInfo.mainConcern}: ${info.mainComplaint}`
            }
            if (info.otherSymptoms) {
                if (symptomDisplay) symptomDisplay += '\n'
                symptomDisplay += `${t.basicInfo.otherSymptoms}: ${info.otherSymptoms}`
            }
            if (!symptomDisplay) {
                symptomDisplay = info.symptoms || t.common.none
            }

            initialSummaries['basic_info'] = `${t.basicInfo.fullName}: ${info.name}\n${t.basicInfo.age}: ${info.age}\n${t.basicInfo.gender}: ${info.gender}\n${t.basicInfo.height}: ${info.height}cm\n${t.basicInfo.weight}: ${info.weight}kg\n\n${symptomDisplay}`
        }

        // Inquiry
        if (data.wen_inquiry) {
            initialSummaries['wen_inquiry'] = data.wen_inquiry.summary || t.diagnosisSummary.defaultMessages.inquiryCompleted
        }

        // Tongue
        if (data.wang_tongue) {
            initialSummaries['wang_tongue'] = data.wang_tongue.observation || t.diagnosisSummary.defaultMessages.noObservation
        }

        // Face
        if (data.wang_face) {
            initialSummaries['wang_face'] = data.wang_face.observation || t.diagnosisSummary.defaultMessages.noObservation
        }

        // Body Part
        if (data.wang_part) {
            initialSummaries['wang_part'] = data.wang_part.observation || t.diagnosisSummary.defaultMessages.noObservation
        }

        // Audio
        if (data.wen_audio) {
            initialSummaries['wen_audio'] = data.wen_audio.transcription || data.wen_audio.analysis || t.diagnosisSummary.defaultMessages.audioCompleted
        }

        // Pulse
        if (data.qie) {
            const qualities = data.qie.pulseQualities?.map((q: any) => q.nameEn).join(', ') || t.common.none
            initialSummaries['qie'] = `BPM: ${data.qie.bpm}\n${t.pulse.tcmPulseQualities}: ${qualities}`
        }

        // Smart Connect
        if (data.smart_connect) {
            const sc = data.smart_connect
            const metrics = []
            if (sc.pulseRate) metrics.push(`${t.pulse.pulseRate}: ${sc.pulseRate} BPM`)
            if (sc.bloodPressure) metrics.push(`${t.pulse.bloodPressure}: ${sc.bloodPressure} mmHg`)
            if (sc.bloodOxygen) metrics.push(`${t.pulse.bloodOxygen}: ${sc.bloodOxygen}%`)
            if (sc.bodyTemp) metrics.push(`${t.pulse.bodyTemperature}: ${sc.bodyTemp}°C`)
            if (sc.hrv) metrics.push(`HRV: ${sc.hrv} ms`)
            if (sc.stressLevel) metrics.push(`Stress Level: ${sc.stressLevel}`)
            initialSummaries['smart_connect'] = metrics.length > 0 ? metrics.join('\n') : t.diagnosisSummary.defaultMessages.noDeviceData
        }

        setSummaries(initialSummaries)
    }, [data, t])

    // FIX: Memoize handlers to prevent unnecessary re-renders
    // Using functional updaters means no dependencies needed
    const handleSummaryChange = useCallback((key: string, value: string) => {
        setSummaries(prev => ({ ...prev, [key]: value }))
    }, [])

    const handleOptionChange = useCallback((key: keyof ReportOptions, checked: boolean) => {
        setOptions(prev => ({ ...prev, [key]: checked }))
    }, [])

    const handleConfirm = useCallback(() => {
        onConfirm(summaries, options, additionalInfo)
    }, [onConfirm, summaries, options, additionalInfo])

    // FIX: Memoize steps to prevent infinite re-render loop caused by unstable dependencies updating Context
    const steps = useMemo(() => [
        { id: 'observations', title: t.diagnosisSummary.sections.wangTongue, icon: Stethoscope }, // Using Tongue title as representative for observations
        { id: 'inquiry', title: t.diagnosisSummary.sections.wenInquiry, icon: ClipboardList },
        { id: 'options', title: t.diagnosisSummary.reportOptions.title, icon: FileOutput },
    ], [t])

    const currentStepIndex = steps.findIndex(s => s.id === currentStep)

    // Refs to store the latest versions of handlers to avoid stale closures
    const onBackRef = useRef(onBack)
    const onConfirmRef = useRef(onConfirm)
    const summariesRef = useRef(summaries)
    const optionsRef = useRef(options)
    const additionalInfoRef = useRef(additionalInfo)

    // Keep refs up to date
    useEffect(() => {
        onBackRef.current = onBack
        onConfirmRef.current = onConfirm
        summariesRef.current = summaries
        optionsRef.current = options
        additionalInfoRef.current = additionalInfo
    }, [onBack, onConfirm, summaries, options, additionalInfo])

    const handleNext = useCallback(() => {
        const stepIndex = steps.findIndex(s => s.id === currentStep)
        if (stepIndex < steps.length - 1) {
            setCurrentStep(steps[stepIndex + 1].id as WizardStep)
        } else {
            onConfirmRef.current(summariesRef.current, optionsRef.current, additionalInfoRef.current)
        }
    }, [currentStep, steps])

    const handleBack = useCallback(() => {
        const stepIndex = steps.findIndex(s => s.id === currentStep)
        if (stepIndex > 0) {
            setCurrentStep(steps[stepIndex - 1].id as WizardStep)
        } else {
            onBackRef.current()
        }
    }, [currentStep, steps])

    // Sync with global navigation bar (for mobile)
    useEffect(() => {
        setNavigationState({
            onNext: handleNext,
            onBack: handleBack,
            onSkip: undefined, // No skip for summary steps
            showNext: true,
            showBack: true,
            showSkip: false
        })
    }, [setNavigationState, handleNext, handleBack])

    // FIX: Memoize section arrays to prevent recreation on every render
    const observationSections = useMemo(() => [
        { id: 'wang_tongue', title: t.diagnosisSummary.sections.wangTongue },
        { id: 'wang_face', title: t.diagnosisSummary.sections.wangFace },
        { id: 'wang_part', title: t.diagnosisSummary.sections.wangPart },
        { id: 'wen_audio', title: t.diagnosisSummary.sections.wenAudio },
        { id: 'qie', title: t.diagnosisSummary.sections.qie },
    ], [t])

    const inquirySections = useMemo(() => [
        { id: 'basic_info', title: t.diagnosisSummary.sections.basicInfo },
        { id: 'wen_inquiry', title: t.diagnosisSummary.sections.wenInquiry },
        { id: 'smart_connect', title: t.diagnosisSummary.sections.smartConnect },
    ], [t])

    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
    }

    const renderObservationsStep = () => {
        // observationSections is now memoized above
        return (
            <div className="space-y-6">
                <div className="bg-blue-50/50 backdrop-blur-sm p-4 rounded-xl border border-blue-100 mb-6">
                    <p className="text-sm text-blue-800 leading-relaxed">
                        Please review and edit the clinical observations below. These will be included in the final report.
                    </p>
                </div>
                {observationSections.map(section => {
                    if (!summaries[section.id]) return null

                    // Check for image in the corresponding data section
                    const sectionData = data[section.id]
                    const imageSrc = sectionData?.image

                    return (
                        <SummaryEditCard
                            key={section.id}
                            title={section.title}
                            value={summaries[section.id]}
                            onChange={(newValue) => handleSummaryChange(section.id, newValue)}
                            imageSrc={imageSrc}
                        />
                    )
                })}
            </div>
        )
    }

    const renderInquiryStep = () => {
        // inquirySections is now memoized above
        return (
            <div className="space-y-6">
                <div className="bg-blue-50/50 backdrop-blur-sm p-4 rounded-xl border border-blue-100 mb-6">
                    <p className="text-sm text-blue-800 leading-relaxed">
                        Please review the patient's basic information and inquiry details.
                    </p>
                </div>
                {inquirySections.map(section => {
                    if (!summaries[section.id]) return null
                    return (
                        <SummaryEditCard
                            key={section.id}
                            title={section.title}
                            value={summaries[section.id]}
                            onChange={(newValue) => handleSummaryChange(section.id, newValue)}
                        />
                    )
                })}
            </div>
        )
    }

    const renderOptionsStep = () => {
        return (
            <div className="space-y-4">
                <div className="bg-blue-50/50 backdrop-blur-sm p-4 rounded-xl border border-blue-100 mb-6">
                    <p className="text-sm text-blue-800 leading-relaxed">
                        Customize what information to include in the final generated report.
                    </p>
                </div>

                {/* Patient Information Section */}
                <CollapsibleOptionsSection
                    id="patientInfo"
                    title={t.diagnosisSummary.reportOptions.patientInfo}
                    subtitle={t.diagnosisSummary.reportOptions.demographics}
                    icon={User}
                    iconBgColor="bg-emerald-100"
                    iconColor="text-emerald-600"
                    isExpanded={expandedSections.patientInfo}
                    onToggle={() => toggleSection('patientInfo')}
                    delay={0.1}
                >
                    <CheckboxOption
                        id="includePatientName"
                        label={t.diagnosisSummary.reportOptions.patientName}
                        checked={options.includePatientName}
                        onChange={(c) => handleOptionChange('includePatientName', c)}
                    />
                    <CheckboxOption
                        id="includePatientAge"
                        label={t.diagnosisSummary.reportOptions.age}
                        checked={options.includePatientAge}
                        onChange={(c) => handleOptionChange('includePatientAge', c)}
                    />
                    <CheckboxOption
                        id="includePatientGender"
                        label={t.diagnosisSummary.reportOptions.gender}
                        checked={options.includePatientGender}
                        onChange={(c) => handleOptionChange('includePatientGender', c)}
                    />
                    <CheckboxOption
                        id="includePatientContact"
                        label={t.diagnosisSummary.reportOptions.contactInfo}
                        checked={options.includePatientContact}
                        onChange={(c) => handleOptionChange('includePatientContact', c)}
                    >
                        <Input
                            placeholder="Enter contact number"
                            value={additionalInfo.contact}
                            onChange={(e) => setAdditionalInfo(prev => ({ ...prev, contact: e.target.value }))}
                            className="w-full h-9 text-sm bg-white"
                        />
                    </CheckboxOption>
                    <CheckboxOption
                        id="includePatientAddress"
                        label={t.diagnosisSummary.reportOptions.address}
                        checked={options.includePatientAddress}
                        onChange={(c) => handleOptionChange('includePatientAddress', c)}
                    >
                        <Input
                            placeholder="Enter address"
                            value={additionalInfo.address}
                            onChange={(e) => setAdditionalInfo(prev => ({ ...prev, address: e.target.value }))}
                            className="w-full h-9 text-sm bg-white"
                        />
                    </CheckboxOption>
                    <CheckboxOption
                        id="includeEmergencyContact"
                        label={t.diagnosisSummary.reportOptions.emergencyContact}
                        checked={options.includeEmergencyContact}
                        onChange={(c) => handleOptionChange('includeEmergencyContact', c)}
                    >
                        <Input
                            placeholder="Enter emergency contact"
                            value={additionalInfo.emergencyContact}
                            onChange={(e) => setAdditionalInfo(prev => ({ ...prev, emergencyContact: e.target.value }))}
                            className="w-full h-9 text-sm bg-white"
                        />
                    </CheckboxOption>
                </CollapsibleOptionsSection>

                {/* Vital Signs & Measurements Section */}
                <CollapsibleOptionsSection
                    id="vitalSigns"
                    title={t.diagnosisSummary.reportOptions.vitalSigns}
                    subtitle={t.diagnosisSummary.reportOptions.healthData}
                    icon={Activity}
                    iconBgColor="bg-rose-100"
                    iconColor="text-rose-500"
                    isExpanded={expandedSections.vitalSigns}
                    onToggle={() => toggleSection('vitalSigns')}
                    delay={0.2}
                >
                    <CheckboxOption
                        id="includeVitalSigns"
                        label={t.diagnosisSummary.reportOptions.vitalSignsDesc}
                        checked={options.includeVitalSigns}
                        onChange={(c) => handleOptionChange('includeVitalSigns', c)}
                    />
                    <CheckboxOption
                        id="includeBMI"
                        label={t.diagnosisSummary.reportOptions.bmiMeasurements}
                        checked={options.includeBMI}
                        onChange={(c) => handleOptionChange('includeBMI', c)}
                    />
                    <CheckboxOption
                        id="includeSmartConnectData"
                        label={t.diagnosisSummary.reportOptions.smartConnectData}
                        checked={options.includeSmartConnectData}
                        onChange={(c) => handleOptionChange('includeSmartConnectData', c)}
                    />
                </CollapsibleOptionsSection>

                {/* Medical History Section */}
                <CollapsibleOptionsSection
                    id="medicalHistory"
                    title={t.diagnosisSummary.reportOptions.medicalHistory}
                    subtitle={t.diagnosisSummary.reportOptions.background}
                    icon={FileText}
                    iconBgColor="bg-blue-100"
                    iconColor="text-blue-500"
                    isExpanded={expandedSections.medicalHistory}
                    onToggle={() => toggleSection('medicalHistory')}
                    delay={0.3}
                >
                    <CheckboxOption
                        id="includeMedicalHistory"
                        label={t.diagnosisSummary.reportOptions.pastMedicalHistory}
                        checked={options.includeMedicalHistory}
                        onChange={(c) => handleOptionChange('includeMedicalHistory', c)}
                    />
                    <CheckboxOption
                        id="includeAllergies"
                        label={t.diagnosisSummary.reportOptions.knownAllergies}
                        checked={options.includeAllergies}
                        onChange={(c) => handleOptionChange('includeAllergies', c)}
                    />
                    <CheckboxOption
                        id="includeCurrentMedications"
                        label={t.diagnosisSummary.reportOptions.currentMedications}
                        checked={options.includeCurrentMedications}
                        onChange={(c) => handleOptionChange('includeCurrentMedications', c)}
                    />
                    <CheckboxOption
                        id="includePastDiagnoses"
                        label={t.diagnosisSummary.reportOptions.pastTcmDiagnoses}
                        checked={options.includePastDiagnoses}
                        onChange={(c) => handleOptionChange('includePastDiagnoses', c)}
                    />
                    <CheckboxOption
                        id="includeFamilyHistory"
                        label={t.diagnosisSummary.reportOptions.familyHistory}
                        checked={options.includeFamilyHistory}
                        onChange={(c) => handleOptionChange('includeFamilyHistory', c)}
                    />
                </CollapsibleOptionsSection>

                {/* TCM Recommendations Section */}
                <CollapsibleOptionsSection
                    id="recommendations"
                    title={t.diagnosisSummary.reportOptions.tcmRecommendations}
                    subtitle={t.diagnosisSummary.reportOptions.treatment}
                    icon={Check}
                    iconBgColor="bg-emerald-100"
                    iconColor="text-emerald-600"
                    isExpanded={expandedSections.recommendations}
                    onToggle={() => toggleSection('recommendations')}
                    delay={0.4}
                >
                    <CheckboxOption
                        id="suggestMedicine"
                        label={t.diagnosisSummary.reportOptions.herbalMedicine}
                        checked={options.suggestMedicine}
                        onChange={(c) => handleOptionChange('suggestMedicine', c)}
                    />
                    <CheckboxOption
                        id="suggestDoctor"
                        label={t.diagnosisSummary.reportOptions.nearbyDoctor}
                        checked={options.suggestDoctor}
                        onChange={(c) => handleOptionChange('suggestDoctor', c)}
                    />
                    <CheckboxOption
                        id="includeDietary"
                        label={t.diagnosisSummary.reportOptions.dietary}
                        checked={options.includeDietary}
                        onChange={(c) => handleOptionChange('includeDietary', c)}
                    />
                    <CheckboxOption
                        id="includeLifestyle"
                        label={t.diagnosisSummary.reportOptions.lifestyle}
                        checked={options.includeLifestyle}
                        onChange={(c) => handleOptionChange('includeLifestyle', c)}
                    />
                    <CheckboxOption
                        id="includeAcupuncture"
                        label={t.diagnosisSummary.reportOptions.acupuncture}
                        checked={options.includeAcupuncture}
                        onChange={(c) => handleOptionChange('includeAcupuncture', c)}
                    />
                    <CheckboxOption
                        id="includeExercise"
                        label={t.diagnosisSummary.reportOptions.exercise}
                        checked={options.includeExercise}
                        onChange={(c) => handleOptionChange('includeExercise', c)}
                    />
                    <CheckboxOption
                        id="includeSleepAdvice"
                        label={t.diagnosisSummary.reportOptions.sleepAdvice}
                        checked={options.includeSleepAdvice}
                        onChange={(c) => handleOptionChange('includeSleepAdvice', c)}
                    />
                    <CheckboxOption
                        id="includeEmotionalWellness"
                        label={t.diagnosisSummary.reportOptions.emotionalWellness}
                        checked={options.includeEmotionalWellness}
                        onChange={(c) => handleOptionChange('includeEmotionalWellness', c)}
                    />
                </CollapsibleOptionsSection>

                {/* Report Format & Extras Section */}
                <CollapsibleOptionsSection
                    id="reportExtras"
                    title={t.diagnosisSummary.reportOptions.reportExtras}
                    subtitle={t.diagnosisSummary.reportOptions.formatting}
                    icon={FileText}
                    iconBgColor="bg-purple-100"
                    iconColor="text-purple-500"
                    isExpanded={expandedSections.reportExtras}
                    onToggle={() => toggleSection('reportExtras')}
                    delay={0.5}
                >
                    <CheckboxOption
                        id="includePrecautions"
                        label={t.diagnosisSummary.reportOptions.precautions}
                        checked={options.includePrecautions}
                        onChange={(c) => handleOptionChange('includePrecautions', c)}
                    />
                    <CheckboxOption
                        id="includeFollowUp"
                        label={t.diagnosisSummary.reportOptions.followUp}
                        checked={options.includeFollowUp}
                        onChange={(c) => handleOptionChange('includeFollowUp', c)}
                    />
                    <CheckboxOption
                        id="includeTimestamp"
                        label={t.diagnosisSummary.reportOptions.timestamp}
                        checked={options.includeTimestamp}
                        onChange={(c) => handleOptionChange('includeTimestamp', c)}
                    />
                    <CheckboxOption
                        id="includeQRCode"
                        label={t.diagnosisSummary.reportOptions.qrCode}
                        checked={options.includeQRCode}
                        onChange={(c) => handleOptionChange('includeQRCode', c)}
                    />
                    <CheckboxOption
                        id="includeDoctorSignature"
                        label={t.diagnosisSummary.reportOptions.doctorSignature}
                        checked={options.includeDoctorSignature}
                        onChange={(c) => handleOptionChange('includeDoctorSignature', c)}
                    />
                </CollapsibleOptionsSection>
            </div>
        )
    }

    return (
        <Card className="p-4 md:p-6 space-y-6 pb-6 max-w-3xl mx-auto bg-white/80 backdrop-blur-md shadow-xl border-emerald-100/50 mb-20 md:mb-0">
            <div className="space-y-2 text-center md:text-left">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-800 to-teal-700 bg-clip-text text-transparent">{t.diagnosisSummary.title}</h2>
                <p className="text-slate-600 text-sm md:text-base">{t.diagnosisSummary.subtitle}</p>
            </div>

            {/* Progress Steps */}
            <div className="relative flex justify-between items-center px-2 md:px-4 py-6">
                <div className="absolute left-4 right-4 top-1/2 h-0.5 bg-slate-100 -z-10" />
                {steps.map((step, index) => {
                    const Icon = step.icon
                    const isActive = index === currentStepIndex
                    const isCompleted = index < currentStepIndex

                    return (
                        <div key={step.id} className="flex flex-col items-center gap-2 bg-white/80 backdrop-blur-sm px-2 rounded-full">
                            <motion.div
                                initial={false}
                                animate={{
                                    scale: isActive ? 1.1 : 1,
                                    borderColor: isActive ? '#10b981' : isCompleted ? '#10b981' : '#e2e8f0',
                                    backgroundColor: isActive ? '#ecfdf5' : isCompleted ? '#10b981' : '#ffffff'
                                }}
                                className={`
                                    w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center border-2 transition-colors shadow-sm
                                    ${isActive ? 'text-emerald-600' : isCompleted ? 'text-white' : 'text-slate-400'}
                                `}
                            >
                                {isCompleted ? <Check className="w-5 h-5 md:w-6 md:h-6" /> : <Icon className="w-5 h-5 md:w-6 md:h-6" />}
                            </motion.div>
                            <span className={`text-[10px] md:text-xs font-medium uppercase tracking-wider ${isActive ? 'text-emerald-600' : 'text-slate-400'} hidden md:block`}>
                                {step.title}
                            </span>
                        </div>
                    )
                })}
            </div>

            <div className="min-h-full">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="px-1"
                    >
                        {currentStep === 'observations' && renderObservationsStep()}
                        {currentStep === 'inquiry' && renderInquiryStep()}
                        {currentStep === 'options' && renderOptionsStep()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </Card>
    )
}
