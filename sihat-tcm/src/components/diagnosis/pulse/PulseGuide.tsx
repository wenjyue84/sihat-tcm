'use client'

import { Info } from 'lucide-react'

interface PulseGuideStep {
    title: string;
    description: string;
    tip: string;
}

interface PulseGuideProps {
    steps: PulseGuideStep[];
    guideStep: number;
    setGuideStep: (step: number) => void;
}

export function PulseGuide({ steps, guideStep, setGuideStep }: PulseGuideProps) {
    if (!steps || steps.length === 0) {
        return null
    }

    return (
        <div className="space-y-4">
            {/* Steps Image */}
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-gradient-to-br from-slate-50 to-teal-50">
                <img
                    src="/pulse-check-steps.png"
                    alt="How to Check Your Pulse"
                    className="w-full h-auto object-contain"
                />
            </div>

            {/* Step Cards - Responsive Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {steps.map((step, index) => (
                    <div
                        key={index}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${guideStep === index
                            ? 'border-emerald-400 bg-emerald-50 shadow-md'
                            : 'border-slate-200 bg-white hover:border-emerald-200'
                            }`}
                        onClick={() => setGuideStep(index)}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${guideStep === index
                                ? 'bg-emerald-500 text-white'
                                : 'bg-slate-200 text-slate-600'
                                }`}>
                                {index + 1}
                            </div>
                            <h3 className="font-medium text-sm">{step.title}</h3>
                        </div>
                        <p className="text-xs text-slate-600 mb-2">{step.description}</p>
                        <div className="flex items-start gap-1 text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">
                            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                            <span>{step.tip}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
