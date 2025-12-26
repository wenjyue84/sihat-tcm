'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '@/components/ui/card'
import {
    User, Scale, Ruler, Activity, Clock, Heart,
    Sparkles, Brain, Eye, Ear, Hand,
    CheckCircle2, Circle, Loader2, AlertCircle,
    Database, Send, Cpu, FileJson, Layout
} from 'lucide-react'
import { BasicInfoData } from './BasicInfoForm'
import { useLanguage } from '@/stores/useAppStore'

interface AnalysisLoadingScreenProps {
    basicInfo: BasicInfoData | null
    apiStatus?: 'idle' | 'sending' | 'waiting' | 'streaming' | 'parsing' | 'complete' | 'error'
    streamProgress?: number // 0-100
    errorMessage?: string
}

export function AnalysisLoadingScreen({ basicInfo, apiStatus = 'sending', streamProgress = 0, errorMessage }: AnalysisLoadingScreenProps) {
    const { t } = useLanguage()
    const [elapsedSeconds, setElapsedSeconds] = useState(0)
    const [currentFactIndex, setCurrentFactIndex] = useState(0)
    const [currentInfoIndex, setCurrentInfoIndex] = useState(0)
    const [currentDebugStep, setCurrentDebugStep] = useState(1)

    // TCM educational facts to display while loading
    const TCM_FACTS = [
        {
            icon: Eye,
            title: t.analysisLoading.tcmFacts.observation.title,
            description: t.analysisLoading.tcmFacts.observation.description
        },
        {
            icon: Ear,
            title: t.analysisLoading.tcmFacts.listening.title,
            description: t.analysisLoading.tcmFacts.listening.description
        },
        {
            icon: Brain,
            title: t.analysisLoading.tcmFacts.inquiry.title,
            description: t.analysisLoading.tcmFacts.inquiry.description
        },
        {
            icon: Hand,
            title: t.analysisLoading.tcmFacts.palpation.title,
            description: t.analysisLoading.tcmFacts.palpation.description
        },
        {
            icon: Heart,
            title: t.analysisLoading.tcmFacts.yinYang.title,
            description: t.analysisLoading.tcmFacts.yinYang.description
        },
        {
            icon: Sparkles,
            title: t.analysisLoading.tcmFacts.fiveElements.title,
            description: t.analysisLoading.tcmFacts.fiveElements.description
        },
        {
            icon: Activity,
            title: t.analysisLoading.tcmFacts.qiBlood.title,
            description: t.analysisLoading.tcmFacts.qiBlood.description
        },
    ]

    // Analysis steps to show progress
    const DEBUG_STEPS = [
        { id: 1, label: t.analysisLoading.debugSteps.dataCollected, icon: Database, description: t.analysisLoading.debugSteps.gatheringInfo },
        { id: 2, label: t.analysisLoading.debugSteps.preparingAnalysis, icon: FileJson, description: t.analysisLoading.debugSteps.organizingData },
        { id: 3, label: t.analysisLoading.debugSteps.connecting, icon: Send, description: t.analysisLoading.debugSteps.establishingConnection },
        { id: 4, label: t.analysisLoading.debugSteps.processing, icon: Cpu, description: t.analysisLoading.debugSteps.preparingConsultation },
        { id: 5, label: t.analysisLoading.debugSteps.aiAnalysis, icon: Sparkles, description: t.analysisLoading.debugSteps.generatingInsights },
        { id: 6, label: t.analysisLoading.debugSteps.receivingResults, icon: Loader2, description: t.analysisLoading.debugSteps.retrievingAnalysis },
        { id: 7, label: t.analysisLoading.debugSteps.validating, icon: FileJson, description: t.analysisLoading.debugSteps.checkingResults },
        { id: 8, label: t.analysisLoading.debugSteps.renderingReport, icon: Layout, description: t.analysisLoading.debugSteps.creatingReport },
    ]

    // Timer effect
    useEffect(() => {
        const timer = setInterval(() => {
            setElapsedSeconds(prev => prev + 1)
        }, 1000)
        return () => clearInterval(timer)
    }, [])

    // Simulate debug step progression based on time (for visual feedback)
    useEffect(() => {
        if (elapsedSeconds >= 1 && currentDebugStep < 2) setCurrentDebugStep(2)
        if (elapsedSeconds >= 2 && currentDebugStep < 3) setCurrentDebugStep(3)
        if (elapsedSeconds >= 3 && currentDebugStep < 4) setCurrentDebugStep(4)
        if (elapsedSeconds >= 4 && currentDebugStep < 5) setCurrentDebugStep(5)
        if (elapsedSeconds >= 6 && currentDebugStep < 6) setCurrentDebugStep(6)
        // Steps 7 and 8 will happen once response arrives
    }, [elapsedSeconds, currentDebugStep])

    // Rotate TCM facts every 5 seconds
    useEffect(() => {
        const factTimer = setInterval(() => {
            setCurrentFactIndex(prev => (prev + 1) % TCM_FACTS.length)
        }, 5000)
        return () => clearInterval(factTimer)
    }, [TCM_FACTS.length])

    // Rotate patient info every 3 seconds
    useEffect(() => {
        const infoTimer = setInterval(() => {
            setCurrentInfoIndex(prev => (prev + 1) % 4)
        }, 3000)
        return () => clearInterval(infoTimer)
    }, [])

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // Calculate BMI if we have the data
    const calculateBMI = () => {
        if (!basicInfo?.weight || !basicInfo?.height) return null
        const weightKg = parseFloat(basicInfo.weight)
        const heightM = parseFloat(basicInfo.height) / 100
        if (isNaN(weightKg) || isNaN(heightM) || heightM === 0) return null
        return (weightKg / (heightM * heightM)).toFixed(1)
    }

    const bmi = calculateBMI()

    // Patient info cards to cycle through
    const patientInfoCards = [
        {
            icon: User,
            label: t.analysisLoading.patientInfo.patient,
            value: basicInfo?.name || t.analysisLoading.patientInfo.anonymous,
            color: "text-blue-600",
            bgColor: "bg-blue-50",
        },
        {
            icon: Clock,
            label: t.analysisLoading.patientInfo.age,
            value: basicInfo?.age ? `${basicInfo.age} ${t.analysisLoading.yearsOld}` : t.analysisLoading.patientInfo.notAvailable,
            color: "text-purple-600",
            bgColor: "bg-purple-50",
        },
        {
            icon: Scale,
            label: t.analysisLoading.patientInfo.weightBmi,
            value: basicInfo?.weight ? `${basicInfo.weight} kg${bmi ? ` (BMI: ${bmi})` : ''}` : t.analysisLoading.patientInfo.notAvailable,
            color: "text-orange-600",
            bgColor: "bg-orange-50",
        },
        {
            icon: Activity,
            label: t.analysisLoading.patientInfo.mainConcerns,
            value: basicInfo?.symptoms || t.analysisLoading.patientInfo.generalConsultation,
            color: "text-emerald-600",
            bgColor: "bg-emerald-50",
        },
    ]

    const currentFact = TCM_FACTS[currentFactIndex]
    const CurrentFactIcon = currentFact.icon

    const getStepStatus = (stepId: number) => {
        if (stepId < currentDebugStep) return 'complete'
        if (stepId === currentDebugStep) return 'active'
        return 'pending'
    }

    return (
        <Card className="p-8 border-none shadow-2xl bg-gradient-to-br from-white via-emerald-50/30 to-teal-50/30 backdrop-blur-sm">
            <div className="space-y-8">
                {/* Header with Yin-Yang animation */}
                <div className="text-center space-y-4">
                    <div className="relative w-28 h-28 mx-auto">
                        {/* Outer glow ring */}
                        <div className="absolute inset-0 border-4 border-emerald-200/50 rounded-full animate-pulse"></div>
                        {/* Spinning ring */}
                        <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
                        {/* Inner spinning ring (opposite direction) */}
                        <div className="absolute inset-2 border-2 border-teal-400 rounded-full border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
                        {/* Center icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <motion.span
                                className="text-4xl"
                                animate={{ rotate: [0, 360] }}
                                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                            >
                                ☯
                            </motion.span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-600 bg-clip-text text-transparent">
                            {t.analysisLoading.title}
                        </h2>
                        <p className="text-stone-500">
                            {t.analysisLoading.subtitle}
                        </p>
                    </div>

                    {/* Timer */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 rounded-full text-stone-600">
                        <Clock className="w-4 h-4 animate-pulse" />
                        <span className="font-mono font-medium">{formatTime(elapsedSeconds)}</span>
                        {elapsedSeconds > 60 && (
                            <span className="text-amber-600 text-xs ml-2">{t.analysisLoading.takingLonger}</span>
                        )}
                    </div>
                </div>

                {/* Patient Info Carousel */}
                <div className="relative h-24 overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentInfoIndex}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                            className="absolute inset-0"
                        >
                            {(() => {
                                const info = patientInfoCards[currentInfoIndex]
                                const InfoIcon = info.icon
                                return (
                                    <div className={`flex items-center gap-4 p-4 rounded-xl ${info.bgColor} border border-stone-100`}>
                                        <div className={`p-3 rounded-full bg-white shadow-sm`}>
                                            <InfoIcon className={`w-6 h-6 ${info.color}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-stone-500 font-medium">{info.label}</p>
                                            <p className={`text-lg font-semibold ${info.color} truncate`}>
                                                {info.value}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })()}
                        </motion.div>
                    </AnimatePresence>

                    {/* Progress dots */}
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex gap-1.5">
                        {patientInfoCards.map((_, idx) => (
                            <div
                                key={idx}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${idx === currentInfoIndex
                                    ? 'bg-emerald-500 w-4'
                                    : 'bg-stone-300'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* TCM Facts Carousel */}
                <div className="relative">
                    <div className="absolute -top-3 left-4 px-2 py-1 bg-emerald-100 rounded-full">
                        <p className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            {t.analysisLoading.didYouKnow}
                        </p>
                    </div>

                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100 min-h-[120px]">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentFactIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.5 }}
                                className="flex gap-4"
                            >
                                <div className="p-3 bg-white rounded-xl shadow-sm shrink-0">
                                    <CurrentFactIcon className="w-8 h-8 text-emerald-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-emerald-800 mb-1">
                                        {currentFact.title}
                                    </h3>
                                    <p className="text-sm text-stone-600 leading-relaxed">
                                        {currentFact.description}
                                    </p>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Fact progress bar */}
                    <div className="flex gap-1 mt-3 justify-center">
                        {TCM_FACTS.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1 rounded-full transition-all duration-500 ${idx === currentFactIndex
                                    ? 'bg-emerald-500 w-8'
                                    : 'bg-stone-200 w-4'
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* ANALYSIS PROGRESS - Mobile Optimized */}
                <div className="bg-gradient-to-br from-stone-50 to-slate-50 rounded-2xl p-5 border border-stone-200 shadow-sm">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-100 rounded-lg">
                                <Cpu className="w-4 h-4 text-emerald-600" />
                            </div>
                            <p className="text-sm font-bold text-stone-700">
                                {t.analysisLoading.analysisProgress}
                            </p>
                        </div>
                        <div className="px-3 py-1 bg-emerald-100 rounded-full">
                            <span className="text-xs font-semibold text-emerald-700">{currentDebugStep}/8</span>
                        </div>
                    </div>

                    {/* Circular Progress Icons Timeline */}
                    <div className="relative mb-5">
                        {/* Connection line */}
                        <div className="absolute top-5 left-4 right-4 h-0.5 bg-stone-200 z-0" />
                        <div
                            className="absolute top-5 left-4 h-0.5 bg-gradient-to-r from-emerald-400 to-emerald-500 z-0 transition-all duration-500"
                            style={{ width: `calc(${Math.min((currentDebugStep - 1) / 7 * 100, 100)}% - 32px)` }}
                        />

                        {/* Icons */}
                        <div className="relative z-10 flex justify-between">
                            {DEBUG_STEPS.map((step) => {
                                const status = getStepStatus(step.id)
                                const StepIcon = step.icon

                                return (
                                    <motion.div
                                        key={step.id}
                                        initial={{ scale: 0.8, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: step.id * 0.05 }}
                                        className="flex flex-col items-center"
                                    >
                                        <div
                                            className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${status === 'complete'
                                                    ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-200'
                                                    : status === 'active'
                                                        ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-200'
                                                        : 'bg-white border-2 border-stone-200'
                                                }`}
                                        >
                                            {status === 'complete' ? (
                                                <CheckCircle2 className="w-5 h-5 text-white" />
                                            ) : status === 'active' ? (
                                                <motion.div
                                                    animate={{ rotate: 360 }}
                                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                                >
                                                    <StepIcon className="w-5 h-5 text-white" />
                                                </motion.div>
                                            ) : (
                                                <StepIcon className="w-4 h-4 text-stone-400" />
                                            )}

                                            {/* Active pulse ring */}
                                            {status === 'active' && (
                                                <motion.div
                                                    className="absolute inset-0 rounded-full border-2 border-amber-400"
                                                    animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
                                                    transition={{ duration: 1.5, repeat: Infinity }}
                                                />
                                            )}
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Single Rotating Label - Shows current step info */}
                    <div className="min-h-[60px] flex items-center justify-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentDebugStep}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="text-center"
                            >
                                <p className="text-base font-semibold text-stone-800 mb-1">
                                    {DEBUG_STEPS[currentDebugStep - 1]?.label}
                                </p>
                                <p className="text-sm text-stone-500">
                                    {DEBUG_STEPS[currentDebugStep - 1]?.description}
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Progress bar */}
                    <div className="mt-4">
                        <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${(currentDebugStep / 8) * 100}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                            />
                        </div>
                    </div>

                    {/* Warning if taking too long */}
                    {elapsedSeconds > 30 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 p-3 mt-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-700 text-sm"
                        >
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>
                                {t.analysisLoading.takingLongerWarning}
                                {currentDebugStep <= 5
                                    ? t.analysisLoading.aiAnalysisMayTakeMoment
                                    : t.analysisLoading.responseStreaming}
                            </span>
                        </motion.div>
                    )}

                    {elapsedSeconds > 120 && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center gap-2 p-3 mt-3 bg-red-50 rounded-xl border border-red-200 text-red-700 text-sm"
                        >
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>
                                {t.analysisLoading.timeoutWarning}
                            </span>
                        </motion.div>
                    )}
                </div>
            </div>
        </Card>
    )
}

