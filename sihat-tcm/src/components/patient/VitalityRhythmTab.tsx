'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
    Activity,
    Calendar,
    Clock,
    Info,
    TrendingUp,
    Zap,
    Wind,
    Droplets,
    Sun,
    Moon,
    Flame,
    Compass,
    AlertCircle,
    ChevronRight,
    Leaf
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/contexts/LanguageContext'
import { DiagnosisSession } from '@/lib/actions'
import { parseConstitution } from '@/lib/tcm-utils'

interface VitalityRhythmTabProps {
    sessions: DiagnosisSession[]
}

export function VitalityRhythmTab({ sessions }: VitalityRhythmTabProps) {
    const { t, language } = useLanguage()
    const vitalityT = t.patientDashboard.vitalityRhythm
    const [currentTime, setCurrentTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    // TCM Organ Clock Logic
    const getActiveOrgan = (hour: number) => {
        if (hour >= 23 || hour < 1) return { name: 'Gallbladder', time: '11 PM - 1 AM', advice: 'Sleep deeply for Yin restoration.', organ: 'Gallbladder', element: 'Wood' }
        if (hour >= 1 && hour < 3) return { name: 'Liver', time: '1 AM - 3 AM', advice: 'Deep sleep is vital for blood detoxification.', organ: 'Liver', element: 'Wood' }
        if (hour >= 3 && hour < 5) return { name: 'Lung', time: '3 AM - 5 AM', advice: 'Body is detoxing the lungs. Keep warm.', organ: 'Lung', element: 'Metal' }
        if (hour >= 5 && hour < 7) return { name: 'Large Intestine', time: '5 AM - 7 AM', advice: 'Perfect time for bowel movements and drinking warm water.', organ: 'Large Intestine', element: 'Metal' }
        if (hour >= 7 && hour < 9) return { name: 'Stomach', time: '7 AM - 9 AM', advice: 'Eat a warm, nutrient-rich breakfast for best absorption.', organ: 'Stomach', element: 'Earth' }
        if (hour >= 9 && hour < 11) return { name: 'Spleen', time: '9 AM - 11 AM', advice: 'Mental focus is high. Good time for work/study.', organ: 'Spleen', element: 'Earth' }
        if (hour >= 11 && hour < 13) return { name: 'Heart', time: '11 AM - 1 PM', advice: 'Eat a light lunch and take a short nap.', organ: 'Heart', element: 'Fire' }
        if (hour >= 13 && hour < 15) return { name: 'Small Intestine', time: '1 PM - 3 PM', advice: 'Assimilation time. Stay active but don\'t overwork.', organ: 'Small Intestine', element: 'Fire' }
        if (hour >= 15 && hour < 17) return { name: 'Bladder', time: '3 PM - 5 PM', advice: 'Good time for physical activity and hydration.', organ: 'Bladder', element: 'Water' }
        if (hour >= 17 && hour < 19) return { name: 'Kidney', time: '5 PM - 19 PM', advice: 'Restore energy. Light dinner and gentle activity.', organ: 'Kidney', element: 'Water' }
        if (hour >= 19 && hour < 21) return { name: 'Pericardium', time: '7 PM - 9 PM', advice: 'Emotional connection and relaxation. Prepare for sleep.', organ: 'Pericardium', element: 'Fire' }
        if (hour >= 21 && hour < 23) return { name: 'Triple Burner', time: '9 PM - 11 PM', advice: 'Final winding down. Avoid screens; keep the body warm.', organ: 'Triple Burner', element: 'Fire' }
        return { name: 'Unknown', time: '', advice: '', organ: '', element: '' }
    }

    const currentOrgan = getActiveOrgan(currentTime.getHours())

    // 24 Solar Terms Logic (Simplified for demonstration)
    const getSolarTerm = (date: Date) => {
        // Today is 2025-12-25
        // Winter Solstice (Dong Zhi) is around Dec 21-23
        // Next is Xiao Han (Minor Cold) around Jan 5
        return {
            current: language === 'zh' ? '冬至 (Dong Zhi)' : 'Winter Solstice (Dong Zhi)',
            date: 'Dec 21 - Jan 5',
            advice: vitalityT.healthWisdom,
            next: language === 'zh' ? '小寒 (Xiao Han)' : 'Minor Cold (Xiao Han)',
            nextDate: 'Jan 5'
        }
    }

    const solarTerm = getSolarTerm(currentTime)

    const constitutionHistory = sessions
        .filter(s => s.constitution)
        .slice(0, 5)
        .map(s => ({
            date: new Date(s.created_at).toLocaleDateString(),
            ...parseConstitution(s.constitution)
        }))

    return (
        <div className="space-y-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-emerald-50">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg relative overflow-hidden group">
                        <Activity className="w-7 h-7 relative z-10 transition-transform group-hover:scale-110" />
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-800 to-purple-900">
                            {vitalityT.title}
                        </h2>
                        <p className="text-slate-500 font-medium">{vitalityT.subtitle}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-semibold text-indigo-700">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Meridian Clock & Solar Terms */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Meridian Organ Clock */}
                    <Card className="border-none shadow-xl bg-white overflow-hidden rounded-3xl">
                        <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50/30 border-b border-slate-100">
                            <CardTitle className="text-xl flex items-center gap-2 text-indigo-900">
                                <Clock className="w-6 h-6 text-indigo-600" />
                                {vitalityT.meridianClock}
                            </CardTitle>
                            <CardDescription>
                                {vitalityT.meridianClockDesc}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="flex flex-col md:flex-row gap-8 items-center">
                                {/* Visual Clock Element */}
                                <div className="relative w-48 h-48 rounded-full border-8 border-slate-100 flex items-center justify-center shrink-0">
                                    <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin-slow" />
                                    <div className="text-center">
                                        <p className="text-3xl font-black text-indigo-600">{currentTime.getHours()}</p>
                                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400">{vitalityT.hour}</p>
                                    </div>
                                    {/* Small dots for organs */}
                                    {[...Array(12)].map((_, i) => (
                                        <div
                                            key={i}
                                            className="absolute w-2 h-2 rounded-full"
                                            style={{
                                                transform: `rotate(${i * 30}deg) translateY(-85px)`,
                                                backgroundColor: i === Math.floor(currentTime.getHours() / 2) % 12 ? '#4f46e5' : '#e2e8f0'
                                            }}
                                        />
                                    ))}
                                </div>

                                <div className="flex-1 space-y-4">
                                    <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 relative overflow-hidden">
                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-bold text-indigo-400 uppercase tracking-widest">{vitalityT.activeOrgan}</span>
                                                <span className="text-xs font-bold text-indigo-600 bg-white px-2 py-1 rounded-md shadow-sm">{currentOrgan.time}</span>
                                            </div>
                                            <h3 className="text-2xl font-black text-indigo-900 mb-2">{currentOrgan.name}</h3>
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${currentOrgan.element === 'Wood' ? 'bg-emerald-100 text-emerald-700' :
                                                    currentOrgan.element === 'Fire' ? 'bg-orange-100 text-orange-700' :
                                                        currentOrgan.element === 'Earth' ? 'bg-amber-100 text-amber-700' :
                                                            currentOrgan.element === 'Metal' ? 'bg-slate-100 text-slate-700' :
                                                                'bg-blue-100 text-blue-700'
                                                    }`}>
                                                    {vitalityT.element}: {currentOrgan.element}
                                                </span>
                                            </div>
                                            <p className="text-indigo-800/80 font-medium leading-relaxed italic border-l-2 border-indigo-200/50 pl-4 py-1">
                                                {currentOrgan.advice}
                                            </p>
                                        </div>
                                        <Zap className="absolute -right-4 -bottom-4 w-24 h-24 text-indigo-200/50" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{vitalityT.comingNext}</p>
                                            <p className="font-bold text-slate-700">{getActiveOrgan((currentTime.getHours() + 2) % 24).name}</p>
                                        </div>
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{vitalityT.previous}</p>
                                            <p className="font-bold text-slate-700">{getActiveOrgan((currentTime.getHours() - 2 + 24) % 24).name}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Seasonal 24 Solar Terms */}
                    <Card className="border-none shadow-xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white overflow-hidden rounded-3xl">
                        <CardHeader className="border-b border-white/10">
                            <CardTitle className="text-xl flex items-center gap-2 text-indigo-200">
                                <Compass className="w-6 h-6 text-indigo-400" />
                                {vitalityT.solarTerms}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="space-y-6 flex-1">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest">{vitalityT.currentTerm}</span>
                                            <span className="text-xs font-medium text-white/50">{solarTerm.date}</span>
                                        </div>
                                        <h3 className="text-3xl font-black mb-4">{solarTerm.current}</h3>
                                        <div className="p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                                            <div className="flex gap-4">
                                                <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                                                    <Leaf className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-indigo-200 text-sm mb-1 uppercase">{vitalityT.healthWisdom}</h4>
                                                    <p className="text-indigo-50/80 text-sm leading-relaxed">{vitalityT.healthWisdomDesc || 'Yang energy is at its lowest. Focus on warm foods, protect back/knees, and get extra rest.'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2 text-white/60">
                                            <ChevronRight className="w-4 h-4" />
                                            <span>{vitalityT.comingNext}: <strong>{solarTerm.next}</strong></span>
                                        </div>
                                        <span className="text-white/40">{solarTerm.nextDate}</span>
                                    </div>
                                </div>

                                <div className="md:w-48 flex items-center justify-center">
                                    <div className="relative">
                                        <div className="w-32 h-32 rounded-full bg-indigo-500/20 animate-pulse" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Sun className="w-16 h-16 text-amber-400" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Constitution Tracker */}
                <div className="space-y-6">
                    <Card className="border-none shadow-lg bg-white rounded-3xl overflow-hidden">
                        <CardHeader className="bg-emerald-50/50 border-b border-emerald-50">
                            <CardTitle className="text-lg flex items-center gap-2 text-emerald-900">
                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                                {vitalityT.constitutionTracker}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <p className="text-sm text-slate-500 mb-6">
                                {vitalityT.constitutionTrackerDesc}
                            </p>

                            {constitutionHistory.length > 0 ? (
                                <div className="space-y-6">
                                    {constitutionHistory.map((entry, i) => (
                                        <div key={i} className="relative pl-6 border-l-2 border-slate-100 last:border-l-0 pb-6 last:pb-0">
                                            {/* Step Connector Dot */}
                                            <div className="absolute left-[-9px] top-1 w-4 h-4 rounded-full bg-white border-4 border-slate-200" />

                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-bold text-slate-800">{entry.type}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{entry.date}</p>
                                                </div>

                                                {entry.tendencies && (
                                                    <p className="text-xs text-slate-600 leading-relaxed mt-1 italic">
                                                        "{entry.tendencies}"
                                                    </p>
                                                )}

                                                {entry.characteristics && (
                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                        {entry.characteristics.split(',').map((char, index) => (
                                                            <span key={index} className="text-[9px] px-2 py-0.5 bg-slate-50 text-slate-500 rounded-full border border-slate-100">
                                                                {char.trim()}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between mt-2">
                                                    {i === 0 && (
                                                        <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase">{vitalityT.latest}</span>
                                                    )}
                                                    {entry.percentage_match && (
                                                        <span className="text-[9px] text-emerald-600 font-bold ml-auto">{entry.percentage_match}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <AlertCircle className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                                    <p className="text-sm text-slate-500">{vitalityT.noData}</p>
                                </div>
                            )}

                            <Button
                                variant="outline"
                                className="w-full mt-6 rounded-xl border-emerald-100 text-emerald-700 hover:bg-emerald-50"
                                onClick={() => window.location.href = '/'}
                            >
                                {vitalityT.getNewAssessment}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-lg bg-white rounded-3xl overflow-hidden">
                        <CardHeader className="bg-amber-50/50 border-b border-amber-50">
                            <CardTitle className="text-lg flex items-center gap-2 text-amber-900">
                                <Info className="w-5 h-5 text-amber-600" />
                                {vitalityT.didYouKnow}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <p className="text-sm text-slate-600 leading-relaxed italic">
                                "The wise man adapts himself to the time and the season, as the water adapts itself to the channel that guides it."
                            </p>
                            <p className="text-xs text-slate-400 mt-4">
                                TCM emphasizes <strong>Ziwu Liuzhu</strong> (The Flow of Qi through Meridians) as a way to maintain health by aligning biological rhythms with solar and lunar cycles.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <style jsx>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 60s linear infinite;
                }
            `}</style>
        </div>
    )
}
