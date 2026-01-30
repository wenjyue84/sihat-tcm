"use client";

import { motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Activity,
  Lightbulb,
  Sparkles,
  Wind,
  Droplets,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SnoreAnalysisResult } from "../types";
import { getSeverityColor } from "../utils";

interface AnalysisResultsProps {
  result: SnoreAnalysisResult;
  onReset: () => void;
  translations: {
    severityLevels: Record<string, string>;
  };
}

export function AnalysisResults({
  result,
  onReset,
  translations,
}: AnalysisResultsProps) {
  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Severity & Basic Findings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className={`p-6 rounded-3xl flex flex-col justify-between border ${
            result.snoring_detected
              ? "bg-orange-50/50 border-orange-100"
              : "bg-emerald-50/50 border-emerald-100"
          }`}
        >
          <div className="flex items-center gap-3 mb-4">
            {result.snoring_detected ? (
              <AlertCircle className="w-6 h-6 text-orange-600" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            )}
            <span className="font-bold text-slate-800">
              {result.snoring_detected ? "Significant Snoring" : "Quiet Breathing"}
            </span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              Severity
            </span>
            <span
              className={`px-4 py-1 rounded-full text-sm font-bold ${getSeverityColor(result.severity)}`}
            >
              {translations.severityLevels[result.severity]}
            </span>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-4 text-slate-400">
            <Clock className="w-6 h-6" />
            <span className="font-bold text-slate-800">Frequency Analysis</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-sm font-medium text-slate-500 uppercase tracking-wider">
              Episodes
            </span>
            <span className="text-2xl font-black text-slate-800">
              {result.frequency}
              <small className="text-xs ml-1 text-slate-400 uppercase font-bold">/min</small>
            </span>
          </div>
        </div>
      </div>

      {/* TCM Perspective */}
      <div className="bg-gradient-to-br from-emerald-900 to-teal-950 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Activity className="w-32 h-32" />
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-xl backdrop-blur-sm">
              <Activity className="w-6 h-6 text-emerald-400" />
            </div>
            <h4 className="text-xl font-bold tracking-tight">
              TCM Pattern: {result.tcm_analysis.pattern}
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <div className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">
                  Mechanism
                </div>
                <p className="text-emerald-50/80 leading-relaxed">
                  {result.tcm_analysis.explanation}
                </p>
              </div>
              <div>
                <div className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1 text-red-300">
                  Fatigue Link
                </div>
                <p className="text-red-50/90 leading-relaxed font-medium">
                  {result.tcm_analysis.fatigue_correlation}
                </p>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-5 backdrop-blur-md border border-white/10">
              <div className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3">
                Meridians Involved
              </div>
              <div className="flex flex-wrap gap-2">
                {result.tcm_analysis.meridians_affected.map((m, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-white/10 rounded-full text-xs font-semibold"
                  >
                    {m}
                  </span>
                ))}
              </div>

              <div className="mt-6">
                <div className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-3">
                  TCM Insights
                </div>
                <div className="text-sm italic text-emerald-50/60">
                  In TCM, the sound of snoring is a "listening diagnosis" that reveals the state of
                  Qi and Phlegm in the body.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations Grid */}
      <div className="space-y-4">
        <h4 className="font-bold text-slate-800 text-lg flex items-center gap-2 px-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          Path to Balance
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {result.tcm_recommendations.map((rec, i) => (
            <div
              key={i}
              className="p-5 bg-white border border-slate-100 rounded-3xl hover:border-emerald-200 hover:shadow-md transition-all group"
            >
              <div className="flex gap-4">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    rec.type === "acupressure"
                      ? "bg-purple-50 text-purple-600"
                      : rec.type === "dietary"
                        ? "bg-emerald-50 text-emerald-600"
                        : rec.type === "lifestyle"
                          ? "bg-blue-50 text-blue-600"
                          : "bg-amber-50 text-amber-600"
                  }`}
                >
                  {rec.type === "acupressure" ? (
                    <Activity className="w-6 h-6" />
                  ) : rec.type === "dietary" ? (
                    <Sparkles className="w-6 h-6" />
                  ) : rec.type === "lifestyle" ? (
                    <Wind className="w-6 h-6" />
                  ) : (
                    <Droplets className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    {rec.type}
                  </div>
                  <h5 className="font-bold text-slate-800 mb-1 group-hover:text-emerald-700 transition-colors uppercase text-sm">
                    {rec.suggestion}
                  </h5>
                  <p className="text-sm text-slate-500 leading-snug">{rec.benefit}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-6 border-t border-slate-100">
        <Button
          onClick={onReset}
          className="w-full h-14 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-2xl shadow-lg"
        >
          <RefreshCw className="w-5 h-5 mr-3" />
          New Session
        </Button>
      </div>
    </motion.div>
  );
}
