'use client'

import { motion } from 'framer-motion'
import { useRef } from 'react'

interface EcgAnimationProps {
    bpm: number | null
    isActive?: boolean
    height?: number
    className?: string
    lineColor?: string
}

// ECG waveform path - realistic PQRST wave pattern
// P wave (atrial depolarization), QRS complex (ventricular depolarization), T wave (ventricular repolarization)
const ECG_PATH = "M 0,50 L 8,50 L 10,48 L 12,50 L 14,50 L 16,50 L 18,55 L 19,20 L 20,85 L 21,5 L 22,50 L 24,50 L 26,45 L 30,50 L 35,50"

export function EcgAnimation({
    bpm,
    isActive = true,
    height = 60,
    className = '',
    lineColor
}: EcgAnimationProps) {
    const containerRef = useRef<HTMLDivElement>(null)

    // Calculate animation duration based on BPM - REALISTIC TIMING
    // At 60 BPM: 1 beat per second, so one ECG wave should take ~1 second
    // At 120 BPM: 2 beats per second, so one ECG wave should take ~0.5 seconds
    // The full animation shows multiple waves scrolling, so we scale accordingly
    const getAnimationDuration = (bpmValue: number | null): number => {
        if (!bpmValue || bpmValue <= 0) return 3 // Default slow for no input

        // Each ECG segment is 35 units wide in the path
        // We want one heartbeat (one wave) to take: 60/BPM seconds
        // Since we're scrolling 8 waves, total duration = (60/BPM) * 8
        // But we want it to feel dynamic, so:
        // 60 BPM -> ~4 seconds total scroll
        // 120 BPM -> ~2 seconds total scroll
        // 180 BPM -> ~1.33 seconds total scroll

        const beatDuration = 60 / bpmValue // seconds per beat
        return beatDuration * 4 // Show about 4 heartbeats worth of scrolling
    }

    const duration = getAnimationDuration(bpm)

    // Dynamic color based on BPM range
    const getLineColor = (bpmValue: number | null): string => {
        if (lineColor) return lineColor
        if (!bpmValue) return '#10b981' // emerald-500 default
        if (bpmValue < 60) return '#3b82f6' // blue-500 for bradycardia
        if (bpmValue > 100) return '#ef4444' // red-500 for tachycardia
        return '#10b981' // emerald-500 for normal
    }

    const color = getLineColor(bpm)

    // Get pulse interval for the dot animation (matches actual heart rate)
    const pulseInterval = bpm && bpm > 0 ? 60 / bpm : 1

    if (!isActive || !bpm || bpm <= 0) {
        return (
            <div
                ref={containerRef}
                className={`relative overflow-hidden ${className}`}
                style={{ height }}
            >
                <svg
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="w-full h-full"
                >
                    <line
                        x1="0"
                        y1="50"
                        x2="100"
                        y2="50"
                        stroke="#d1d5db"
                        strokeWidth="2"
                        className="opacity-30"
                    />
                </svg>
            </div>
        )
    }

    return (
        <div
            ref={containerRef}
            className={`relative overflow-hidden ${className}`}
            style={{ height }}
        >
            {/* Background grid lines for ECG monitor effect */}
            <div className="absolute inset-0 opacity-10">
                <div className="w-full h-full" style={{
                    backgroundImage: `linear-gradient(${color}40 1px, transparent 1px), linear-gradient(90deg, ${color}40 1px, transparent 1px)`,
                    backgroundSize: '20px 20px'
                }} />
            </div>

            {/* Animated ECG lines - continuous scrolling */}
            <svg
                viewBox="0 0 200 100"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full"
            >
                <defs>
                    <linearGradient id={`ecgGradient-${bpm}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={color} stopOpacity="0" />
                        <stop offset="15%" stopColor={color} stopOpacity="1" />
                        <stop offset="85%" stopColor={color} stopOpacity="1" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>
                    <filter id={`ecgGlow-${bpm}`}>
                        <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Continuous scrolling ECG pattern */}
                <g filter={`url(#ecgGlow-${bpm})`}>
                    <motion.g
                        initial={{ x: 280 }}
                        animate={{ x: -280 }}
                        transition={{
                            duration: duration,
                            repeat: Infinity,
                            ease: 'linear'
                        }}
                    >
                        {/* Generate multiple waves for seamless scrolling */}
                        {[0, 35, 70, 105, 140, 175, 210, 245, 280, 315, 350, 385, 420, 455, 490, 525].map((offset, i) => (
                            <path
                                key={i}
                                d={ECG_PATH}
                                fill="none"
                                stroke={`url(#ecgGradient-${bpm})`}
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                transform={`translate(${offset}, 0)`}
                            />
                        ))}
                    </motion.g>
                </g>
            </svg>

            {/* Pulsing dot that beats with heart rate */}
            <motion.div
                className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full shadow-lg"
                style={{
                    backgroundColor: color,
                    boxShadow: `0 0 10px ${color}, 0 0 20px ${color}50`
                }}
                animate={{
                    scale: [1, 1.8, 1],
                    opacity: [1, 0.6, 1]
                }}
                transition={{
                    duration: pulseInterval,
                    repeat: Infinity,
                    ease: 'easeInOut'
                }}
            />

            {/* Scan line effect */}
            <div
                className="absolute right-8 top-0 bottom-0 w-0.5 opacity-40"
                style={{ backgroundColor: color }}
            />
        </div>
    )
}
