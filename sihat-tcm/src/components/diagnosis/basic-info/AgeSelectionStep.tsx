import { motion } from 'framer-motion'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { BasicInfoData } from './types'
import { MobileNumericInput } from './MobileNumericInput'
import { useLanguage } from '@/contexts/LanguageContext'

interface AgeSelectionStepProps {
    formData: BasicInfoData
    setFormData: (data: BasicInfoData) => void
}

export function AgeSelectionStep({ formData, setFormData }: AgeSelectionStepProps) {
    const { t } = useLanguage()

    // Age quick-select values
    const ageRanges = [
        { label: t.basicInfo.ageRanges?.under18 || 'Under 18', value: 15, min: 0, max: 17 },
        { label: t.basicInfo.ageRanges?.['18-25'] || '18-25', value: 22, min: 18, max: 25 },
        { label: t.basicInfo.ageRanges?.['26-35'] || '26-35', value: 30, min: 26, max: 35 },
        { label: t.basicInfo.ageRanges?.['36-45'] || '36-45', value: 40, min: 36, max: 45 },
        { label: t.basicInfo.ageRanges?.['46-55'] || '46-55', value: 50, min: 46, max: 55 },
        { label: t.basicInfo.ageRanges?.['56-65'] || '56-65', value: 60, min: 56, max: 65 },
        { label: t.basicInfo.ageRanges?.over65 || 'Over 65', value: 70, min: 66, max: 120 },
    ]

    return (
        <div className="space-y-6">
            {/* Age Input with Quick Select */}
            <div className="space-y-4">
                <Label htmlFor="age" className="text-muted-foreground font-medium">{t.basicInfo.age}</Label>

                {/* Quick Age Range Pills */}
                <div className="flex flex-wrap gap-2 justify-center">
                    {ageRanges.map((range) => (
                        <motion.button
                            key={range.label}
                            type="button"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setFormData({ ...formData, age: String(range.value) })}
                            className={`
                                px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 min-h-11
                                ${parseInt(formData.age) >= range.min && parseInt(formData.age) <= range.max
                                    ? 'bg-primary/20 text-primary border-2 border-primary/50 shadow-sm'
                                    : 'bg-card text-muted-foreground border border-border hover:border-primary/50 hover:bg-accent'
                                }
                            `}
                        >
                            {range.label}
                        </motion.button>
                    ))}
                </div>

                {/* Or enter exact age */}
                <div className="text-center text-muted-foreground/50 text-sm my-4">— {t.common.or} —</div>

                {/* Precise Age Input */}
                <MobileNumericInput
                    id="age"
                    value={formData.age}
                    onChange={(val) => setFormData({ ...formData, age: val })}
                    placeholder={t.basicInfo.agePlaceholder}
                    icon={<CalendarIcon className="h-4 w-4" />}
                    min={1}
                    max={120}
                    step={1}
                    quickValues={[18, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70]}
                />
            </div>
        </div>
    )
}
