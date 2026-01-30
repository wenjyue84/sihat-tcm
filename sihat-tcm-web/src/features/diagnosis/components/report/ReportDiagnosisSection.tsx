import { motion } from "framer-motion";
import { Stethoscope, HeartPulse, BarChart3, Activity, BrainCircuit } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ViewMode } from "./ViewSwitcher";

interface ReportDiagnosisSectionProps {
  data: any;
  diagnosisText: string;
  constitutionText: string;
  analysisText: string;
  variants: any;
  viewMode?: ViewMode;
}

export function ReportDiagnosisSection({
  data,
  diagnosisText,
  constitutionText,
  analysisText,
  variants,
  viewMode = "modern",
}: ReportDiagnosisSectionProps) {
  const { t } = useLanguage();

  if (viewMode === "classic") {
    return (
      <motion.div variants={variants} className="space-y-6 font-serif border-b border-stone-300 pb-8">
        <div>
          <h3 className="text-lg font-bold uppercase mb-3 border-b border-stone-200 inline-block pr-8">{t.mainDiagnosis}</h3>
          <p className="text-xl font-bold text-stone-900">{diagnosisText}</p>
          {/* Secondary Patterns */}
          {typeof data.diagnosis === "object" && data.diagnosis !== null && "secondary_patterns" in data.diagnosis && Array.isArray((data.diagnosis as any).secondary_patterns) && (data.diagnosis as any).secondary_patterns.length > 0 && (
            <p className="text-stone-700 mt-1 italic">
              Secondary: {(data.diagnosis as any).secondary_patterns.join(", ")}
            </p>
          )}
        </div>

        <div>
          <h3 className="text-lg font-bold uppercase mb-2">{t.report.constitution}</h3>
          <p className="text-base text-stone-800">{constitutionText}</p>
        </div>

        <div>
          <h3 className="text-lg font-bold uppercase mb-3">{t.report.detailedAnalysis}</h3>
          <p className="text-sm leading-relaxed whitespace-pre-wrap text-justify">
            {analysisText}
          </p>
        </div>
      </motion.div>
    );
  }

  // Modern View
  return (
    <motion.div variants={variants} className="space-y-6">
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-6 md:p-8 border border-emerald-100/50 shadow-sm relative overflow-hidden">
        {/* Background Deco */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-white rounded-xl shadow-sm">
              <Stethoscope className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-sm font-bold text-emerald-800 uppercase tracking-widest">{t.report.tcmDiagnosis}</span>
          </div>

          <h2 className="text-2xl md:text-4xl font-bold text-emerald-950 mb-4 leading-tight">
            {diagnosisText}
          </h2>

          {/* Tags for Secondary/Organs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {typeof data.diagnosis === "object" && data.diagnosis?.secondary_patterns?.map((p: string, i: number) => (
              <span key={i} className="px-3 py-1 bg-white/60 border border-emerald-200/50 rounded-full text-xs font-semibold text-emerald-800">
                {p}
              </span>
            ))}
            {typeof data.diagnosis === "object" && data.diagnosis?.affected_organs?.map((o: string, i: number) => (
              <span key={i} className="px-3 py-1 bg-emerald-100/50 border border-emerald-200/50 rounded-full text-xs font-semibold text-emerald-900">
                {o}
              </span>
            ))}
          </div>

          <div className="bg-white/40 backdrop-blur-sm rounded-2xl p-4 border border-emerald-100/50">
            <div className="flex items-center gap-2 mb-2">
              <HeartPulse className="w-4 h-4 text-emerald-700" />
              <span className="font-bold text-emerald-900">{t.report.constitution}: {constitutionText}</span>
            </div>
            {typeof data.constitution === "object" && data.constitution.description && (
              <p className="text-sm text-emerald-800/80 leading-relaxed">
                {data.constitution.description}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Card - Only show in Modern/Classic (Summary skips detailed analysis usually, or shows simplified) */}
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-stone-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 rounded-xl">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">{t.report.detailedAnalysis}</h3>
        </div>

        <p className="text-slate-600 text-base md:text-lg leading-relaxed whitespace-pre-wrap mb-8">
          {analysisText}
        </p>

        {/* Key Findings Grid */}
        {typeof data.analysis === "object" && data.analysis.key_findings && (
          <div className="grid md:grid-cols-3 gap-4">
            {data.analysis.key_findings.from_inquiry && (
              <FindingCard
                icon={BrainCircuit}
                title={t.report.fromInquiry}
                content={data.analysis.key_findings.from_inquiry}
                color="blue"
              />
            )}
            {data.analysis.key_findings.from_visual && (
              <FindingCard
                icon={Activity}
                title={t.report.fromVisual}
                content={data.analysis.key_findings.from_visual}
                color="purple"
              />
            )}
            {data.analysis.key_findings.from_pulse && (
              <FindingCard
                icon={HeartPulse}
                title={t.report.fromPulse}
                content={data.analysis.key_findings.from_pulse}
                color="rose"
              />
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

const FindingCard = ({ icon: Icon, title, content, color }: any) => {
  const colors = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
  }

  return (
    <div className={`p-4 rounded-2xl border ${colors[color as keyof typeof colors] || colors.blue} bg-opacity-50`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" />
        <span className="font-bold text-xs uppercase tracking-wider">{title}</span>
      </div>
      <p className="text-sm font-medium opacity-90 leading-relaxed">{content}</p>
    </div>
  )
}
