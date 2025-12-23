'use client'

import { CheckCircle2, AlertCircle, Stethoscope } from 'lucide-react'
import { tcmPulseQualities, PulseQuality } from './types'

interface PulseQualitySelectorProps {
    selectedPulseQualities: string[];
    togglePulseQuality: (id: string) => void;
    conflictWarning: string | null;
    t: any;
}

export function PulseQualitySelector({
    selectedPulseQualities,
    togglePulseQuality,
    conflictWarning,
    t
}: PulseQualitySelectorProps) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-5">
                {/* Professional TCM Practitioner Notice */}
                <div className="flex items-start gap-3 mb-4 p-3 bg-amber-100/70 rounded-lg border border-amber-300">
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-amber-800">
                            ⚕️ 专业中医师诊断 | TCM Practitioner Required
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                            以下脉象判断需由专业中医师通过切诊确认和输入。普通用户可跳过此部分。
                        </p>
                        <p className="text-xs text-amber-600 mt-0.5">
                            The pulse qualities below require assessment by a qualified TCM practitioner. General users may skip this section.
                        </p>
                    </div>
                </div>

                {/* Section Header */}
                <div className="flex items-center gap-2 mb-4">
                    <Stethoscope className="w-5 h-5 text-amber-600" />
                    <h3 className="font-semibold text-amber-800">{t.pulse?.tcmPulseQualities || 'TCM Pulse Qualities'}</h3>
                    <span className="text-xs text-amber-600 bg-amber-200 px-2 py-0.5 rounded-full">{t.pulse?.optional || 'Optional'}</span>
                </div>

                {/* Conflict Warning Alert */}
                {conflictWarning && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-2">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700 font-medium">{conflictWarning}</p>
                    </div>
                )}

                {/* Pulse Quality Grid - Responsive */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {tcmPulseQualities.map((quality) => (
                        <button
                            key={quality.id}
                            onClick={() => togglePulseQuality(quality.id)}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${selectedPulseQualities.includes(quality.id)
                                ? 'border-amber-500 bg-amber-100 shadow-md'
                                : 'border-amber-200 bg-white hover:border-amber-300 hover:bg-amber-50'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className="font-bold text-amber-800">{quality.nameZh}</span>
                                {selectedPulseQualities.includes(quality.id) && (
                                    <CheckCircle2 className="w-4 h-4 text-amber-600" />
                                )}
                            </div>
                            <p className="text-xs text-amber-700">{quality.nameEn}</p>
                            <p className="text-xs text-amber-600 mt-1 opacity-75">{quality.description}</p>
                        </button>
                    ))}
                </div>

                {/* Selected Qualities Display */}
                {selectedPulseQualities.length > 0 && (
                    <div className="mt-4 p-3 bg-white rounded-lg border border-amber-200">
                        <p className="text-sm text-amber-800">
                            <span className="font-semibold">已选脉象 Selected: </span>
                            {selectedPulseQualities.map(id => {
                                const quality = tcmPulseQualities.find(q => q.id === id)
                                return quality?.nameZh
                            }).join('、')}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
