'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import { Mic, Wind, MessageSquare, Volume2, ChevronDown, ChevronUp, RefreshCw, ArrowRight, CheckCircle, AlertCircle, Info, Upload } from 'lucide-react'
import { useState } from 'react'

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
    onContinue: () => void
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
}

function CategoryCard({ title, icon, iconBgColor, data, isExpanded, onToggle }: CategoryCardProps) {
    if (!data) return null

    const colors = getSeverityColor(data.severity)

    return (
        <div
            className={`rounded-xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${colors.border} ${colors.bg} hover:shadow-md`}
            onClick={onToggle}
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
                    {!isExpanded && (
                        <p className="text-sm text-gray-500 mt-0.5 truncate">{data.observation}</p>
                    )}
                </div>
                <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                </div>
            </div>

            {isExpanded && (
                <div className="px-4 pb-4 space-y-3 animate-in fade-in duration-200">
                    <div className="h-px bg-gray-200" />

                    <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">Observation</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{data.observation}</p>
                    </div>

                    {data.tcm_indicators && data.tcm_indicators.length > 0 && (
                        <div>
                            <p className="text-sm font-medium text-gray-600 mb-1.5">TCM Indicators</p>
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
                        </div>
                    )}

                    {data.clinical_significance && (
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

    const categories = [
        {
            key: 'voice',
            title: 'Voice Quality Analysis',
            icon: <Volume2 className="w-5 h-5 text-white" />,
            iconBgColor: 'bg-gradient-to-br from-blue-500 to-indigo-500',
            data: analysisData.voice_quality_analysis
        },
        {
            key: 'breathing',
            title: 'Breathing Patterns',
            icon: <Wind className="w-5 h-5 text-white" />,
            iconBgColor: 'bg-gradient-to-br from-cyan-500 to-teal-500',
            data: analysisData.breathing_patterns
        },
        {
            key: 'speech',
            title: 'Speech Patterns',
            icon: <MessageSquare className="w-5 h-5 text-white" />,
            iconBgColor: 'bg-gradient-to-br from-violet-500 to-purple-500',
            data: analysisData.speech_patterns
        },
        {
            key: 'cough',
            title: 'Cough Sounds',
            icon: <Mic className="w-5 h-5 text-white" />,
            iconBgColor: 'bg-gradient-to-br from-rose-500 to-pink-500',
            data: analysisData.cough_sounds
        }
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <Card className="p-6 bg-gradient-to-br from-white to-green-50/50 border-green-200">
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                        <Mic className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">Listening Analysis Complete</h2>
                        <p className="text-sm text-gray-500">闻诊 (Wén Zhěn) Results</p>
                    </div>
                    {analysisData.confidence && (
                        <div className={`ml-auto px-3 py-1 rounded-full text-sm font-medium ${analysisData.confidence === 'high' ? 'bg-green-100 text-green-700' :
                            analysisData.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                            }`}>
                            {analysisData.confidence === 'high' ? 'High' :
                                analysisData.confidence === 'medium' ? 'Medium' : 'Low'} Confidence
                        </div>
                    )}
                </div>

                {/* Overall Observation */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                    <p className="text-gray-700 leading-relaxed">{analysisData.overall_observation}</p>
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
                        data={category.data}
                        isExpanded={expandedCategories[category.key]}
                        onToggle={() => toggleCategory(category.key)}
                    />
                ))}
            </div>

            {/* Pattern Suggestions */}
            {analysisData.pattern_suggestions && analysisData.pattern_suggestions.length > 0 && (
                <Card className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-100">
                    <h4 className="font-semibold text-purple-800 mb-2 flex items-center gap-2">
                        <span>🔮</span> Pattern Suggestions
                    </h4>
                    <ul className="space-y-1">
                        {analysisData.pattern_suggestions.map((pattern, idx) => (
                            <li key={idx} className="text-sm text-purple-700 flex items-start gap-2">
                                <span className="text-purple-400 mt-0.5">•</span>
                                {pattern}
                            </li>
                        ))}
                    </ul>
                </Card>
            )}

            {/* Notes */}
            {analysisData.notes && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                    <div className="flex items-center gap-2 mb-1">
                        <Info className="w-4 h-4 text-amber-600" />
                        <span className="font-medium text-amber-800 text-sm">Note</span>
                    </div>
                    <p className="text-sm text-amber-700">{analysisData.notes}</p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
                <Button
                    variant="outline"
                    onClick={onRetake}
                    className="flex-1 h-12 text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Record Again
                </Button>
                <Button
                    variant="outline"
                    onClick={onUpload}
                    className="flex-1 h-12 text-gray-600 border-gray-300 hover:bg-gray-50"
                >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Audio
                </Button>
                <Button
                    onClick={onContinue}
                    className="hidden md:flex flex-1 h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-md"
                >
                    Continue
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </div>
    )
}
