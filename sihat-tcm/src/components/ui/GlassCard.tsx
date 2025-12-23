'use client'

import * as React from "react"
import { motion, type HTMLMotionProps } from "framer-motion"
import { cn } from "@/lib/utils"

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "ref" | "glow" | "variant"> {
    /** Visual style variant */
    variant?: "default" | "elevated" | "subtle" | "glow"
    /** Blur intensity level */
    intensity?: "low" | "medium" | "high"
    /** Enable entrance animation (default: true) */
    animated?: boolean
    /** Enable shimmer border effect on hover - PC only (default: false) */
    glow?: boolean
}

/**
 * GlassCard - Premium glassmorphism card component
 * 
 * Features:
 * - Framer Motion entrance animations
 * - Responsive hover (PC) / active (mobile) states
 * - Optional animated shimmer border on hover
 * - Respects prefers-reduced-motion
 * - Dark mode optimized
 */
function GlassCard({
    className,
    variant = "default",
    intensity = "medium",
    animated = true,
    glow = false,
    children,
    ...props
}: GlassCardProps) {
    // Check for reduced motion preference
    const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)

    React.useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
        setPrefersReducedMotion(mediaQuery.matches)

        const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
        mediaQuery.addEventListener('change', handler)
        return () => mediaQuery.removeEventListener('change', handler)
    }, [])

    const shouldAnimate = animated && !prefersReducedMotion

    // Variant styles for border and shadow
    const variantStyles = {
        default: "border-white/20 shadow-sm hover:shadow-md",
        elevated: "border-white/30 shadow-lg shadow-black/5 hover:shadow-xl hover:shadow-black/10",
        subtle: "border-white/10 shadow-none hover:shadow-sm",
        glow: "border-emerald-200/50 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20"
    }

    // Intensity styles for backdrop blur and background
    const intensityStyles = {
        low: "backdrop-blur-sm bg-white/30 dark:bg-white/5",
        medium: "backdrop-blur-md bg-white/50 dark:bg-white/10",
        high: "backdrop-blur-lg bg-white/70 dark:bg-white/20"
    }

    // Animation variants
    const motionVariants = {
        hidden: { opacity: 0, y: 8, scale: 0.98 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.3,
                ease: [0.22, 1, 0.36, 1] as any // easeOutQuint
            }
        }
    }

    const shouldShowGlow = glow === true || variant === 'glow';

    return (
        <motion.div
            data-slot="glass-card"
            initial={shouldAnimate ? "hidden" : false}
            animate={shouldAnimate ? "visible" : false}
            variants={motionVariants}
            whileHover={shouldAnimate ? {
                scale: 1.01,
                transition: { duration: 0.2 }
            } : undefined}
            whileTap={shouldAnimate ? {
                scale: 0.99,
                transition: { duration: 0.1 }
            } : undefined}
            className={cn(
                // Base styles
                "relative rounded-xl border p-6 transition-all duration-300",
                // Blur and background
                intensityStyles[intensity],
                // Border and shadow
                variantStyles[variant],
                // Responsive interaction states (CSS fallback for non-motion)
                "md:hover:scale-[1.01] active:scale-[0.99]",
                // Glow effect wrapper
                glow && "overflow-hidden",
                className
            )}
            {...props}
        >
            {(shouldShowGlow && (
                <div
                    className="absolute inset-0 -z-10 rounded-xl opacity-0 transition-opacity duration-500 md:group-hover:opacity-100 md:hover:opacity-100"
                    style={{
                        background: 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.2), transparent)',
                        animation: shouldAnimate ? 'shimmer 2s infinite' : 'none'
                    }}
                />
            )) as React.ReactNode}

            {/* Content */}
            {children as React.ReactNode}
        </motion.div>
    )
}

export { GlassCard }
export type { GlassCardProps }
