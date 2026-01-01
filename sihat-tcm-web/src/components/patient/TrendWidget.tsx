"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Zap,
  Info,
  X,
  Target,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import { useLanguage } from "@/stores/useAppStore";

import type { DiagnosisSession } from "@/types/database";
import { DigitalTwin } from "./DigitalTwin";
import { UserCheck } from "lucide-react";
import { FiveElementsRadar } from "./FiveElementsRadar";
import { extractConstitutionType } from "@/lib/tcm-utils";

// Import extracted modals
import {
  TotalSessionsModal,
  JourneyDurationModal,
  PatternInsightsModal,
  AverageScoreModal,
  ProgressModal,
} from "./trend-modals";

interface TrendData {
  sessionCount: number;
  averageScore: number | null;
  improvement: number | null;
  diagnosisCounts: Record<string, number>;
  sessions: Array<{ score: number | null | undefined; date: string }>;
}

interface TrendWidgetProps {
  trendData: TrendData | null;
  loading?: boolean;
  sessions: DiagnosisSession[];
  journeyDuration?: string;
}

export function TrendWidget({ trendData, loading, sessions, journeyDuration }: TrendWidgetProps) {
  const [showAverageModal, setShowAverageModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showDigitalTwin, setShowDigitalTwin] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [showJourneyModal, setShowJourneyModal] = useState(false);
  const [showPatternModal, setShowPatternModal] = useState(false);
  const [showFiveElementsRadar, setShowFiveElementsRadar] = useState(false);
  const { t } = useLanguage();

  if (loading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
          </div>
          <div className="w-full md:w-80 h-80 bg-slate-100 rounded-3xl animate-pulse" />
        </div>
      </Card>
    );
  }

  if (!trendData || trendData.sessionCount === 0) {
    return (
      <Card className="p-6 bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200">
        <div className="text-center py-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-200 flex items-center justify-center">
            <Activity className="w-8 h-8 text-slate-400" />
          </div>
          <p className="text-slate-600 text-sm">
            {t.patientDashboard.healthJourney.noSessionsDesc}
          </p>
        </div>
      </Card>
    );
  }

  const {
    sessionCount,
    averageScore,
    improvement,
    diagnosisCounts,
    sessions: trendSessions,
  } = trendData;
  const topDiagnosis = Object.entries(diagnosisCounts).sort((a, b) => b[1] - a[1])[0];

  return (
    <div className="w-full">
      <Card className="overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 border-emerald-100/50 flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 pb-3 sm:pb-4 border-b border-emerald-100/50 flex justify-between items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-xl font-bold text-emerald-900 flex items-center gap-2">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
              <span className="truncate">{t.patientDashboard.healthJourney.vitalityTitle}</span>
            </h3>
            <p className="text-xs sm:text-sm text-emerald-700 mt-0.5 sm:mt-1 line-clamp-2">
              {t.patientDashboard.healthJourney.subtitle}
            </p>
          </div>

          {/* Icon Buttons Container */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Five Elements Radar Trigger Icon */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFiveElementsRadar(true)}
              className="group relative cursor-pointer"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
              <div className="relative p-2 sm:p-3 bg-white rounded-full shadow-md border border-amber-100 flex items-center justify-center">
                <Target className="w-4 h-4 sm:w-6 sm:h-6 text-amber-600" />
                <div className="absolute top-0 right-0 h-2 w-2 sm:h-3 sm:w-3 bg-amber-500 border-2 border-white rounded-full"></div>
              </div>
              <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-amber-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter hidden sm:block">
                Five Elements
              </p>
            </motion.div>

            {/* Digital Twin Trigger Icon */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowDigitalTwin(true)}
              className="group relative cursor-pointer"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
              <div className="relative p-2 sm:p-3 bg-white rounded-full shadow-md border border-emerald-100 flex items-center justify-center">
                <UserCheck className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-600" />
                <div className="absolute top-0 right-0 h-2 w-2 sm:h-3 sm:w-3 bg-emerald-500 border-2 border-white rounded-full"></div>
              </div>
              <p className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-emerald-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-tighter hidden sm:block">
                View Digital Twin
              </p>
            </motion.div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-3 sm:p-4 grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 flex-1">
          {/* Total Sessions - Clickable */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            onClick={() => setShowSessionsModal(true)}
            className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-emerald-100/50 cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-medium text-emerald-700 uppercase tracking-wide mb-0.5 flex items-center gap-1">
                  {t.patientDashboard.healthJourney.totalSessions}
                  <Info className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                </p>
                <p className="text-2xl font-bold text-emerald-900 leading-tight">{sessionCount}</p>
                <p className="text-[9px] text-emerald-600 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  Click for insights →
                </p>
              </div>
              <div className="p-1.5 bg-emerald-100 rounded-md ml-2 flex-shrink-0">
                <Calendar className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
          </motion.div>

          {/* Journey Duration - Clickable */}
          {journeyDuration && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              onClick={() => setShowJourneyModal(true)}
              className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-violet-100/50 cursor-pointer hover:shadow-md hover:border-violet-300 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-violet-700 uppercase tracking-wide mb-0.5 flex items-center gap-1">
                    {t.patientDashboard.healthJourney.journeyDuration || "Journey"}
                    <Info className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </p>
                  <p className="text-xl font-bold text-violet-900 leading-tight">{journeyDuration}</p>
                  <p className="text-[9px] text-violet-600 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click for timeline →
                  </p>
                </div>
                <div className="p-1.5 bg-violet-100 rounded-md ml-2 flex-shrink-0">
                  <Clock className="w-4 h-4 text-violet-600" />
                </div>
              </div>
            </motion.div>
          )}

          {/* Average Score - Clickable */}
          {averageScore !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              onClick={() => setShowAverageModal(true)}
              className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-teal-100/50 cursor-pointer hover:shadow-md hover:border-teal-300 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-teal-700 uppercase tracking-wide mb-0.5 flex items-center gap-1">
                    {t.patientDashboard.healthJourney.averageScore}
                    <Info className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </p>
                  <p className="text-2xl font-bold text-teal-900 leading-tight">{averageScore}</p>
                  <p className="text-[9px] text-teal-600 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click for details →
                  </p>
                </div>
                <div
                  className={`p-1.5 rounded-md ml-2 flex-shrink-0 ${averageScore >= 75
                    ? "bg-emerald-100"
                    : averageScore >= 50
                      ? "bg-amber-100"
                      : "bg-red-100"
                    }`}
                >
                  <Activity
                    className={`w-4 h-4 ${averageScore >= 75
                      ? "text-emerald-600"
                      : averageScore >= 50
                        ? "text-amber-600"
                        : "text-red-600"
                      }`}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Improvement - Clickable */}
          {improvement !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              onClick={() => setShowProgressModal(true)}
              className="bg-white/80 backdrop-blur-sm rounded-lg p-3 shadow-sm border border-cyan-100/50 cursor-pointer hover:shadow-md hover:border-cyan-300 transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-medium text-cyan-700 uppercase tracking-wide mb-0.5 flex items-center gap-1">
                    {t.patientDashboard.healthJourney.progress}
                    <Info className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </p>
                  <div className="flex items-baseline gap-1.5">
                    <p
                      className={`text-2xl font-bold leading-tight ${improvement > 0
                        ? "text-emerald-600"
                        : improvement < 0
                          ? "text-red-600"
                          : "text-slate-600"
                        }`}
                    >
                      {improvement > 0 ? "+" : ""}
                      {improvement}
                    </p>
                    <span className="text-xs text-slate-500">
                      {t.patientDashboard.healthJourney.points}
                    </span>
                  </div>
                  <p className="text-[9px] text-cyan-600 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click for details →
                  </p>
                </div>
                <div
                  className={`p-1.5 rounded-md ml-2 flex-shrink-0 ${improvement > 0
                    ? "bg-emerald-100"
                    : improvement < 0
                      ? "bg-red-100"
                      : "bg-slate-100"
                    }`}
                >
                  {improvement > 0 ? (
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  ) : improvement < 0 ? (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  ) : (
                    <Activity className="w-4 h-4 text-slate-600" />
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Most Common Diagnosis - Clickable */}
        {topDiagnosis && (
          <div className="px-6 pb-6">
            <div
              onClick={() => setShowPatternModal(true)}
              className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-emerald-100/50 cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all group"
            >
              <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider mb-2 flex items-center gap-1">
                {t.patientDashboard.healthJourney.mostCommonPattern}
                <Info className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-emerald-900">{topDiagnosis[0]}</p>
                  <p className="text-[9px] text-emerald-600 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to learn more →
                  </p>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                  {topDiagnosis[1]}{" "}
                  {topDiagnosis[1] === 1
                    ? t.patientDashboard.healthJourney.time
                    : t.patientDashboard.healthJourney.times}
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Digital Twin Modal */}
      <Dialog.Root open={showDigitalTwin} onOpenChange={setShowDigitalTwin}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]" />
          <div className="fixed inset-0 flex items-center justify-center z-[101] p-4">
            <Dialog.Content className="bg-[#0F172A] rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-white/10 outline-none">
              <div className="relative h-[80vh] flex flex-col">
                <div className="p-6 pb-2 border-b border-white/5 flex justify-between items-center bg-[#1E293B]">
                  <div>
                    <Dialog.Title asChild>
                      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <div className="p-1.5 bg-cyan-500/20 rounded-lg">
                          <UserCheck className="w-5 h-5 text-cyan-400" />
                        </div>
                        Digital Health Visualizer
                      </h2>
                    </Dialog.Title>
                    <Dialog.Description className="sr-only">
                      Interactive 3D visualization of your current organs and energy balance based on TCM diagnosis.
                    </Dialog.Description>
                    <p className="text-cyan-400/60 text-xs font-mono mt-1 uppercase tracking-widest">
                      AI Energy Mapping System v2.0
                    </p>
                  </div>
                  <Dialog.Close asChild>
                    <button className="p-2.5 hover:bg-white/10 rounded-xl transition-colors text-white/70 hover:text-white border border-white/5">
                      <X className="w-5 h-5" />
                    </button>
                  </Dialog.Close>
                </div>

                <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center bg-gradient-to-b from-[#0F172A] to-[#1E293B]">
                  <div className="w-full max-w-sm flex-1">
                    <DigitalTwin sessions={sessions} loading={loading} />
                  </div>

                  <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                      <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold mb-1">Status</p>
                      <p className="text-white text-sm">Real-time Analysis Active</p>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                      <p className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold mb-1">Data Source</p>
                      <p className="text-white text-sm">{sessions.length} Medical Sessions</p>
                    </div>
                  </div>
                </div>
              </div>
            </Dialog.Content>
          </div>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Five Elements Radar Modal */}
      <Dialog.Root open={showFiveElementsRadar} onOpenChange={setShowFiveElementsRadar}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]" />
          <div className="fixed inset-0 flex items-center justify-center z-[101] p-4">
            <Dialog.Content className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-200 outline-none">
              <div className="relative flex flex-col max-h-[90vh]">
                <div className="p-6 pb-4 border-b border-slate-200 flex justify-between items-center bg-gradient-to-r from-amber-50 to-orange-50">
                  <div>
                    <Dialog.Title asChild>
                      <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <div className="p-1.5 bg-amber-500/20 rounded-lg">
                          <Target className="w-5 h-5 text-amber-600" />
                        </div>
                        {t.fiveElementsRadar?.title || "Five Elements Health Radar"}
                      </h2>
                    </Dialog.Title>
                    <Dialog.Description className="sr-only">
                      Traditional Chinese Medicine organ health assessment based on the Five Elements theory.
                    </Dialog.Description>
                    <p className="text-amber-600/80 text-xs font-medium mt-1">
                      {t.fiveElementsRadar?.subtitle || "Traditional Chinese Medicine organ health assessment based on the Five Elements theory"}
                    </p>
                  </div>
                  <Dialog.Close asChild>
                    <button className="p-2.5 hover:bg-white/80 rounded-xl transition-colors text-slate-600 hover:text-slate-900 border border-slate-200">
                      <X className="w-5 h-5" />
                    </button>
                  </Dialog.Close>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-amber-50/30 to-orange-50/30">
                  <FiveElementsRadar
                    constitutionType={
                      sessions.length > 0 && sessions[0].constitution
                        ? extractConstitutionType(sessions[0].constitution)
                        : undefined
                    }
                    diagnosisData={sessions.length > 0 ? sessions[0] : undefined}
                  />
                </div>
              </div>
            </Dialog.Content>
          </div>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Insight Modals */}
      {averageScore !== null && (
        <AverageScoreModal
          open={showAverageModal}
          onOpenChange={setShowAverageModal}
          averageScore={averageScore}
          sessions={trendSessions}
        />
      )}

      {improvement !== null && (
        <ProgressModal
          open={showProgressModal}
          onOpenChange={setShowProgressModal}
          improvement={improvement}
          sessions={trendSessions}
        />
      )}

      <TotalSessionsModal
        open={showSessionsModal}
        onOpenChange={setShowSessionsModal}
        sessionCount={sessionCount}
        sessions={trendSessions}
      />

      {journeyDuration && (
        <JourneyDurationModal
          open={showJourneyModal}
          onOpenChange={setShowJourneyModal}
          duration={journeyDuration}
          sessions={trendSessions}
        />
      )}

      {topDiagnosis && (
        <PatternInsightsModal
          open={showPatternModal}
          onOpenChange={setShowPatternModal}
          pattern={topDiagnosis[0]}
          count={topDiagnosis[1]}
          totalSessions={sessionCount}
        />
      )}
    </div>
  );
}
