"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Sparkles, UtensilsCrossed, Activity, Sun } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  generateDailyTip,
  shouldRefreshTip,
  getDailyGradient,
  type DailyTip,
} from "@/lib/daily-tips";
import { useLanguage } from "@/stores/useAppStore";

const STORAGE_KEY = "sihat-tcm-daily-tip";

interface DailyTipCardProps {
  constitutionType?: string;
}

export function DailyTipCard({
  constitutionType = "平和质",
}: DailyTipCardProps): React.ReactElement {
  const { language, t } = useLanguage();
  const [tip, setTip] = useState<DailyTip | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [gradient, setGradient] = useState("");

  // Load or generate tip on mount
  useEffect(() => {
    const storedData = localStorage.getItem(STORAGE_KEY);
    let needsNewTip = true;

    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        if (!shouldRefreshTip(parsed.timestamp)) {
          setTip(parsed as DailyTip);
          needsNewTip = false;
        }
      } catch (err) {
        console.error("[DailyTipCard] Failed to parse stored tip:", err);
      }
    }

    if (needsNewTip) {
      const newTip = generateDailyTip(constitutionType);
      setTip(newTip);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTip));
    }

    setGradient(getDailyGradient());
  }, [constitutionType]);

  // Re-generate tip when constitution changes
  useEffect(() => {
    if (constitutionType && tip) {
      const newTip = generateDailyTip(constitutionType);
      setTip(newTip);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTip));
    }
  }, [constitutionType]);

  if (!tip) return <></>;

  const getIcon = () => {
    switch (tip.type) {
      case "diet":
        return <UtensilsCrossed className="w-5 h-5" />;
      case "exercise":
        return <Activity className="w-5 h-5" />;
      case "seasonal":
        return <Sun className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  const title = language === "zh" ? tip.title : tip.titleEn;
  const summary = language === "zh" ? tip.summary : tip.summaryEn;
  const details = language === "zh" ? tip.details : tip.detailsEn;
  const ingredients = language === "zh" ? tip.ingredients : tip.ingredientsEn;
  const method = language === "zh" ? tip.method : tip.methodEn;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card
        className={`relative overflow-hidden cursor-pointer border-none shadow-lg bg-gradient-to-br ${gradient} hover:shadow-xl transition-shadow`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-3xl -translate-y-16 translate-x-16" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/20 rounded-full blur-2xl translate-y-12 -translate-x-12" />

        {/* Card Content */}
        <div className="relative p-5">
          {/* Header - Always Visible */}
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-white/40 backdrop-blur-sm shadow-sm ${
                tip.type === "diet"
                  ? "text-emerald-600"
                  : tip.type === "exercise"
                    ? "text-blue-600"
                    : "text-amber-600"
              }`}
            >
              {tip.icon || getIcon()}
            </div>

            {/* Title and Summary */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h3 className="text-base font-bold text-slate-800 mb-1 line-clamp-1">{title}</h3>
                  <p className="text-sm text-slate-600 line-clamp-2">{summary}</p>
                </div>

                {/* Expand/Collapse Button */}
                <button
                  className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/50 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsExpanded(!isExpanded);
                  }}
                >
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-slate-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-600" />
                  )}
                </button>
              </div>

              {/* Tip Type Badge */}
              <div className="mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/50 backdrop-blur-sm rounded-full text-xs font-medium text-slate-700">
                  <Sparkles className="w-3 h-3" />
                  {t.patientDashboard?.dailyTip?.badge || "今日养生小贴士"}
                </span>
              </div>
            </div>
          </div>

          {/* Expanded Details */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-4 pt-4 border-t border-slate-200/50">
                  {/* Details */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2">
                      {t.patientDashboard?.dailyTip?.detailsTitle || "详细说明"}
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{details}</p>
                  </div>

                  {/* Ingredients (for diet tips) */}
                  {ingredients && ingredients.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">
                        {t.patientDashboard?.dailyTip?.ingredientsTitle || "食材"}
                      </h4>
                      <ul className="space-y-1">
                        {ingredients.map((ingredient, i) => (
                          <li key={i} className="text-sm text-slate-600 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            {ingredient}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Method (for diet tips) */}
                  {method && (
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-2">
                        {t.patientDashboard?.dailyTip?.methodTitle || "做法"}
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed">{method}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
}
