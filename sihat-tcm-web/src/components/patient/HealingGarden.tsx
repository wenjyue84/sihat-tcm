"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  MessageCircle,
  Heart,
  Camera,
  Send,
  Sparkles,
  CheckCircle2,
  Plus,
  Image as ImageIcon,
  Award,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/stores/useAppStore";
import { useAuth } from "@/stores/useAppStore";
import { FiveElementsRadar } from "./FiveElementsRadar";
import { TrendWidget } from "./TrendWidget";

// No mock data needed for refined view

interface HealingGardenProps {
  userConstitution?: string;
  sessions?: any[]; // We can improve type safety later if needed, or import DiagnosisSession
  loading?: boolean;
  showHealthVitality?: boolean; // Show the Health Vitality stats / Digital Twin section
}

export function HealingGarden({
  userConstitution = "dampHeat",
  sessions = [],
  loading = false,
  showHealthVitality = false,
}: HealingGardenProps) {
  const { t } = useLanguage();
  const { profile } = useAuth();

  // Calculate trendData from sessions for TrendWidget
  const trendData = useMemo(() => {
    if (!sessions || sessions.length === 0) return null;

    const validSessions = sessions.filter(
      (s: any) => s.overall_score !== null && s.overall_score !== undefined
    );

    if (validSessions.length === 0) return null;

    const scores = validSessions.map((s: any) => s.overall_score as number);
    const averageScore = Math.round(
      scores.reduce((a: number, b: number) => a + b, 0) / scores.length
    );

    // Calculate improvement (latest - first)
    const sortedByDate = [...validSessions].sort(
      (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const firstScore = sortedByDate[0]?.overall_score || 0;
    const lastScore = sortedByDate[sortedByDate.length - 1]?.overall_score || 0;
    const improvement = sortedByDate.length >= 2 ? lastScore - firstScore : null;

    // Count diagnoses
    const diagnosisCounts: Record<string, number> = {};
    validSessions.forEach((s: any) => {
      const diagnosis = s.primary_diagnosis || "Unknown";
      diagnosisCounts[diagnosis] = (diagnosisCounts[diagnosis] || 0) + 1;
    });

    return {
      sessionCount: validSessions.length,
      averageScore,
      improvement,
      diagnosisCounts,
      sessions: validSessions.map((s: any) => ({
        score: s.overall_score,
        date: s.created_at,
      })),
    };
  }, [sessions]);

  return (
    <div className="space-y-8">
      {/* Health Vitality Stats with Digital Twin - Only shown when showHealthVitality is true */}
      {showHealthVitality && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <TrendWidget trendData={trendData} loading={loading} sessions={sessions} />
        </motion.div>
      )}

      {/* Five Elements Radar Chart - NEW */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <FiveElementsRadar
          constitutionType={userConstitution}
          diagnosisData={sessions[0]?.full_report}
          // Use latest session if available
        />
      </motion.div>
    </div>
  );
}
