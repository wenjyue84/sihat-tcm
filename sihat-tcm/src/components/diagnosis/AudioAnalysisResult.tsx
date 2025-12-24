'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useLanguage } from '@/contexts/LanguageContext'
import { Mic, Wind, MessageSquare, Volume2, ChevronDown, ChevronUp, RefreshCw, ArrowRight, CheckCircle, AlertCircle, Info, Upload, Pencil, Save, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'

interface AnalysisCategory {
    observation: string
    severity: string
    tcm_indicators: string[]
    clinical_significance: string
}

interface AudioAnalysisData {
    overall_observation: string
    voice_quality_analysis: AnalysisCategory | null
    breathing_patterns: AnalysisCategory | null
    speech_patterns: AnalysisCategory | null
    cough_sounds: AnalysisCategory | null
    pattern_suggestions?: string[]
    recommendations?: string[]
    confidence: string
    notes?: string
    status: string
}

interface AudioAnalysisResultProps {
    analysisData: AudioAnalysisData
    onRetake: () => void
    onUpload: () => void
    onContinue: (data?: AudioAnalysisData) => void
}

const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
        case 'normal':
        case 'none':
            return {
                bg: 'bg-green-50',
                border: 'border-green-200',
                text: 'text-green-700',
                badge: 'bg-green-100 text-green-700'
            }
        case 'mild':
            return {
                bg: 'bg-yellow-50',
                border: 'border-yellow-200',
                text: 'text-yellow-700',
                badge: 'bg-yellow-100 text-yellow-700'
            }
        case 'moderate':
            return {
                bg: 'bg-orange-50',
                border: 'border-orange-200',
                text: 'text-orange-700',
                badge: 'bg-orange-100 text-orange-700'
            }
        case 'significant':
            return {
                bg: 'bg-red-50',
                border: 'border-red-200',
                text: 'text-red-700',
                badge: 'bg-red-100 text-red-700'
            }
        default:
            return {
                bg: 'bg-gray-50',
                border: 'border-gray-200',
                text: 'text-gray-700',
                badge: 'bg-gray-100 text-gray-700'
            }
    }
}

const getSeverityIcon = (severity: string) => {
    switch (severity?.toLowerCase()) {
        case 'normal':
        case 'none':
            return <CheckCircle className="w-4 h-4 text-green-500" />
        case 'mild':
            return <Info className="w-4 h-4 text-yellow-500" />
        case 'moderate':
            return <AlertCircle className="w-4 h-4 text-orange-500" />
        case 'significant':
            return <AlertCircle className="w-4 h-4 text-red-500" />
        default:
            return <Info className="w-4 h-4 text-gray-500" />
    }
}

interface CategoryCardProps {
    title: string
    icon: React.ReactNode
    iconBgColor: string
    data: AnalysisCategory | null
    isExpanded: boolean
    onToggle: () => void
    isEditing: boolean
    onUpdate: (newData: AnalysisCategory) => void
}

