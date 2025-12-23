import { useState } from 'react'
import { motion } from 'framer-motion'
import { Ruler, Scale, Info } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { BasicInfoData } from './types'
import { MobileNumericInput } from './MobileNumericInput'
import { BMIExplanationModal } from '../BMIExplanationModal'
import { useLanguage } from '@/contexts/LanguageContext'

interface BodyMeasurementsStepProps {
    formData: BasicInfoData
    setFormData: (data: BasicInfoData) => void
}

export function BodyMeasurementsStep({ formData, setFormData }: BodyMeasurementsStepProps) {
    const { t } = useLanguage()
    const [showBMIModal, setShowBMIModal] = useState(false)

    return (
        <div className="space-y-6">
            {/* Height */}
            <div className="space-y-2">
                <Label htmlFor="height" className="text-muted-foreground font-medium flex items-center gap-2">
                    <Ruler className="w-4 h-4 text-primary" />
                    {t.basicInfo.height}
                </Label>
                <MobileNumericInput
                    id="height"
                    value={formData.height}
                    onChange={(val) => setFormData({ ...formData, height: val })}
                    placeholder={t.basicInfo.heightPlaceholder}
                    icon={<Ruler className="h-4 w-4" />}
                    min={100}
                    max={220}
                    step={1}
                    unit="cm"
                    quickValues={[150, 155, 160, 165, 170, 175, 180, 185, 190]}
                    required
                />
            </div>

            {/* Weight */}
            <div className="space-y-2">
                <Label htmlFor="weight" className="text-muted-foreground font-medium flex items-center gap-2">
                    <Scale className="w-4 h-4 text-primary" />
                    {t.basicInfo.weight}
                </Label>
                <MobileNumericInput
                    id="weight"
                    value={formData.weight}
                    onChange={(val) => setFormData({ ...formData, weight: val })}
                    placeholder={t.basicInfo.weightPlaceholder}
                    icon={<Scale className="h-4 w-4" />}
                    min={20}
                    max={200}
                    step={1}
                    unit="kg"
                    quickValues={[45, 50, 55, 60, 65, 70, 75, 80, 85, 90]}
                    required
                />
            </div>

            {/* BMI Preview */}
            {formData.height && formData.weight && (
                <>
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 bg-muted/30 rounded-xl border border-border text-center cursor-pointer hover:bg-accent transition-colors relative group"
                        onClick={() => setShowBMIModal(true)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <span className="text-muted-foreground text-sm">BMI: </span>
                        <span className="text-primary font-bold text-lg">
                            {(parseFloat(formData.weight) / Math.pow(parseFloat(formData.height) / 100, 2)).toFixed(1)}
                        </span>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Info className="w-4 h-4 text-primary/70" />
                        </div>
                        <div className="text-xs text-primary/70 mt-1 font-medium">
                            {t.common.view || 'View'} details
                        </div>
                    </motion.div>

                    <BMIExplanationModal
                        isOpen={showBMIModal}
                        onClose={() => setShowBMIModal(false)}
                        bmi={parseFloat(formData.weight) / Math.pow(parseFloat(formData.height) / 100, 2)}
                        height={parseFloat(formData.height)}
                        weight={parseFloat(formData.weight)}
                    />
                </>
            )}
        </div>
    )
}
