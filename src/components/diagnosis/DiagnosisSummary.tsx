import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronRight, ChevronLeft, Edit2, Check, User, FileText, Activity, Settings, ChevronDown, ChevronUp, Stethoscope, ClipboardList, FileOutput } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { motion, AnimatePresence } from 'framer-motion'

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

export function DiagnosisSummary({ data, onConfirm, onBack }: DiagnosisSummaryProps) {
    const { t } = useLanguage()
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
        onConfirm(summaries, options, additionalInfo)
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
                        <motion.div
                            key={section.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                                            <Edit2 className="w-4 h-4 text-emerald-600" />
                                        </div>
                                        <h3 className="font-semibold text-slate-800">{section.title}</h3>
                                    </div>
                                    <Textarea
                                        value={summaries[section.id]}
                                        onChange={(e) => handleSummaryChange(section.id, e.target.value)}
                                        className="min-h-[120px] bg-slate-50/50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 resize-none transition-all"
                                    />
                                </div>

                                {imageSrc && (
                                    <div className="flex-shrink-0 mt-11">
                                        <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 shadow-sm group">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={imageSrc}
                                                alt={section.title}
                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
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
                <div className="bg-blue-50/50 backdrop-blur-sm p-4 rounded-xl border border-blue-100 mb-6">
                    <p className="text-sm text-blue-800 leading-relaxed">
                        Please review the patient's basic information and inquiry details.
                    </p>
                </div>
                {inquirySections.map(section => {
                    if (!summaries[section.id]) return null
                    return (
                        <motion.div
                            key={section.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                                    <Edit2 className="w-4 h-4 text-emerald-600" />
                                </div>
                                <h3 className="font-semibold text-slate-800">{section.title}</h3>
                            </div>
                            <Textarea
                                value={summaries[section.id]}
                                onChange={(e) => handleSummaryChange(section.id, e.target.value)}
                                className="min-h-[120px] bg-slate-50/50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 resize-none transition-all"
                            />
                        </motion.div>
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
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white/70 backdrop-blur-sm rounded-xl border border-emerald-100 overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                    <button
                        type="button"
                        onClick={() => setExpandedSections(prev => ({ ...prev, patientInfo: !prev.patientInfo }))}
                        className="w-full px-4 py-4 flex items-center justify-between hover:bg-emerald-50/30 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                <User className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="font-semibold text-slate-800">{t.diagnosisSummary.reportOptions.patientInfo}</span>
                                <span className="text-xs text-slate-500 hidden sm:inline-block">{t.diagnosisSummary.reportOptions.demographics}</span>
                            </div>
                        </div>
                        {expandedSections.patientInfo ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </button>
                    <AnimatePresence>
                        {expandedSections.patientInfo && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-emerald-50 pt-4 bg-white/50">
                                    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <Checkbox id="includePatientName" checked={options.includePatientName} onCheckedChange={(checked) => handleOptionChange('includePatientName', checked as boolean)} />
                                        <Label htmlFor="includePatientName" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">{t.diagnosisSummary.reportOptions.patientName}</Label>
                                    </div>
                                    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <Checkbox id="includePatientAge" checked={options.includePatientAge} onCheckedChange={(checked) => handleOptionChange('includePatientAge', checked as boolean)} />
                                        <Label htmlFor="includePatientAge" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">{t.diagnosisSummary.reportOptions.age}</Label>
                                    </div>
                                    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <Checkbox id="includePatientGender" checked={options.includePatientGender} onCheckedChange={(checked) => handleOptionChange('includePatientGender', checked as boolean)} />
                                        <Label htmlFor="includePatientGender" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">{t.diagnosisSummary.reportOptions.gender}</Label>
                                    </div>
                                    <div className="space-y-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center space-x-3">
                                            <Checkbox id="includePatientContact" checked={options.includePatientContact} onCheckedChange={(checked) => handleOptionChange('includePatientContact', checked as boolean)} />
                                            <Label htmlFor="includePatientContact" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">{t.diagnosisSummary.reportOptions.contactInfo}</Label>
                                        </div>
                                        {options.includePatientContact && (
                                            <Input
                                                placeholder="Enter contact number"
                                                value={additionalInfo.contact}
                                                onChange={(e) => setAdditionalInfo(prev => ({ ...prev, contact: e.target.value }))}
                                                className="ml-7 w-[calc(100%-1.75rem)] h-9 text-sm bg-white"
                                            />
                                        )}
                                    </div>
                                    <div className="space-y-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center space-x-3">
                                            <Checkbox id="includePatientAddress" checked={options.includePatientAddress} onCheckedChange={(checked) => handleOptionChange('includePatientAddress', checked as boolean)} />
                                            <Label htmlFor="includePatientAddress" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">{t.diagnosisSummary.reportOptions.address}</Label>
                                        </div>
                                        {options.includePatientAddress && (
                                            <Input
                                                placeholder="Enter address"
                                                value={additionalInfo.address}
                                                onChange={(e) => setAdditionalInfo(prev => ({ ...prev, address: e.target.value }))}
                                                className="ml-7 w-[calc(100%-1.75rem)] h-9 text-sm bg-white"
                                            />
                                        )}
                                    </div>
                                    <div className="space-y-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <div className="flex items-center space-x-3">
                                            <Checkbox id="includeEmergencyContact" checked={options.includeEmergencyContact} onCheckedChange={(checked) => handleOptionChange('includeEmergencyContact', checked as boolean)} />
                                            <Label htmlFor="includeEmergencyContact" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">{t.diagnosisSummary.reportOptions.emergencyContact}</Label>
                                        </div>
                                        {options.includeEmergencyContact && (
                                            <Input
                                                placeholder="Enter emergency contact"
                                                value={additionalInfo.emergencyContact}
                                                onChange={(e) => setAdditionalInfo(prev => ({ ...prev, emergencyContact: e.target.value }))}
                                                className="ml-7 w-[calc(100%-1.75rem)] h-9 text-sm bg-white"
                                            />
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Vital Signs & Measurements Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/70 backdrop-blur-sm rounded-xl border border-emerald-100 overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                    <button
                        type="button"
                        onClick={() => setExpandedSections(prev => ({ ...prev, vitalSigns: !prev.vitalSigns }))}
                        className="w-full px-4 py-4 flex items-center justify-between hover:bg-emerald-50/30 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center">
                                <Activity className="w-4 h-4 text-rose-500" />
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="font-semibold text-slate-800">{t.diagnosisSummary.reportOptions.vitalSigns}</span>
                                <span className="text-xs text-slate-500 hidden sm:inline-block">{t.diagnosisSummary.reportOptions.healthData}</span>
                            </div>
                        </div>
                        {expandedSections.vitalSigns ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </button>
                    <AnimatePresence>
                        {expandedSections.vitalSigns && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-emerald-50 pt-4 bg-white/50">
                                    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <Checkbox id="includeVitalSigns" checked={options.includeVitalSigns} onCheckedChange={(checked) => handleOptionChange('includeVitalSigns', checked as boolean)} />
                                        <Label htmlFor="includeVitalSigns" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">{t.diagnosisSummary.reportOptions.vitalSignsDesc}</Label>
                                    </div>
                                    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <Checkbox id="includeBMI" checked={options.includeBMI} onCheckedChange={(checked) => handleOptionChange('includeBMI', checked as boolean)} />
                                        <Label htmlFor="includeBMI" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">{t.diagnosisSummary.reportOptions.bmiMeasurements}</Label>
                                    </div>
                                    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <Checkbox id="includeSmartConnectData" checked={options.includeSmartConnectData} onCheckedChange={(checked) => handleOptionChange('includeSmartConnectData', checked as boolean)} />
                                        <Label htmlFor="includeSmartConnectData" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">{t.diagnosisSummary.reportOptions.smartConnectData}</Label>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Medical History Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/70 backdrop-blur-sm rounded-xl border border-emerald-100 overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                    <button
                        type="button"
                        onClick={() => setExpandedSections(prev => ({ ...prev, medicalHistory: !prev.medicalHistory }))}
                        className="w-full px-4 py-4 flex items-center justify-between hover:bg-emerald-50/30 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-blue-500" />
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="font-semibold text-slate-800">{t.diagnosisSummary.reportOptions.medicalHistory}</span>
                                <span className="text-xs text-slate-500 hidden sm:inline-block">{t.diagnosisSummary.reportOptions.background}</span>
                            </div>
                        </div>
                        {expandedSections.medicalHistory ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </button>
                    <AnimatePresence>
                        {expandedSections.medicalHistory && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-emerald-50 pt-4 bg-white/50">
                                    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <Checkbox id="includeMedicalHistory" checked={options.includeMedicalHistory} onCheckedChange={(checked) => handleOptionChange('includeMedicalHistory', checked as boolean)} />
                                        <Label htmlFor="includeMedicalHistory" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">{t.diagnosisSummary.reportOptions.pastMedicalHistory}</Label>
                                    </div>
                                    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <Checkbox id="includeAllergies" checked={options.includeAllergies} onCheckedChange={(checked) => handleOptionChange('includeAllergies', checked as boolean)} />
                                        <Label htmlFor="includeAllergies" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">{t.diagnosisSummary.reportOptions.knownAllergies}</Label>
                                    </div>
                                    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <Checkbox id="includeCurrentMedications" checked={options.includeCurrentMedications} onCheckedChange={(checked) => handleOptionChange('includeCurrentMedications', checked as boolean)} />
                                        <Label htmlFor="includeCurrentMedications" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">{t.diagnosisSummary.reportOptions.currentMedications}</Label>
                                    </div>
                                    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <Checkbox id="includePastDiagnoses" checked={options.includePastDiagnoses} onCheckedChange={(checked) => handleOptionChange('includePastDiagnoses', checked as boolean)} />
                                        <Label htmlFor="includePastDiagnoses" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">{t.diagnosisSummary.reportOptions.pastTcmDiagnoses}</Label>
                                    </div>
                                    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <Checkbox id="includeFamilyHistory" checked={options.includeFamilyHistory} onCheckedChange={(checked) => handleOptionChange('includeFamilyHistory', checked as boolean)} />
                                        <Label htmlFor="includeFamilyHistory" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">{t.diagnosisSummary.reportOptions.familyHistory}</Label>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* TCM Recommendations Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/70 backdrop-blur-sm rounded-xl border border-emerald-100 overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                    <button
                        type="button"
                        onClick={() => setExpandedSections(prev => ({ ...prev, recommendations: !prev.recommendations }))}
                        className="w-full px-4 py-4 flex items-center justify-between hover:bg-emerald-50/30 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                <Check className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="font-semibold text-slate-800">{t.diagnosisSummary.reportOptions.tcmRecommendations}</span>
                                <span className="text-xs text-slate-500 hidden sm:inline-block">{t.diagnosisSummary.reportOptions.treatment}</span>
                            </div>
                        </div>
                        {expandedSections.recommendations ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </button>
                    <AnimatePresence>
                        {expandedSections.recommendations && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-emerald-50 pt-4 bg-white/50">
                                    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <Checkbox id="suggestMedicine" checked={options.suggestMedicine} onCheckedChange={(checked) => handleOptionChange('suggestMedicine', checked as boolean)} />
                                        <Label htmlFor="suggestMedicine" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">{t.diagnosisSummary.reportOptions.herbalMedicine}</Label>
                                    </div>
                                    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <Checkbox id="suggestDoctor" checked={options.suggestDoctor} onCheckedChange={(checked) => handleOptionChange('suggestDoctor', checked as boolean)} />
                                        <Label htmlFor="suggestDoctor" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">{t.diagnosisSummary.reportOptions.nearbyDoctor}</Label>
                                    </div>
                                    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <Checkbox id="includeDietary" checked={options.includeDietary} onCheckedChange={(checked) => handleOptionChange('includeDietary', checked as boolean)} />
                                        <Label htmlFor="includeDietary" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">{t.diagnosisSummary.reportOptions.dietary}</Label>
                                    </div>
                                    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <Checkbox id="includeLifestyle" checked={options.includeLifestyle} onCheckedChange={(checked) => handleOptionChange('includeLifestyle', checked as boolean)} />
                                        <Label htmlFor="includeLifestyle" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">{t.diagnosisSummary.reportOptions.lifestyle}</Label>
                                    </div>
                                    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <Checkbox id="includeAcupuncture" checked={options.includeAcupuncture} onCheckedChange={(checked) => handleOptionChange('includeAcupuncture', checked as boolean)} />
                                        <Label htmlFor="includeAcupuncture" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">{t.diagnosisSummary.reportOptions.acupuncture}</Label>
                                    </div>
                                    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <Checkbox id="includeExercise" checked={options.includeExercise} onCheckedChange={(checked) => handleOptionChange('includeExercise', checked as boolean)} />
                                        <Label htmlFor="includeExercise" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">{t.diagnosisSummary.reportOptions.exercise}</Label>
                                    </div>
                                    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <Checkbox id="includeSleepAdvice" checked={options.includeSleepAdvice} onCheckedChange={(checked) => handleOptionChange('includeSleepAdvice', checked as boolean)} />
                                        <Label htmlFor="includeSleepAdvice" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">{t.diagnosisSummary.reportOptions.sleepAdvice}</Label>
                                    </div>
                                    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <Checkbox id="includeEmotionalWellness" checked={options.includeEmotionalWellness} onCheckedChange={(checked) => handleOptionChange('includeEmotionalWellness', checked as boolean)} />
                                        <Label htmlFor="includeEmotionalWellness" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">{t.diagnosisSummary.reportOptions.emotionalWellness}</Label>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Report Format & Extras Section */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white/70 backdrop-blur-sm rounded-xl border border-emerald-100 overflow-hidden shadow-sm hover:shadow-md transition-all"
                >
                    <button
                        type="button"
                        onClick={() => setExpandedSections(prev => ({ ...prev, reportExtras: !prev.reportExtras }))}
                        className="w-full px-4 py-4 flex items-center justify-between hover:bg-emerald-50/30 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                <FileText className="w-4 h-4 text-purple-500" />
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="font-semibold text-slate-800">{t.diagnosisSummary.reportOptions.reportExtras}</span>
                                <span className="text-xs text-slate-500 hidden sm:inline-block">{t.diagnosisSummary.reportOptions.formatting}</span>
                            </div>
                        </div>
                        {expandedSections.reportExtras ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </button>
                    <AnimatePresence>
                        {expandedSections.reportExtras && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-emerald-50 pt-4 bg-white/50">
                                    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <Checkbox id="includePrecautions" checked={options.includePrecautions} onCheckedChange={(checked) => handleOptionChange('includePrecautions', checked as boolean)} />
                                        <Label htmlFor="includePrecautions" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">{t.diagnosisSummary.reportOptions.precautions}</Label>
                                    </div>
                                    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <Checkbox id="includeFollowUp" checked={options.includeFollowUp} onCheckedChange={(checked) => handleOptionChange('includeFollowUp', checked as boolean)} />
                                        <Label htmlFor="includeFollowUp" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">{t.diagnosisSummary.reportOptions.followUp}</Label>
                                    </div>
                                    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <Checkbox id="includeTimestamp" checked={options.includeTimestamp} onCheckedChange={(checked) => handleOptionChange('includeTimestamp', checked as boolean)} />
                                        <Label htmlFor="includeTimestamp" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">{t.diagnosisSummary.reportOptions.timestamp}</Label>
                                    </div>
                                    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <Checkbox id="includeQRCode" checked={options.includeQRCode} onCheckedChange={(checked) => handleOptionChange('includeQRCode', checked as boolean)} />
                                        <Label htmlFor="includeQRCode" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">{t.diagnosisSummary.reportOptions.qrCode}</Label>
                                    </div>
                                    <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                                        <Checkbox id="includeDoctorSignature" checked={options.includeDoctorSignature} onCheckedChange={(checked) => handleOptionChange('includeDoctorSignature', checked as boolean)} />
                                        <Label htmlFor="includeDoctorSignature" className="text-sm font-medium text-slate-700 cursor-pointer flex-1">{t.diagnosisSummary.reportOptions.doctorSignature}</Label>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
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

            <ScrollArea className="h-[calc(100vh-380px)] md:h-[500px] pr-2 md:pr-4 -mr-2 md:-mr-4">
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
            </ScrollArea>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-lg border-t border-slate-200 shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)] z-50 md:static md:bg-transparent md:border-none md:shadow-none md:p-0 flex gap-3">
                <Button
                    variant="outline"
                    onClick={handleBack}
                    className="h-12 px-6 border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 rounded-xl"
                >
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    {currentStepIndex === 0 ? t.diagnosisSummary.buttons.back : t.common.previous}
                </Button>
                <Button
                    onClick={handleNext}
                    className="flex-1 h-12 text-lg font-semibold transition-all bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg shadow-emerald-500/20 rounded-xl"
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
