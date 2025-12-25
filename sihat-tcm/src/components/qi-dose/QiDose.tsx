'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Sparkles,
    Trophy,
    BookOpen,
    Clock,
    Wind,
    Eye,
    Zap,
    Play,
    Shield,
    ChevronRight,
    Search,
    Dumbbell,
    Coffee,
    Leaf
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/contexts/LanguageContext'
import { QiGarden } from './QiGarden'

interface QuickFix {
    id: string
    title: string
    ailment: string
    movement: string
    duration: number
    color: string
}

export function QiDose() {
    const { t } = useLanguage()
    const [selectedRoutine, setSelectedRoutine] = useState<string | null>(null)
    const [isExercising, setIsExercising] = useState(false)
    const [countdown, setCountdown] = useState(60)
    const [showGarden, setShowGarden] = useState(false)

    const quickFixes: QuickFix[] = [
        {
            id: 'tired',
            title: t.qiDose.feelingTired,
            ailment: 'Regulates Triple Burner',
            movement: 'Two Hands Hold Up the Heavens',
            duration: 60,
            color: 'from-amber-400 to-orange-500'
        },
        {
            id: 'back',
            title: t.qiDose.backPain,
            ailment: 'Strengthens Kidneys',
            movement: 'Two Hands Touch the Feet',
            duration: 60,
            color: 'from-blue-400 to-indigo-500'
        },
        {
            id: 'stress',
            title: t.qiDose.stressed,
            ailment: 'Opens Lungs/Chest',
            movement: 'Drawing the Bow to Shoot the Hawk',
            duration: 60,
            color: 'from-emerald-400 to-teal-500'
        }
    ]

    const deskRoutines = [
        {
            title: t.qiDose.meridianSlap,
            desc: t.qiDose.meridianSlapDesc,
            duration: '3m',
            icon: Zap
        },
        {
            title: t.qiDose.ironOx,
            desc: t.qiDose.ironOxDesc,
            duration: '5m',
            icon: Dumbbell
        },
        {
            title: t.qiDose.digitalDetox,
            desc: t.qiDose.digitalDetoxDesc,
            duration: '2m',
            icon: Eye
        }
    ]

    return (
        <div className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                            <Wind className="w-5 h-5" />
                        </div>
                        <span className="text-sm font-bold text-emerald-600 uppercase tracking-widest">{t.qiDose.title}</span>
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t.qiDose.subtitle}</h2>
                </div>

                <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <div className="text-right">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t.qiDose.streak}</p>
                        <p className="text-xl font-black text-emerald-600">5 Days</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center border-2 border-emerald-100">
                        <Trophy className="w-6 h-6 text-emerald-600" />
                    </div>
                </div>
            </div>

            {/* Tab Switcher */}
            <div className="flex items-center gap-2 p-1 bg-white rounded-2xl shadow-sm border border-slate-100 w-fit">
                <button
                    onClick={() => setShowGarden(false)}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${!showGarden

                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    <Wind className="w-4 h-4" />
                    {t.qiDose.practicesTab || 'Practices'}
                </button>
                <button
                    onClick={() => setShowGarden(true)}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${showGarden
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-600 hover:bg-slate-50'
                        }`}
                >
                    <Leaf className="w-4 h-4" />
                    {t.qiDose.gardenTab || 'Qi Garden'}
                </button>
            </div>

            {/* Conditionally Render Main Content */}
            {showGarden ? (
                <QiGarden />
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Action Area */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* 8-Minute Brocade (Quick Fixes) */}
                        <section>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-amber-500" />
                                    {t.qiDose.eightMinuteBrocade}
                                </h3>
                                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{t.qiDose.quickFix}</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {quickFixes.map((fix) => (
                                    <motion.button
                                        key={fix.id}
                                        whileHover={{ y: -4 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="group relative overflow-hidden text-left"
                                        onClick={() => setSelectedRoutine(fix.id)}
                                    >
                                        <div className={`h-full p-6 rounded-2xl bg-gradient-to-br ${fix.color} text-white shadow-lg transition-all duration-300 group-hover:shadow-xl`}>
                                            <p className="text-sm font-medium opacity-90 mb-1">{fix.title}</p>
                                            <h4 className="text-lg font-bold leading-tight mb-4">{fix.movement}</h4>
                                            <div className="flex items-center gap-2 mt-auto">
                                                <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
                                                    <Play className="w-4 h-4 fill-white" />
                                                </div>
                                                <span className="text-xs font-bold tracking-wider">START</span>
                                            </div>
                                        </div>
                                        {/* Abstract shapes for visual flair */}
                                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-colors" />
                                    </motion.button>
                                ))}
                            </div>
                        </section>

                        {/* Desk Friendly Circuits */}
                        <section>
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-4">
                                <Coffee className="w-5 h-5 text-blue-500" />
                                {t.qiDose.deskFriendly}
                            </h3>
                            <div className="space-y-3">
                                {deskRoutines.map((routine, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-emerald-200 transition-all hover:bg-emerald-50/30 group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center group-hover:bg-white transition-colors">
                                                <routine.icon className="w-6 h-6 text-slate-600 group-hover:text-emerald-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-slate-800">{routine.title}</h4>
                                                <p className="text-sm text-slate-500 line-clamp-1">{routine.desc}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded-md">{routine.duration}</span>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full group-hover:bg-emerald-100 group-hover:text-emerald-600">
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Gamification & Info Sidebar */}
                    <div className="space-y-8">
                        {/* Dan Tian Filling Visualization */}
                        <Card className="border-none shadow-xl bg-gradient-to-b from-slate-900 to-emerald-950 text-white overflow-hidden relative">
                            <CardHeader className="relative z-10">
                                <CardTitle className="text-lg font-bold flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-emerald-400" />
                                    {t.qiDose.danTianFilling}
                                </CardTitle>
                                <CardDescription className="text-emerald-100/70">
                                    {t.qiDose.danTianDesc}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="relative z-10 pt-4 pb-12">
                                <div className="relative w-40 h-40 mx-auto">
                                    {/* Energy Orb Animation */}
                                    <motion.div
                                        animate={{
                                            scale: [1, 1.1, 1],
                                            opacity: [0.5, 0.8, 0.5]
                                        }}
                                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                        className="absolute inset-0 bg-emerald-500/20 rounded-full blur-3xl"
                                    />
                                    <motion.div
                                        animate={{
                                            rotate: 360,
                                            scale: [1, 1.05, 1]
                                        }}
                                        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                                        className="absolute inset-4 border-2 border-emerald-400/30 border-dashed rounded-full"
                                    />
                                    <div className="absolute inset-8 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 shadow-[0_0_50px_rgba(16,185,129,0.5)] flex items-center justify-center">
                                        <div className="text-center">
                                            <p className="text-3xl font-black">78%</p>
                                            <p className="text-[10px] font-bold uppercase tracking-tighter opacity-70">Filled</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                            {/* Background subtle grain/dust effect could go here */}
                        </Card>

                        {/* Unlocked Scrolls */}
                        <Card className="border-none shadow-sm bg-amber-50/50">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg font-bold flex items-center gap-2 text-amber-900">
                                    <BookOpen className="w-5 h-5" />
                                    {t.qiDose.unlockScrolls}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4 p-3 bg-white rounded-xl border border-amber-100 shadow-sm">
                                    <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                                        <Shield className="w-5 h-5 text-amber-700" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-amber-700 uppercase tracking-tighter">Day 7 Reward</p>
                                        <h5 className="font-bold text-slate-800">Turtle Breath Scroll</h5>
                                    </div>
                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                                        <Search className="w-3 h-3 text-slate-400" />
                                    </div>
                                </div>

                                <div className="relative pt-2">
                                    <div className="flex justify-between text-xs font-bold mb-1">
                                        <span className="text-amber-700">{t.qiDose.nextScroll}</span>
                                        <span className="text-slate-500">2/7 {t.qiDose.minutes}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: '30%' }}
                                            className="h-full bg-amber-500 rounded-full"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Feature Highlight: X-Ray Vision */}
                        <div className="p-6 rounded-2xl bg-indigo-900 text-white shadow-lg overflow-hidden relative group">
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="p-1.5 bg-indigo-500 rounded-md">
                                        <Eye className="w-4 h-4" />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-widest">{t.qiDose.xRayVision}</span>
                                </div>
                                <h4 className="text-lg font-bold mb-2">See Your Qi Flow</h4>
                                <p className="text-sm text-indigo-100/70 leading-relaxed mb-4">
                                    Overlay anatomical meridian lines to see exactly which organs you're healing.
                                </p>
                                <Button variant="secondary" size="sm" className="w-full bg-white text-indigo-900 hover:bg-indigo-50 font-bold border-none">
                                    PREVIEW FEATURE
                                </Button>
                            </div>
                            <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl transition-transform group-hover:scale-150 duration-700" />
                        </div>
                    </div>
                </div>
            )}

            {/* Routine Execution Modal (Simplified for prototype) */}
            <AnimatePresence>
                {selectedRoutine && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl"
                        >
                            <div className="p-8 text-center space-y-6">
                                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Play className="w-10 h-10 text-emerald-600 fill-emerald-600" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                                    {quickFixes.find(f => f.id === selectedRoutine)?.movement}
                                </h3>
                                <p className="text-slate-500 max-w-sm mx-auto">
                                    "{t.qiDose.sifuVoice}": Sink your weight into your heels. Imagine your breath filling your lower Dan Tian...
                                </p>

                                <div className="flex justify-center gap-4">
                                    <div className="text-center p-4 bg-slate-50 rounded-2xl w-24 border border-slate-100">
                                        <p className="text-2xl font-black text-slate-800">01</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.qiDose.minutes}</p>
                                    </div>
                                    <div className="flex items-center text-2xl font-black text-slate-300">:</div>
                                    <div className="text-center p-4 bg-slate-50 rounded-2xl w-24 border border-slate-100">
                                        <p className="text-2xl font-black text-slate-800">00</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.qiDose.seconds}</p>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <Button
                                        variant="outline"
                                        className="flex-1 py-6 rounded-2xl font-bold border-2"
                                        onClick={() => setSelectedRoutine(null)}
                                    >
                                        CANCEL
                                    </Button>
                                    <Button
                                        className="flex-1 py-6 rounded-2xl font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-200"
                                        onClick={() => {
                                            setSelectedRoutine(null)
                                            // Handle exercise completion state logic here
                                        }}
                                    >
                                        {t.qiDose.startExercise}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
