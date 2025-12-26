import { motion } from 'framer-motion'
import { User, Check } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BasicInfoData } from './types'
import { useLanguage } from '@/stores/useAppStore'

interface PersonalDetailsStepProps {
    formData: BasicInfoData
    setFormData: (data: BasicInfoData) => void
}

export function PersonalDetailsStep({ formData, setFormData }: PersonalDetailsStepProps) {
    const { t } = useLanguage()

    return (
        <div className="space-y-6">
            {/* Name Input */}
            <div className="space-y-2">
                <Label htmlFor="name" className="text-muted-foreground font-medium">{t.basicInfo.fullName}</Label>
                <div className="relative">
                    <User className="absolute left-3 top-3.5 h-4 w-4 text-primary" />
                    <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={t.basicInfo.fullNamePlaceholder}
                        className="pl-10 h-12 border-border focus-visible:ring-ring focus-visible:border-primary bg-muted/20 text-foreground"
                        suppressHydrationWarning
                    />
                </div>
            </div>

            {/* Gender Selection - Icon Buttons */}
            <div className="space-y-3" role="radiogroup" aria-labelledby="gender-label">
                <Label id="gender-label" className="text-muted-foreground font-medium">{t.basicInfo.gender}</Label>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { value: 'male', label: t.basicInfo.male, icon: '♂️', color: 'from-blue-500 to-blue-600' },
                        { value: 'female', label: t.basicInfo.female, icon: '♀️', color: 'from-pink-500 to-pink-600' },
                        { value: 'other', label: t.basicInfo.other, icon: '⚧️', color: 'from-purple-500 to-purple-600' }
                    ].map(gender => (
                        <motion.button
                            key={gender.value}
                            type="button"
                            role="radio"
                            aria-checked={formData.gender === gender.value}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setFormData({ ...formData, gender: gender.value })}
                            className={`
                                relative p-4 rounded-xl border-2 transition-all duration-200 min-h-[100px] flex flex-col items-center justify-center gap-2
                                focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2
                                ${formData.gender === gender.value
                                    ? 'border-primary bg-primary/10 shadow-md'
                                    : 'border-border bg-card hover:border-primary/50 hover:bg-accent'
                                }
                            `}
                        >
                            <span className="text-3xl">{gender.icon}</span>
                            <span className={`text-sm font-medium ${formData.gender === gender.value ? 'text-primary' : 'text-muted-foreground'}`}>
                                {gender.label}
                            </span>
                            {formData.gender === gender.value && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute top-2 right-2 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center"
                                >
                                    <Check className="w-3 h-3 text-white" />
                                </motion.div>
                            )}
                        </motion.button>
                    ))}
                </div>
            </div>
        </div>
    )
}
