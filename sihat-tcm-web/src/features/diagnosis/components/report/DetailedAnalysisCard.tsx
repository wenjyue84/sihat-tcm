import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { useLanguage } from "@/contexts/LanguageContext";

interface DetailedAnalysisCardProps {
  data: any;
  analysisText: string;
}

export function DetailedAnalysisCard({ data, analysisText }: DetailedAnalysisCardProps) {
  const { t } = useLanguage();
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div variants={item}>
      <GlassCard variant="default" intensity="medium" className="bg-white/50 border-stone-200/50">
        <div className="flex items-center gap-2 text-stone-800 font-semibold mb-4 border-b border-stone-200/30 pb-2">
          <Info className="h-5 w-5 text-stone-600" />
          {t.report.detailedAnalysis}
        </div>
        <div>
          <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">{analysisText}</p>
          {typeof data.analysis === "object" && data.analysis.key_findings && (
            <div className="mt-4 pt-4 border-t border-stone-100/50 space-y-2">
              <p className="font-medium text-stone-800">{t.report.keyFindings}</p>
              {data.analysis.key_findings.from_inquiry && (
                <p className="text-sm text-stone-600">
                  <span className="font-medium">{t.report.fromInquiry}:</span>{" "}
                  {data.analysis.key_findings.from_inquiry}
                </p>
              )}
              {data.analysis.key_findings.from_visual && (
                <p className="text-sm text-stone-600">
                  <span className="font-medium">{t.report.fromVisual}:</span>{" "}
                  {data.analysis.key_findings.from_visual}
                </p>
              )}
              {data.analysis.key_findings.from_pulse && (
                <p className="text-sm text-stone-600">
                  <span className="font-medium">{t.report.fromPulse}:</span>{" "}
                  {data.analysis.key_findings.from_pulse}
                </p>
              )}
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}
