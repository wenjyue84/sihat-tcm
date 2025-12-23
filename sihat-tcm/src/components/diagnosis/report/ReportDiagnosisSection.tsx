import { motion } from 'framer-motion'
import { Stethoscope, HeartPulse, Info } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'

interface ReportDiagnosisSectionProps {
    data: any
    diagnosisText: string
    constitutionText: string
    analysisText: string
    variants: any
}

export function ReportDiagnosisSection({ data, diagnosisText, constitutionText, analysisText, variants }: ReportDiagnosisSectionProps) {
    return (
        <>
            {/* Main Diagnosis Card */}
            <motion.div variants={variants}>
                <GlassCard variant="elevated" intensity="medium" className="border-emerald-100/50 bg-gradient-to-br from-emerald-50/50 to-teal-50/50">
                    <div className="flex items-center gap-2 text-emerald-900 text-base md:text-lg font-semibold mb-4 border-b border-emerald-200/30 pb-2">
                        <Stethoscope className="h-5 w-5" />
                        TCM Diagnosis (辨证)
                    </div>
                    <div>
                        <div className="text-xl md:text-2xl font-semibold text-emerald-900 mb-2">
                            {diagnosisText}
                        </div>
                        {typeof data.diagnosis === 'object' && data.diagnosis.secondary_patterns && data.diagnosis.secondary_patterns.length > 0 && (
                            <div className="mb-2">
                                <p className="text-sm text-emerald-700 font-medium">Secondary Patterns:</p>
                                <p className="text-emerald-800">{data.diagnosis.secondary_patterns.join(', ')}</p>
                            </div>
                        )}
                        {typeof data.diagnosis === 'object' && data.diagnosis.affected_organs && data.diagnosis.affected_organs.length > 0 && (
                            <div className="mb-2">
                                <p className="text-sm text-emerald-700 font-medium">Affected Organs:</p>
                                <p className="text-emerald-800">{data.diagnosis.affected_organs.join(', ')}</p>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-emerald-700 font-medium text-sm md:text-base mt-3 pt-3 border-t border-emerald-100/50">
                            <HeartPulse className="h-4 w-4" />
                            Constitution: {constitutionText}
                        </div>
                        {typeof data.constitution === 'object' && data.constitution.description && (
                            <p className="text-sm text-emerald-600 mt-1">{data.constitution.description}</p>
                        )}
                    </div>
                </GlassCard>
            </motion.div>

            {/* Detailed Analysis */}
            <motion.div variants={variants}>
                <GlassCard variant="default" intensity="medium" className="bg-white/50 border-stone-200/50">
                    <div className="flex items-center gap-2 text-stone-800 font-semibold mb-4 border-b border-stone-200/30 pb-2">
                        <Info className="h-5 w-5 text-stone-600" />
                        Detailed Analysis
                    </div>
                    <div>
                        <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">
                            {analysisText}
                        </p>
                        {typeof data.analysis === 'object' && data.analysis.key_findings && (
                            <div className="mt-4 pt-4 border-t border-stone-100/50 space-y-2">
                                <p className="font-medium text-stone-800">Key Findings:</p>
                                {data.analysis.key_findings.from_inquiry && (
                                    <p className="text-sm text-stone-600"><span className="font-medium">From Inquiry:</span> {data.analysis.key_findings.from_inquiry}</p>
                                )}
                                {data.analysis.key_findings.from_visual && (
                                    <p className="text-sm text-stone-600"><span className="font-medium">From Visual:</span> {data.analysis.key_findings.from_visual}</p>
                                )}
                                {data.analysis.key_findings.from_pulse && (
                                    <p className="text-sm text-stone-600"><span className="font-medium">From Pulse:</span> {data.analysis.key_findings.from_pulse}</p>
                                )}
                            </div>
                        )}
                    </div>
                </GlassCard>
            </motion.div>
        </>
    )
}
