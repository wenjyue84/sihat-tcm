import { motion } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'

export function StepProgress({ currentStep, totalSteps }: { currentStep: number; totalSteps: number }) {
    const { t } = useLanguage()

    return (
        <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-stone-600">
                    {t.basicInfo.wizardSteps?.stepProgress?.replace('{current}', String(currentStep)).replace('{total}', String(totalSteps))
                        || `Step ${currentStep} of ${totalSteps}`}
                </span>
                {/* Percentage hidden - only global diagnosis percentage shown */}
            </div>
            <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                />
            </div>
        </div>
    )
}
