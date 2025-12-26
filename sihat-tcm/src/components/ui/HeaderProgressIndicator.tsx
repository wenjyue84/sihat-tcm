'use client'

import { motion } from 'framer-motion'
import { useDiagnosisProgressOptional } from '@/stores/useAppStore'

interface HeaderProgressIndicatorProps {
    /** Size of the indicator in pixels */
    size?: number
}

/**
 * ============================================================================
 * HEADER PROGRESS INDICATOR
 * ============================================================================
 * A compact circular progress indicator designed for the header.
 * Shows the diagnosis completion percentage with an animated ring.
 * 
 * Features:
 * - Animated progress ring with gradient
 * - Percentage display in center
 * - Smooth transitions between progress values
 * - Compact design for header placement
 * ============================================================================
 */
export function HeaderProgressIndicator({ size = 40 }: HeaderProgressIndicatorProps) {
    const progressContext = useDiagnosisProgressOptional()
    const progress = progressContext?.progress ?? 0

    const strokeWidth = 3
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (progress / 100) * circumference

    // Don't show if progress is 0 or context not available
    if (progress === 0) {
        return (
            <div
                className="flex items-center justify-center bg-white/10 rounded-full backdrop-blur-sm border border-white/20"
                style={{ width: size, height: size }}
            >
                <span className="text-xs font-medium text-white/60">0%</span>
            </div>
        )
    }

    return (
        <motion.div
            className="relative flex-shrink-0"
            style={{ width: size, height: size }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {/* Background circle */}
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                {/* Progress circle */}
                <motion.circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="url(#headerProgressGradient)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset: offset }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    style={{
                        strokeDasharray: circumference,
                    }}
                />
                {/* Gradient definition */}
                <defs>
                    <linearGradient id="headerProgressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#34d399" />
                        <stop offset="100%" stopColor="#2dd4bf" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Percentage text */}
            <div className="absolute inset-0 flex items-center justify-center">
                <motion.span
                    className="text-xs font-bold text-white"
                    key={progress}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                >
                    {progress}%
                </motion.span>
            </div>
        </motion.div>
    )
}

export default HeaderProgressIndicator
