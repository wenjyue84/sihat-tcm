"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { useLanguage } from "@/stores/useAppStore";
import { translateConstitution } from "@/lib/translations";
import { extractConstitutionType } from "@/lib/tcm-utils";

import { WeeklyCalendarView } from "../WeeklyCalendarView";
import { DietaryPreferencesForm } from "../DietaryPreferencesForm";

import { useMealPlanWizard } from "./hooks";
import {
  LoadingState,
  GeneratingState,
  GenerateButton,
  WeeklyProgressCard,
  DietaryBalanceCard,
  PreferencesSummaryCard,
  TCMPrinciplesCard,
  DailyWisdomCard,
  ConstitutionInfoCard,
  QuickStatsCard,
} from "./components";
import type { MealPlanWizardProps } from "./types";

export function MealPlanWizard({
  latestDiagnosis,
  dietaryPreferences: externalPreferences,
}: MealPlanWizardProps) {
  const { t } = useLanguage();
  const strings = t.patientDashboard.mealPlanner;

  const {
    mealPlan,
    loading,
    generating,
    loadingMessage,
    error,
    dietaryPreferences,
    showPreferencesForm,
    setShowPreferencesForm,
    handleGenerate,
    handlePreferencesSaved,
    clearMealPlan,
  } = useMealPlanWizard({ latestDiagnosis, externalPreferences });

  // Loading state
  if (loading) {
    return <LoadingState message={t.common.loading} />;
  }

  // Show existing meal plan
  if (mealPlan && !generating) {
    return <WeeklyCalendarView mealPlan={mealPlan} onRefresh={clearMealPlan} />;
  }

  // Preferences Form State
  if ((!dietaryPreferences || showPreferencesForm) && !generating) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <DietaryPreferencesForm
            initialPreferences={dietaryPreferences}
            onSaved={handlePreferencesSaved}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  const constitutionName =
    typeof latestDiagnosis?.constitution === "object"
      ? latestDiagnosis?.constitution?.name
      : latestDiagnosis?.constitution;

  // Main wizard view
  return (
    <div className="space-y-10 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-semibold text-slate-900 tracking-tight mb-2">
            {strings.title}
          </h1>
          <p className="text-lg text-slate-600 font-normal">{strings.subtitle}</p>
        </div>

        {mealPlan && (
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-xl p-3 rounded-2xl shadow-sm border border-slate-200/50">
            <div className="text-right">
              <p className="text-xs font-medium text-slate-500">Days Completed</p>
              <p className="text-lg font-semibold text-slate-900">{mealPlan.progress || 0}/7</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-slate-700" />
            </div>
          </div>
        )}
      </div>

      {generating ? (
        <GeneratingState loadingMessage={loadingMessage} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Action Area */}
          <div className="lg:col-span-2 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900 mb-1">
                    {strings.readyToGenerate || "Ready to Generate"}
                  </h2>
                  <p className="text-sm text-slate-500">
                    {latestDiagnosis
                      ? strings.generateDescription.replace(
                          "{constitution}",
                          translateConstitution(extractConstitutionType(constitutionName), t)
                        )
                      : "Complete a TCM diagnosis to get started"}
                  </p>
                </div>
              </div>

              <GenerateButton
                hasLatestDiagnosis={!!latestDiagnosis}
                onGenerate={handleGenerate}
                strings={strings}
              />

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm"
                >
                  {error}
                </motion.div>
              )}

              {!latestDiagnosis && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800"
                >
                  {strings.completeDiagnosisFirst}
                </motion.div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <WeeklyProgressCard />
            <DietaryBalanceCard />
            <PreferencesSummaryCard
              dietaryPreferences={dietaryPreferences}
              onEditPreferences={() => setShowPreferencesForm(true)}
              strings={strings}
            />
            <TCMPrinciplesCard />
            <DailyWisdomCard />
            <ConstitutionInfoCard latestDiagnosis={latestDiagnosis} t={t} />
            <QuickStatsCard />
          </div>
        </div>
      )}
    </div>
  );
}
