'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Eye, FileText, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { motion } from 'framer-motion'
import { DiagnosisSession } from '@/lib/actions'

interface HistoryCardProps {
    session: DiagnosisSession
    onClick: () => void
    index?: number
}

const diagnosisIcons: Record<string, string> = {
    'Yin Deficiency': '☯️',
    'Yang Deficiency': '☯️',
    'Qi Deficiency': '🌀',
    'Blood Deficiency': '💉',
    'Damp Heat': '💧',
    'Phlegm': '🌫️',
    'Blood Stasis': '🩸',
    'Liver Qi Stagnation': '🌿',
    'default': '🏥'
}

const getDiagnosisIcon = (diagnosis: string): string => {
    for (const key in diagnosisIcons) {
        if (diagnosis.toLowerCase().includes(key.toLowerCase())) {
            return diagnosisIcons[key]
        }
    }
    return diagnosisIcons['default']
}

const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    }).format(date)
}

const getScoreTrend = (score?: number) => {
    if (!score) return null
    if (score >= 75) return { icon: TrendingUp, color: 'text-emerald-500', label: 'Good' }
    if (score >= 50) return { icon: Minus, color: 'text-amber-500', label: 'Fair' }
    return { icon: TrendingDown, color: 'text-red-500', label: 'Needs Attention' }
}

export function HistoryCard({ session, onClick, index = 0 }: HistoryCardProps) {
    const trend = getScoreTrend(session.overall_score)
    const TrendIcon = trend?.icon

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
        >
            <Card className="group relative overflow-hidden bg-gradient-to-br from-white to-slate-50/50 hover:shadow-xl transition-all duration-300 border-slate-200/60 cursor-pointer"
                onClick={onClick}
            >
                {/* Decorative gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-transparent to-teal-500/0 group-hover:from-emerald-500/5 group-hover:to-teal-500/5 transition-all duration-500 pointer-events-none" />
                
                <div className="relative p-5">
                    {/* Header: Icon, Diagnosis, Score */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="text-3xl shrink-0">
                                {getDiagnosisIcon(session.primary_diagnosis)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="text-lg font-semibold text-slate-800 truncate group-hover:text-emerald-700 transition-colors">
                                    {session.primary_diagnosis}
                                </h3>
                                {session.constitution && (
                                    <p className="text-sm text-slate-500 truncate">
                                        {session.constitution}
                                    </p>
                                )}
                            </div>
                        </div>
                        
                        {/* Score Badge */}
                        {session.overall_score !== null && session.overall_score !== undefined && (
                            <div className="shrink-0 ml-3">
                                <div className="flex flex-col items-center">
                                    <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${
                                        session.overall_score >= 75 ? 'bg-emerald-100 text-emerald-700' :
                                        session.overall_score >= 50 ? 'bg-amber-100 text-amber-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {TrendIcon && <TrendIcon className="w-3.5 h-3.5" />}
                                        <span className="text-sm font-bold">{session.overall_score}</span>
                                    </div>
                                    {trend && (
                                        <span className={`text-[10px] mt-0.5 font-medium ${trend.color}`}>
                                            {trend.label}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Date */}
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(session.created_at)}</span>
                    </div>

                    {/* Notes Preview (if exists) */}
                    {session.notes && (
                        <div className="mb-3 p-2.5 bg-amber-50/50 border border-amber-100 rounded-lg">
                            <div className="flex items-start gap-2">
                                <FileText className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                                <p className="text-xs text-amber-900 line-clamp-2 leading-relaxed">
                                    {session.notes}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Action Button */}
                    <Button
                        variant="ghost"
                        className="w-full mt-2 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation()
                            onClick()
                        }}
                    >
                        <Eye className="w-4 h-4 mr-2" />
                        View Full Report
                    </Button>
                </div>

                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </Card>
        </motion.div>
    )
}

