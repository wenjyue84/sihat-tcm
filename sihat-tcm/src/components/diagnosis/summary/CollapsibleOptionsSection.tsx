'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, LucideIcon } from 'lucide-react'

interface CollapsibleOptionsSectionProps {
    id: string
    title: string
    subtitle?: string
    /** Icon component from lucide-react */
    icon: LucideIcon
    /** Tailwind class for icon background, e.g. 'bg-emerald-100' */
    iconBgColor: string
    /** Tailwind class for icon color, e.g. 'text-emerald-600' */
    iconColor: string
    isExpanded: boolean
    onToggle: () => void
    /** Animation delay in seconds */
    delay?: number
    children: React.ReactNode
}

/**
 * CollapsibleOptionsSection - Reusable expandable section for report options
 * 
 * Replaces the repetitive accordion pattern in DiagnosisSummary.tsx
 */
export function CollapsibleOptionsSection({
    id,
    title,
    subtitle,
    icon: Icon,
    iconBgColor,
    iconColor,
    isExpanded,
    onToggle,
    delay = 0,
    children
}: CollapsibleOptionsSectionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay }}
            className="bg-white/70 backdrop-blur-sm rounded-xl border border-emerald-100 overflow-hidden shadow-sm hover:shadow-md transition-all"
        >
            <button
                type="button"
                onClick={onToggle}
                className="w-full px-4 py-4 flex items-center justify-between hover:bg-emerald-50/30 transition-colors"
                aria-expanded={isExpanded}
                aria-controls={`section-${id}`}
            >
                <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center ${iconBgColor}`}>
                        <Icon className={`w-4 h-4 ${iconColor}`} />
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="font-semibold text-slate-800">{title}</span>
                        {subtitle && <span className="text-xs text-slate-500 hidden sm:inline-block">{subtitle}</span>}
                    </div>
                </div>
                {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </button>
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        id={`section-${id}`}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-emerald-50 pt-4 bg-white/50">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
