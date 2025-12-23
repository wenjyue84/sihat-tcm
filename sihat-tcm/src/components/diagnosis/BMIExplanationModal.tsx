import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useLanguage } from "@/contexts/LanguageContext"
import { motion } from "framer-motion"
import { Info, Scale, Ruler, Calculator } from "lucide-react"

interface BMIExplanationModalProps {
    isOpen: boolean
    onClose: () => void
    bmi: number
    height: number // in cm
    weight: number // in kg
}

export function BMIExplanationModal({ isOpen, onClose, bmi, height, weight }: BMIExplanationModalProps) {
    const { t } = useLanguage()

    // BMI Categories based on WHO standards
    const getBMICategory = (value: number) => {
        if (value < 18.5) return { label: t.basicInfo.bmiExplanation.underweight, color: "text-blue-500", bg: "bg-blue-500", range: "< 18.5" }
        if (value < 25) return { label: t.basicInfo.bmiExplanation.normal, color: "text-emerald-500", bg: "bg-emerald-500", range: "18.5 - 24.9" }
        if (value < 30) return { label: t.basicInfo.bmiExplanation.overweight, color: "text-orange-500", bg: "bg-orange-500", range: "25 - 29.9" }
        return { label: t.basicInfo.bmiExplanation.obese, color: "text-red-500", bg: "bg-red-500", range: "≥ 30" }
    }

    const category = getBMICategory(bmi)

    // Calculate position for the indicator on the scale (clamped between 0 and 100)
    // Scale ranges from 15 to 35 for display purposes
    const minScale = 15
    const maxScale = 35
    const percentage = Math.min(Math.max(((bmi - minScale) / (maxScale - minScale)) * 100, 0), 100)

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm border-stone-100 shadow-2xl">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <Calculator className="w-5 h-5 text-emerald-600" />
                        </div>
                        <DialogTitle className="text-xl font-bold text-stone-800">
                            {t.basicInfo.bmiExplanation.title}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-stone-500">
                        {t.basicInfo.bmiExplanation.description}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Current BMI Display */}
                    <div className="flex flex-col items-center justify-center p-6 bg-stone-50 rounded-2xl border border-stone-100">
                        <span className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-1">
                            {t.basicInfo.bmiExplanation.yourBmi}
                        </span>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-5xl font-bold ${category.color}`}>
                                {bmi.toFixed(1)}
                            </span>
                        </div>
                        <span className={`mt-2 px-3 py-1 rounded-full text-sm font-semibold ${category.color} bg-white shadow-sm border border-stone-100`}>
                            {category.label}
                        </span>
                    </div>

                    {/* Visual Scale */}
                    <div className="space-y-2">
                        <div className="h-4 bg-stone-100 rounded-full overflow-hidden relative flex">
                            {/* Underweight Segment */}
                            <div className="h-full bg-blue-200 flex-1 border-r border-white/50" title="< 18.5" />
                            {/* Normal Segment */}
                            <div className="h-full bg-emerald-300 flex-[1.5] border-r border-white/50" title="18.5 - 24.9" />
                            {/* Overweight Segment */}
                            <div className="h-full bg-orange-300 flex-[1] border-r border-white/50" title="25 - 29.9" />
                            {/* Obese Segment */}
                            <div className="h-full bg-red-300 flex-[1]" title="≥ 30" />

                            {/* Indicator */}
                            <motion.div
                                className="absolute top-0 bottom-0 w-1 bg-stone-800 shadow-[0_0_10px_rgba(0,0,0,0.3)] z-10"
                                initial={{ left: '0%' }}
                                animate={{ left: `${percentage}%` }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        </div>
                        <div className="flex justify-between text-xs text-stone-400 font-medium px-1">
                            <span>15</span>
                            <span>18.5</span>
                            <span>25</span>
                            <span>30</span>
                            <span>35+</span>
                        </div>
                    </div>

                    {/* Formula Explanation */}
                    <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100/50">
                        <h4 className="text-sm font-semibold text-stone-700 mb-3 flex items-center gap-2">
                            <Info className="w-4 h-4 text-emerald-500" />
                            {t.basicInfo.bmiExplanation.howItIsCalculated}
                        </h4>
                        <div className="flex items-center justify-center gap-4 text-sm text-stone-600 font-mono bg-white/50 p-3 rounded-lg">
                            <div className="text-center">
                                <div className="border-b border-stone-300 mb-1 pb-1">{weight} kg</div>
                                <div>({height / 100} m)²</div>
                            </div>
                            <div className="text-xl font-bold text-emerald-600">=</div>
                            <div className="text-xl font-bold text-stone-800">{bmi.toFixed(1)}</div>
                        </div>
                    </div>

                    {/* Categories Legend */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 text-blue-700">
                            <div className="w-3 h-3 rounded-full bg-blue-500" />
                            <div className="flex flex-col">
                                <span className="font-semibold">{t.basicInfo.bmiExplanation.underweight}</span>
                                <span className="opacity-70">&lt; 18.5</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50 text-emerald-700">
                            <div className="w-3 h-3 rounded-full bg-emerald-500" />
                            <div className="flex flex-col">
                                <span className="font-semibold">{t.basicInfo.bmiExplanation.normal}</span>
                                <span className="opacity-70">18.5 - 24.9</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-50 text-orange-700">
                            <div className="w-3 h-3 rounded-full bg-orange-500" />
                            <div className="flex flex-col">
                                <span className="font-semibold">{t.basicInfo.bmiExplanation.overweight}</span>
                                <span className="opacity-70">25 - 29.9</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-red-50 text-red-700">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <div className="flex flex-col">
                                <span className="font-semibold">{t.basicInfo.bmiExplanation.obese}</span>
                                <span className="opacity-70">&ge; 30</span>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
