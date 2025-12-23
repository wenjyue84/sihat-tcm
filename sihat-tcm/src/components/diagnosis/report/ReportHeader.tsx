import { motion } from 'framer-motion'
import { Clock, Check } from 'lucide-react'
import { ShowPromptButton } from '../ShowPromptButton'

interface ReportHeaderProps {
    doctorInfo: {
        name: string
        icon: React.ReactNode
        bgColor: string
        borderColor: string
        textColor: string
    }
    hasSaved: boolean
    language: string
    timestamp?: string
    includeTimestamp: boolean
}

export function ReportHeader({ doctorInfo, hasSaved, language, timestamp, includeTimestamp }: ReportHeaderProps) {
    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    }

    return (
        <motion.div variants={item} className="text-center space-y-1 md:space-y-2">
            <div className="flex items-center justify-center gap-2 mb-2 flex-wrap">
                <span className={`px-3 py-1 rounded-full text-sm font-medium border ${doctorInfo.bgColor} ${doctorInfo.borderColor} ${doctorInfo.textColor}`}>
                    {doctorInfo.icon} Analyzed by {doctorInfo.name}
                </span>
                <ShowPromptButton promptType="final" />
                {hasSaved && (
                    <span className="px-3 py-1 rounded-full text-sm font-medium border bg-green-100 border-green-200 text-green-800 flex items-center gap-1">
                        <Check className="w-3 h-3" /> {language === 'zh' ? '已保存' : language === 'ms' ? 'Disimpan' : 'Saved to Records'}
                    </span>
                )}
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-emerald-900">Comprehensive TCM Report</h2>
            <p className="text-stone-600 text-sm md:text-base">Based on Four Pillars Diagnosis (四诊合参)</p>

            {includeTimestamp && timestamp && (
                <p suppressHydrationWarning className="text-xs text-stone-500 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" />
                    Generated: {new Date(timestamp).toLocaleString()}
                </p>
            )}
        </motion.div>
    )
}
