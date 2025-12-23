import { motion } from 'framer-motion'
import { Stethoscope, HeartPulse, Info, BarChart3 } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'

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
            {/* Main Diagnosis Card - Collapsible */}
            <motion.div variants={variants}>
                <CollapsibleSection
                    title="TCM Diagnosis (辨证)"
                    icon={Stethoscope}
                    accentColor="emerald"
                    highlight={true}
                >
                    <div className="w-full">
                        <div className="text-xl md:text-2xl font-semibold text-emerald-900 mb-3">
                            {diagnosisText}
                        </div>
                        {typeof data.diagnosis === 'object' && data.diagnosis.secondary_patterns && data.diagnosis.secondary_patterns.length > 0 && (
                            <div className="mb-3">
                                <p className="text-sm text-emerald-700 font-medium mb-1">Secondary Patterns:</p>
                                <p className="text-emerald-800 text-sm">{data.diagnosis.secondary_patterns.join(', ')}</p>
                            </div>
                        )}
                        {typeof data.diagnosis === 'object' && data.diagnosis.affected_organs && data.diagnosis.affected_organs.length > 0 && (
                            <div className="mb-3">
                                <p className="text-sm text-emerald-700 font-medium mb-1">Affected Organs:</p>
                                <p className="text-emerald-800 text-sm">{data.diagnosis.affected_organs.join(', ')}</p>
                            </div>
                        )}
                        <div className="flex items-center gap-2 text-emerald-700 font-medium text-sm md:text-base mt-4 pt-4 border-t border-emerald-100/50">
                            <HeartPulse className="h-4 w-4" />
                            Constitution: {constitutionText}
                        </div>
                        {typeof data.constitution === 'object' && data.constitution.description && (
                            <p className="text-sm text-emerald-600 mt-2 leading-relaxed">{data.constitution.description}</p>
                        )}
                    </div>
                </CollapsibleSection>
            </motion.div>

            {/* Detailed Analysis - Collapsible */}
            <motion.div variants={variants}>
                <CollapsibleSection
                    title="Detailed Analysis"
                    icon={BarChart3}
                    accentColor="blue"
                >
                    <div className="w-[90%] max-w-[680px] mx-auto">
                        <p className="text-base md:text-lg text-stone-800 leading-[1.7] md:leading-relaxed whitespace-pre-wrap">
                            {analysisText}
                        </p>
                        {typeof data.analysis === 'object' && data.analysis.key_findings && (
                            <div className="mt-6 pt-6 border-t border-stone-200/50 space-y-3">
                                <p className="font-semibold text-stone-800 text-base md:text-lg">Key Findings:</p>
                                {data.analysis.key_findings.from_inquiry && (
                                    <p className="text-base text-stone-700 leading-relaxed"><span className="font-medium text-stone-800">From Inquiry:</span> {data.analysis.key_findings.from_inquiry}</p>
                                )}
                                {data.analysis.key_findings.from_visual && (
                                    <p className="text-base text-stone-700 leading-relaxed"><span className="font-medium text-stone-800">From Visual:</span> {data.analysis.key_findings.from_visual}</p>
                                )}
                                {data.analysis.key_findings.from_pulse && (
                                    <p className="text-base text-stone-700 leading-relaxed"><span className="font-medium text-stone-800">From Pulse:</span> {data.analysis.key_findings.from_pulse}</p>
                                )}
                            </div>
                        )}
                    </div>
                </CollapsibleSection>
            </motion.div>
        </>
    )
}
