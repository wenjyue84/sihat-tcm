import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronRight, ChevronLeft, Edit2, Check, User, FileText, Activity, Settings, ChevronDown, ChevronUp, Stethoscope, ClipboardList, FileOutput } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { motion, AnimatePresence } from 'framer-motion'

interface DiagnosisSummaryProps {
    data: any
    onConfirm: (confirmedData: any, options: any) => void
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

export function DiagnosisSummary({ data, onConfirm, onBack }: DiagnosisSummaryProps) {
    const { t } = useLanguage()
    const [currentStep, setCurrentStep] = useState<WizardStep>('observations')
    const [summaries, setSummaries] = useState<Record<string, string>>({})
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
            initialSummaries['basic_info'] = `${t.basicInfo.fullName}: ${info.name}\n${t.basicInfo.age}: ${info.age}\n${t.basicInfo.gender}: ${info.gender}\n${t.basicInfo.height}: ${info.height}cm\n${t.basicInfo.weight}: ${info.weight}kg\n${t.report.symptoms}: ${info.symptoms || t.common.none}`
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

    const handleSummaryChange = (key: string, value: string) => {
        setSummaries(prev => ({ ...prev, [key]: value }))
    }

    const handleOptionChange = (key: keyof typeof options, checked: boolean) => {
        setOptions(prev => ({ ...prev, [key]: checked }))
    }

    const handleConfirm = () => {
        onConfirm(summaries, options)
    }

    const steps = [
        { id: 'observations', title: t.diagnosisSummary.sections.wangTongue, icon: Stethoscope }, // Using Tongue title as representative for observations
        { id: 'inquiry', title: t.diagnosisSummary.sections.wenInquiry, icon: ClipboardList },
        { id: 'options', title: t.diagnosisSummary.reportOptions.title, icon: FileOutput },
    ]

    const currentStepIndex = steps.findIndex(s => s.id === currentStep)

    const handleNext = () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStep(steps[currentStepIndex + 1].id as WizardStep)
        } else {
            handleConfirm()
        }
    }

    const handleBack = () => {
        if (currentStepIndex > 0) {
            setCurrentStep(steps[currentStepIndex - 1].id as WizardStep)
        } else {
            onBack()
        }
    }

    const renderObservationsStep = () => {
        const observationSections = [
            { id: 'wang_tongue', title: t.diagnosisSummary.sections.wangTongue },
            { id: 'wang_face', title: t.diagnosisSummary.sections.wangFace },
            { id: 'wang_part', title: t.diagnosisSummary.sections.wangPart },
            { id: 'wen_audio', title: t.diagnosisSummary.sections.wenAudio },
            { id: 'qie', title: t.diagnosisSummary.sections.qie },
        ]

        return (
            <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-blue-800">
                        Please review and edit the clinical observations below. These will be included in the final report.
                    </p>
                </div>
                {observationSections.map(section => {
                    if (!summaries[section.id]) return null
                    return (
                        <div key={section.id} className="space-y-2 border-b border-slate-100 pb-4 last:border-0">
                            <div className="flex items-center gap-2">
                                <Edit2 className="w-4 h-4 text-emerald-600" />
                                <h3 className="font-semibold text-slate-800">{section.title}</h3>
                            </div>
                            <Textarea
                                value={summaries[section.id]}
                                onChange={(e) => handleSummaryChange(section.id, e.target.value)}
                                className="min-h-[100px] bg-slate-50 border-slate-200 focus:border-emerald-500"
                            />
                        </div>
                    )
                })}
            </div>
        )
    }

    const renderInquiryStep = () => {
        const inquirySections = [
            { id: 'basic_info', title: t.diagnosisSummary.sections.basicInfo },
            { id: 'wen_inquiry', title: t.diagnosisSummary.sections.wenInquiry },
            { id: 'smart_connect', title: t.diagnosisSummary.sections.smartConnect },
        ]

        return (
            <div className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-blue-800">
                        Please review the patient's basic information and inquiry details.
                    </p>
                </div>
                {inquirySections.map(section => {
                    if (!summaries[section.id]) return null
                    return (
                        <div key={section.id} className="space-y-2 border-b border-slate-100 pb-4 last:border-0">
                            <div className="flex items-center gap-2">
                                <Edit2 className="w-4 h-4 text-emerald-600" />
                                <h3 className="font-semibold text-slate-800">{section.title}</h3>
                            </div>
                            <Textarea
                                value={summaries[section.id]}
                                onChange={(e) => handleSummaryChange(section.id, e.target.value)}
                                className="min-h-[100px] bg-slate-50 border-slate-200 focus:border-emerald-500"
                            />
                        </div>
                    )
                })}
            </div>
        )
    }

    const renderOptionsStep = () => {
        return (
            <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <p className="text-sm text-blue-800">
                        Customize what information to include in the final generated report.
                    </p>
                </div>

                {/* Patient Information Section */}
                <div className="bg-white/70 rounded-lg border border-emerald-100 overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setExpandedSections(prev => ({ ...prev, patientInfo: !prev.patientInfo }))}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-emerald-50/50 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-emerald-600" />
                            <span className="font-semibold text-slate-800">{t.diagnosisSummary.reportOptions.patientInfo}</span>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{t.diagnosisSummary.reportOptions.demographics}</span>
                        </div>
                        {expandedSections.patientInfo ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>
                    {expandedSections.patientInfo && (
                        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-emerald-100 pt-3">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="includePatientName" checked={options.includePatientName} onCheckedChange={(checked) => handleOptionChange('includePatientName', checked as boolean)} />
                                <Label htmlFor="includePatientName" className="text-sm">{t.diagnosisSummary.reportOptions.patientName}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="includePatientAge" checked={options.includePatientAge} onCheckedChange={(checked) => handleOptionChange('includePatientAge', checked as boolean)} />
                                <Label htmlFor="includePatientAge" className="text-sm">{t.diagnosisSummary.reportOptions.age}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="includePatientGender" checked={options.includePatientGender} onCheckedChange={(checked) => handleOptionChange('includePatientGender', checked as boolean)} />
                                <Label htmlFor="includePatientGender" className="text-sm">{t.diagnosisSummary.reportOptions.gender}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="includePatientContact" checked={options.includePatientContact} onCheckedChange={(checked) => handleOptionChange('includePatientContact', checked as boolean)} />
                                <Label htmlFor="includePatientContact" className="text-sm text-slate-500">{t.diagnosisSummary.reportOptions.contactInfo}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="includePatientAddress" checked={options.includePatientAddress} onCheckedChange={(checked) => handleOptionChange('includePatientAddress', checked as boolean)} />
                                <Label htmlFor="includePatientAddress" className="text-sm text-slate-500">{t.diagnosisSummary.reportOptions.address}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="includeEmergencyContact" checked={options.includeEmergencyContact} onCheckedChange={(checked) => handleOptionChange('includeEmergencyContact', checked as boolean)} />
                                <Label htmlFor="includeEmergencyContact" className="text-sm text-slate-500">{t.diagnosisSummary.reportOptions.emergencyContact}</Label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Vital Signs & Measurements Section */}
                <div className="bg-white/70 rounded-lg border border-emerald-100 overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setExpandedSections(prev => ({ ...prev, vitalSigns: !prev.vitalSigns }))}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-emerald-50/50 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-rose-500" />
                            <span className="font-semibold text-slate-800">{t.diagnosisSummary.reportOptions.vitalSigns}</span>
                            <span className="text-xs text-slate-500 bg-rose-50 px-2 py-0.5 rounded-full">{t.diagnosisSummary.reportOptions.healthData}</span>
                        </div>
                        {expandedSections.vitalSigns ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>
                    {expandedSections.vitalSigns && (
                        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-emerald-100 pt-3">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="includeVitalSigns" checked={options.includeVitalSigns} onCheckedChange={(checked) => handleOptionChange('includeVitalSigns', checked as boolean)} />
                                <Label htmlFor="includeVitalSigns" className="text-sm">{t.diagnosisSummary.reportOptions.vitalSignsDesc}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="includeBMI" checked={options.includeBMI} onCheckedChange={(checked) => handleOptionChange('includeBMI', checked as boolean)} />
                                <Label htmlFor="includeBMI" className="text-sm">{t.diagnosisSummary.reportOptions.bmiMeasurements}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="includeSmartConnectData" checked={options.includeSmartConnectData} onCheckedChange={(checked) => handleOptionChange('includeSmartConnectData', checked as boolean)} />
                                <Label htmlFor="includeSmartConnectData" className="text-sm">{t.diagnosisSummary.reportOptions.smartConnectData}</Label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Medical History Section */}
                <div className="bg-white/70 rounded-lg border border-emerald-100 overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setExpandedSections(prev => ({ ...prev, medicalHistory: !prev.medicalHistory }))}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-emerald-50/50 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <span className="font-semibold text-slate-800">{t.diagnosisSummary.reportOptions.medicalHistory}</span>
                            <span className="text-xs text-slate-500 bg-blue-50 px-2 py-0.5 rounded-full">{t.diagnosisSummary.reportOptions.background}</span>
                        </div>
                        {expandedSections.medicalHistory ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>
                    {expandedSections.medicalHistory && (
                        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-emerald-100 pt-3">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="includeMedicalHistory" checked={options.includeMedicalHistory} onCheckedChange={(checked) => handleOptionChange('includeMedicalHistory', checked as boolean)} />
                                <Label htmlFor="includeMedicalHistory" className="text-sm">{t.diagnosisSummary.reportOptions.pastMedicalHistory}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="includeAllergies" checked={options.includeAllergies} onCheckedChange={(checked) => handleOptionChange('includeAllergies', checked as boolean)} />
                                <Label htmlFor="includeAllergies" className="text-sm">{t.diagnosisSummary.reportOptions.knownAllergies}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="includeCurrentMedications" checked={options.includeCurrentMedications} onCheckedChange={(checked) => handleOptionChange('includeCurrentMedications', checked as boolean)} />
                                <Label htmlFor="includeCurrentMedications" className="text-sm">{t.diagnosisSummary.reportOptions.currentMedications}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="includePastDiagnoses" checked={options.includePastDiagnoses} onCheckedChange={(checked) => handleOptionChange('includePastDiagnoses', checked as boolean)} />
                                <Label htmlFor="includePastDiagnoses" className="text-sm">{t.diagnosisSummary.reportOptions.pastTcmDiagnoses}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="includeFamilyHistory" checked={options.includeFamilyHistory} onCheckedChange={(checked) => handleOptionChange('includeFamilyHistory', checked as boolean)} />
                                <Label htmlFor="includeFamilyHistory" className="text-sm">{t.diagnosisSummary.reportOptions.familyHistory}</Label>
                            </div>
                        </div>
                    )}
                </div>

                {/* TCM Recommendations Section */}
                <div className="bg-white/70 rounded-lg border border-emerald-100 overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setExpandedSections(prev => ({ ...prev, recommendations: !prev.recommendations }))}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-emerald-50/50 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <Check className="w-4 h-4 text-emerald-600" />
                            <span className="font-semibold text-slate-800">{t.diagnosisSummary.reportOptions.tcmRecommendations}</span>
                            <span className="text-xs text-slate-500 bg-emerald-100 px-2 py-0.5 rounded-full">{t.diagnosisSummary.reportOptions.treatment}</span>
                        </div>
                        {expandedSections.recommendations ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>
                    {expandedSections.recommendations && (
                        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-emerald-100 pt-3">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="suggestMedicine" checked={options.suggestMedicine} onCheckedChange={(checked) => handleOptionChange('suggestMedicine', checked as boolean)} />
                                <Label htmlFor="suggestMedicine" className="text-sm">{t.diagnosisSummary.reportOptions.herbalMedicine}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="suggestDoctor" checked={options.suggestDoctor} onCheckedChange={(checked) => handleOptionChange('suggestDoctor', checked as boolean)} />
                                <Label htmlFor="suggestDoctor" className="text-sm">{t.diagnosisSummary.reportOptions.nearbyDoctor}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="includeDietary" checked={options.includeDietary} onCheckedChange={(checked) => handleOptionChange('includeDietary', checked as boolean)} />
                                <Label htmlFor="includeDietary" className="text-sm">{t.diagnosisSummary.reportOptions.dietary}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="includeLifestyle" checked={options.includeLifestyle} onCheckedChange={(checked) => handleOptionChange('includeLifestyle', checked as boolean)} />
                                <Label htmlFor="includeLifestyle" className="text-sm">{t.diagnosisSummary.reportOptions.lifestyle}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="includeAcupuncture" checked={options.includeAcupuncture} onCheckedChange={(checked) => handleOptionChange('includeAcupuncture', checked as boolean)} />
                                <Label htmlFor="includeAcupuncture" className="text-sm">{t.diagnosisSummary.reportOptions.acupuncture}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="includeExercise" checked={options.includeExercise} onCheckedChange={(checked) => handleOptionChange('includeExercise', checked as boolean)} />
                                <Label htmlFor="includeExercise" className="text-sm">{t.diagnosisSummary.reportOptions.exercise}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="includeSleepAdvice" checked={options.includeSleepAdvice} onCheckedChange={(checked) => handleOptionChange('includeSleepAdvice', checked as boolean)} />
                                <Label htmlFor="includeSleepAdvice" className="text-sm">{t.diagnosisSummary.reportOptions.sleepAdvice}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="includeEmotionalWellness" checked={options.includeEmotionalWellness} onCheckedChange={(checked) => handleOptionChange('includeEmotionalWellness', checked as boolean)} />
                                <Label htmlFor="includeEmotionalWellness" className="text-sm">{t.diagnosisSummary.reportOptions.emotionalWellness}</Label>
                            </div>
                        </div>
                    )}
                </div>

                {/* Report Format & Extras Section */}
                <div className="bg-white/70 rounded-lg border border-emerald-100 overflow-hidden">
                    <button
                        type="button"
                        onClick={() => setExpandedSections(prev => ({ ...prev, reportExtras: !prev.reportExtras }))}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-emerald-50/50 transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-purple-500" />
                            <span className="font-semibold text-slate-800">{t.diagnosisSummary.reportOptions.reportExtras}</span>
                            <span className="text-xs text-slate-500 bg-purple-50 px-2 py-0.5 rounded-full">{t.diagnosisSummary.reportOptions.formatting}</span>
                        </div>
                        {expandedSections.reportExtras ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </button>
                    {expandedSections.reportExtras && (
                        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-emerald-100 pt-3">
                            <div className="flex items-center space-x-2">
                                <Checkbox id="includePrecautions" checked={options.includePrecautions} onCheckedChange={(checked) => handleOptionChange('includePrecautions', checked as boolean)} />
                                <Label htmlFor="includePrecautions" className="text-sm">{t.diagnosisSummary.reportOptions.precautions}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="includeFollowUp" checked={options.includeFollowUp} onCheckedChange={(checked) => handleOptionChange('includeFollowUp', checked as boolean)} />
                                <Label htmlFor="includeFollowUp" className="text-sm">{t.diagnosisSummary.reportOptions.followUp}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="includeTimestamp" checked={options.includeTimestamp} onCheckedChange={(checked) => handleOptionChange('includeTimestamp', checked as boolean)} />
                                <Label htmlFor="includeTimestamp" className="text-sm">{t.diagnosisSummary.reportOptions.timestamp}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="includeQRCode" checked={options.includeQRCode} onCheckedChange={(checked) => handleOptionChange('includeQRCode', checked as boolean)} />
                                <Label htmlFor="includeQRCode" className="text-sm text-slate-500">{t.diagnosisSummary.reportOptions.qrCode}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox id="includeDoctorSignature" checked={options.includeDoctorSignature} onCheckedChange={(checked) => handleOptionChange('includeDoctorSignature', checked as boolean)} />
                                <Label htmlFor="includeDoctorSignature" className="text-sm text-slate-500">{t.diagnosisSummary.reportOptions.doctorSignature}</Label>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <Card className="p-6 space-y-6 pb-24 md:pb-6 max-w-3xl mx-auto">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-emerald-800">{t.diagnosisSummary.title}</h2>
                <p className="text-slate-600">{t.diagnosisSummary.subtitle}</p>
            </div>

            {/* Progress Steps */}
            <div className="relative flex justify-between items-center px-4 py-4">
                <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-200 -z-10" />
                {steps.map((step, index) => {
                    const Icon = step.icon
                    const isActive = index === currentStepIndex
                    const isCompleted = index < currentStepIndex

                    return (
                        <div key={step.id} className="flex flex-col items-center gap-2 bg-white px-2">
                            <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                                ${isActive ? 'border-emerald-500 bg-emerald-50 text-emerald-600' :
                                    isCompleted ? 'border-emerald-500 bg-emerald-500 text-white' :
                                        'border-slate-200 bg-white text-slate-400'}
                            `}>
                                {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                            </div>
                            <span className={`text-xs font-medium ${isActive ? 'text-emerald-600' : 'text-slate-500'}`}>
                                {step.title}
                            </span>
                        </div>
                    )
                })}
            </div>

            <ScrollArea className="h-[500px] pr-4">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {currentStep === 'observations' && renderObservationsStep()}
                        {currentStep === 'inquiry' && renderInquiryStep()}
                        {currentStep === 'options' && renderOptionsStep()}
                    </motion.div>
                </AnimatePresence>
            </ScrollArea>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-stone-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 md:static md:bg-transparent md:border-none md:shadow-none md:p-0 flex gap-3">
                <Button
                    variant="outline"
                    onClick={handleBack}
                    className="h-12 px-6 border-stone-300 text-stone-600 hover:bg-stone-100"
                >
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    {currentStepIndex === 0 ? t.diagnosisSummary.buttons.back : t.common.previous}
                </Button>
                <Button
                    onClick={handleNext}
                    className="flex-1 h-12 text-lg font-semibold transition-all bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg"
                >
                    <span className="flex items-center gap-2">
                        {currentStepIndex === steps.length - 1 ? t.diagnosisSummary.buttons.confirmGenerate : t.common.next}
                        <ChevronRight className="w-5 h-5" />
                    </span>
                </Button>
            </div>
        </Card>
    )
}
