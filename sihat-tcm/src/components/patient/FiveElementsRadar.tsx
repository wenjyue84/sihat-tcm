'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    ChevronLeft,
    ChevronRight,
    Info,
    TrendingUp,
    Heart,
    Wind,
    Flame,
    Droplets,
    Leaf
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

// Five Elements data structure
export interface FiveElementsScore {
    liver: number    // 肝（木）Wood
    heart: number    // 心（火）Fire
    spleen: number   // 脾（土）Earth
    lung: number     // 肺（金）Metal
    kidney: number   // 肾（水）Water
    timestamp?: string
}

interface FiveElementsRadarProps {
    // Current scores
    currentScores?: FiveElementsScore
    // Historical scores for timeline
    historicalScores?: FiveElementsScore[]
    // Constitution type to infer scores if not provided
    constitutionType?: string
    // Diagnosis data to extract organ scores
    diagnosisData?: any
}

// Icons for each element
const ELEMENT_ICONS = {
    liver: Leaf,
    heart: Flame,
    spleen: Wind,
    lung: Wind,
    kidney: Droplets
}

// Colors for each element (五行颜色)
const ELEMENT_COLORS = {
    liver: '#10b981',   // Wood - Green
    heart: '#ef4444',   // Fire - Red
    spleen: '#eab308',  // Earth - Yellow
    lung: '#e5e7eb',    // Metal - White/Gray
    kidney: '#3b82f6'   // Water - Blue
}

const ELEMENT_DARK_COLORS = {
    liver: '#047857',
    heart: '#991b1b',
    spleen: '#854d0e',
    lung: '#6b7280',
    kidney: '#1e3a8a'
}

