"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollapsibleSectionProps {
    title: string
    icon?: LucideIcon | React.ComponentType<{ className?: string }>
    accentColor?: string
    defaultOpen?: boolean
    children: React.ReactNode
    className?: string
    highlight?: boolean
    borderLeft?: boolean
}

export function CollapsibleSection({
    title,
    icon: Icon,
    accentColor = 'emerald',
    defaultOpen = false,
    children,
    className,
    highlight = false,
    borderLeft = true
}: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen)

    const colorClasses = {
        emerald: 'border-emerald-500 bg-emerald-50/50',
        blue: 'border-blue-500 bg-blue-50/50',
        orange: 'border-orange-500 bg-orange-50/50',
        indigo: 'border-indigo-500 bg-indigo-50/50',
        purple: 'border-purple-500 bg-purple-50/50',
        rose: 'border-rose-500 bg-rose-50/50',
        teal: 'border-teal-500 bg-teal-50/50',
        amber: 'border-amber-500 bg-amber-50/50'
    }

    const iconColorClasses = {
        emerald: 'text-emerald-600 bg-emerald-100/50',
        blue: 'text-blue-600 bg-blue-100/50',
        orange: 'text-orange-600 bg-orange-100/50',
        indigo: 'text-indigo-600 bg-indigo-100/50',
        purple: 'text-purple-600 bg-purple-100/50',
        rose: 'text-rose-600 bg-rose-100/50',
        teal: 'text-teal-600 bg-teal-100/50',
        amber: 'text-amber-600 bg-amber-100/50'
    }

    const accentClass = colorClasses[accentColor as keyof typeof colorClasses] || colorClasses.emerald
    const iconClass = iconColorClasses[accentColor as keyof typeof iconColorClasses] || iconColorClasses.emerald

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
                'rounded-xl border bg-white/50 backdrop-blur-sm shadow-sm overflow-hidden',
                highlight && 'ring-2 ring-emerald-200/50',
                className
            )}
        >
            <button
                onClick={() => setIsOpen(!isOpen)}
                type="button"
                className={cn(
                    'w-full flex items-center justify-between p-4 md:p-5 transition-colors hover:bg-stone-50/50 active:bg-stone-100/50 touch-manipulation',
                    borderLeft && `border-l-4 ${accentClass}`
                )}
                aria-expanded={isOpen}
                aria-controls={`collapsible-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
            >
                <div className="flex items-center gap-3">
                    {Icon && (
                        <div className={cn('p-2 rounded-lg shrink-0', iconClass)}>
                            <Icon className="w-5 h-5" />
                        </div>
                    )}
                    <h3 className="text-base md:text-lg font-semibold text-stone-800 text-left">
                        {title}
                    </h3>
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown className="w-5 h-5 text-stone-500 shrink-0" />
                </motion.div>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                        id={`collapsible-content-${title.replace(/\s+/g, '-').toLowerCase()}`}
                    >
                        <div className="p-3 md:p-5 pt-0">
                            <div className="pt-4 border-t border-stone-100">
                                {children}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}

