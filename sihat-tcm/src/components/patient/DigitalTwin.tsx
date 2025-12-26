'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DiagnosisSession } from '@/lib/actions'
import { useLanguage } from '@/contexts/LanguageContext'

interface DigitalTwinProps {
    sessions: DiagnosisSession[]
    loading?: boolean
}

// Organ SVG Paths
const ORGAN_PATHS = {
    body: "M100,20 C115,20 128,30 128,50 C128,65 118,75 110,78 L110,85 C140,88 165,110 165,145 L165,300 C165,310 160,320 145,320 L140,320 L140,550 L130,550 L130,350 L70,350 L70,550 L60,550 L60,320 L55,320 C40,320 35,310 35,300 L35,145 C35,110 60,88 90,85 L90,78 C82,75 72,65 72,50 C72,30 85,20 100,20 Z",
    heart: "M108,125 C108,120 102,115 98,120 C92,110 80,115 80,128 C80,140 95,150 100,155 C105,150 115,140 115,128 C115,125 112,125 108,125 Z",
    lungsLeft: "M115,110 C125,110 135,120 135,140 C135,160 125,170 120,165 C115,160 115,120 115,110 Z",
    lungsRight: "M85,110 C75,110 65,120 65,140 C65,160 75,170 80,165 C85,160 85,120 85,110 Z",
    liver: "M85,175 C70,175 70,195 85,200 C100,205 110,190 105,170 C100,165 90,170 85,175 Z",
    spleen: "M125,180 C135,180 138,190 135,195 C130,200 120,195 120,190 C120,185 122,180 125,180 Z",
    kidneysLeft: "M115,210 C122,210 125,220 122,228 C118,235 112,230 112,220 C112,215 113,210 115,210 Z",
    kidneysRight: "M85,210 C78,210 75,220 78,228 C82,235 88,230 88,220 C88,215 87,210 85,210 Z"
}

