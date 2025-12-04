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

interface AnalysisLoadingScreenProps {
    basicInfo: BasicInfoData | null
    apiStatus?: 'idle' | 'sending' | 'waiting' | 'streaming' | 'parsing' | 'complete' | 'error'
    streamProgress?: number // 0-100
    errorMessage?: string
}

// TCM educational facts to display while loading
const TCM_FACTS = [
    {
        icon: Eye,
        title: "望 (Wàng) - Observation",
        description: "TCM practitioners examine your facial complexion, tongue coating, and body posture to understand your internal health condition."
    },
    {
        icon: Ear,
        title: "聞 (Wén) - Listening & Smelling",
        description: "The practitioner listens to your voice, breathing patterns, and cough sounds to detect imbalances in your Qi and organ systems."
    },
    {
        icon: Brain,
        title: "問 (Wèn) - Inquiry",
        description: "Through detailed questioning about your symptoms, lifestyle, and medical history, TCM builds a comprehensive picture of your health."
    },
    {
        icon: Hand,
        title: "切 (Qiè) - Palpation",
        description: "Pulse diagnosis reveals the state of your organs and Qi flow. A skilled practitioner can detect up to 28 different pulse qualities."
    },
    {
        icon: Heart,
        title: "Yin-Yang Balance",
        description: "TCM seeks to restore balance between opposing forces. Symptoms often indicate excess or deficiency in either Yin or Yang energy."
    },
    {
        icon: Sparkles,
        title: "Five Elements Theory",
        description: "Wood, Fire, Earth, Metal, and Water represent different organs and emotions. Their harmony is essential for wellbeing."
    },
    {
        icon: Activity,
        title: "Qi & Blood Flow",
        description: "Qi is your life force energy. When Qi flows smoothly through your meridians, health follows. Blockages lead to pain and illness."
    },
]

// Debug steps to show API flow
const DEBUG_STEPS = [
    { id: 1, label: "Data Collected", icon: Database, description: "Patient info gathered from form" },
    { id: 2, label: "Request Prepared", icon: FileJson, description: "Building API payload" },
    { id: 3, label: "Sending to API", icon: Send, description: "POST /api/consult" },
    { id: 4, label: "API Processing", icon: Cpu, description: "Server building prompt" },
    { id: 5, label: "Calling Gemini", icon: Sparkles, description: "Waiting for AI..." },
    { id: 6, label: "Streaming Response", icon: Loader2, description: "Receiving chunks..." },
    { id: 7, label: "Parsing JSON", icon: FileJson, description: "Validating response" },
    { id: 8, label: "Rendering Report", icon: Layout, description: "Building UI" },
]

export function AnalysisLoadingScreen({ basicInfo, apiStatus = 'sending', streamProgress = 0, errorMessage }: AnalysisLoadingScreenProps) {
    const [elapsedSeconds, setElapsedSeconds] = useState(0)
    const [currentFactIndex, setCurrentFactIndex] = useState(0)
    const [currentInfoIndex, setCurrentInfoIndex] = useState(0)
    const [currentDebugStep, setCurrentDebugStep] = useState(1)

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
    }, [])

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
            label: "Patient",
            value: basicInfo?.name || "Anonymous",
            color: "text-blue-600",
            bgColor: "bg-blue-50",
        },
        {
            icon: Clock,
            label: "Age",
            value: basicInfo?.age ? `${basicInfo.age} years old` : "N/A",
            color: "text-purple-600",
            bgColor: "bg-purple-50",
        },
        {
            icon: Scale,
            label: "Weight & BMI",
            value: basicInfo?.weight ? `${basicInfo.weight} kg${bmi ? ` (BMI: ${bmi})` : ''}` : "N/A",
            color: "text-orange-600",
            bgColor: "bg-orange-50",
        },
        {
            icon: Activity,
            label: "Main Concerns",
            value: basicInfo?.symptoms || "General consultation",
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
                            Analyzing Your Constitution
                        </h2>
                        <p className="text-stone-500">
                            Our AI practitioner is synthesizing your symptoms, observations, and pulse data...
                        </p>
                    </div>

                    {/* Timer */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 rounded-full text-stone-600">
                        <Clock className="w-4 h-4 animate-pulse" />
                        <span className="font-mono font-medium">{formatTime(elapsedSeconds)}</span>
                        {elapsedSeconds > 60 && (
                            <span className="text-amber-600 text-xs ml-2">(taking longer than usual)</span>
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
                            Did you know?
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

                {/* DEBUG: API Process Steps */}
                <div className="space-y-3 bg-stone-50 rounded-xl p-4 border border-stone-200">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-stone-600 uppercase tracking-wider flex items-center gap-2">
                            <Cpu className="w-4 h-4" />
                            Debug: API Process
                        </p>
                        <span className="text-xs text-stone-400">Step {currentDebugStep}/8</span>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                        {DEBUG_STEPS.map((step) => {
                            const status = getStepStatus(step.id)
                            const StepIcon = step.icon

                            return (
                                <div
                                    key={step.id}
                                    className={`p-2 rounded-lg text-center transition-all ${status === 'complete' ? 'bg-emerald-100 border border-emerald-200' :
                                            status === 'active' ? 'bg-amber-100 border border-amber-300 animate-pulse' :
                                                'bg-white border border-stone-200'
                                        }`}
                                >
                                    <div className="flex justify-center mb-1">
                                        {status === 'complete' ? (
                                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                        ) : status === 'active' ? (
                                            <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                                        ) : (
                                            <Circle className="w-5 h-5 text-stone-300" />
                                        )}
                                    </div>
                                    <p className={`text-xs font-medium ${status === 'complete' ? 'text-emerald-700' :
                                            status === 'active' ? 'text-amber-700' :
                                                'text-stone-400'
                                        }`}>
                                        {step.label}
                                    </p>
                                    <p className="text-[10px] text-stone-400 mt-0.5 truncate">
                                        {step.description}
                                    </p>
                                </div>
                            )
                        })}
                    </div>

                    {/* Warning if taking too long */}
                    {elapsedSeconds > 30 && (
                        <div className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200 text-amber-700 text-xs">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>
                                Taking longer than expected.
                                {currentDebugStep <= 5
                                    ? " Gemini AI may be slow to respond. Check console for errors."
                                    : " Response is streaming, please wait..."}
                            </span>
                        </div>
                    )}

                    {elapsedSeconds > 120 && (
                        <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-200 text-red-700 text-xs">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>
                                Timeout likely. Check: 1) API key valid? 2) Network connection? 3) Console errors?
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    )
}

