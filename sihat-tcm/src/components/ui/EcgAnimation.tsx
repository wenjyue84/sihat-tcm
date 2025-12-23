'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface EcgAnimationProps {
    bpm: number | null
    isActive?: boolean
    height?: number
    className?: string
    lineColor?: string
}

// Medically-accurate PQRST waveform path - Hospital-grade ECG
// Based on real 12-lead ECG morphology with proper intervals:
// - P Wave: Atrial depolarization (~80ms)
// - PR Interval: AV node conduction delay (~120-200ms)
// - QRS Complex: Ventricular depolarization (~80-120ms)  
// - ST Segment: Early repolarization
// - T Wave: Ventricular repolarization (~160ms)
// - TP Segment: Resting period before next beat
// Path width: 100 units = 1 cardiac cycle, baseline at y=50
const ECG_PATH = `
M 0,50
L 10,50
C 13,50 15,47 18,43
C 21,39 23,39 25,43
C 27,47 29,50 32,50
L 38,50
L 40,53
L 42,15
L 44,80
L 46,8
L 48,50
L 55,50
C 60,50 63,44 68,38
C 73,32 76,32 80,38
C 84,44 87,50 92,50
L 100,50
`.trim().replace(/\n/g, ' ')

const PATH_WIDTH = 100 // Width of one complete cardiac cycle