export function DigitalTwin({ sessions, loading }: DigitalTwinProps) {
    const { t } = useLanguage()

    if (loading) {
        return (
            <div className="relative flex flex-col items-center justify-center aspect-[3/4] max-h-[500px] w-full bg-slate-900/5 rounded-2xl border border-slate-200 overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
                <div className="w-1/3 h-2/3 bg-slate-200/50 rounded-full blur-xl animate-pulse" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm tracking-widest animate-pulse">
                    INITIALIZING SCAN...
                </div>
            </div>
        )
    }

    // Extract affected organs from the latest session
    const latestSession = sessions[0]
    const diagnosis = latestSession?.full_report?.diagnosis
    const affectedOrgans = (typeof diagnosis === 'object' && diagnosis !== null && 'affected_organs' in diagnosis && Array.isArray((diagnosis as any).affected_organs))
        ? (diagnosis as any).affected_organs
        : []

    // Check for previous sessions to see improvement
    const previousSessions = sessions.slice(1)
    const previouslyAffectedOrgans = new Set<string>()
    previousSessions.forEach(s => {
        const prevDiagnosis = s.full_report?.diagnosis
        const organs = (typeof prevDiagnosis === 'object' && prevDiagnosis !== null && 'affected_organs' in prevDiagnosis && Array.isArray((prevDiagnosis as any).affected_organs))
            ? (prevDiagnosis as any).affected_organs
            : []
        organs.forEach((o: string) => previouslyAffectedOrgans.add(o))
    })

    const getOrganStatus = (organ: string) => {
        const isCurrentlyAffected = affectedOrgans.some((o: string) => o.toLowerCase().includes(organ.toLowerCase()))

        // Special mapping for TCM organs that might be named subtly differently
        const normalizedOrgan = organ.toLowerCase()
        const isLung = normalizedOrgan === 'lung' && affectedOrgans.some((o: string) => o.toLowerCase().includes('lung') || o.toLowerCase().includes('respiratory'))
        const isKidney = normalizedOrgan === 'kidney' && affectedOrgans.some((o: string) => o.toLowerCase().includes('kidney'))

        if (isCurrentlyAffected || isLung || isKidney) return 'affected'

        const wasPreviouslyAffected = Array.from(previouslyAffectedOrgans).some((o: string) => o.toLowerCase().includes(organ.toLowerCase()))
        if (wasPreviouslyAffected) return 'healing'

        return 'neutral'
    }

    const organs = [
        { id: 'heart', name: 'Heart', label: t.digitalTwin.heart, path: ORGAN_PATHS.heart },
        { id: 'lung', name: 'Lung', label: t.digitalTwin.lungs, path: ORGAN_PATHS.lungsLeft }, // Render both lungs manually
        { id: 'liver', name: 'Liver', label: t.digitalTwin.liver, path: ORGAN_PATHS.liver },
        { id: 'spleen', name: 'Spleen', label: t.digitalTwin.spleen, path: ORGAN_PATHS.spleen },
        { id: 'kidney', name: 'Kidney', label: t.digitalTwin.kidneys, path: ORGAN_PATHS.kidneysLeft }, // Render both kidneys manually
    ]

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'affected': return { fill: '#ef4444', stroke: '#fee2e2', glow: '#ef4444' } // Red
            case 'healing': return { fill: '#10b981', stroke: '#d1fae5', glow: '#10b981' } // Green
            default: return { fill: 'rgba(56, 189, 248, 0.1)', stroke: 'rgba(56, 189, 248, 0.3)', glow: 'rgba(56, 189, 248, 0)' } // Sky Blue / Transparent
        }
    }

    return (
        <div className="relative group flex flex-col items-center w-full bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
            {/* Holographic Background Grid */}
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(56,189,248,0.3)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.3)_1px,transparent_1px)] bg-[size:30px_30px] perspective-[500px] hover:opacity-30 transition-opacity duration-1000" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-slate-900/50" />

            {/* Scanner Line Animation */}
            <motion.div
                className="absolute w-full h-1 bg-sky-400/50 shadow-[0_0_20px_rgba(56,189,248,0.8)] z-10"
                animate={{ top: ['0%', '100%', '0%'] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />

            {/* Header */}
            <div className="absolute top-4 left-0 w-full flex justify-between px-6 z-20">
                <h4 className="flex items-center gap-2 text-xs font-bold text-sky-400 uppercase tracking-[0.2em] opacity-80">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                    </span>
                    {t.digitalTwin.title}
                </h4>
                <div className="text-[10px] text-sky-400/60 font-mono">
                    SYS.V.2.0.4
                </div>
            </div>

            {/* Main SVG Container */}
            <div className="relative w-full aspect-[3/5] max-h-[500px] p-8 flex items-center justify-center">
                <svg viewBox="0 0 200 600" className="w-full h-full drop-shadow-2xl">
                    <defs>
                        <linearGradient id="hologramGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgba(56, 189, 248, 0.1)" />
                            <stop offset="50%" stopColor="rgba(56, 189, 248, 0.2)" />
                            <stop offset="100%" stopColor="rgba(56, 189, 248, 0.05)" />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                        <filter id="intense-glow">
                            <feGaussianBlur stdDeviation="6" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {/* Base Body Silhouette */}
                    <motion.path
                        d={ORGAN_PATHS.body}
                        fill="url(#hologramGradient)"
                        stroke="rgba(56, 189, 248, 0.4)"
                        strokeWidth="1.5"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                        className="drop-shadow-[0_0_10px_rgba(56,189,248,0.3)]"
                    />

                    {/* Organs Layer */}
                    {organs.map((organ, idx) => {
                        const status = getOrganStatus(organ.name)
                        const colors = getStatusColor(status)

                        // Define paths array (handle pairs)
                        let paths = []
                        if (organ.id === 'lung') {
                            paths = [ORGAN_PATHS.lungsLeft, ORGAN_PATHS.lungsRight]
                        } else if (organ.id === 'kidney') {
                            paths = [ORGAN_PATHS.kidneysLeft, ORGAN_PATHS.kidneysRight]
                        } else {
                            paths = [organ.path]
                        }

                        return (
                            <g key={organ.id} className="cursor-pointer group/organ">
                                {paths.map((p, pIdx) => (
                                    <motion.path
                                        key={`${organ.id}-${pIdx}`}
                                        d={p}
                                        fill={colors.fill}
                                        stroke={colors.stroke}
                                        strokeWidth={status === 'neutral' ? "1" : "2"}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{
                                            opacity: 1,
                                            scale: 1,
                                            fillOpacity: status === 'neutral' ? 0.3 : 0.8
                                        }}
                                        transition={{ delay: 0.5 + (idx * 0.2), duration: 1 }}
                                        whileHover={{ scale: 1.05, filter: "url(#intense-glow)" }}
                                        className={status !== 'neutral' ? 'animate-pulse' : ''}
                                        style={{
                                            filter: status !== 'neutral' ? 'url(#glow)' : 'none',
                                            transformOrigin: 'center'
                                        }}
                                    />
                                ))}
                            </g>
                        )
                    })}

                    {/* Particles / Data Flow Effect */}
                    {[...Array(5)].map((_, i) => (
                        <motion.circle
                            key={`particle-${i}`}
                            r="1"
                            fill="#38bdf8"
                            initial={{ x: 100, y: 550, opacity: 0 }}
                            animate={{
                                y: [550, 20],
                                x: [100, 100 + (Math.random() * 40 - 20)],
                                opacity: [0, 1, 0]
                            }}
                            transition={{
                                duration: 3 + Math.random() * 2,
                                repeat: Infinity,
                                delay: Math.random() * 2,
                                ease: "linear"
                            }}
                        />
                    ))}
                </svg>

                {/* Organ Label Tooltips (Absolute positioned over SVG) */}
                {organs.map((organ) => {
                    const status = getOrganStatus(organ.name)
                    if (status === 'neutral') return null

                    // Approximate label positions
                    const positions: Record<string, string> = {
                        heart: 'top-[22%] left-[60%]',
                        lung: 'top-[20%] left-[20%]',
                        liver: 'top-[35%] left-[65%]',
                        spleen: 'top-[35%] left-[20%]',
                        kidney: 'top-[45%] left-[55%]'
                    }

                    return (
                        <motion.div
                            key={`label-${organ.id}`}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className={`absolute ${positions[organ.id as keyof typeof positions]} pointer-events-none`}
                        >
                            <div className={`flex items-center gap-2 ${status === 'affected' ? 'text-red-400' : 'text-emerald-400'}`}>
                                <div className="h-[1px] w-8 bg-current opacity-50" />
                                <span className="text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm bg-slate-900/80 px-2 py-1 rounded border border-current/30 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                                    {organ.label}
                                </span>
                            </div>
                        </motion.div>
                    )
                })}
            </div>

            {/* Bottom Status Panel */}
            <div className="w-full bg-slate-900/90 backdrop-blur border-t border-slate-800 p-4">
                {affectedOrgans.length > 0 ? (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-[ping_1.5s_infinite]" />
                            <span className="text-[10px] font-medium text-red-400 uppercase tracking-widest">
                                System Alert: Imbalance Detected
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {affectedOrgans.map((o: string, i: number) => (
                                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-red-500/10 border border-red-500/20 rounded-md">
                                    <span className="text-red-400 text-xs font-medium">{o}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center py-2 space-y-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                            <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-widest">
                            All Systems Nominal
                        </span>
                    </div>
                )}

                <p className="mt-4 text-[10px] text-slate-500 text-center font-mono leading-relaxed border-t border-slate-800/50 pt-3">
                    {t.digitalTwin.description}
                </p>
            </div>
        </div>
    )
}

