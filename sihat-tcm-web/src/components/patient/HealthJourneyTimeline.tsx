"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FileHeart, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DiagnosisSession } from "@/types/database";
import { TimelineSessionCard } from "./TimelineSessionCard";
import { TimelineFilters, DateRange, SortField, SortDirection } from "./TimelineFilters";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/stores/useAppStore";
import { TrendWidget } from "./TrendWidget";

interface HealthJourneyTimelineProps {
  sessions: DiagnosisSession[];
  loading?: boolean;
  onStartDiagnosis?: () => void;
  onRefresh?: () => void;
  onRestoreData?: () => void;
}

// Updated to accept translation object 't'
const calculateJourneyDuration = (sessions: DiagnosisSession[], t: any): string => {
  // Safe access to translation keys with fallback
  const journeyT = t?.patientDashboard_v1?.healthJourney || {};
  const durationT = journeyT.duration || {};

  if (sessions.length === 0) return durationT.zero || "0 months";

  const sorted = [...sessions].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const first = new Date(sorted[0].created_at);
  const last = new Date(sorted[sorted.length - 1].created_at);
  const months = Math.round((last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24 * 30));

  if (months < 1) return durationT.lessThanMonth || "Less than a month";
  if (months === 1) return durationT.oneMonth || "1 month";
  return (durationT.months || "{count} months").replace("{count}", months.toString());
};

const filterByDateRange = (sessions: DiagnosisSession[], range: DateRange): DiagnosisSession[] => {
  if (range === "all") return sessions;

  const now = new Date();
  const cutoff = new Date();

  if (range === "year") {
    cutoff.setFullYear(now.getFullYear() - 1);
  } else if (range === "month") {
    cutoff.setMonth(now.getMonth() - 1);
  }

  return sessions.filter(session => new Date(session.created_at) >= cutoff);
};

const sortSessions = (
  sessions: DiagnosisSession[],
  field: SortField,
  direction: SortDirection
): DiagnosisSession[] => {
  const sorted = [...sessions];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (field) {
      case "date":
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        break;
      case "score":
        comparison = (a.overall_score ?? 0) - (b.overall_score ?? 0);
        break;
      case "diagnosis":
        comparison = (a.primary_diagnosis || "").localeCompare(b.primary_diagnosis || "");
        break;
    }

    return direction === "asc" ? comparison : -comparison;
  });

  return sorted;
};

export function HealthJourneyTimeline({
  sessions,
  loading = false,
  onStartDiagnosis,
  onRefresh,
  onRestoreData
}: HealthJourneyTimelineProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Safe access to translation keys
  const journeyT = t?.patientDashboard_v1?.healthJourney || {
    heroTitle: "Your Health Journey",
    sessionsCount: "{count} sessions • {duration}",
    sessionSingular: "session",
    sessionPlural: "sessions",
    showingCount: "Showing {filtered} of {total} sessions",
    emptyTitle: "Begin Your Journey",
    emptyDesc: "Your health journey begins with your first diagnosis.",
    startButton: "Start First Diagnosis",
    originMarker: "Your journey began here"
  };

  const filteredAndSortedSessions = useMemo(() => {
    const filtered = filterByDateRange(sessions, dateRange);
    return sortSessions(filtered, sortField, sortDirection);
  }, [sessions, dateRange, sortField, sortDirection]);

  const journeyDuration = calculateJourneyDuration(sessions, t);

  // Calculate trendData from sessions for TrendWidget
  const trendData = useMemo(() => {
    if (!sessions || sessions.length === 0) return null;

    const validSessions = sessions.filter(
      (s: DiagnosisSession) => s.overall_score !== null && s.overall_score !== undefined
    );

    if (validSessions.length === 0) return null;

    const scores = validSessions.map((s: DiagnosisSession) => s.overall_score as number);
    const averageScore = Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);

    // Calculate improvement (latest - first)
    const sortedByDate = [...validSessions].sort(
      (a: DiagnosisSession, b: DiagnosisSession) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const firstScore = sortedByDate[0]?.overall_score || 0;
    const lastScore = sortedByDate[sortedByDate.length - 1]?.overall_score || 0;
    const improvement = sortedByDate.length >= 2 ? lastScore - firstScore : null;

    // Count diagnoses
    const diagnosisCounts: Record<string, number> = {};
    validSessions.forEach((s: DiagnosisSession) => {
      const diagnosis = s.primary_diagnosis || "Unknown";
      diagnosisCounts[diagnosis] = (diagnosisCounts[diagnosis] || 0) + 1;
    });

    return {
      sessionCount: validSessions.length,
      averageScore,
      improvement,
      diagnosisCounts,
      sessions: validSessions.map((s: DiagnosisSession) => ({
        score: s.overall_score,
        date: s.created_at,
      })),
    };
  }, [sessions]);

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Hero Section Skeleton */}
        <div className="animate-pulse">
          <div className="h-32 bg-slate-100 rounded-3xl" />
        </div>

        {/* Timeline Skeleton */}
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="ml-8 h-48 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Health Vitality Stats Section */}
      {sessions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <TrendWidget trendData={trendData} loading={loading} sessions={sessions} journeyDuration={journeyDuration} />
        </motion.div>
      )}



      {/* Filters */}
      {sessions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap items-center justify-between gap-4"
        >
          <div className="text-sm text-slate-600">
            {(journeyT.showingCount || "")
              .replace("{filtered}", filteredAndSortedSessions.length.toString())
              .replace("{total}", sessions.length.toString())}
          </div>
          <TimelineFilters
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            sortField={sortField}
            onSortFieldChange={setSortField}
            sortDirection={sortDirection}
            onSortDirectionChange={setSortDirection}
          />
        </motion.div>
      )}

      {/* Timeline */}
      {sessions.length === 0 ? (
        /* Empty State */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20 px-4"
        >
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-6">
            <FileHeart className="w-12 h-12 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-light text-slate-900 mb-3">{journeyT.emptyTitle}</h2>
          <p className="text-slate-600 mb-8 max-w-md text-center leading-relaxed">
            {journeyT.emptyDesc}
          </p>
          <div className="flex flex-col items-center gap-3">
            <Button
              onClick={() => {
                if (onStartDiagnosis) {
                  onStartDiagnosis();
                } else {
                  router.push("/");
                }
              }}
              size="lg"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              {journeyT.startButton}
            </Button>

            {/* Restore Data Option */}
            {onRestoreData && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRestoreData}
                className="text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 mt-2"
              >
                {t.patientDashboard_v1?.healthJourney?.cantFindData || "Can't find your data?"} <span className="underline ml-1">{t.patientDashboard_v1?.healthJourney?.restoreMockData || "Restore Data"}</span>
              </Button>
            )}
          </div>
        </motion.div>
      ) : (
        /* Timeline with sessions */
        <div className="relative">
          {/* Timeline spine - vertical line */}
          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-500 via-emerald-300 to-emerald-200" />

          {/* Timeline items */}
          <div className="space-y-8 pb-8">
            {filteredAndSortedSessions.map((session, index) => (
              <TimelineSessionCard
                key={session.id}
                session={session}
                index={index}
                isFirst={index === 0}
                isLast={index === filteredAndSortedSessions.length - 1}
                onRefresh={onRefresh}
              />
            ))}
          </div>

          {/* Origin point marker */}
          {filteredAndSortedSessions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: filteredAndSortedSessions.length * 0.1 + 0.3 }}
              className="ml-8 mt-8 p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <p className="text-sm font-medium text-slate-700">
                  {journeyT.originMarker}
                </p>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}


