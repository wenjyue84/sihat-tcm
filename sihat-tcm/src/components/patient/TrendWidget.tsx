'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Activity, Calendar, Zap, Info, X, Calculator, BarChart3, Target, ArrowRight, Clock } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'
import { useLanguage } from '@/contexts/LanguageContext'

interface TrendData {
    sessionCount: number
    averageScore: number | null
    improvement: number | null
    diagnosisCounts: Record<string, number>
    sessions: Array<{ score: number | null | undefined; date: string }>
}

interface TrendWidgetProps {
    trendData: TrendData | null
    loading?: boolean
}

// Score breakdown modal for Average Score
function AverageScoreModal({
    open,
    onOpenChange,
    averageScore,
    sessions
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    averageScore: number
    sessions: Array<{ score: number | null | undefined; date: string }>
}) {
    const validSessions = sessions.filter(s => s.score !== null && s.score !== undefined)
    const scores = validSessions.map(s => s.score as number)
    const total = scores.reduce((a, b) => a + b, 0)
    const min = Math.min(...scores)
    const max = Math.max(...scores)
    const variance = scores.length > 1
        ? scores.reduce((acc, val) => acc + Math.pow(val - averageScore, 2), 0) / scores.length
        : 0
    const stdDev = Math.sqrt(variance)

    // Categorize scores
    const excellent = scores.filter(s => s >= 80).length
    const good = scores.filter(s => s >= 60 && s < 80).length
    const fair = scores.filter(s => s >= 40 && s < 60).length
    const needsWork = scores.filter(s => s < 40).length

    const getScoreInterpretation = (score: number) => {
        if (score >= 80) return { label: 'Excellent', color: 'text-emerald-600', bg: 'bg-emerald-100', description: 'Strong Qi flow, balanced constitution' }
        if (score >= 60) return { label: 'Good', color: 'text-teal-600', bg: 'bg-teal-100', description: 'Minor imbalances, generally healthy' }
        if (score >= 40) return { label: 'Fair', color: 'text-amber-600', bg: 'bg-amber-100', description: 'Notable imbalances requiring attention' }
        return { label: 'Needs Improvement', color: 'text-red-600', bg: 'bg-red-100', description: 'Significant imbalances, active treatment recommended' }
    }

    const interpretation = getScoreInterpretation(averageScore)

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl max-w-lg w-[95vw] max-h-[85vh] overflow-y-auto z-50 p-0">
                    <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-emerald-600 text-white p-6 rounded-t-2xl">
                        <Dialog.Title className="text-xl font-bold flex items-center gap-2">
                            <Calculator className="w-6 h-6" />
                            Average Score Breakdown
                        </Dialog.Title>
                        <Dialog.Description className="text-teal-100 text-sm mt-1">
                            Scientific methodology behind your health score calculation
                        </Dialog.Description>
                        <Dialog.Close asChild>
                            <button className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </Dialog.Close>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Main Score Display */}
                        <div className="text-center bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-6 border border-teal-100">
                            <p className="text-6xl font-bold text-teal-700">{averageScore}</p>
                            <p className={`text-sm font-medium mt-2 ${interpretation.color}`}>
                                {interpretation.label}
                            </p>
                            <p className="text-xs text-slate-500 mt-1">{interpretation.description}</p>
                        </div>

                        {/* Calculation Formula */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                                <Target className="w-4 h-4 text-teal-600" />
                                Calculation Method
                            </h4>
                            <div className="bg-white rounded-lg p-4 font-mono text-sm text-slate-700 border border-slate-100">
                                <p className="mb-2">Average Score = Σ (Session Scores) ÷ n</p>
                                <p className="text-teal-600">= ({scores.join(' + ')}) ÷ {scores.length}</p>
                                <p className="text-emerald-600 font-bold mt-1">= {total} ÷ {scores.length} = {averageScore}</p>
                            </div>
                            <p className="text-xs text-slate-500 mt-3">
                                The arithmetic mean is used to provide a balanced representation of your overall health trend,
                                giving equal weight to each diagnosis session.
                            </p>
                        </div>

                        {/* Statistical Analysis */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                                <BarChart3 className="w-4 h-4 text-teal-600" />
                                Statistical Analysis
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white rounded-lg p-3 border border-slate-100 text-center">
                                    <p className="text-2xl font-bold text-slate-800">{min}</p>
                                    <p className="text-xs text-slate-500">Minimum Score</p>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-slate-100 text-center">
                                    <p className="text-2xl font-bold text-slate-800">{max}</p>
                                    <p className="text-xs text-slate-500">Maximum Score</p>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-slate-100 text-center">
                                    <p className="text-2xl font-bold text-slate-800">{max - min}</p>
                                    <p className="text-xs text-slate-500">Range</p>
                                </div>
                                <div className="bg-white rounded-lg p-3 border border-slate-100 text-center">
                                    <p className="text-2xl font-bold text-slate-800">±{stdDev.toFixed(1)}</p>
                                    <p className="text-xs text-slate-500">Std. Deviation</p>
                                </div>
                            </div>
                        </div>

                        {/* Score Distribution */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <h4 className="font-semibold text-slate-800 mb-3">Score Distribution</h4>
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-24 text-xs text-emerald-600 font-medium">Excellent (80+)</div>
                                    <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(excellent / scores.length) * 100}%` }} />
                                    </div>
                                    <div className="w-8 text-xs text-slate-600 text-right">{excellent}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-24 text-xs text-teal-600 font-medium">Good (60-79)</div>
                                    <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${(good / scores.length) * 100}%` }} />
                                    </div>
                                    <div className="w-8 text-xs text-slate-600 text-right">{good}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-24 text-xs text-amber-600 font-medium">Fair (40-59)</div>
                                    <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${(fair / scores.length) * 100}%` }} />
                                    </div>
                                    <div className="w-8 text-xs text-slate-600 text-right">{fair}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-24 text-xs text-red-600 font-medium">Needs Work (&lt;40)</div>
                                    <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-red-500 rounded-full transition-all" style={{ width: `${(needsWork / scores.length) * 100}%` }} />
                                    </div>
                                    <div className="w-8 text-xs text-slate-600 text-right">{needsWork}</div>
                                </div>
                            </div>
                        </div>

                        {/* TCM Context */}
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                            <h4 className="font-semibold text-amber-800 mb-2">🌿 TCM Health Score Context</h4>
                            <p className="text-sm text-amber-700 leading-relaxed">
                                Your health score is derived from TCM diagnostic indicators including <strong>tongue analysis</strong> (color, coating, shape),
                                <strong> pulse assessment</strong> (rate, rhythm, depth), and <strong>symptom inquiry</strong> (physical and emotional symptoms).
                                Each session evaluates the balance of Qi, Blood, Yin, and Yang in your body.
                            </p>
                        </div>

                        {/* Session List */}
                        <div>
                            <h4 className="font-semibold text-slate-800 mb-3">Contributing Sessions ({validSessions.length})</h4>
                            <div className="max-h-48 overflow-y-auto space-y-2">
                                {validSessions.slice().reverse().map((session, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-slate-400" />
                                            <span className="text-sm text-slate-600">
                                                {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <span className={`font-semibold ${getScoreInterpretation(session.score as number).color}`}>
                                            {session.score}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}

// Progress breakdown modal
function ProgressModal({
    open,
    onOpenChange,
    improvement,
    sessions
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    improvement: number
    sessions: Array<{ score: number | null | undefined; date: string }>
}) {
    const validSessions = sessions.filter(s => s.score !== null && s.score !== undefined)
    const firstSession = validSessions[0]
    const lastSession = validSessions[validSessions.length - 1]

    const firstScore = firstSession?.score as number
    const lastScore = lastSession?.score as number

    // Calculate improvement percentage
    const percentChange = firstScore > 0 ? ((improvement / firstScore) * 100).toFixed(1) : 0

    // Calculate trend over time
    const getProgressInterpretation = (change: number) => {
        if (change >= 15) return { label: 'Significant Improvement', color: 'text-emerald-600', icon: '🎉', description: 'Excellent progress! Your TCM treatments and lifestyle changes are working very well.' }
        if (change >= 5) return { label: 'Good Progress', color: 'text-teal-600', icon: '📈', description: 'You\'re on the right track. Continue with your current treatment plan.' }
        if (change >= 0) return { label: 'Stable', color: 'text-amber-600', icon: '➡️', description: 'Your health is maintaining. Consider consulting your practitioner for optimization.' }
        if (change >= -5) return { label: 'Slight Decline', color: 'text-orange-600', icon: '⚠️', description: 'Minor setback. Review recent lifestyle changes or stressors.' }
        return { label: 'Needs Attention', color: 'text-red-600', icon: '🔴', description: 'Notable decline. Schedule a consultation to adjust your treatment.' }
    }

    const interpretation = getProgressInterpretation(improvement)

    // Calculate weekly averages if enough data
    const weeklyProgress: { week: number; avg: number }[] = []
    if (validSessions.length >= 2) {
        const now = new Date()
        for (let w = 0; w < 4; w++) {
            const weekStart = new Date(now)
            weekStart.setDate(now.getDate() - (w + 1) * 7)
            const weekEnd = new Date(now)
            weekEnd.setDate(now.getDate() - w * 7)

            const weekSessions = validSessions.filter(s => {
                const d = new Date(s.date)
                return d >= weekStart && d < weekEnd
            })

            if (weekSessions.length > 0) {
                const avg = Math.round(weekSessions.reduce((a, b) => a + (b.score as number), 0) / weekSessions.length)
                weeklyProgress.push({ week: w, avg })
            }
        }
    }

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl max-w-lg w-[95vw] max-h-[85vh] overflow-y-auto z-50 p-0">
                    <div className={`sticky top-0 ${improvement >= 0 ? 'bg-gradient-to-r from-emerald-600 to-teal-600' : 'bg-gradient-to-r from-red-500 to-orange-500'} text-white p-6 rounded-t-2xl`}>
                        <Dialog.Title className="text-xl font-bold flex items-center gap-2">
                            {improvement >= 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                            Progress Analysis
                        </Dialog.Title>
                        <Dialog.Description className={`${improvement >= 0 ? 'text-teal-100' : 'text-red-100'} text-sm mt-1`}>
                            Track your health trajectory over time
                        </Dialog.Description>
                        <Dialog.Close asChild>
                            <button className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </Dialog.Close>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Main Progress Display */}
                        <div className={`text-center ${improvement >= 0 ? 'bg-gradient-to-br from-emerald-50 to-teal-50' : 'bg-gradient-to-br from-red-50 to-orange-50'} rounded-xl p-6 border ${improvement >= 0 ? 'border-emerald-100' : 'border-red-100'}`}>
                            <div className="text-5xl mb-2">{interpretation.icon}</div>
                            <p className={`text-5xl font-bold ${improvement >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                {improvement > 0 ? '+' : ''}{improvement}
                            </p>
                            <p className="text-sm text-slate-600 mt-1">points</p>
                            <p className={`text-sm font-medium mt-2 ${interpretation.color}`}>
                                {interpretation.label}
                            </p>
                        </div>

                        {/* Calculation Breakdown */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                                <Calculator className="w-4 h-4 text-cyan-600" />
                                How Progress is Calculated
                            </h4>
                            <div className="bg-white rounded-lg p-4 border border-slate-100">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="text-center flex-1">
                                        <p className="text-xs text-slate-500 mb-1">First Session</p>
                                        <p className="text-2xl font-bold text-slate-700">{firstScore}</p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {new Date(firstSession?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-center gap-1">
                                        <ArrowRight className={`w-6 h-6 ${improvement >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
                                        <span className={`text-xs font-medium ${improvement >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                            {percentChange}%
                                        </span>
                                    </div>
                                    <div className="text-center flex-1">
                                        <p className="text-xs text-slate-500 mb-1">Latest Session</p>
                                        <p className="text-2xl font-bold text-slate-700">{lastScore}</p>
                                        <p className="text-xs text-slate-400 mt-1">
                                            {new Date(lastSession?.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-100">
                                    <p className="font-mono text-sm text-center text-slate-600">
                                        Progress = Latest Score − First Score
                                    </p>
                                    <p className={`font-mono text-center font-bold mt-1 ${improvement >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                        = {lastScore} − {firstScore} = {improvement > 0 ? '+' : ''}{improvement}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Score Journey Visualization */}
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                            <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                                <BarChart3 className="w-4 h-4 text-cyan-600" />
                                Your Score Journey
                            </h4>
                            <div className="relative">
                                {/* Simple bar chart */}
                                <div className="flex items-end justify-between gap-1 h-32">
                                    {validSessions.map((session, idx) => {
                                        const score = session.score as number
                                        const height = (score / 100) * 100
                                        return (
                                            <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                                                <span className="text-xs text-slate-500">{score}</span>
                                                <div
                                                    className={`w-full rounded-t transition-all ${score >= 75 ? 'bg-emerald-500' :
                                                        score >= 50 ? 'bg-teal-500' :
                                                            score >= 25 ? 'bg-amber-500' :
                                                                'bg-red-500'
                                                        }`}
                                                    style={{ height: `${height}%` }}
                                                />
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="flex justify-between mt-2 text-xs text-slate-400">
                                    <span>Oldest</span>
                                    <span>Latest</span>
                                </div>
                            </div>
                        </div>

                        {/* Interpretation */}
                        <div className={`rounded-xl p-4 border ${improvement >= 0 ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200' : 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200'}`}>
                            <h4 className={`font-semibold mb-2 ${improvement >= 0 ? 'text-emerald-800' : 'text-orange-800'}`}>
                                📊 What This Means
                            </h4>
                            <p className={`text-sm leading-relaxed ${improvement >= 0 ? 'text-emerald-700' : 'text-orange-700'}`}>
                                {interpretation.description}
                            </p>
                        </div>

                        {/* TCM Context */}
                        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                            <h4 className="font-semibold text-amber-800 mb-2">🌿 TCM Perspective on Progress</h4>
                            <p className="text-sm text-amber-700 leading-relaxed">
                                In Traditional Chinese Medicine, health improvement reflects the gradual <strong>restoration of balance</strong> between
                                Yin and Yang, and the free flow of Qi and Blood. Progress may not always be linear—
                                <strong> healing often occurs in cycles</strong> as the body adjusts. Temporary setbacks during treatment
                                can sometimes indicate the body is actively working to expel pathogens or rebalance energy.
                            </p>
                        </div>

                        {/* Session Timeline */}
                        <div>
                            <h4 className="font-semibold text-slate-800 mb-3">Session Timeline</h4>
                            <div className="max-h-48 overflow-y-auto space-y-2">
                                {validSessions.slice().reverse().map((session, idx) => {
                                    const prevSession = validSessions.slice().reverse()[idx + 1]
                                    const change = prevSession ? (session.score as number) - (prevSession.score as number) : 0
                                    return (
                                        <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 text-slate-400" />
                                                <span className="text-sm text-slate-600">
                                                    {new Date(session.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-slate-800">{session.score}</span>
                                                {prevSession && (
                                                    <span className={`text-xs font-medium ${change > 0 ? 'text-emerald-600' : change < 0 ? 'text-red-600' : 'text-slate-400'}`}>
                                                        {change > 0 ? '+' : ''}{change !== 0 ? change : '—'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    )
}

export function TrendWidget({ trendData, loading }: TrendWidgetProps) {
    const [showAverageModal, setShowAverageModal] = useState(false)
    const [showProgressModal, setShowProgressModal] = useState(false)
    const { t } = useLanguage()

    if (loading) {
        return (
            <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
                <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
                </div>
            </Card>
        )
    }

    if (!trendData || trendData.sessionCount === 0) {
        return (
            <Card className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
                <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-200 flex items-center justify-center">
                        <Activity className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-600 text-sm">
                        {t.patientDashboard.healthJourney.noSessionsDesc}
                    </p>
                </div>
            </Card>
        )
    }

    const { sessionCount, averageScore, improvement, diagnosisCounts, sessions } = trendData
    const topDiagnosis = Object.entries(diagnosisCounts).sort((a, b) => b[1] - a[1])[0]

    return (
        <>
            <Card className="overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-emerald-100/50">
                {/* Header */}
                <div className="p-6 pb-4 border-b border-emerald-100/50">
                    <h3 className="text-xl font-bold text-emerald-900 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-emerald-600" />
                        {t.patientDashboard.healthJourney.vitalityTitle}
                    </h3>
                    <p className="text-sm text-emerald-700 mt-1">
                        {t.patientDashboard.healthJourney.subtitle}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Total Sessions */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-emerald-100/50"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider mb-1">
                                    {t.patientDashboard.healthJourney.totalSessions}
                                </p>
                                <p className="text-3xl font-bold text-emerald-900">
                                    {sessionCount}
                                </p>
                            </div>
                            <div className="p-2 bg-emerald-100 rounded-lg">
                                <Calendar className="w-5 h-5 text-emerald-600" />
                            </div>
                        </div>
                    </motion.div>

                    {/* Average Score - Clickable */}
                    {averageScore !== null && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                            onClick={() => setShowAverageModal(true)}
                            className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-teal-100/50 cursor-pointer hover:shadow-md hover:border-teal-300 transition-all group"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-medium text-teal-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                                        {t.patientDashboard.healthJourney.averageScore}
                                        <Info className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </p>
                                    <p className="text-3xl font-bold text-teal-900">
                                        {averageScore}
                                    </p>
                                    <p className="text-xs text-teal-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Click for details →
                                    </p>
                                </div>
                                <div className={`p-2 rounded-lg ${averageScore >= 75 ? 'bg-emerald-100' :
                                    averageScore >= 50 ? 'bg-amber-100' :
                                        'bg-red-100'
                                    }`}>
                                    <Activity className={`w-5 h-5 ${averageScore >= 75 ? 'text-emerald-600' :
                                        averageScore >= 50 ? 'text-amber-600' :
                                            'text-red-600'
                                        }`} />
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Improvement - Clickable */}
                    {improvement !== null && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.3 }}
                            onClick={() => setShowProgressModal(true)}
                            className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-cyan-100/50 cursor-pointer hover:shadow-md hover:border-cyan-300 transition-all group"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-xs font-medium text-cyan-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                                        {t.patientDashboard.healthJourney.progress}
                                        <Info className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </p>
                                    <div className="flex items-baseline gap-2">
                                        <p className={`text-3xl font-bold ${improvement > 0 ? 'text-emerald-600' :
                                            improvement < 0 ? 'text-red-600' :
                                                'text-slate-600'
                                            }`}>
                                            {improvement > 0 ? '+' : ''}{improvement}
                                        </p>
                                        <span className="text-sm text-slate-500">{t.patientDashboard.healthJourney.points}</span>
                                    </div>
                                    <p className="text-xs text-cyan-600 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        Click for details →
                                    </p>
                                </div>
                                <div className={`p-2 rounded-lg ${improvement > 0 ? 'bg-emerald-100' :
                                    improvement < 0 ? 'bg-red-100' :
                                        'bg-slate-100'
                                    }`}>
                                    {improvement > 0 ? (
                                        <TrendingUp className="w-5 h-5 text-emerald-600" />
                                    ) : improvement < 0 ? (
                                        <TrendingDown className="w-5 h-5 text-red-600" />
                                    ) : (
                                        <Activity className="w-5 h-5 text-slate-600" />
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Most Common Diagnosis */}
                {topDiagnosis && (
                    <div className="px-6 pb-6">
                        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-emerald-100/50">
                            <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider mb-2">
                                {t.patientDashboard.healthJourney.mostCommonPattern}
                            </p>
                            <div className="flex items-center justify-between">
                                <p className="text-lg font-semibold text-emerald-900">
                                    {topDiagnosis[0]}
                                </p>
                                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                                    {topDiagnosis[1]} {topDiagnosis[1] === 1 ? t.patientDashboard.healthJourney.time : t.patientDashboard.healthJourney.times}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            {/* Modals */}
            {averageScore !== null && (
                <AverageScoreModal
                    open={showAverageModal}
                    onOpenChange={setShowAverageModal}
                    averageScore={averageScore}
                    sessions={sessions}
                />
            )}

            {improvement !== null && (
                <ProgressModal
                    open={showProgressModal}
                    onOpenChange={setShowProgressModal}
                    improvement={improvement}
                    sessions={sessions}
                />
            )}
        </>
    )
}

