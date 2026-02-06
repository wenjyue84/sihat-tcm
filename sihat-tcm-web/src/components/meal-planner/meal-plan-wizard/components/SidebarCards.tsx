"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  Calendar,
  Zap,
  Utensils,
  Settings,
  Leaf,
  Sparkles,
  BookOpen,
  Info,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import type { DietaryPreferences } from "@/app/actions/meal-planner";
import { ALLERGIES, DIETARY_TYPES } from "../../DietaryPreferencesForm";
import { QUICK_STATS_DEFAULT, DAILY_WISDOM_TIPS } from "../constants";
import type { DiagnosisData } from "../types";
import { translateConstitution } from "@/lib/translations";
import { extractConstitutionType } from "@/lib/tcm-utils";

interface SidebarCardsProps {
  dietaryPreferences: DietaryPreferences | null;
  latestDiagnosis?: DiagnosisData;
  onEditPreferences: () => void;
  strings: Record<string, unknown>;
  t: Record<string, unknown>;
}

export function WeeklyProgressCard() {
  return (
    <Card className="border border-slate-200 shadow-sm bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-slate-600" />
          Weekly Progress
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-slate-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-500 mb-0.5">Days Completed</p>
            <h5 className="font-semibold text-slate-900">0/7 Days</h5>
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-600">Next Milestone</span>
            <span className="text-slate-500">7 days</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "0%" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-slate-600 rounded-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DietaryBalanceCard() {
  return (
    <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Zap className="w-5 h-5 text-slate-600" />
          Dietary Balance
        </CardTitle>
        <CardDescription className="text-slate-500">
          Your nutritional harmony is building. Keep eating mindfully!
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2 pb-8">
        <div className="relative w-36 h-36 mx-auto">
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-slate-100 rounded-full blur-2xl"
          />
          <svg
            className="absolute inset-0 w-full h-full transform -rotate-90"
            viewBox="0 0 100 100"
          >
            <circle cx="50" cy="50" r="45" fill="none" stroke="rgb(241 245 249)" strokeWidth="6" />
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgb(51 65 85)"
              strokeWidth="6"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 0.45 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <p className="text-3xl font-semibold text-slate-900">45%</p>
              <p className="text-xs font-medium text-slate-500 mt-1">Balanced</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function PreferencesSummaryCard({
  dietaryPreferences,
  onEditPreferences,
  strings: rawStrings,
}: Omit<SidebarCardsProps, "latestDiagnosis" | "t">) {
  const strings = rawStrings as Record<string, string>;
  return (
    <Card className="border border-slate-200 shadow-sm bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Utensils className="w-5 h-5 text-slate-600" />
            {strings.yourPreferences || "Your Preferences"}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            onClick={onEditPreferences}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">{strings.dietaryType}</p>
            <p className="text-slate-900 font-medium">
              {dietaryPreferences?.dietary_type && dietaryPreferences.dietary_type !== "none"
                ? DIETARY_TYPES.find((d) => d.id === dietaryPreferences.dietary_type)
                  ? (strings as Record<string, string>)[
                      DIETARY_TYPES.find((d) => d.id === dietaryPreferences.dietary_type)!.key
                    ]
                  : dietaryPreferences.dietary_type
                : strings.noRestrictions}
            </p>
          </div>

          {dietaryPreferences?.allergies && dietaryPreferences.allergies.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">{strings.allergies}</p>
              <p className="text-slate-900 font-medium">
                {dietaryPreferences.allergies
                  .map((id) => {
                    const allergy = ALLERGIES.find((a) => a.id === id);
                    return allergy ? (strings as Record<string, string>)[allergy.key] : id;
                  })
                  .join(", ")}
              </p>
            </div>
          )}

          {dietaryPreferences?.disliked_foods && dietaryPreferences.disliked_foods.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">{strings.dislikedFoods}</p>
              <p className="text-slate-900 font-medium">
                {dietaryPreferences.disliked_foods.join(", ")}
              </p>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">{strings.servingSize}</p>
            <p className="text-slate-900 font-medium">
              {dietaryPreferences?.serving_size || 1}{" "}
              {dietaryPreferences?.serving_size === 1 ? strings.person : strings.people}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TCMPrinciplesCard() {
  return (
    <Card className="border border-slate-200 shadow-sm bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <Leaf className="w-5 h-5 text-slate-600" />
          TCM Principles
        </CardTitle>
        <CardDescription className="text-slate-500">
          Your meal plan follows traditional Chinese medicine dietary therapy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
            <Utensils className="w-4 h-4 text-slate-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-500 mb-0.5">Balancing</p>
            <h5 className="font-semibold text-slate-900 text-sm">Yin & Yang</h5>
          </div>
        </div>
        <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-slate-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-500 mb-0.5">Therapeutic</p>
            <h5 className="font-semibold text-slate-900 text-sm">Food as Medicine</h5>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DailyWisdomCard() {
  const todayTip = DAILY_WISDOM_TIPS[0];
  return (
    <Card className="border border-slate-200 shadow-sm bg-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-slate-600" />
          Daily Wisdom
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
            <Info className="w-5 h-5 text-slate-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-medium text-slate-500 mb-0.5">Today's Tip</p>
            <h5 className="font-semibold text-slate-900 text-sm">{todayTip.title}</h5>
            <p className="text-xs text-slate-600 mt-1">{todayTip.description}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-600">Next Tip</span>
            <span className="text-slate-500">Tomorrow</span>
          </div>
          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "60%" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-full bg-slate-600 rounded-full"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ConstitutionInfoCard({
  latestDiagnosis,
  t,
}: Pick<SidebarCardsProps, "latestDiagnosis" | "t">) {
  if (!latestDiagnosis) return null;

  const constitutionName =
    typeof latestDiagnosis.constitution === "object"
      ? latestDiagnosis.constitution?.name
      : latestDiagnosis.constitution;

  return (
    <Card className="border border-slate-200 shadow-sm bg-white">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            <Calendar className="w-4 h-4 text-slate-600" />
          </div>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Your Constitution
          </span>
        </div>
        <h4 className="text-base font-semibold text-slate-900 mb-2">
          {translateConstitution(
            extractConstitutionType(constitutionName),
            t as Record<string, unknown>
          )}
        </h4>
        <p className="text-sm text-slate-600 leading-relaxed">
          Your meal plan is personalized based on your TCM constitution type.
        </p>
      </CardContent>
    </Card>
  );
}

export function QuickStatsCard() {
  return (
    <Card className="border border-slate-200 shadow-sm bg-white">
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-slate-100 rounded-lg">
            <TrendingUp className="w-4 h-4 text-slate-600" />
          </div>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            Quick Stats
          </span>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Meals Planned</span>
            <span className="text-sm font-semibold text-slate-900">
              {QUICK_STATS_DEFAULT.mealsPlanned}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Recipes Available</span>
            <span className="text-sm font-semibold text-slate-900">
              {QUICK_STATS_DEFAULT.recipesAvailable}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600">Shopping Items</span>
            <span className="text-sm font-semibold text-slate-900">
              {QUICK_STATS_DEFAULT.shoppingItems}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
