import { Stethoscope } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface MobileReportSummaryProps {
    t: any
    diagnosisText: string
    constitutionText: string
    patientInfo: any
    foodRecsCount: number
    lifestyleTipsCount: number
    onViewFull: () => void
}

export function MobileReportSummary({
    t,
    diagnosisText,
    constitutionText,
    patientInfo,
    foodRecsCount,
    lifestyleTipsCount,
    onViewFull
}: MobileReportSummaryProps) {
    return (
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-4 border-b border-emerald-100 overflow-y-auto max-h-[35vh]">
            <div className="max-w-lg mx-auto space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                            <Stethoscope className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-emerald-800 text-sm">{t.report?.summary || 'TCM Report Summary'}</h3>
                            <p className="text-xs text-emerald-600">{t.report?.chatReference || 'Reference while chatting'}</p>
                        </div>
                    </div>
                    <button
                        onClick={onViewFull}
                        className="text-xs px-3 py-1.5 bg-white/80 text-emerald-700 rounded-full border border-emerald-200 hover:bg-white transition-colors"
                    >
                        {t.report?.viewFullReport || 'View Full Report'}
                    </button>
                </div>

                {/* Key Info Cards */}
                <div className="grid grid-cols-2 gap-2">
                    {/* Diagnosis */}
                    <div className="bg-white/60 rounded-lg p-3 border border-emerald-100">
                        <p className="text-xs text-emerald-600 font-medium mb-1">{t.report?.diagnosis || 'Diagnosis'}</p>
                        <p className="text-sm font-semibold text-emerald-800 line-clamp-2">{diagnosisText}</p>
                    </div>

                    {/* Constitution */}
                    <div className="bg-white/60 rounded-lg p-3 border border-emerald-100">
                        <p className="text-xs text-emerald-600 font-medium mb-1">{t.report?.constitution || 'Constitution'}</p>
                        <p className="text-sm font-semibold text-emerald-800 line-clamp-2">{constitutionText}</p>
                    </div>
                </div>

                {/* Quick Facts */}
                <div className="flex flex-wrap gap-1.5">
                    {patientInfo?.name && (
                        <span className="text-xs px-2 py-1 bg-white/60 rounded-full text-stone-600 border border-stone-200">
                            👤 {patientInfo.name}
                        </span>
                    )}
                    {patientInfo?.age && (
                        <span className="text-xs px-2 py-1 bg-white/60 rounded-full text-stone-600 border border-stone-200">
                            📅 {patientInfo.age} {t.report?.yearsShort || 'yrs'}
                        </span>
                    )}
                    {foodRecsCount > 0 && (
                        <span className="text-xs px-2 py-1 bg-white/60 rounded-full text-stone-600 border border-stone-200">
                            🥗 {foodRecsCount} {t.report?.foodsCount || 'foods'}
                        </span>
                    )}
                    {lifestyleTipsCount > 0 && (
                        <span className="text-xs px-2 py-1 bg-white/60 rounded-full text-stone-600 border border-stone-200">
                            🌿 {lifestyleTipsCount} {t.report?.lifestyleTipsCount || 'lifestyle tips'}
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
