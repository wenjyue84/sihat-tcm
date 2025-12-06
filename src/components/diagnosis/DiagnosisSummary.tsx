import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronRight, ChevronLeft, Edit2, Check, User, FileText, Activity, Settings, ChevronDown, ChevronUp } from 'lucide-react'

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

export function DiagnosisSummary({ data, onConfirm, onBack }: DiagnosisSummaryProps) {
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
            initialSummaries['basic_info'] = `Name: ${info.name}\nAge: ${info.age}\nGender: ${info.gender}\nHeight: ${info.height}cm\nWeight: ${info.weight}kg\nSymptoms: ${info.symptoms || 'None'}`
        }

        // Inquiry
        if (data.wen_inquiry) {
            // If there's a specific summary field, use it. Otherwise, summarize the chat or just say "Completed".
            // Assuming data.wen_inquiry might have a summary or we just list the main points if available.
            // For now, let's try to extract a summary or default to a placeholder.
            initialSummaries['wen_inquiry'] = data.wen_inquiry.summary || "Patient inquiry completed."
        }

        // Tongue
        if (data.wang_tongue) {
            initialSummaries['wang_tongue'] = data.wang_tongue.observation || "No observation recorded."
        }

        // Face
        if (data.wang_face) {
            initialSummaries['wang_face'] = data.wang_face.observation || "No observation recorded."
        }

        // Body Part
        if (data.wang_part) {
            initialSummaries['wang_part'] = data.wang_part.observation || "No observation recorded."
        }

        // Audio
        if (data.wen_audio) {
            initialSummaries['wen_audio'] = data.wen_audio.transcription || data.wen_audio.analysis || "Audio analysis completed."
        }

        // Pulse
        if (data.qie) {
            const qualities = data.qie.pulseQualities?.map((q: any) => q.nameEn).join(', ') || 'None'
            initialSummaries['qie'] = `BPM: ${data.qie.bpm}\nPulse Qualities: ${qualities}`
        }

        // Smart Connect
        if (data.smart_connect) {
            const sc = data.smart_connect
            const metrics = []
            if (sc.pulseRate) metrics.push(`Pulse Rate: ${sc.pulseRate} BPM`)
            if (sc.bloodPressure) metrics.push(`Blood Pressure: ${sc.bloodPressure} mmHg`)
            if (sc.bloodOxygen) metrics.push(`Blood Oxygen: ${sc.bloodOxygen}%`)
            if (sc.bodyTemp) metrics.push(`Temperature: ${sc.bodyTemp}°C`)
            if (sc.hrv) metrics.push(`HRV: ${sc.hrv} ms`)
            if (sc.stressLevel) metrics.push(`Stress Level: ${sc.stressLevel}`)
            initialSummaries['smart_connect'] = metrics.length > 0 ? metrics.join('\n') : 'No device data connected.'
        }

        setSummaries(initialSummaries)
    }, [data])

    const handleSummaryChange = (key: string, value: string) => {
        setSummaries(prev => ({ ...prev, [key]: value }))
    }

    const handleOptionChange = (key: keyof typeof options, checked: boolean) => {
        setOptions(prev => ({ ...prev, [key]: checked }))
    }

    const handleConfirm = () => {
        // Merge the edited summaries back into a structure that can be passed to the report generation
        // We might want to pass these as "user_verified_summaries" or similar.
        onConfirm(summaries, options)
    }

    const sections = [
        { id: 'basic_info', title: 'Basic Information' },
        { id: 'wen_inquiry', title: 'Inquiry (Wen)' },
        { id: 'wang_tongue', title: 'Tongue Diagnosis (Wang)' },
        { id: 'wang_face', title: 'Face Diagnosis (Wang)' },
        { id: 'wang_part', title: 'Body Part Diagnosis (Wang)' },
        { id: 'wen_audio', title: 'Audio Analysis (Wen)' },
        { id: 'qie', title: 'Pulse Diagnosis (Qie)' },
        { id: 'smart_connect', title: 'Smart Connect Health Metrics' },
    ]

    return (
        <Card className="p-6 space-y-6 pb-24 md:pb-6 max-w-3xl mx-auto">
            <div className="space-y-2">
                <h2 className="text-2xl font-bold text-emerald-800">Diagnostic Summary</h2>
                <p className="text-slate-600">Please review and edit the collected information before generating the final report.</p>
            </div>

            <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-6">
                    {sections.map(section => {
                        // Only show sections that have data
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

                    {/* Comprehensive Report Options */}
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 rounded-xl space-y-4 mt-6 border border-emerald-100">
                        <h3 className="font-bold text-emerald-800 flex items-center gap-2 text-lg">
                            <Settings className="w-5 h-5" />
                            Report Options
                        </h3>
                        <p className="text-sm text-slate-600">Customize what information to include in your diagnosis report</p>

                        {/* Patient Information Section */}
                        <div className="bg-white/70 rounded-lg border border-emerald-100 overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setExpandedSections(prev => ({ ...prev, patientInfo: !prev.patientInfo }))}
                                className="w-full px-4 py-3 flex items-center justify-between hover:bg-emerald-50/50 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-emerald-600" />
                                    <span className="font-semibold text-slate-800">Patient Information</span>
                                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Demographics</span>
                                </div>
                                {expandedSections.patientInfo ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </button>
                            {expandedSections.patientInfo && (
                                <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-emerald-100 pt-3">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="includePatientName" checked={options.includePatientName} onCheckedChange={(checked) => handleOptionChange('includePatientName', checked as boolean)} />
                                        <Label htmlFor="includePatientName" className="text-sm">Patient Name</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="includePatientAge" checked={options.includePatientAge} onCheckedChange={(checked) => handleOptionChange('includePatientAge', checked as boolean)} />
                                        <Label htmlFor="includePatientAge" className="text-sm">Age</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="includePatientGender" checked={options.includePatientGender} onCheckedChange={(checked) => handleOptionChange('includePatientGender', checked as boolean)} />
                                        <Label htmlFor="includePatientGender" className="text-sm">Gender</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="includePatientContact" checked={options.includePatientContact} onCheckedChange={(checked) => handleOptionChange('includePatientContact', checked as boolean)} />
                                        <Label htmlFor="includePatientContact" className="text-sm text-slate-500">Contact Information</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="includePatientAddress" checked={options.includePatientAddress} onCheckedChange={(checked) => handleOptionChange('includePatientAddress', checked as boolean)} />
                                        <Label htmlFor="includePatientAddress" className="text-sm text-slate-500">Address</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="includeEmergencyContact" checked={options.includeEmergencyContact} onCheckedChange={(checked) => handleOptionChange('includeEmergencyContact', checked as boolean)} />
                                        <Label htmlFor="includeEmergencyContact" className="text-sm text-slate-500">Emergency Contact</Label>
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
                                    <span className="font-semibold text-slate-800">Vital Signs & Measurements</span>
                                    <span className="text-xs text-slate-500 bg-rose-50 px-2 py-0.5 rounded-full">Health Data</span>
                                </div>
                                {expandedSections.vitalSigns ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </button>
                            {expandedSections.vitalSigns && (
                                <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-emerald-100 pt-3">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="includeVitalSigns" checked={options.includeVitalSigns} onCheckedChange={(checked) => handleOptionChange('includeVitalSigns', checked as boolean)} />
                                        <Label htmlFor="includeVitalSigns" className="text-sm">Vital Signs (BP, HR, Temp)</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="includeBMI" checked={options.includeBMI} onCheckedChange={(checked) => handleOptionChange('includeBMI', checked as boolean)} />
                                        <Label htmlFor="includeBMI" className="text-sm">BMI & Body Measurements</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="includeSmartConnectData" checked={options.includeSmartConnectData} onCheckedChange={(checked) => handleOptionChange('includeSmartConnectData', checked as boolean)} />
                                        <Label htmlFor="includeSmartConnectData" className="text-sm">Smart Connect Device Data</Label>
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
                                    <span className="font-semibold text-slate-800">Medical History</span>
                                    <span className="text-xs text-slate-500 bg-blue-50 px-2 py-0.5 rounded-full">Background</span>
                                </div>
                                {expandedSections.medicalHistory ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </button>
                            {expandedSections.medicalHistory && (
                                <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-emerald-100 pt-3">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="includeMedicalHistory" checked={options.includeMedicalHistory} onCheckedChange={(checked) => handleOptionChange('includeMedicalHistory', checked as boolean)} />
                                        <Label htmlFor="includeMedicalHistory" className="text-sm">Past Medical History</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="includeAllergies" checked={options.includeAllergies} onCheckedChange={(checked) => handleOptionChange('includeAllergies', checked as boolean)} />
                                        <Label htmlFor="includeAllergies" className="text-sm">Known Allergies</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="includeCurrentMedications" checked={options.includeCurrentMedications} onCheckedChange={(checked) => handleOptionChange('includeCurrentMedications', checked as boolean)} />
                                        <Label htmlFor="includeCurrentMedications" className="text-sm">Current Medications</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="includePastDiagnoses" checked={options.includePastDiagnoses} onCheckedChange={(checked) => handleOptionChange('includePastDiagnoses', checked as boolean)} />
                                        <Label htmlFor="includePastDiagnoses" className="text-sm">Past TCM Diagnoses</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="includeFamilyHistory" checked={options.includeFamilyHistory} onCheckedChange={(checked) => handleOptionChange('includeFamilyHistory', checked as boolean)} />
                                        <Label htmlFor="includeFamilyHistory" className="text-sm">Family Medical History</Label>
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
                                    <span className="font-semibold text-slate-800">TCM Recommendations</span>
                                    <span className="text-xs text-slate-500 bg-emerald-100 px-2 py-0.5 rounded-full">Treatment</span>
                                </div>
                                {expandedSections.recommendations ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </button>
                            {expandedSections.recommendations && (
                                <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-emerald-100 pt-3">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="suggestMedicine" checked={options.suggestMedicine} onCheckedChange={(checked) => handleOptionChange('suggestMedicine', checked as boolean)} />
                                        <Label htmlFor="suggestMedicine" className="text-sm">Herbal Medicine Suggestions</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="suggestDoctor" checked={options.suggestDoctor} onCheckedChange={(checked) => handleOptionChange('suggestDoctor', checked as boolean)} />
                                        <Label htmlFor="suggestDoctor" className="text-sm">Nearby TCM Doctor</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="includeDietary" checked={options.includeDietary} onCheckedChange={(checked) => handleOptionChange('includeDietary', checked as boolean)} />
                                        <Label htmlFor="includeDietary" className="text-sm">Dietary Advice (食疗)</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="includeLifestyle" checked={options.includeLifestyle} onCheckedChange={(checked) => handleOptionChange('includeLifestyle', checked as boolean)} />
                                        <Label htmlFor="includeLifestyle" className="text-sm">Lifestyle Tips (养生)</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="includeAcupuncture" checked={options.includeAcupuncture} onCheckedChange={(checked) => handleOptionChange('includeAcupuncture', checked as boolean)} />
                                        <Label htmlFor="includeAcupuncture" className="text-sm">Acupuncture Points (穴位)</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="includeExercise" checked={options.includeExercise} onCheckedChange={(checked) => handleOptionChange('includeExercise', checked as boolean)} />
                                        <Label htmlFor="includeExercise" className="text-sm">Exercise Recommendations</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="includeSleepAdvice" checked={options.includeSleepAdvice} onCheckedChange={(checked) => handleOptionChange('includeSleepAdvice', checked as boolean)} />
                                        <Label htmlFor="includeSleepAdvice" className="text-sm">Sleep & Rest Guidance</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="includeEmotionalWellness" checked={options.includeEmotionalWellness} onCheckedChange={(checked) => handleOptionChange('includeEmotionalWellness', checked as boolean)} />
                                        <Label htmlFor="includeEmotionalWellness" className="text-sm">Emotional Wellness (情志)</Label>
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
                                    <span className="font-semibold text-slate-800">Report Format & Extras</span>
                                    <span className="text-xs text-slate-500 bg-purple-50 px-2 py-0.5 rounded-full">Formatting</span>
                                </div>
                                {expandedSections.reportExtras ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </button>
                            {expandedSections.reportExtras && (
                                <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-emerald-100 pt-3">
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="includePrecautions" checked={options.includePrecautions} onCheckedChange={(checked) => handleOptionChange('includePrecautions', checked as boolean)} />
                                        <Label htmlFor="includePrecautions" className="text-sm">Precautions & Warnings</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="includeFollowUp" checked={options.includeFollowUp} onCheckedChange={(checked) => handleOptionChange('includeFollowUp', checked as boolean)} />
                                        <Label htmlFor="includeFollowUp" className="text-sm">Follow-up Guidance</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="includeTimestamp" checked={options.includeTimestamp} onCheckedChange={(checked) => handleOptionChange('includeTimestamp', checked as boolean)} />
                                        <Label htmlFor="includeTimestamp" className="text-sm">Report Timestamp</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="includeQRCode" checked={options.includeQRCode} onCheckedChange={(checked) => handleOptionChange('includeQRCode', checked as boolean)} />
                                        <Label htmlFor="includeQRCode" className="text-sm text-slate-500">QR Code for Digital Access</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Checkbox id="includeDoctorSignature" checked={options.includeDoctorSignature} onCheckedChange={(checked) => handleOptionChange('includeDoctorSignature', checked as boolean)} />
                                        <Label htmlFor="includeDoctorSignature" className="text-sm text-slate-500">Doctor Signature Field</Label>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </ScrollArea>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-stone-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 md:static md:bg-transparent md:border-none md:shadow-none md:p-0 flex gap-3">
                <Button
                    variant="outline"
                    onClick={onBack}
                    className="h-12 px-6 border-stone-300 text-stone-600 hover:bg-stone-100"
                >
                    <ChevronLeft className="w-5 h-5 mr-2" />
                    Back
                </Button>
                <Button
                    onClick={handleConfirm}
                    className="flex-1 h-12 text-lg font-semibold transition-all bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 shadow-lg"
                >
                    <span className="flex items-center gap-2">
                        Confirm & Generate Report
                        <ChevronRight className="w-5 h-5" />
                    </span>
                </Button>
            </div>
        </Card>
    )
}
