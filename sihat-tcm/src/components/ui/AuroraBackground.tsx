'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export function AuroraBackground() {
    // Using isMounted to prevent hydration mismatch for initial random positions if we used them
    // For now, deterministic animations are fine.

    return (
        <div className="fixed inset-0 z-0 overflow-hidden bg-background pointer-events-none">
            {/* Base Gradient for Depth */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/10 via-background to-background" />

            {/* Blob 1 - Emerald (Top Left) */}
            <motion.div
                animate={{
                    x: [-20, 20, -20],
                    y: [0, 50, 0],
                    opacity: [0.3, 0.5, 0.3],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/30 rounded-full blur-[120px]"
            />

            {/* Blob 2 - Amber (Center Right) - Matches Mobile specific 'gold' accent */}
            <motion.div
                animate={{
                    x: [0, -50, 0],
                    y: [0, 30, 0],
                    opacity: [0.2, 0.4, 0.2],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 2
                }}
                className="absolute top-[30%] right-[-10%] w-[400px] h-[400px] bg-amber-500/20 rounded-full blur-[100px]"
            />

            {/* Blob 3 - Blue (Bottom Left) - Matches Mobile specific 'water' accent */}
            <motion.div
                animate={{
                    x: [0, 60, 0],
                    y: [0, -40, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 5
                }}
                className="absolute bottom-[-10%] left-[10%] w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[140px]"
            />
        </div>
    )
}
