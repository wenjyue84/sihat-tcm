import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ChevronRight, ChevronLeft, Edit2, Check } from 'lucide-react'

interface DiagnosisSummaryProps {
    data: any
    onConfirm: (confirmedData: any, options: any) => void
    onBack: () => void
}

export function DiagnosisSummary({ data, onConfirm, onBack }: DiagnosisSummaryProps) {
    const [summaries, setSummaries] = useState<Record<string, string>>({})
    const [options, setOptions] = useState({
        suggestMedicine: true,
        suggestDoctor: true,
        includeDietary: true,
        includeLifestyle: true
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

                    <div className="bg-emerald-50 p-4 rounded-xl space-y-4 mt-6">
                        <h3 className="font-semibold text-emerald-800 flex items-center gap-2">
                            <Check className="w-5 h-5" />
                            Report Options
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="suggestMedicine"
                                    checked={options.suggestMedicine}
                                    onCheckedChange={(checked) => handleOptionChange('suggestMedicine', checked as boolean)}
                                />
                                <Label htmlFor="suggestMedicine">Suggest Herbal Medicine</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="suggestDoctor"
                                    checked={options.suggestDoctor}
                                    onCheckedChange={(checked) => handleOptionChange('suggestDoctor', checked as boolean)}
                                />
                                <Label htmlFor="suggestDoctor">Suggest Nearby TCM Doctor</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="includeDietary"
                                    checked={options.includeDietary}
                                    onCheckedChange={(checked) => handleOptionChange('includeDietary', checked as boolean)}
                                />
                                <Label htmlFor="includeDietary">Include Dietary Advice</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="includeLifestyle"
                                    checked={options.includeLifestyle}
                                    onCheckedChange={(checked) => handleOptionChange('includeLifestyle', checked as boolean)}
                                />
                                <Label htmlFor="includeLifestyle">Include Lifestyle Tips</Label>
                            </div>
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
