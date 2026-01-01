import { motion } from "framer-motion";
import { Clock, Check, Sparkles, FileText } from "lucide-react";
import { ShowPromptButton } from "../ShowPromptButton";
import { useLanguage } from "@/stores/useAppStore";
import type { ViewMode } from "./ViewSwitcher";

interface ReportHeaderProps {
  doctorInfo: {
    name: string;
    icon: React.ReactNode;
    bgColor: string;
    borderColor: string;
    textColor: string;
  };
  hasSaved: boolean;
  language: string;
  timestamp?: string;
  includeTimestamp: boolean;
  variants: any;
  viewMode?: ViewMode;
}

export function ReportHeader({
  doctorInfo,
  hasSaved,
  language,
  timestamp,
  includeTimestamp,
  variants,
  viewMode = "modern",
}: ReportHeaderProps) {
  // @ts-ignore
  const { t } = useLanguage();

  if (viewMode === "classic") {
    return (
      <motion.div variants={variants} className="text-center mb-8 pb-6 border-b-2 border-stone-800">
        <h1 className="text-3xl font-serif font-bold text-stone-900 mb-2 uppercase tracking-widest">
          {t.report.comprehensiveReport}
        </h1>
        <div className="flex items-center justify-center gap-4 text-sm text-stone-600 font-serif">
          <span>{t.report.basedOnFourPillars}</span>
          <span>•</span>
          {includeTimestamp && timestamp && (
            <span>
              {new Date(timestamp).toLocaleDateString()}
            </span>
          )}
        </div>
        <div className="mt-4 flex justify-between items-end">
          <div className="text-left">
            <p className="text-xs text-stone-500 uppercase">Provider</p>
            <p className="font-bold">{doctorInfo.name}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-stone-500 uppercase">Status</p>
            <p className="font-bold">{hasSaved ? "Finalized" : "Draft"}</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Modern / Summary View
  return (
    <motion.div variants={variants} className="text-center relative">
      {/* Decorative Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-emerald-300/20 rounded-full blur-3xl -z-10" />

      <div className="inline-flex items-center gap-2 mb-4">
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase border backdrop-blur-sm ${doctorInfo.bgColor} ${doctorInfo.borderColor} ${doctorInfo.textColor}`}
        >
          {doctorInfo.icon} {t.report.analyzedBy} {doctorInfo.name}
        </span>
        {hasSaved && (
          <span className="px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase border bg-emerald-100/80 border-emerald-200/50 text-emerald-800 flex items-center gap-1 backdrop-blur-sm">
            <Check className="w-3 h-3" />{" "}
            {t.report.actionAlerts?.saved || "Saved"}
          </span>
        )}
      </div>

      <h2 className="text-3xl md:text-5xl font-bold text-slate-800 mb-3 tracking-tight">
        {t.report.comprehensiveReport}
      </h2>

      <p className="text-stone-500 text-sm md:text-lg mb-4 max-w-lg mx-auto leading-relaxed">
        {t.report.basedOnFourPillars}
      </p>

      {includeTimestamp && timestamp && (
        <div className="flex items-center justify-center gap-4">
          <p className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/50 rounded-lg text-xs font-medium text-stone-400 border border-stone-100">
            <Clock className="w-3 h-3" />
            {new Date(timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <ShowPromptButton promptType="final" />
        </div>
      )}
    </motion.div>
  );
}