export function FiveElementsRadar({
    currentScores,
    historicalScores = [],
    constitutionType,
    diagnosisData
}: FiveElementsRadarProps) {
    const { t } = useLanguage()
    const [selectedElement, setSelectedElement] = useState<string | null>(null)
    const [timelineIndex, setTimelineIndex] = useState(historicalScores.length - 1)
    const [showInfo, setShowInfo] = useState(false)

    // Calculate scores from constitution or diagnosis if not provided
    const scores = useMemo(() => {
        if (currentScores) return currentScores

        // If we have historical data, use the latest
        if (historicalScores.length > 0 && timelineIndex >= 0) {
            return historicalScores[timelineIndex]
        }

        // Otherwise, infer from constitution type
        return inferScoresFromConstitution(constitutionType || 'balanced')
    }, [currentScores, historicalScores, timelineIndex, constitutionType])

    // Transform data for radar chart
    const chartData = useMemo(() => {
        return [
            {
                element: t.fiveElementsRadar?.organs?.liver || 'Liver (Wood)',
                score: scores.liver,
                fullMark: 100,
                color: ELEMENT_COLORS.liver,
                icon: 'liver',
                elementKey: 'liver'
            },
            {
                element: t.fiveElementsRadar?.organs?.heart || 'Heart (Fire)',
                score: scores.heart,
                fullMark: 100,
                color: ELEMENT_COLORS.heart,
                icon: 'heart',
                elementKey: 'heart'
            },
            {
                element: t.fiveElementsRadar?.organs?.spleen || 'Spleen (Earth)',
                score: scores.spleen,
                fullMark: 100,
                color: ELEMENT_COLORS.spleen,
                icon: 'spleen',
                elementKey: 'spleen'
            },
            {
                element: t.fiveElementsRadar?.organs?.lung || 'Lung (Metal)',
                score: scores.lung,
                fullMark: 100,
                color: ELEMENT_COLORS.lung,
                icon: 'lung',
                elementKey: 'lung'
            },
            {
                element: t.fiveElementsRadar?.organs?.kidney || 'Kidney (Water)',
                score: scores.kidney,
                fullMark: 100,
                color: ELEMENT_COLORS.kidney,
                icon: 'kidney',
                elementKey: 'kidney'
            }
        ]
    }, [scores, t])

    const handlePrevious = () => {
        if (timelineIndex > 0) {
            setTimelineIndex(timelineIndex - 1)
        }
    }

    const handleNext = () => {
        if (timelineIndex < historicalScores.length - 1) {
            setTimelineIndex(timelineIndex + 1)
        }
    }

    // Find elements that need attention (score < 60)
    const weakElements = chartData.filter(item => item.score < 60)

    return (
        <Card className="overflow-hidden border-amber-200/50 shadow-lg bg-gradient-to-br from-amber-50/30 to-orange-50/30">
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle className="text-2xl font-serif text-slate-800 flex items-center gap-2">
                            {t.fiveElementsRadar?.title || 'Five Elements Health Radar'}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowInfo(!showInfo)}
                                className="h-6 w-6 p-0 rounded-full hover:bg-amber-100"
                            >
                                <Info className="h-4 w-4 text-amber-600" />
                            </Button>
                        </CardTitle>
                        <CardDescription className="mt-1">
                            {t.fiveElementsRadar?.subtitle || 'Traditional Chinese Medicine organ health assessment based on the Five Elements theory'}
                        </CardDescription>
                    </div>
                    {weakElements.length > 0 && (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            {weakElements.length} {t.fiveElementsRadar?.needsAttention || 'Need Attention'}
                        </Badge>
                    )}
                </div>

                {/* Info panel */}
                <AnimatePresence>
                    {showInfo && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-4 p-4 bg-amber-50/50 rounded-xl border border-amber-200"
                        >
                            <h4 className="font-semibold text-slate-800 mb-2">
                                {t.fiveElementsRadar?.legend?.title || 'Five Elements (五行) Theory'}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-600">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ELEMENT_COLORS.liver }} />
                                    <span className="font-medium text-emerald-700">Wood (木)</span> → Liver
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ELEMENT_COLORS.heart }} />
                                    <span className="font-medium text-red-700">Fire (火)</span> → Heart
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ELEMENT_COLORS.spleen }} />
                                    <span className="font-medium text-yellow-700">Earth (土)</span> → Spleen
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ELEMENT_COLORS.lung }} />
                                    <span className="font-medium text-gray-700">Metal (金)</span> → Lung
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ELEMENT_COLORS.kidney }} />
                                    <span className="font-medium text-blue-700">Water (水)</span> → Kidney
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Radar Chart */}
                <div className="relative">
                    {/* Background texture */}
                    <div className="absolute inset-0 opacity-5 bg-[url('/images/tcm-pattern.png')] bg-cover bg-center rounded-xl" />

                    <ResponsiveContainer width="100%" height={400}>
                        <RadarChart data={chartData}>
                            <PolarGrid stroke="#d1d5db" strokeDasharray="3 3" />
                            <PolarAngleAxis
                                dataKey="element"
                                tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
                            />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#94a3b8' }} />
                            <Radar
                                name="Score"
                                dataKey="score"
                                stroke="#f59e0b"
                                fill="#fbbf24"
                                fillOpacity={0.6}
                                strokeWidth={2}
                            />
                            <Tooltip
                                content={({ payload }) => {
                                    if (!payload || payload.length === 0) return null
                                    const data = payload[0].payload
                                    return (
                                        <div className="bg-white/95 backdrop-blur-sm p-3 rounded-lg border border-slate-200 shadow-lg">
                                            <p className="font-semibold text-slate-800">{data.element}</p>
                                            <p className="text-2xl font-bold" style={{ color: data.color }}>
                                                {data.score}
                                                <span className="text-sm text-slate-500 ml-1">/ 100</span>
                                            </p>
                                            {data.score < 60 && (
                                                <p className="text-xs text-orange-600 mt-1">⚠️ Needs attention</p>
                                            )}
                                        </div>
                                    )
                                }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                {/* Element cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {chartData.map((item) => {
                        const isWeak = item.score < 60
                        const isSelected = selectedElement === item.elementKey

                        return (
                            <motion.button
                                key={item.elementKey}
                                onClick={() => setSelectedElement(isSelected ? null : item.elementKey)}
                                className={`
                  p-3 rounded-xl border-2 transition-all text-left
                  ${isSelected
                                        ? 'border-amber-500 bg-amber-50 shadow-md'
                                        : isWeak
                                            ? 'border-orange-200 bg-orange-50/50 hover:border-orange-300'
                                            : 'border-slate-200 bg-white hover:border-slate-300'
                                    }
                `}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm"
                                        style={{ backgroundColor: isWeak ? ELEMENT_DARK_COLORS[item.elementKey as keyof typeof ELEMENT_DARK_COLORS] : item.color }}
                                    >
                                        {item.score}
                                    </div>
                                    {isWeak && <span className="text-orange-500 text-xs">⚠️</span>}
                                </div>
                                <p className="text-xs font-medium text-slate-600 truncate">{item.element}</p>
                            </motion.button>
                        )
                    })}
                </div>

                {/* Selected element details */}
                <AnimatePresence>
                    {selectedElement && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="p-5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <h4 className="font-semibold text-lg text-slate-800">
                                        {chartData.find(d => d.elementKey === selectedElement)?.element}
                                    </h4>
                                    <p className="text-sm text-slate-600 mt-1">
                                        {getElementDescription(selectedElement, t)}
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSelectedElement(null)}
                                    className="h-6 w-6 p-0"
                                >
                                    ✕
                                </Button>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 mb-1">
                                        {t.fiveElementsRadar?.currentStatus || 'Current Status'}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all"
                                                style={{
                                                    width: `${scores[selectedElement as keyof FiveElementsScore]}%`,
                                                    backgroundColor: chartData.find(d => d.elementKey === selectedElement)?.color
                                                }}
                                            />
                                        </div>
                                        <span className="text-sm font-bold text-slate-700">
                                            {scores[selectedElement as keyof FiveElementsScore]}%
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-xs font-medium text-slate-500 mb-2">
                                        {t.fiveElementsRadar?.recommendations || 'Recommendations'}
                                    </p>
                                    <ul className="space-y-1 text-sm text-slate-700">
                                        {getElementRecommendations(selectedElement, scores[selectedElement as keyof FiveElementsScore], t).map((rec, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <span className="text-amber-600 mt-0.5">•</span>
                                                <span>{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Timeline controls */}
                {historicalScores.length > 1 && (
                    <div className="pt-4 border-t border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-sm font-medium text-slate-700 flex items-center gap-1">
                                <TrendingUp className="w-4 h-4 text-amber-600" />
                                {t.fiveElementsRadar?.historicalTrend || 'Historical Trend'}
                            </p>
                            <p className="text-xs text-slate-500">
                                {timelineIndex + 1} / {historicalScores.length}
                            </p>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handlePrevious}
                                disabled={timelineIndex === 0}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>

                            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-amber-500 rounded-full transition-all"
                                    style={{ width: `${((timelineIndex + 1) / historicalScores.length) * 100}%` }}
                                />
                            </div>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleNext}
                                disabled={timelineIndex === historicalScores.length - 1}
                                className="h-8 w-8 p-0"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        {scores.timestamp && (
                            <p className="text-xs text-slate-500 mt-2 text-center">
                                {new Date(scores.timestamp).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

// Helper function to infer scores from constitution type
function inferScoresFromConstitution(constitutionType: string): FiveElementsScore {
    const baseScores: FiveElementsScore = {
        liver: 70,
        heart: 70,
        spleen: 70,
        lung: 70,
        kidney: 70
    }

    const type = constitutionType.toLowerCase()

    // Adjust based on constitution patterns
    if (type.includes('qi') && type.includes('deficiency')) {
        baseScores.spleen = 55
        baseScores.lung = 60
    }
    if (type.includes('yang') && type.includes('deficiency')) {
        baseScores.kidney = 55
        baseScores.spleen = 60
    }
    if (type.includes('yin') && type.includes('deficiency')) {
        baseScores.kidney = 55
        baseScores.liver = 60
    }
    if (type.includes('damp') || type.includes('phlegm')) {
        baseScores.spleen = 55
        baseScores.lung = 58
    }
    if (type.includes('heat') || type.includes('fire')) {
        baseScores.heart = 55
        baseScores.liver = 58
    }
    if (type.includes('blood') && type.includes('stasis')) {
        baseScores.liver = 55
        baseScores.heart = 58
    }
    if (type.includes('balanced') || type.includes('平和')) {
        baseScores.liver = 80
        baseScores.heart = 82
        baseScores.spleen = 78
        baseScores.lung = 80
        baseScores.kidney = 79
    }

    return baseScores
}

// Helper function to get element description
function getElementDescription(element: string, t: any): string {
    const descriptions: Record<string, string> = {
        liver: t.fiveElementsRadar?.descriptions?.liver || 'The Liver (Wood element) governs the smooth flow of Qi and blood, stores blood, and controls the tendons. It is associated with emotional well-being and planning.',
        heart: t.fiveElementsRadar?.descriptions?.heart || 'The Heart (Fire element) governs blood circulation and houses the Shen (spirit/mind). It controls consciousness, memory, and sleep.',
        spleen: t.fiveElementsRadar?.descriptions?.spleen || 'The Spleen (Earth element) governs digestion, transformation, and transportation of nutrients. It produces Qi and blood and controls the muscles.',
        lung: t.fiveElementsRadar?.descriptions?.lung || 'The Lung (Metal element) governs Qi and respiration, controls the skin and body hair, and regulates water passages.',
        kidney: t.fiveElementsRadar?.descriptions?.kidney || 'The Kidney (Water element) stores Essence (Jing), governs birth, growth, reproduction, and development. It controls bones, marrow, and the brain.'
    }
    return descriptions[element] || 'No description available'
}

// Helper function to get recommendations
function getElementRecommendations(element: string, score: number, t: any): string[] {
    const isWeak = score < 60

    const recommendations: Record<string, { weak: string[], normal: string[] }> = {
        liver: {
            weak: [
                t.fiveElementsRadar?.tips?.liver?.weak1 || 'Eat more green vegetables (spinach, broccoli, celery)',
                t.fiveElementsRadar?.tips?.liver?.weak2 || 'Practice gentle stretching and Tai Chi',
                t.fiveElementsRadar?.tips?.liver?.weak3 || 'Manage stress and avoid anger',
                t.fiveElementsRadar?.tips?.liver?.weak4 || 'Get adequate sleep (11pm-3am is Liver meridian time)'
            ],
            normal: [
                t.fiveElementsRadar?.tips?.liver?.normal1 || 'Continue eating green vegetables regularly',
                t.fiveElementsRadar?.tips?.liver?.normal2 || 'Maintain emotional balance',
                t.fiveElementsRadar?.tips?.liver?.normal3 || 'Keep regular sleep schedule'
            ]
        },
        heart: {
            weak: [
                t.fiveElementsRadar?.tips?.heart?.weak1 || 'Eat red foods (red beans, goji berries, red dates)',
                t.fiveElementsRadar?.tips?.heart?.weak2 || 'Practice meditation and deep breathing',
                t.fiveElementsRadar?.tips?.heart?.weak3 || 'Avoid excessive excitement or stress',
                t.fiveElementsRadar?.tips?.heart?.weak4 || 'Ensure good quality sleep'
            ],
            normal: [
                t.fiveElementsRadar?.tips?.heart?.normal1 || 'Maintain joyful activities',
                t.fiveElementsRadar?.tips?.heart?.normal2 || 'Continue mindfulness practices',
                t.fiveElementsRadar?.tips?.heart?.normal3 || 'Stay socially connected'
            ]
        },
        spleen: {
            weak: [
                t.fiveElementsRadar?.tips?.spleen?.weak1 || 'Eat warm, cooked foods (avoid raw and cold)',
                t.fiveElementsRadar?.tips?.spleen?.weak2 || 'Include yellow foods (sweet potato, pumpkin)',
                t.fiveElementsRadar?.tips?.spleen?.weak3 || 'Eat regular meals at consistent times',
                t.fiveElementsRadar?.tips?.spleen?.weak4 || 'Avoid overthinking and excessive worry'
            ],
            normal: [
                t.fiveElementsRadar?.tips?.spleen?.normal1 || 'Continue regular meal schedule',
                t.fiveElementsRadar?.tips?.spleen?.normal2 || 'Keep digestive system healthy',
                t.fiveElementsRadar?.tips?.spleen?.normal3 || 'Maintain positive thinking'
            ]
        },
        lung: {
            weak: [
                t.fiveElementsRadar?.tips?.lung?.weak1 || 'Eat white foods (pear, lotus root, white fungus)',
                t.fiveElementsRadar?.tips?.lung?.weak2 || 'Practice deep breathing exercises',
                t.fiveElementsRadar?.tips?.lung?.weak3 || 'Keep indoor air quality good',
                t.fiveElementsRadar?.tips?.lung?.weak4 || 'Avoid cold and stay warm in autumn/winter'
            ],
            normal: [
                t.fiveElementsRadar?.tips?.lung?.normal1 || 'Continue respiratory health practices',
                t.fiveElementsRadar?.tips?.lung?.normal2 || 'Maintain good posture',
                t.fiveElementsRadar?.tips?.lung?.normal3 || 'Fresh air exposure daily'
            ]
        },
        kidney: {
            weak: [
                t.fiveElementsRadar?.tips?.kidney?.weak1 || 'Eat black foods (black sesame, black beans, walnuts)',
                t.fiveElementsRadar?.tips?.kidney?.weak2 || 'Avoid overwork and excessive sexual activity',
                t.fiveElementsRadar?.tips?.kidney?.weak3 || 'Keep lower back and feet warm',
                t.fiveElementsRadar?.tips?.kidney?.weak4 || 'Get adequate rest and sleep'
            ],
            normal: [
                t.fiveElementsRadar?.tips?.kidney?.normal1 || 'Maintain work-life balance',
                t.fiveElementsRadar?.tips?.kidney?.normal2 || 'Continue healthy lifestyle',
                t.fiveElementsRadar?.tips?.kidney?.normal3 || 'Regular gentle exercise'
            ]
        }
    }

    return isWeak ? recommendations[element]?.weak || [] : recommendations[element]?.normal || []
}