function CategoryCard({ title, icon, iconBgColor, data, isExpanded, onToggle, isEditing, onUpdate }: CategoryCardProps) {
    if (!data) return null

    const colors = getSeverityColor(data.severity)

    // Local state for editing form inputs
    // We update parent on every change or on blur/submit? 
    // For simplicity, let's update parent immediately or use local state and effect.
    // Actually, controlled components via parent state is better, or simpler: handle changes here and call onUpdate.

    return (
        <div
            className={`rounded-xl border-2 transition-all duration-300 overflow-hidden ${colors.border} ${colors.bg} ${!isEditing ? 'hover:shadow-md cursor-pointer' : ''}`}
            onClick={!isEditing ? onToggle : undefined}
        >
            <div className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full ${iconBgColor} flex items-center justify-center shadow-sm flex-shrink-0`}>
                    {icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-gray-800">{title}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge} flex items-center gap-1`}>
                            {getSeverityIcon(data.severity)}
                            <span className="capitalize">{data.severity || 'Normal'}</span>
                        </span>
                    </div>
                    {!isExpanded && !isEditing && (
                        <p className="text-sm text-gray-500 mt-0.5 truncate">{data.observation}</p>
                    )}
                </div>
                {!isEditing && (
                    <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                    </div>
                )}
            </div>

            {(isExpanded || isEditing) && (
                <div className="px-4 pb-4 space-y-3 animate-in fade-in duration-200">
                    <div className="h-px bg-gray-200" />

                    <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Observation</p>
                        {isEditing ? (
                            <Textarea
                                value={data.observation}
                                onChange={(e) => onUpdate({ ...data, observation: e.target.value })}
                                className="bg-white"
                                placeholder={`Enter observation for ${title}...`}
                            />
                        ) : (
                            <p className="text-sm text-gray-700 leading-relaxed">{data.observation}</p>
                        )}
                    </div>

                    {(isEditing || (data.tcm_indicators && data.tcm_indicators.length > 0)) && (
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1.5">TCM Indicators</p>
                            {isEditing ? (
                                <>
                                    <p className="text-xs text-gray-400 mb-1">One indicator per line</p>
                                    <Textarea
                                        value={data.tcm_indicators?.join('\n') || ''}
                                        onChange={(e) => onUpdate({
                                            ...data,
                                            tcm_indicators: e.target.value.split('\n').filter(s => s.trim().length > 0)
                                        })}
                                        className="bg-white min-h-[80px]"
                                        placeholder="e.g. Weak Pulse&#10;Pale Tongue"
                                    />
                                </>
                            ) : (
                                <div className="flex flex-wrap gap-1.5">
                                    {data.tcm_indicators.map((indicator, idx) => (
                                        <span
                                            key={idx}
                                            className="text-xs px-2 py-1 bg-white rounded-md border border-gray-200 text-gray-700"
                                        >
                                            {indicator}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {!isEditing && data.clinical_significance && (
                        <div className="bg-white/70 rounded-lg p-3 border border-gray-100">
                            <p className="text-sm font-medium text-gray-600 mb-1">Clinical Significance</p>
                            <p className="text-sm text-gray-700 leading-relaxed">{data.clinical_significance}</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export function AudioAnalysisResult({ analysisData, onRetake, onUpload, onContinue }: AudioAnalysisResultProps) {
    const { t } = useLanguage()
    const [isEditing, setIsEditing] = useState(false)
    const [editedData, setEditedData] = useState<AudioAnalysisData>(analysisData)

    // Sync state if props change (unlikely here but good practice)
    useEffect(() => {
        setEditedData(analysisData)
    }, [analysisData])

    const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
        voice: true, // Start with voice expanded
        breathing: false,
        speech: false,
        cough: false
    })

    const toggleCategory = (category: string) => {
        setExpandedCategories(prev => ({
            ...prev,
            [category]: !prev[category]
        }))
    }

    const handleUpdateCategory = (key: keyof AudioAnalysisData, newData: AnalysisCategory) => {
        setEditedData(prev => ({
            ...prev,
            [key]: newData
        }))
    }

    const toggleEdit = () => {
        if (isEditing) {
            // Turning off - handled by "Done" button usually
            setIsEditing(false)
        } else {
            // Turning on
            setIsEditing(true)
            // Expand all categories when editing for better visibility
            setExpandedCategories({
                voice: true,
                breathing: true,
                speech: true,
                cough: true
            })
        }
    }

    const cancelEdit = () => {
        setEditedData(analysisData) // Revert
        setIsEditing(false)
    }

    const categories = [
        {
            key: 'voice_quality_analysis' as keyof AudioAnalysisData,
            title: 'Voice Quality Analysis',
            icon: <Volume2 className="w-5 h-5 text-white" />,
            iconBgColor: 'bg-gradient-to-br from-blue-500 to-indigo-500',
            data: editedData.voice_quality_analysis
        },
        {
            key: 'breathing_patterns' as keyof AudioAnalysisData,
            title: 'Breathing Patterns',
            icon: <Wind className="w-5 h-5 text-white" />,
            iconBgColor: 'bg-gradient-to-br from-cyan-500 to-teal-500',
            data: editedData.breathing_patterns
        },
        {
            key: 'speech_patterns' as keyof AudioAnalysisData,
            title: 'Speech Patterns',
            icon: <MessageSquare className="w-5 h-5 text-white" />,
            iconBgColor: 'bg-gradient-to-br from-violet-500 to-purple-500',
            data: editedData.speech_patterns
        },
        {
            key: 'cough_sounds' as keyof AudioAnalysisData,
            title: 'Cough Sounds',
            icon: <Mic className="w-5 h-5 text-white" />,
            iconBgColor: 'bg-gradient-to-br from-rose-500 to-pink-500',
            data: editedData.cough_sounds
        }
    ]

    return (
        <div className="space-y-6 pb-24 md:pb-6">
            {/* Header */}
            <Card className="p-6 bg-gradient-to-br from-white to-green-50/50 border-green-200">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                            <Mic className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Listening Analysis Complete</h2>
                            <p className="text-sm text-gray-500">闻诊 (Wén Zhěn) Results</p>
                        </div>
                    </div>

                    {/* Edit Controls */}
                    <div className="flex items-center gap-2">
                        {!isEditing ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={toggleEdit}
                                className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                            >
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit Result
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={cancelEdit}
                                    className="text-stone-500 hover:bg-stone-100"
                                >
                                    <X className="w-4 h-4 mr-1" />
                                    Cancel
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsEditing(false)}
                                    className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                >
                                    <Save className="w-4 h-4 mr-2" />
                                    Done
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Confidence Badge (hidden in edit mode to save space/reduce clutter?) - keeping it is fine */}
                {!isEditing && editedData.confidence && (
                    <div className={`mb-4 inline-block px-3 py-1 rounded-full text-sm font-medium ${editedData.confidence === 'high' ? 'bg-green-100 text-green-700' :
                        editedData.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                        }`}>
                        {editedData.confidence === 'high' ? 'High' :
                            editedData.confidence === 'medium' ? 'Medium' : 'Low'} Confidence
                    </div>
                )}

                {/* Overall Observation */}
                <div className={`rounded-xl p-4 border transition-colors ${isEditing ? 'bg-white border-green-300 ring-2 ring-green-100' : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-100'}`}>
                    {isEditing ? (
                        <>
                            <Label htmlFor="overall" className="text-green-800 mb-2 block">Overall Observation</Label>
                            <Textarea
                                id="overall"
                                value={editedData.overall_observation}
                                onChange={(e) => setEditedData(prev => ({ ...prev, overall_observation: e.target.value }))}
                                className="bg-white border-green-200"
                            />
                        </>
                    ) : (
                        <p className="text-gray-700 leading-relaxed">{editedData.overall_observation}</p>
                    )}
                </div>
            </Card>

            {/* Analysis Categories */}
            <div className="space-y-3">
                {categories.map(category => (
                    <CategoryCard
                        key={category.key}
                        title={category.title}
                        icon={category.icon}
                        iconBgColor={category.iconBgColor}
                        data={category.data as AnalysisCategory}
                        isExpanded={expandedCategories[category.key as string]}
                        onToggle={() => toggleCategory(category.key as string)}
                        isEditing={isEditing}
                        onUpdate={(newData) => handleUpdateCategory(category.key, newData)}
                    />
                ))}
            </div>

            {/* Pattern Suggestions */}
            {(editedData.pattern_suggestions && (editedData.pattern_suggestions.length > 0 || isEditing)) && (
                <Card className={`p-4 border border-purple-100 ${isEditing ? 'bg-white ring-2 ring-purple-100' : 'bg-gradient-to-r from-purple-50 to-indigo-50'}`}>
                    <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                        <span>🔮</span> Pattern Suggestions
                    </h4>
                    {isEditing ? (
                        <>
                            <p className="text-xs text-stone-500 mb-1">One pattern per line</p>
                            <Textarea
                                value={editedData.pattern_suggestions?.join('\n') || ''}
                                onChange={(e) => setEditedData(prev => ({
                                    ...prev,
                                    pattern_suggestions: e.target.value.split('\n').filter(s => s.trim().length > 0)
                                }))}
                                className="bg-white"
                            />
                        </>
                    ) : (
                        <ul className="space-y-1">
                            {editedData.pattern_suggestions?.map((pattern, idx) => (
                                <li key={idx} className="text-sm text-purple-700 flex items-start gap-2">
                                    <span className="text-purple-400 mt-0.5">•</span>
                                    {pattern}
                                </li>
                            ))}
                        </ul>
                    )}
                </Card>
            )}

            {/* Notes */}
            {(editedData.notes || isEditing) && (
                <div className={`rounded-xl p-4 border transition-colors ${isEditing ? 'bg-white border-amber-300 ring-2 ring-amber-100' : 'bg-amber-50 border-amber-100'}`}>
                    <div className="flex items-center gap-2 mb-1">
                        <Info className="w-4 h-4 text-amber-600" />
                        <span className="font-medium text-amber-800 text-sm">Note</span>
                    </div>
                    {isEditing ? (
                        <Textarea
                            value={editedData.notes || ''}
                            onChange={(e) => setEditedData(prev => ({ ...prev, notes: e.target.value }))}
                            className="bg-white border-amber-200"
                            placeholder="Add notes..."
                        />
                    ) : (
                        <p className="text-sm text-amber-700">{editedData.notes}</p>
                    )}
                </div>
            )}

            {/* Action Buttons */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-stone-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-50 md:static md:bg-transparent md:border-none md:shadow-none md:p-0 flex gap-3">
                <Button
                    variant="outline"
                    onClick={onRetake}
                    className="flex-1 h-12 text-gray-600 border-gray-300 hover:bg-gray-50"
                    disabled={isEditing}
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Record Again
                </Button>
                <Button
                    variant="outline"
                    onClick={onUpload}
                    className="flex-1 h-12 text-gray-600 border-gray-300 hover:bg-gray-50"
                    disabled={isEditing}
                >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Audio
                </Button>
                <Button
                    onClick={() => onContinue(editedData)}
                    className="hidden md:flex flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-md"
                    disabled={isEditing}
                >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
            {/* Mobile Continue Button (only show if buttons are fixed) - duplicate for mobile fixed nav is already in layout above, but this specific one is usually hidden on mobile via CSS on parent or handled by wizard? 
                 Ah, looking at previous code, the buttons were flexible. I added the 'fixed bottom-0' wrapper to match ObservationResult style for mobile consistency. 
                 The "Record Again" and "Upload" buttons take up space. Let's make sure "Continue" is also visible on mobile.
              */}
            <div className="md:hidden fixed bottom-20 right-4 z-50">
                <Button
                    onClick={() => onContinue(editedData)}
                    className="h-12 w-full shadow-xl bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6"
                    disabled={isEditing}
                >
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </div>
    )
}