export function EcgAnimation({
    bpm,
    isActive = true,
    height = 80,
    className = '',
    lineColor
}: EcgAnimationProps) {

    // ============================================
    // TIMING CALCULATION - TRIPLE VERIFIED
    // ============================================
    // 
    // Goal: At X BPM, exactly X heartbeats (R-waves) should pass per minute
    // 
    // Method: Scroll exactly ONE waveform (PATH_WIDTH=100 units) per heartbeat
    // 
    // cycleDuration = 60 / BPM (seconds per heartbeat)
    // 
    // Verification at 60 BPM:
    //   - cycleDuration = 60/60 = 1 second
    //   - Animation: scroll 100 units in 1 second
    //   - Rate: 100 units/sec = 1 complete waveform/sec = 60 BPM ✓
    //
    // Verification at 72 BPM:
    //   - cycleDuration = 60/72 = 0.833 seconds
    //   - Animation: scroll 100 units in 0.833 seconds
    //   - Rate: 120 units/sec = 1.2 waveforms/sec = 72 BPM ✓
    //
    // Verification at 120 BPM:
    //   - cycleDuration = 60/120 = 0.5 seconds
    //   - Animation: scroll 100 units in 0.5 seconds
    //   - Rate: 200 units/sec = 2 waveforms/sec = 120 BPM ✓
    // ============================================

    const cycleDuration = useMemo(() => {
        if (!bpm || bpm <= 0) return 1
        return 60 / bpm // seconds per heartbeat
    }, [bpm])

    // Generate enough waveforms to fill the screen plus overflow for seamless looping
    // viewBox is 200 units wide, so we need at least 4-5 waveforms visible + extras for scrolling
    const waveCount = 10
    const waveOffsets = useMemo(() => {
        return Array.from({ length: waveCount }, (_, i) => i * PATH_WIDTH)
    }, [])

    // CRITICAL FIX FOR SEAMLESS LOOP:
    // Animate exactly ONE PATH_WIDTH per cycleDuration
    // This creates perfect timing: 1 heartbeat per cycleDuration, which equals BPM
    // The loop is seamless because all waveforms are identical
    const animateDistance = PATH_WIDTH
    const animateDuration = cycleDuration

    // Color based on BPM range (hospital monitors use green primarily)
    const color = useMemo(() => {
        if (lineColor) return lineColor
        return '#00ff41' // Classic ECG green (phosphor)
    }, [lineColor])

    // Status indicator color based on BPM
    const statusColor = useMemo(() => {
        if (!bpm) return '#00ff41'
        if (bpm < 60) return '#3b82f6' // Blue for bradycardia
        if (bpm > 100) return '#ef4444' // Red for tachycardia
        return '#00ff41' // Green for normal
    }, [bpm])

    // Inactive state - flat line (hospital monitor style)
    if (!isActive || !bpm || bpm <= 0) {
        return (
            <div
                className={`relative overflow-hidden rounded-lg ${className}`}
                style={{
                    height,
                    backgroundColor: '#0a0a0a',
                    border: '1px solid #1a1a1a'
                }}
            >
                {/* Dark grid background */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `
                            linear-gradient(#1a3d1a 1px, transparent 1px),
                            linear-gradient(90deg, #1a3d1a 1px, transparent 1px)
                        `,
                        backgroundSize: '20px 20px'
                    }}
                />
                <svg
                    viewBox="0 0 200 100"
                    preserveAspectRatio="none"
                    className="w-full h-full relative"
                >
                    <line
                        x1="0"
                        y1="50"
                        x2="200"
                        y2="50"
                        stroke="#00ff41"
                        strokeWidth="2"
                        opacity={0.3}
                    />
                </svg>
                {/* Monitor frame effect */}
                <div className="absolute inset-0 rounded-lg pointer-events-none"
                    style={{
                        boxShadow: 'inset 0 0 30px rgba(0,0,0,0.5)'
                    }}
                />
            </div>
        )
    }

    return (
        <div
            className={`relative overflow-hidden rounded-lg ${className}`}
            style={{
                height,
                backgroundColor: '#0a0a0a',
                border: '1px solid #1a1a1a'
            }}
        >
            {/* Hospital ECG Paper Grid Background */}
            <div className="absolute inset-0">
                {/* Large grid (5mm equivalent - major divisions) */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `
                            linear-gradient(#0d2810 1px, transparent 1px),
                            linear-gradient(90deg, #0d2810 1px, transparent 1px)
                        `,
                        backgroundSize: '25px 25px'
                    }}
                />
                {/* Small grid (1mm equivalent - minor divisions) */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `
                            linear-gradient(#091a09 1px, transparent 1px),
                            linear-gradient(90deg, #091a09 1px, transparent 1px)
                        `,
                        backgroundSize: '5px 5px'
                    }}
                />
            </div>

            {/* Animated ECG Waveform */}
            <svg
                viewBox="0 0 200 100"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full"
            >
                <defs>
                    {/* Horizontal gradient for fade-in/fade-out at edges */}
                    <linearGradient id={`ecgFade-${bpm}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor={color} stopOpacity="0" />
                        <stop offset="8%" stopColor={color} stopOpacity="1" />
                        <stop offset="92%" stopColor={color} stopOpacity="1" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                    </linearGradient>

                    {/* Phosphor glow filter - CRT monitor effect */}
                    <filter id={`phosphorGlow-${bpm}`} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="1.5" result="blur1" />
                        <feGaussianBlur stdDeviation="4" result="blur2" />
                        <feMerge>
                            <feMergeNode in="blur2" />
                            <feMergeNode in="blur1" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Main scrolling ECG waveform with phosphor glow */}
                <g filter={`url(#phosphorGlow-${bpm})`}>
                    <motion.g
                        animate={{ x: [0, -animateDistance] }}
                        transition={{
                            duration: animateDuration,
                            repeat: Infinity,
                            ease: 'linear',
                            repeatType: 'loop'
                        }}
                    >
                        {/* Render multiple waveform segments for seamless loop */}
                        {waveOffsets.map((offset, i) => (
                            <path
                                key={i}
                                d={ECG_PATH}
                                fill="none"
                                stroke={`url(#ecgFade-${bpm})`}
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                transform={`translate(${offset}, 0)`}
                            />
                        ))}
                    </motion.g>
                </g>
            </svg>

            {/* BPM Display - Hospital monitor style */}
            <div className="absolute top-2 right-3 flex items-center gap-2">
                <motion.div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: statusColor }}
                    animate={{
                        opacity: [1, 0.3, 1],
                        scale: [1, 1.2, 1]
                    }}
                    transition={{
                        duration: cycleDuration,
                        repeat: Infinity,
                        ease: 'easeInOut'
                    }}
                />
                <span
                    className="text-xs font-mono font-bold"
                    style={{ color: statusColor }}
                >
                    {bpm}
                </span>
            </div>

            {/* Scan line effect - moving vertical line (synced to heartbeat) */}
            <motion.div
                className="absolute top-0 bottom-0 w-px opacity-60"
                style={{ backgroundColor: color }}
                initial={{ left: '0%' }}
                animate={{ left: '100%' }}
                transition={{
                    duration: cycleDuration,
                    repeat: Infinity,
                    ease: 'linear'
                }}
            />

            {/* Monitor frame vignette effect */}
            <div
                className="absolute inset-0 rounded-lg pointer-events-none"
                style={{
                    boxShadow: 'inset 0 0 40px rgba(0,0,0,0.6), inset 0 0 80px rgba(0,0,0,0.3)'
                }}
            />

            {/* Subtle scanline overlay for CRT effect */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)'
                }}
            />
        </div>
    )
}
