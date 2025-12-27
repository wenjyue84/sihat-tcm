"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Zap,
  Info,
  X,
  Calculator,
  BarChart3,
  Target,
  ArrowRight,
  Clock,
  Award,
  Heart,
  Sparkles,
  Star,
  Shield,
  Leaf,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import { useLanguage } from "@/stores/useAppStore";

import type { DiagnosisSession } from "@/types/database";
import { DigitalTwin } from "./DigitalTwin";
import { UserCheck } from "lucide-react";
import { FiveElementsRadar } from "./FiveElementsRadar";
import { extractConstitutionType } from "@/lib/tcm-utils";

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

// Total Sessions Insights Modal
function TotalSessionsModal({
  open,
  onOpenChange,
  sessionCount,
  sessions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionCount: number;
  sessions: Array<{ score: number | null | undefined; date: string }>;
}) {
  const getMilestone = (count: number) => {
    if (count >= 20) return { title: "Health Champion", icon: "🏆", color: "from-amber-500 to-yellow-500" };
    if (count >= 10) return { title: "Wellness Warrior", icon: "⭐", color: "from-emerald-500 to-teal-500" };
    if (count >= 5) return { title: "Health Explorer", icon: "🌟", color: "from-blue-500 to-cyan-500" };
    if (count >= 3) return { title: "Wellness Seeker", icon: "🌱", color: "from-green-500 to-emerald-500" };
    return { title: "Getting Started", icon: "✨", color: "from-violet-500 to-purple-500" };
  };

  const milestone = getMilestone(sessionCount);
  const nextMilestone = sessionCount < 3 ? 3 : sessionCount < 5 ? 5 : sessionCount < 10 ? 10 : sessionCount < 20 ? 20 : null;
  const progress = nextMilestone ? (sessionCount / nextMilestone) * 100 : 100;

  // Calculate session frequency
  const validSessions = sessions.filter((s) => s.date);
  const sortedDates = validSessions.map((s) => new Date(s.date)).sort((a, b) => a.getTime() - b.getTime());

  let avgDaysBetween = 0;
  if (sortedDates.length >= 2) {
    const totalDays = (sortedDates[sortedDates.length - 1].getTime() - sortedDates[0].getTime()) / (1000 * 60 * 60 * 24);
    avgDaysBetween = Math.round(totalDays / (sortedDates.length - 1));
  }

  const insights = [
    {
      icon: <Heart className="w-5 h-5 text-rose-500" />,
      title: "Dedication to Health",
      description: `You've committed to ${sessionCount} health check-in${sessionCount !== 1 ? "s" : ""}. Each session is a step toward better understanding your body.`,
    },
    {
      icon: <Shield className="w-5 h-5 text-blue-500" />,
      title: "Proactive Wellness",
      description: "Regular TCM sessions help identify imbalances early, before they become major health concerns.",
    },
    {
      icon: <Sparkles className="w-5 h-5 text-amber-500" />,
      title: "Building Health Data",
      description: "Each session adds valuable data points, helping track patterns and improvements over time.",
    },
  ];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <Dialog.Content className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-0 outline-none">
            <div className={`sticky top-0 bg-gradient-to-r ${milestone.color} text-white p-6 rounded-t-2xl`}>
              <Dialog.Title className="text-xl font-bold flex items-center gap-2">
                <Award className="w-6 h-6" />
                Your Health Journey Sessions
              </Dialog.Title>
              <Dialog.Description className="text-white/80 text-sm mt-1">
                Every session is a commitment to your wellbeing
              </Dialog.Description>
              <Dialog.Close asChild>
                <button className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            <div className="p-6 space-y-6">
              {/* Achievement Badge */}
              <div className="text-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
                <div className="text-6xl mb-3">{milestone.icon}</div>
                <p className="text-5xl font-bold text-slate-800 mb-1">{sessionCount}</p>
                <p className="text-sm text-slate-500 mb-3">Total Sessions</p>
                <div className={`inline-block px-4 py-2 rounded-full bg-gradient-to-r ${milestone.color} text-white font-semibold text-sm`}>
                  {milestone.title}
                </div>
              </div>

              {/* Progress to Next Milestone */}
              {nextMilestone && (
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-emerald-800">Progress to Next Milestone</span>
                    <span className="text-sm text-emerald-600">{sessionCount}/{nextMilestone} sessions</span>
                  </div>
                  <div className="h-3 bg-emerald-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                    />
                  </div>
                  <p className="text-xs text-emerald-600 mt-2">
                    🎯 Only {nextMilestone - sessionCount} more session{nextMilestone - sessionCount !== 1 ? "s" : ""} to unlock the next achievement!
                  </p>
                </div>
              )}

              {/* Session Frequency */}
              {avgDaysBetween > 0 && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <h4 className="font-semibold text-blue-800 flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4" />
                    Your Consistency
                  </h4>
                  <p className="text-sm text-blue-700">
                    On average, you have a session every <strong>{avgDaysBetween} days</strong>.
                    {avgDaysBetween <= 14
                      ? " That's excellent commitment to your health!"
                      : avgDaysBetween <= 30
                        ? " Great job maintaining regular check-ins!"
                        : " Consider more frequent sessions for optimal health tracking."}
                  </p>
                </div>
              )}

              {/* Positive Insights */}
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-800">Why This Matters</h4>
                {insights.map((insight, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex gap-3 bg-white rounded-lg p-3 border border-slate-100 shadow-sm"
                  >
                    <div className="p-2 bg-slate-50 rounded-lg h-fit">{insight.icon}</div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm">{insight.title}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{insight.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Encouragement */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                <p className="text-sm text-amber-800 leading-relaxed">
                  🌿 <strong>TCM Wisdom:</strong> In Traditional Chinese Medicine, consistent health monitoring aligns with the principle of "治未病" (zhì wèi bìng) — treating disease before it arises. Your commitment to regular sessions embodies this ancient wisdom.
                </p>
              </div>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Journey Duration Insights Modal
function JourneyDurationModal({
  open,
  onOpenChange,
  duration,
  sessions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duration: string;
  sessions: Array<{ score: number | null | undefined; date: string }>;
}) {
  const validSessions = sessions.filter((s) => s.date);
  const sortedDates = validSessions.map((s) => new Date(s.date)).sort((a, b) => a.getTime() - b.getTime());
  const firstSession = sortedDates[0];
  const lastSession = sortedDates[sortedDates.length - 1];

  // Calculate days on journey
  const daysOnJourney = firstSession && lastSession
    ? Math.ceil((lastSession.getTime() - firstSession.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const getJourneyMilestone = (days: number) => {
    if (days >= 365) return { title: "Year-Long Wellness Veteran", icon: "🎖️", message: "A full year of health dedication! Your body thanks you." };
    if (days >= 180) return { title: "Half-Year Health Hero", icon: "🌟", message: "Six months of consistent self-care. Remarkable commitment!" };
    if (days >= 90) return { title: "Quarterly Champion", icon: "⭐", message: "Three months of health focus. You're building lasting habits!" };
    if (days >= 30) return { title: "Monthly Milestone", icon: "🌱", message: "One month into your journey. Great foundation!" };
    return { title: "Fresh Start", icon: "✨", message: "Every journey begins with a single step. You've taken it!" };
  };

  const journeyMilestone = getJourneyMilestone(daysOnJourney);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <Dialog.Content className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-0 outline-none">
            <div className="sticky top-0 bg-gradient-to-r from-violet-600 to-purple-600 text-white p-6 rounded-t-2xl">
              <Dialog.Title className="text-xl font-bold flex items-center gap-2">
                <Clock className="w-6 h-6" />
                Your Wellness Timeline
              </Dialog.Title>
              <Dialog.Description className="text-violet-100 text-sm mt-1">
                Celebrating your commitment to lasting health
              </Dialog.Description>
              <Dialog.Close asChild>
                <button className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            <div className="p-6 space-y-6">
              {/* Duration Display */}
              <div className="text-center bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-6 border border-violet-100">
                <div className="text-5xl mb-3">{journeyMilestone.icon}</div>
                <p className="text-4xl font-bold text-violet-800 mb-1">{duration}</p>
                <p className="text-sm text-violet-600 mb-3">on your health journey</p>
                <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold text-sm">
                  {journeyMilestone.title}
                </div>
                <p className="text-sm text-violet-700 mt-3 italic">"{journeyMilestone.message}"</p>
              </div>

              {/* Journey Timeline */}
              {firstSession && (
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <h4 className="font-semibold text-slate-800 mb-4">Your Journey So Far</h4>
                  <div className="relative pl-4 border-l-2 border-violet-300 space-y-4">
                    <div className="relative">
                      <div className="absolute -left-[21px] w-4 h-4 bg-violet-500 rounded-full border-2 border-white" />
                      <p className="text-sm font-medium text-slate-800">Journey Started</p>
                      <p className="text-xs text-slate-500">
                        {firstSession.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                    {validSessions.length > 1 && (
                      <div className="relative">
                        <div className="absolute -left-[21px] w-4 h-4 bg-violet-400 rounded-full border-2 border-white" />
                        <p className="text-sm font-medium text-slate-800">{validSessions.length - 2} Sessions In Between</p>
                        <p className="text-xs text-slate-500">Continuous health monitoring</p>
                      </div>
                    )}
                    <div className="relative">
                      <div className="absolute -left-[21px] w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
                      <p className="text-sm font-medium text-slate-800">Latest Session</p>
                      <p className="text-xs text-slate-500">
                        {lastSession?.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Positive Affirmations */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 text-center">
                  <Star className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-emerald-800">Consistency</p>
                  <p className="text-xs text-emerald-600 mt-1">Time is your ally in healing</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-center">
                  <Leaf className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-amber-800">Growth</p>
                  <p className="text-xs text-amber-600 mt-1">Each day brings new balance</p>
                </div>
              </div>

              {/* TCM Wisdom */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                <p className="text-sm text-amber-800 leading-relaxed">
                  🌿 <strong>TCM Perspective:</strong> Healing follows natural rhythms. Just as seasons change gradually, your body's return to balance is a journey, not a destination. The time you've invested shows wisdom and patience — qualities that TCM considers essential for true wellness.
                </p>
              </div>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Most Common Pattern Insights Modal
function PatternInsightsModal({
  open,
  onOpenChange,
  pattern,
  count,
  totalSessions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pattern: string;
  count: number;
  totalSessions: number;
}) {
  const percentage = Math.round((count / totalSessions) * 100);

  // Pattern-specific insights (simplified - in production, this would be more comprehensive)
  const getPatternInsights = (patternName: string) => {
    const lowerPattern = patternName.toLowerCase();

    if (lowerPattern.includes("improving") || lowerPattern.includes("stable")) {
      return {
        sentiment: "positive",
        icon: "🌟",
        message: "Your pattern shows stability and improvement. This is exactly what we want to see in TCM treatment!",
        tips: [
          "Continue your current wellness practices",
          "Maintain consistent sleep and meal schedules",
          "Keep up with seasonal adjustments to diet",
        ],
      };
    }

    if (lowerPattern.includes("deficiency")) {
      return {
        sentiment: "supportive",
        icon: "💪",
        message: "Deficiency patterns are common and highly treatable with proper nourishment and rest.",
        tips: [
          "Focus on warm, cooked foods to support digestion",
          "Prioritize rest and gentle exercise",
          "Consider herbal tonics recommended by your practitioner",
        ],
      };
    }

    if (lowerPattern.includes("stagnation")) {
      return {
        sentiment: "actionable",
        icon: "🌊",
        message: "Stagnation patterns respond well to movement and emotional expression.",
        tips: [
          "Regular physical activity helps move Qi",
          "Practice stress-reduction techniques",
          "Ensure adequate water intake",
        ],
      };
    }

    return {
      sentiment: "informative",
      icon: "🌿",
      message: "Understanding your pattern is the first step to targeted wellness. Your TCM practitioner can provide personalized guidance.",
      tips: [
        "Discuss this pattern with your practitioner",
        "Keep tracking your symptoms and improvements",
        "Follow your personalized treatment plan",
      ],
    };
  };

  const insights = getPatternInsights(pattern);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <Dialog.Content className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-0 outline-none">
            <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-t-2xl">
              <Dialog.Title className="text-xl font-bold flex items-center gap-2">
                <Activity className="w-6 h-6" />
                Your Health Pattern
              </Dialog.Title>
              <Dialog.Description className="text-emerald-100 text-sm mt-1">
                Understanding your most common diagnosis pattern
              </Dialog.Description>
              <Dialog.Close asChild>
                <button className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            <div className="p-6 space-y-6">
              {/* Pattern Display */}
              <div className="text-center bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
                <div className="text-5xl mb-3">{insights.icon}</div>
                <p className="text-lg font-bold text-emerald-800 mb-2">{pattern}</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                    {count} occurrence{count !== 1 ? "s" : ""}
                  </span>
                  <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium">
                    {percentage}% of sessions
                  </span>
                </div>
              </div>

              {/* Pattern Insight */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <h4 className="font-semibold text-blue-800 flex items-center gap-2 mb-2">
                  <Info className="w-4 h-4" />
                  What This Means
                </h4>
                <p className="text-sm text-blue-700 leading-relaxed">{insights.message}</p>
              </div>

              {/* Actionable Tips */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="font-semibold text-slate-800 mb-3">Wellness Tips for This Pattern</h4>
                <div className="space-y-2">
                  {insights.tips.map((tip, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-2"
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-emerald-600 text-xs font-bold">{idx + 1}</span>
                      </div>
                      <p className="text-sm text-slate-700">{tip}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Positive Reinforcement */}
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-200">
                <h4 className="font-semibold text-violet-800 mb-2">✨ Remember</h4>
                <p className="text-sm text-violet-700 leading-relaxed">
                  Patterns in TCM are not permanent labels — they're snapshots of your current state. With proper care, diet, and lifestyle adjustments, patterns can shift toward greater balance. You're already on the right path by tracking your health!
                </p>
              </div>

              {/* TCM Context */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                <p className="text-sm text-amber-800 leading-relaxed">
                  🌿 <strong>TCM Philosophy:</strong> Each pattern represents a unique combination of Yin, Yang, Qi, and Blood dynamics in your body. Recognizing your pattern allows for precisely targeted treatments that address root causes, not just symptoms.
                </p>
              </div>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Score breakdown modal for Average Score
function AverageScoreModal({
  open,
  onOpenChange,
  averageScore,
  sessions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  averageScore: number;
  sessions: Array<{ score: number | null | undefined; date: string }>;
}) {
  const validSessions = sessions.filter((s) => s.score !== null && s.score !== undefined);
  const scores = validSessions.map((s) => s.score as number);
  const total = scores.reduce((a, b) => a + b, 0);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const variance =
    scores.length > 1
      ? scores.reduce((acc, val) => acc + Math.pow(val - averageScore, 2), 0) / scores.length
      : 0;
  const stdDev = Math.sqrt(variance);

  // Categorize scores
  const excellent = scores.filter((s) => s >= 80).length;
  const good = scores.filter((s) => s >= 60 && s < 80).length;
  const fair = scores.filter((s) => s >= 40 && s < 60).length;
  const needsWork = scores.filter((s) => s < 40).length;

  const getScoreInterpretation = (score: number) => {
    if (score >= 80)
      return {
        label: "Excellent",
        color: "text-emerald-600",
        bg: "bg-emerald-100",
        description: "Strong Qi flow, balanced constitution",
      };
    if (score >= 60)
      return {
        label: "Good",
        color: "text-teal-600",
        bg: "bg-teal-100",
        description: "Minor imbalances, generally healthy",
      };
    if (score >= 40)
      return {
        label: "Fair",
        color: "text-amber-600",
        bg: "bg-amber-100",
        description: "Notable imbalances requiring attention",
      };
    return {
      label: "Needs Improvement",
      color: "text-red-600",
      bg: "bg-red-100",
      description: "Significant imbalances, active treatment recommended",
    };
  };

  const interpretation = getScoreInterpretation(averageScore);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <Dialog.Content className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-0 outline-none">
            <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-emerald-600 text-white p-6 rounded-t-2xl">
              <Dialog.Title className="text-xl font-bold flex items-center gap-2">
                <Calculator className="w-6 h-6" />
                Average Score Breakdown
              </Dialog.Title>
              <Dialog.Description className="text-teal-100 text-sm mt-1">
                Scientific methodology behind your health score calculation
              </Dialog.Description>
              <Dialog.Close asChild>
                <button className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            <div className="p-6 space-y-6">
              {/* Main Score Display */}
              <div className="text-center bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-6 border border-teal-100">
                <p className="text-6xl font-bold text-teal-700">{averageScore}</p>
                <p className={`text-sm font-medium mt-2 ${interpretation.color}`}>
                  {interpretation.label}
                </p>
                <p className="text-xs text-slate-500 mt-1">{interpretation.description}</p>
              </div>

              {/* Calculation Formula */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4 text-teal-600" />
                  Calculation Method
                </h4>
                <div className="bg-white rounded-lg p-4 font-mono text-sm text-slate-700 border border-slate-100">
                  <p className="mb-2">Average Score = Σ (Session Scores) ÷ n</p>
                  <p className="text-teal-600">
                    = ({scores.join(" + ")}) ÷ {scores.length}
                  </p>
                  <p className="text-emerald-600 font-bold mt-1">
                    = {total} ÷ {scores.length} = {averageScore}
                  </p>
                </div>
                <p className="text-xs text-slate-500 mt-3">
                  The arithmetic mean is used to provide a balanced representation of your overall
                  health trend, giving equal weight to each diagnosis session.
                </p>
              </div>

              {/* Statistical Analysis */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-teal-600" />
                  Statistical Analysis
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-slate-100 text-center">
                    <p className="text-2xl font-bold text-slate-800">{min}</p>
                    <p className="text-xs text-slate-500">Minimum Score</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-slate-100 text-center">
                    <p className="text-2xl font-bold text-slate-800">{max}</p>
                    <p className="text-xs text-slate-500">Maximum Score</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-slate-100 text-center">
                    <p className="text-2xl font-bold text-slate-800">{max - min}</p>
                    <p className="text-xs text-slate-500">Range</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-slate-100 text-center">
                    <p className="text-2xl font-bold text-slate-800">±{stdDev.toFixed(1)}</p>
                    <p className="text-xs text-slate-500">Std. Deviation</p>
                  </div>
                </div>
              </div>

              {/* Score Distribution */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="font-semibold text-slate-800 mb-3">Score Distribution</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-24 text-xs text-emerald-600 font-medium">Excellent (80+)</div>
                    <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${(excellent / scores.length) * 100}%` }}
                      />
                    </div>
                    <div className="w-8 text-xs text-slate-600 text-right">{excellent}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 text-xs text-teal-600 font-medium">Good (60-79)</div>
                    <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full transition-all"
                        style={{ width: `${(good / scores.length) * 100}%` }}
                      />
                    </div>
                    <div className="w-8 text-xs text-slate-600 text-right">{good}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 text-xs text-amber-600 font-medium">Fair (40-59)</div>
                    <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all"
                        style={{ width: `${(fair / scores.length) * 100}%` }}
                      />
                    </div>
                    <div className="w-8 text-xs text-slate-600 text-right">{fair}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 text-xs text-red-600 font-medium">Needs Work (&lt;40)</div>
                    <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full transition-all"
                        style={{ width: `${(needsWork / scores.length) * 100}%` }}
                      />
                    </div>
                    <div className="w-8 text-xs text-slate-600 text-right">{needsWork}</div>
                  </div>
                </div>
              </div>

              {/* TCM Context */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                <h4 className="font-semibold text-amber-800 mb-2">🌿 TCM Health Score Context</h4>
                <p className="text-sm text-amber-700 leading-relaxed">
                  Your health score is derived from TCM diagnostic indicators including{" "}
                  <strong>tongue analysis</strong> (color, coating, shape),
                  <strong> pulse assessment</strong> (rate, rhythm, depth), and{" "}
                  <strong>symptom inquiry</strong> (physical and emotional symptoms). Each session
                  evaluates the balance of Qi, Blood, Yin, and Yang in your body.
                </p>
              </div>

              {/* Session List */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-3">
                  Contributing Sessions ({validSessions.length})
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {validSessions
                    .slice()
                    .reverse()
                    .map((session, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-100"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600">
                            {new Date(session.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <span
                          className={`font-semibold ${getScoreInterpretation(session.score as number).color}`}
                        >
                          {session.score}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// Progress breakdown modal
function ProgressModal({
  open,
  onOpenChange,
  improvement,
  sessions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  improvement: number;
  sessions: Array<{ score: number | null | undefined; date: string }>;
}) {
  const validSessions = sessions.filter((s) => s.score !== null && s.score !== undefined);
  const firstSession = validSessions[0];
  const lastSession = validSessions[validSessions.length - 1];

  const firstScore = firstSession?.score as number;
  const lastScore = lastSession?.score as number;

  // Calculate improvement percentage
  const percentChange = firstScore > 0 ? ((improvement / firstScore) * 100).toFixed(1) : 0;

  // Calculate trend over time
  const getProgressInterpretation = (change: number) => {
    if (change >= 15)
      return {
        label: "Significant Improvement",
        color: "text-emerald-600",
        icon: "🎉",
        description:
          "Excellent progress! Your TCM treatments and lifestyle changes are working very well.",
      };
    if (change >= 5)
      return {
        label: "Good Progress",
        color: "text-teal-600",
        icon: "📈",
        description: "You're on the right track. Continue with your current treatment plan.",
      };
    if (change >= 0)
      return {
        label: "Stable",
        color: "text-amber-600",
        icon: "➡️",
        description:
          "Your health is maintaining. Consider consulting your practitioner for optimization.",
      };
    if (change >= -5)
      return {
        label: "Slight Decline",
        color: "text-orange-600",
        icon: "⚠️",
        description: "Minor setback. Review recent lifestyle changes or stressors.",
      };
    return {
      label: "Needs Attention",
      color: "text-red-600",
      icon: "🔴",
      description: "Notable decline. Schedule a consultation to adjust your treatment.",
    };
  };

  const interpretation = getProgressInterpretation(improvement);

  // Calculate weekly averages if enough data
  const weeklyProgress: { week: number; avg: number }[] = [];
  if (validSessions.length >= 2) {
    const now = new Date();
    for (let w = 0; w < 4; w++) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (w + 1) * 7);
      const weekEnd = new Date(now);
      weekEnd.setDate(now.getDate() - w * 7);

      const weekSessions = validSessions.filter((s) => {
        const d = new Date(s.date);
        return d >= weekStart && d < weekEnd;
      });

      if (weekSessions.length > 0) {
        const avg = Math.round(
          weekSessions.reduce((a, b) => a + (b.score as number), 0) / weekSessions.length
        );
        weeklyProgress.push({ week: w, avg });
      }
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
          <Dialog.Content className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-0 outline-none">
            <div
              className={`sticky top-0 ${improvement >= 0 ? "bg-gradient-to-r from-emerald-600 to-teal-600" : "bg-gradient-to-r from-red-500 to-orange-500"} text-white p-6 rounded-t-2xl`}
            >
              <Dialog.Title className="text-xl font-bold flex items-center gap-2">
                {improvement >= 0 ? (
                  <TrendingUp className="w-6 h-6" />
                ) : (
                  <TrendingDown className="w-6 h-6" />
                )}
                Progress Analysis
              </Dialog.Title>
              <Dialog.Description
                className={`${improvement >= 0 ? "text-teal-100" : "text-red-100"} text-sm mt-1`}
              >
                Track your health trajectory over time
              </Dialog.Description>
              <Dialog.Close asChild>
                <button className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            <div className="p-6 space-y-6">
              {/* Main Progress Display */}
              <div
                className={`text-center ${improvement >= 0 ? "bg-gradient-to-br from-emerald-50 to-teal-50" : "bg-gradient-to-br from-red-50 to-orange-50"} rounded-xl p-6 border ${improvement >= 0 ? "border-emerald-100" : "border-red-100"}`}
              >
                <div className="text-5xl mb-2">{interpretation.icon}</div>
                <p
                  className={`text-5xl font-bold ${improvement >= 0 ? "text-emerald-600" : "text-red-600"}`}
                >
                  {improvement > 0 ? "+" : ""}
                  {improvement}
                </p>
                <p className="text-sm text-slate-600 mt-1">points</p>
                <p className={`text-sm font-medium mt-2 ${interpretation.color}`}>
                  {interpretation.label}
                </p>
              </div>

              {/* Calculation Breakdown */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                  <Calculator className="w-4 h-4 text-cyan-600" />
                  How Progress is Calculated
                </h4>
                <div className="bg-white rounded-lg p-4 border border-slate-100">
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-center flex-1">
                      <p className="text-xs text-slate-500 mb-1">First Session</p>
                      <p className="text-2xl font-bold text-slate-700">{firstScore}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(firstSession?.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <ArrowRight
                        className={`w-6 h-6 ${improvement >= 0 ? "text-emerald-500" : "text-red-500"}`}
                      />
                      <span
                        className={`text-xs font-medium ${improvement >= 0 ? "text-emerald-600" : "text-red-600"}`}
                      >
                        {percentChange}%
                      </span>
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-xs text-slate-500 mb-1">Latest Session</p>
                      <p className="text-2xl font-bold text-slate-700">{lastScore}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(lastSession?.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <p className="font-mono text-sm text-center text-slate-600">
                      Progress = Latest Score − First Score
                    </p>
                    <p
                      className={`font-mono text-center font-bold mt-1 ${improvement >= 0 ? "text-emerald-600" : "text-red-600"}`}
                    >
                      = {lastScore} − {firstScore} = {improvement > 0 ? "+" : ""}
                      {improvement}
                    </p>
                  </div>
                </div>
              </div>

              {/* Score Journey Visualization */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                  <BarChart3 className="w-4 h-4 text-cyan-600" />
                  Your Score Journey
                </h4>
                <div className="relative">
                  {/* Simple bar chart */}
                  <div className="flex items-end justify-between gap-1 h-32">
                    {validSessions.map((session, idx) => {
                      const score = session.score as number;
                      const height = (score / 100) * 100;
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                          <span className="text-xs text-slate-500">{score}</span>
                          <div
                            className={`w-full rounded-t transition-all ${score >= 75
                              ? "bg-emerald-500"
                              : score >= 50
                                ? "bg-teal-500"
                                : score >= 25
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                              }`}
                            style={{ height: `${height}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-slate-400">
                    <span>Oldest</span>
                    <span>Latest</span>
                  </div>
                </div>
              </div>

              {/* Interpretation */}
              <div
                className={`rounded-xl p-4 border ${improvement >= 0 ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200" : "bg-gradient-to-br from-orange-50 to-red-50 border-orange-200"}`}
              >
                <h4
                  className={`font-semibold mb-2 ${improvement >= 0 ? "text-emerald-800" : "text-orange-800"}`}
                >
                  📊 What This Means
                </h4>
                <p
                  className={`text-sm leading-relaxed ${improvement >= 0 ? "text-emerald-700" : "text-orange-700"}`}
                >
                  {interpretation.description}
                </p>
              </div>

              {/* TCM Context */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                <h4 className="font-semibold text-amber-800 mb-2">🌿 TCM Perspective on Progress</h4>
                <p className="text-sm text-amber-700 leading-relaxed">
                  In Traditional Chinese Medicine, health improvement reflects the gradual{" "}
                  <strong>restoration of balance</strong> between Yin and Yang, and the free flow of
                  Qi and Blood. Progress may not always be linear—
                  <strong> healing often occurs in cycles</strong> as the body adjusts. Temporary
                  setbacks during treatment can sometimes indicate the body is actively working to
                  expel pathogens or rebalance energy.
                </p>
              </div>

              {/* Session Timeline */}
              <div>
                <h4 className="font-semibold text-slate-800 mb-3">Session Timeline</h4>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {validSessions
                    .slice()
                    .reverse()
                    .map((session, idx) => {
                      const prevSession = validSessions.slice().reverse()[idx + 1];
                      const change = prevSession
                        ? (session.score as number) - (prevSession.score as number)
                        : 0;
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-100"
                        >
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-600">
                              {new Date(session.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">{session.score}</span>
                            {prevSession && (
                              <span
                                className={`text-xs font-medium ${change > 0 ? "text-emerald-600" : change < 0 ? "text-red-600" : "text-slate-400"}`}
                              >
                                {change > 0 ? "+" : ""}
                                {change !== 0 ? change : "—"}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
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

      {/* Modals */}
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

      {/* New Modals */}
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
