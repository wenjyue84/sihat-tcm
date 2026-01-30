"use client";

import { ChefHat, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface GenerateButtonProps {
  hasLatestDiagnosis: boolean;
  onGenerate: () => void;
  strings: {
    generatePlan?: string;
  };
}

export function GenerateButton({ hasLatestDiagnosis, onGenerate, strings }: GenerateButtonProps) {
  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      disabled={!hasLatestDiagnosis}
      onClick={onGenerate}
      className="group relative overflow-hidden text-left w-full"
    >
      <div className="relative h-full p-6 bg-white rounded-2xl border border-slate-200 shadow-sm transition-all duration-200 group-hover:shadow-md group-hover:border-slate-300 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed">
        <div className="relative z-10 flex flex-col h-full min-h-[180px]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-slate-100 rounded-xl group-hover:bg-slate-200 transition-colors">
              <ChefHat className="w-6 h-6 text-slate-700" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">
                {hasLatestDiagnosis ? "Personalized Plan" : "Diagnosis Required"}
              </p>
              <h3 className="text-lg font-semibold text-slate-900 leading-tight">
                {strings.generatePlan || "Generate 7-Day Meal Plan"}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-auto">
            <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-slate-200 transition-colors">
              <Sparkles className="w-4 h-4 text-slate-700 fill-slate-700" />
            </div>
            <span className="text-sm font-medium text-slate-700">
              {hasLatestDiagnosis ? "Start Generation" : "Complete Diagnosis First"}
            </span>
          </div>
        </div>

        {/* Decorative Element */}
        <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-gradient-to-br from-slate-50 to-slate-100 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
      </div>
    </motion.button>
  );
}
