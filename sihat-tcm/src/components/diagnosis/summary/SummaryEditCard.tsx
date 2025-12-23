'use client'

import { Edit2 } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { motion } from 'framer-motion'

interface SummaryEditCardProps {
    title: string
    value: string
    onChange: (value: string) => void
    imageSrc?: string
}

/**
 * SummaryEditCard - Card for reviewing and editing diagnosis summaries
 * 
 * Replaces repetitive card markup in renderObservationsStep and renderInquiryStep
 */
export function SummaryEditCard({
    title,
    value,
    onChange,
    imageSrc
}: SummaryEditCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
        >
            <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="flex-1 space-y-3 w-full">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 shrink-0 rounded-full bg-emerald-50 flex items-center justify-center">
                            <Edit2 className="w-4 h-4 text-emerald-600" />
                        </div>
                        <h3 className="font-semibold text-slate-800">{title}</h3>
                    </div>
                    <Textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="min-h-[120px] bg-slate-50/50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 resize-none transition-all"
                    />
                </div>

                {imageSrc && (
                    <div className="flex-shrink-0 mt-4 sm:mt-11">
                        <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-slate-200 shadow-sm group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={imageSrc}
                                alt={title}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    )
}
