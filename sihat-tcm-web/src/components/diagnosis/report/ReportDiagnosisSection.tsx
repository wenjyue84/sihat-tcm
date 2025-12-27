import { motion } from "framer-motion";
import { Stethoscope, HeartPulse, BarChart3 } from "lucide-react";
import { CollapsibleSection } from "@/components/ui/CollapsibleSection";
import { useLanguage } from "@/contexts/LanguageContext";

interface ReportDiagnosisSectionProps {
  data: any;
  diagnosisText: string;
  constitutionText: string;
  analysisText: string;
  variants: any;
}

export function ReportDiagnosisSection({
  data,
  diagnosisText,
  constitutionText,
  analysisText,
  variants,
}: ReportDiagnosisSectionProps) {
  const { t } = useLanguage();

  return (
    <>
      {/* Main Diagnosis Card - Collapsible */}
      <motion.div variants={variants}>
        <CollapsibleSection
          title={`${t.report.tcmDiagnosis} (辨证)`}
          icon={Stethoscope}
          accentColor="emerald"
          highlight={true}
        >
          <div className="w-full">
            <div className="text-xl md:text-2xl font-semibold text-emerald-900 mb-3">
              {diagnosisText}
            </div>
            {typeof data.diagnosis === "object" &&
              data.diagnosis !== null &&
              "secondary_patterns" in data.diagnosis &&
              Array.isArray((data.diagnosis as any).secondary_patterns) &&
              (data.diagnosis as any).secondary_patterns.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm text-emerald-700 font-medium mb-1">{t.report.secondaryPatterns}</p>
                  <p className="text-emerald-800 text-sm">
                    {(data.diagnosis as any).secondary_patterns.join(", ")}
                  </p>
                </div>
              )}
            {typeof data.diagnosis === "object" &&
              data.diagnosis !== null &&
              "affected_organs" in data.diagnosis &&
              Array.isArray((data.diagnosis as any).affected_organs) &&
              (data.diagnosis as any).affected_organs.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm text-emerald-700 font-medium mb-1">{t.report.affectedOrgans}</p>
                  <p className="text-emerald-800 text-sm">
                    {(data.diagnosis as any).affected_organs.join(", ")}
                  </p>
                </div>
              )}
            <div className="flex items-center gap-2 text-emerald-700 font-medium text-sm md:text-base mt-4 pt-4 border-t border-emerald-100/50">
              <HeartPulse className="h-4 w-4" />
              {t.report.constitution}: {constitutionText}
            </div>
            {typeof data.constitution === "object" && data.constitution.description && (
              <p className="text-sm text-emerald-600 mt-2 leading-relaxed">
                {data.constitution.description}
              </p>
            )}
          </div>
        </CollapsibleSection>
      </motion.div>

      {/* Detailed Analysis - Collapsible */}
      <motion.div variants={variants}>
        <CollapsibleSection title={t.report.detailedAnalysis} icon={BarChart3} accentColor="blue">
          <div className="w-full md:w-[90%] md:max-w-[680px] md:mx-auto">
            <p className="text-base md:text-lg text-stone-800 leading-[1.7] md:leading-relaxed whitespace-pre-wrap">
              {analysisText}
            </p>
            {typeof data.analysis === "object" && data.analysis.key_findings && (
              <div className="mt-6 pt-6 border-t border-stone-200/50 space-y-3">
                <p className="font-semibold text-stone-800 text-base md:text-lg">{t.report.keyFindings}</p>
                {data.analysis.key_findings.from_inquiry && (
                  <p className="text-base text-stone-700 leading-relaxed">
                    <span className="font-medium text-stone-800">{t.report.fromInquiry}:</span>{" "}
                    {data.analysis.key_findings.from_inquiry}
                  </p>
                )}
                {data.analysis.key_findings.from_visual && (
                  <p className="text-base text-stone-700 leading-relaxed">
                    <span className="font-medium text-stone-800">{t.report.fromVisual}:</span>{" "}
                    {data.analysis.key_findings.from_visual}
                  </p>
                )}
                {data.analysis.key_findings.from_pulse && (
                  <p className="text-base text-stone-700 leading-relaxed">
                    <span className="font-medium text-stone-800">{t.report.fromPulse}:</span>{" "}
                    {data.analysis.key_findings.from_pulse}
                  </p>
                )}
              </div>
            )}
          </div>
        </CollapsibleSection>
      </motion.div>
    </>
  );
}
