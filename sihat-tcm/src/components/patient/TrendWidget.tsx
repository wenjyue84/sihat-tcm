'use client'

import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Activity, Calendar, Zap } from 'lucide-react'
import { motion } from 'framer-motion'

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

export function TrendWidget({ trendData, loading }: TrendWidgetProps) {
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
                        No health data yet. Complete your first diagnosis to start tracking!
                    </p>
                </div>
            </Card>
        )
    }

    const { sessionCount, averageScore, improvement, diagnosisCounts } = trendData
    const topDiagnosis = Object.entries(diagnosisCounts).sort((a, b) => b[1] - a[1])[0]

    return (
        <Card className="overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-emerald-100/50">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-emerald-100/50">
                <h3 className="text-xl font-bold text-emerald-900 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-emerald-600" />
                    Your Health Vitality
                </h3>
                <p className="text-sm text-emerald-700 mt-1">
                    Track your wellness journey over time
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
                                Total Sessions
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

                {/* Average Score */}
                {averageScore !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-teal-100/50"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-teal-700 uppercase tracking-wider mb-1">
                                    Average Score
                                </p>
                                <p className="text-3xl font-bold text-teal-900">
                                    {averageScore}
                                </p>
                            </div>
                            <div className={`p-2 rounded-lg ${
                                averageScore >= 75 ? 'bg-emerald-100' :
                                averageScore >= 50 ? 'bg-amber-100' :
                                'bg-red-100'
                            }`}>
                                <Activity className={`w-5 h-5 ${
                                    averageScore >= 75 ? 'text-emerald-600' :
                                    averageScore >= 50 ? 'text-amber-600' :
                                    'text-red-600'
                                }`} />
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Improvement */}
                {improvement !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                        className="bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-sm border border-cyan-100/50"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-xs font-medium text-cyan-700 uppercase tracking-wider mb-1">
                                    Progress
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <p className={`text-3xl font-bold ${
                                        improvement > 0 ? 'text-emerald-600' :
                                        improvement < 0 ? 'text-red-600' :
                                        'text-slate-600'
                                    }`}>
                                        {improvement > 0 ? '+' : ''}{improvement}
                                    </p>
                                    <span className="text-sm text-slate-500">points</span>
                                </div>
                            </div>
                            <div className={`p-2 rounded-lg ${
                                improvement > 0 ? 'bg-emerald-100' :
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
                            Most Common Pattern
                        </p>
                        <div className="flex items-center justify-between">
                            <p className="text-lg font-semibold text-emerald-900">
                                {topDiagnosis[0]}
                            </p>
                            <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                                {topDiagnosis[1]} {topDiagnosis[1] === 1 ? 'time' : 'times'}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    )
}

