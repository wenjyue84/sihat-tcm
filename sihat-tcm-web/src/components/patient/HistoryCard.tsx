"use client";

import React from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Eye,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Wind,
  Droplets,
  Zap,
  Shield,
  Heart,
  Thermometer,
} from "lucide-react";
import { motion } from "framer-motion";
import type { DiagnosisSession } from "@/types/database";
import { extractDiagnosisTitle, extractConstitutionType } from "@/lib/tcm-utils";

interface HistoryCardProps {
  session: DiagnosisSession;
  onClick: () => void;
  index?: number;
}

const diagnosisIcons: Record<string, any> = {
  "Yin Deficiency": Heart,
  "Yang Deficiency": Zap,
  "Qi Deficiency": Wind,
  "Blood Deficiency": Activity,
  "Damp Heat": Droplets,
  Phlegm: Shield,
  "Blood Stasis": Thermometer,
  "Liver Qi Stagnation": Heart,
  default: FileText,
};

const getDiagnosisIcon = (title: string) => {
  const Icon = diagnosisIcons[title] || diagnosisIcons["default"];
  const colors: Record<string, string> = {
    "Yin Deficiency": "text-blue-500 bg-blue-50",
    "Yang Deficiency": "text-amber-500 bg-amber-50",
    "Qi Deficiency": "text-emerald-500 bg-emerald-50",
    "Blood Deficiency": "text-rose-500 bg-rose-50",
    "Damp Heat": "text-orange-500 bg-orange-50",
    Phlegm: "text-slate-500 bg-slate-50",
    "Blood Stasis": "text-purple-500 bg-purple-50",
    "Liver Qi Stagnation": "text-indigo-500 bg-indigo-50",
    default: "text-slate-500 bg-slate-50",
  };
  const colorClass = colors[title] || colors["default"];
  return (
    <div className={`p-2 rounded-lg ${colorClass}`}>
      <Icon className="w-5 h-5" />
    </div>
  );
};

import { formatDate } from "@/lib/utils/date-formatting";

const getScoreTrend = (score?: number) => {
  if (!score) return null;
  if (score >= 75) return { icon: TrendingUp, color: "text-emerald-500", label: "Good" };
  if (score >= 50) return { icon: Minus, color: "text-amber-500", label: "Fair" };
  return { icon: TrendingDown, color: "text-red-500", label: "Needs Attention" };
};

export const HistoryCard = React.memo(function HistoryCard({
  session,
  onClick,
  index = 0,
}: HistoryCardProps) {
  const diagnosisTitle = extractDiagnosisTitle(session.primary_diagnosis);
  const constitutionTitle = extractConstitutionType(session.constitution);
  const trend = getScoreTrend(session.overall_score ?? undefined);
  const TrendIcon = trend?.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card
        className="group relative overflow-hidden bg-gradient-to-br from-white to-slate-50/50 hover:shadow-xl transition-all duration-300 border-slate-200/60 cursor-pointer"
        onClick={onClick}
      >
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-transparent to-teal-500/0 group-hover:from-emerald-500/5 group-hover:to-teal-500/5 transition-all duration-500 pointer-events-none" />

        <div className="relative p-5">
          {/* Date Badge - Floating Top Right */}
          <div className="flex justify-end mb-4">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50/80 backdrop-blur-sm rounded-full border border-slate-100/80 shadow-sm">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {formatDate(session.created_at)}
              </span>
            </div>
          </div>

          {/* Header: Icon, Diagnosis, Score */}
          <div className="flex items-start gap-4 mb-4">
            <div className="shrink-0">{getDiagnosisIcon(diagnosisTitle)}</div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-extrabold text-slate-800 leading-tight group-hover:text-emerald-700 transition-colors">
                {diagnosisTitle}
              </h3>
              {constitutionTitle && (
                <p className="text-sm font-medium text-slate-500 mt-1 truncate">
                  {constitutionTitle}
                </p>
              )}
            </div>

            {/* Score Badge */}
            {session.overall_score !== null && session.overall_score !== undefined && (
              <div className="shrink-0 ml-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${
                      session.overall_score >= 75
                        ? "bg-emerald-100 text-emerald-700"
                        : session.overall_score >= 50
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                    }`}
                  >
                    {TrendIcon && <TrendIcon className="w-3.5 h-3.5" />}
                    <span className="text-sm font-bold">{session.overall_score}</span>
                  </div>
                  {trend && (
                    <span className={`text-[10px] mt-0.5 font-medium ${trend.color}`}>
                      {trend.label}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Input Data Indicators */}
          {(session.inquiry_summary ||
            session.tongue_analysis ||
            session.face_analysis ||
            session.audio_analysis ||
            session.pulse_data) && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {session.inquiry_summary && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[10px] font-medium">
                  Inquiry
                </span>
              )}
              {session.tongue_analysis && (
                <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-[10px] font-medium">
                  Tongue
                </span>
              )}
              {session.face_analysis && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-medium">
                  Face
                </span>
              )}
              {session.audio_analysis && (
                <span className="px-2 py-0.5 bg-teal-100 text-teal-700 rounded-full text-[10px] font-medium">
                  Voice
                </span>
              )}
              {session.pulse_data && (
                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-[10px] font-medium">
                  Pulse
                </span>
              )}
            </div>
          )}

          {/* Notes Preview (if exists) */}
          {session.notes && (
            <div className="mb-3 p-2.5 bg-amber-50/50 border border-amber-100 rounded-lg">
              <div className="flex items-start gap-2">
                <FileText className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-900 line-clamp-2 leading-relaxed">
                  {session.notes}
                </p>
              </div>
            </div>
          )}

          {/* Action Button */}
          <Button
            variant="ghost"
            className="w-full mt-2 group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Eye className="w-4 h-4 mr-2" />
            View Full Report
          </Button>
        </div>

        {/* Bottom accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
      </Card>
    </motion.div>
  );
});

HistoryCard.displayName = "HistoryCard";
