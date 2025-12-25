'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DiagnosisSession } from '@/lib/actions'
import { useLanguage } from '@/contexts/LanguageContext'

interface DigitalTwinProps {
    sessions: DiagnosisSession[]
    loading?: boolean
}

export function DigitalTwin({ sessions, loading }: DigitalTwinProps) {
    const { t } = useLanguage()

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-80 bg-white/50 rounded-2xl border border-slate-100 animate-pulse">
                <div className="w-40 h-64 bg-slate-200 rounded-full mb-4" />
                <div className="h-4 w-32 bg-slate-200 rounded" />
            </div>
        )
    }

    // Extract affected organs from the latest session
    const latestSession = sessions[0]
    const affectedOrgans = latestSession?.full_report?.diagnosis?.affected_organs || []

    // Check for previous sessions to see improvement
    const previousSessions = sessions.slice(1)
    const previouslyAffectedOrgans = new Set<string>()
    previousSessions.forEach(s => {
        const organs = s.full_report?.diagnosis?.affected_organs || []
        organs.forEach((o: string) => previouslyAffectedOrgans.add(o))
    })

    const getOrganStatus = (organ: string) => {
        const isCurrentlyAffected = affectedOrgans.some((o: string) => o.toLowerCase().includes(organ.toLowerCase()))
        const wasPreviouslyAffected = Array.from(previouslyAffectedOrgans).some((o: string) => o.toLowerCase().includes(organ.toLowerCase()))

        if (isCurrentlyAffected) return 'affected'
        if (wasPreviouslyAffected) return 'healing'
        return 'neutral'
    }

    const organs: Array<{
        name: string
        label: string
        pos: { x: number; y: number }
        size: number
        isPair?: boolean
        pairOffset?: number
    }> = [
        { name: 'Heart', label: t.digitalTwin.heart, pos: { x: 48, y: 28 }, size: 6 },
        { name: 'Lung', label: t.digitalTwin.lungs, pos: { x: 48, y: 24 }, isPair: true, size: 8, pairOffset: 10 },
        { name: 'Liver', label: t.digitalTwin.liver, pos: { x: 58, y: 42 }, size: 7 },
        { name: 'Spleen', label: t.digitalTwin.spleen, pos: { x: 42, y: 42 }, size: 6 },
        { name: 'Kidney', label: t.digitalTwin.kidneys, pos: { x: 50, y: 52 }, isPair: true, size: 6, pairOffset: 10 },
    ]


    const getStatusColor = (status: string) => {
        switch (status) {
            case 'affected': return 'rgba(239, 68, 68, 0.8)' // red-500
            case 'healing': return 'rgba(16, 185, 129, 0.8)' // emerald-500
            default: return 'rgba(148, 163, 184, 0.2)' // slate-400
        }
    }

    const getStatusGlow = (status: string) => {
        switch (status) {
            case 'affected': return '0 0 20px rgba(239, 68, 68, 0.6)'
            case 'healing': return '0 0 20px rgba(16, 185, 129, 0.6)'
            default: return 'none'
        }
    }

    return (
        <div className="relative flex flex-col items-center bg-white/60 backdrop-blur-md rounded-2xl p-6 border border-slate-200/60 shadow-lg overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-50/30 to-transparent pointer-events-none" />

            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t.digitalTwin.title}
            </h4>


            <div className="relative w-full max-w-[240px] aspect-[1/2] flex items-center justify-center">
                {/* Human Silhouette SVG */}
                <svg viewBox="0 0 100 200" className="w-full h-full drop-shadow-lg">
                    <defs>
                        <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#f1f5f9" />
                            <stop offset="100%" stopColor="#e2e8f0" />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {/* Simple Human Outline */}
                    <path
                        d="M50,10 C55,10 60,15 60,22 C60,29 55,34 50,34 C45,34 40,29 40,22 C40,15 45,10 50,10 Z 
                           M50,34 L50,38 C35,38 25,45 25,60 L25,100 C25,105 28,108 32,108 L35,108 L35,180 C35,190 42,190 45,190 L48,190 L48,120 L52,120 L52,190 L55,190 C58,190 65,190 65,180 L65,108 L68,108 C72,108 75,105 75,100 L75,60 C75,45 65,38 50,38 Z"
                        fill="url(#bodyGradient)"
                        stroke="#94a3b8"
                        strokeWidth="0.4"
                    />

                    {/* Organs */}
                    {organs.map((organ, idx) => {
                        const status = getOrganStatus(organ.name)
                        const color = getStatusColor(status)

                        if (organ.isPair) {
                            const pairOffset = organ.pairOffset || 8
                            return (
                                <g key={organ.name}>
                                    {/* Left */}
                                    <motion.circle
                                        cx={organ.pos.x - pairOffset}
                                        cy={organ.pos.y}
                                        r={organ.size / 2}
                                        fill={color}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{
                                            scale: status === 'neutral' ? 1 : [1, 1.05, 1],
                                            opacity: status === 'neutral' ? 0.3 : 1
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            delay: idx * 0.2
                                        }}
                                        style={{ filter: status !== 'neutral' ? 'url(#glow)' : 'none' }}
                                    />
                                    {/* Right */}
                                    <motion.circle
                                        cx={organ.pos.x + pairOffset}
                                        cy={organ.pos.y}
                                        r={organ.size / 2}
                                        fill={color}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{
                                            scale: status === 'neutral' ? 1 : [1, 1.05, 1],
                                            opacity: status === 'neutral' ? 0.3 : 1
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            delay: idx * 0.2 + 0.1
                                        }}
                                        style={{ filter: status !== 'neutral' ? 'url(#glow)' : 'none' }}
                                    />
                                </g>
                            )
                        }

                        return (
                            <motion.circle
                                key={organ.name}
                                cx={organ.pos.x}
                                cy={organ.pos.y}
                                r={organ.size / 2}
                                fill={color}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{
                                    scale: status === 'neutral' ? 1 : [1, 1.1, 1],
                                    opacity: status === 'neutral' ? 0.3 : 1
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: idx * 0.2
                                }}
                                style={{ filter: status !== 'neutral' ? 'url(#glow)' : 'none' }}
                            />
                        )
                    })}
                </svg>

                {/* Legend / Tooltips could be added here */}
                {affectedOrgans.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute bottom-0 left-0 right-0 p-3 bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200/60 shadow-sm"
                    >
                        <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-tight mb-1.5">Active Imbalances</p>
                        <div className="flex flex-wrap gap-1">
                            {affectedOrgans.map((o: string, i: number) => (
                                <span key={i} className="px-1.5 py-0.5 bg-red-50 text-red-600 rounded-md text-[9px] font-medium">
                                    {o}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                )}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 w-full">
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]" />
                    <span className="text-[10px] font-medium text-slate-600">{t.digitalTwin.activeFocus}</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
                    <span className="text-[10px] font-medium text-slate-600">{t.digitalTwin.restoring}</span>
                </div>
            </div>

            <p className="mt-4 text-[10px] text-center text-slate-500 leading-relaxed px-3">
                {t.digitalTwin.description}
            </p>

        </div>
    )
}
