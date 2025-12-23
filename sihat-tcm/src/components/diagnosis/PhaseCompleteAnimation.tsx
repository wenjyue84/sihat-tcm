'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'
import { Check, Sparkles, Star, Heart, Zap, Award, ArrowRight } from 'lucide-react'

/**
 * PhaseCompleteAnimation - A lightweight celebration animation component
 * 
 * Features:
 * - Displays a brief congratulatory animation when a diagnosis phase is completed
 * - Uses CSS animations and framer-motion for smooth, GPU-accelerated animations
 * - Responsive design for both PC and mobile devices
 * - Auto-dismisses after a short duration (doesn't block user progress)
 * - Minimal processing resources - uses simple transforms and opacity
 * 
 * Usage:
 * <PhaseCompleteAnimation
 *   isVisible={showCelebration}
 *   phase="basics"
 *   onComplete={() => setShowCelebration(false)}
 * />
 */

export type DiagnosisPhase = 'basics' | 'inquiry' | 'tongue' | 'face' | 'audio' | 'pulse' | 'smartConnect' | 'summary'

interface PhaseCompleteAnimationProps {
    isVisible: boolean
    phase: DiagnosisPhase
    onComplete: () => void
    /** Duration in milliseconds before auto-dismiss. Default: 1500ms */
    duration?: number
}

// Phase-specific configurations
const phaseConfigs: Record<DiagnosisPhase, {
    icon: typeof Check
    color: string
    gradient: string
    emoji: string
}> = {
    basics: {
        icon: Check,
        color: '#10b981',
        gradient: 'from-emerald-400 to-teal-500',
        emoji: '✅'
    },
    inquiry: {
        icon: Heart,
        color: '#ec4899',
        gradient: 'from-pink-400 to-rose-500',
        emoji: '💬'
    },
    tongue: {
        icon: Sparkles,
        color: '#f59e0b',
        gradient: 'from-amber-400 to-orange-500',
        emoji: '👅'
    },
    face: {
        icon: Star,
        color: '#8b5cf6',
        gradient: 'from-violet-400 to-purple-500',
        emoji: '😊'
    },
    audio: {
        icon: Zap,
        color: '#3b82f6',
        gradient: 'from-blue-400 to-indigo-500',
        emoji: '🎤'
    },
    pulse: {
        icon: Heart,
        color: '#ef4444',
        gradient: 'from-red-400 to-rose-500',
        emoji: '💓'
    },
    smartConnect: {
        icon: Zap,
        color: '#06b6d4',
        gradient: 'from-cyan-400 to-teal-500',
        emoji: '📱'
    },
    summary: {
        icon: Award,
        color: '#fbbf24',
        gradient: 'from-yellow-400 to-amber-500',
        emoji: '🎉'
    }
}

// Translations for phase completion messages are now in the global translation files

// Floating particle component for celebration effect
const FloatingParticle = ({ delay, x }: { delay: number; x: number }) => (
    <motion.div
        className="absolute w-2 h-2 rounded-full bg-current opacity-60"
        initial={{ y: 0, x, opacity: 0, scale: 0 }}
        animate={{
            y: -80,
            opacity: [0, 1, 0],
            scale: [0, 1, 0.5],
        }}
        transition={{
            duration: 1,
            delay,
            ease: 'easeOut',
        }}
    />
)

export function PhaseCompleteAnimation({
    isVisible,
    phase,
    onComplete,
    duration = 1500
}: PhaseCompleteAnimationProps) {
    const { t } = useLanguage()
    const [showParticles, setShowParticles] = useState(false)

    const config = phaseConfigs[phase]
    // Fallback to empty if translation loading, though t should always be ready
    const message = t.celebration?.[phase] || { title: '', subtitle: '' }
    const IconComponent = config.icon

    useEffect(() => {
        if (isVisible) {
            setShowParticles(true)
            const timer = setTimeout(() => {
                onComplete()
                setShowParticles(false)
            }, duration)
            return () => clearTimeout(timer)
        }
    }, [isVisible, duration, onComplete])

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    {/* Subtle backdrop */}
                    <motion.div
                        className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    />

                    {/* Main celebration card */}
                    <motion.div
                        className="relative flex flex-col items-center justify-center p-6 md:p-8"
                        initial={{ scale: 0.8, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: -10, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    >
                        {/* Glowing circle behind icon */}
                        <motion.div
                            className={`absolute w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br ${config.gradient} blur-xl opacity-40`}
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.4, 0.6, 0.4],
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                ease: 'easeInOut',
                            }}
                        />

                        {/* Icon container with particles */}
                        <motion.div
                            className="relative"
                            style={{ color: config.color }}
                        >
                            {/* Floating particles */}
                            {showParticles && (
                                <>
                                    <FloatingParticle delay={0} x={-20} />
                                    <FloatingParticle delay={0.1} x={20} />
                                    <FloatingParticle delay={0.15} x={-10} />
                                    <FloatingParticle delay={0.2} x={10} />
                                    <FloatingParticle delay={0.25} x={0} />
                                </>
                            )}

                            {/* Main icon with ring */}
                            <motion.div
                                className={`relative flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br ${config.gradient} shadow-2xl`}
                                initial={{ rotate: -180, scale: 0 }}
                                animate={{ rotate: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                            >
                                {/* Spinning ring effect */}
                                <motion.div
                                    className="absolute inset-0 rounded-full border-4 border-white/30"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                />

                                {/* Icon */}
                                <IconComponent className="w-10 h-10 md:w-12 md:h-12 text-white drop-shadow-lg" />
                            </motion.div>

                            {/* Checkmark badge */}
                            <motion.div
                                className="absolute -bottom-1 -right-1 w-8 h-8 md:w-9 md:h-9 bg-white rounded-full shadow-lg flex items-center justify-center"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.3 }}
                            >
                                <Check className="w-5 h-5 md:w-6 md:h-6 text-emerald-500" strokeWidth={3} />
                            </motion.div>
                        </motion.div>

                        {/* Text content */}
                        <motion.div
                            className="mt-4 md:mt-6 text-center"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h3 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-white mb-1 flex items-center justify-center gap-2">
                                <span>{message.title}</span>
                                <motion.span
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ duration: 0.5, delay: 0.4 }}
                                >
                                    {config.emoji}
                                </motion.span>
                            </h3>
                            <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1">
                                {message.subtitle}
                                <motion.span
                                    animate={{ x: [0, 4, 0] }}
                                    transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 0.3 }}
                                >
                                    <ArrowRight className="w-4 h-4 inline" />
                                </motion.span>
                            </p>
                        </motion.div>

                        {/* Progress dots */}
                        <motion.div
                            className="mt-4 flex gap-1.5"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                        >
                            {[0, 1, 2].map((i) => (
                                <motion.div
                                    key={i}
                                    className={`w-2 h-2 rounded-full bg-gradient-to-r ${config.gradient}`}
                                    animate={{
                                        scale: [1, 1.3, 1],
                                        opacity: [0.5, 1, 0.5],
                                    }}
                                    transition={{
                                        duration: 0.6,
                                        repeat: Infinity,
                                        delay: i * 0.15,
                                    }}
                                />
                            ))}
                        </motion.div>
                    </motion.div>
                </motion.div>
            )
            }
        </AnimatePresence >
    )
}

export default PhaseCompleteAnimation
