"use client";

import { useState, useEffect } from "react";
import {
  generateMealPlan,
  getActiveMealPlan,
  getDietaryPreferences,
  DietaryPreferences,
} from "@/app/actions/meal-planner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  Sparkles,
  UtensilsCrossed,
  RefreshCw,
  Settings,
  ChefHat,
  Calendar,
  CheckCircle,
  Leaf,
  Utensils,
  Trophy,
  BookOpen,
  TrendingUp,
  Zap,
  Info,
} from "lucide-react";
import { WeeklyCalendarView } from "./WeeklyCalendarView";
import { DietaryPreferencesForm } from "./DietaryPreferencesForm";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/stores/useAppStore";
import { translateConstitution } from "@/lib/translations";
import { ALLERGIES, DIETARY_TYPES } from "./DietaryPreferencesForm";
import { extractConstitutionType } from "@/lib/tcm-utils";

interface MealPlanWizardProps {
  latestDiagnosis?: any;
  dietaryPreferences?: DietaryPreferences | null;
}

export function MealPlanWizard({
  latestDiagnosis,
  dietaryPreferences: externalPreferences,
}: MealPlanWizardProps) {
  const [mealPlan, setMealPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dietaryPreferences, setDietaryPreferences] = useState<DietaryPreferences | null>(
    externalPreferences || null
  );
  const [showPreferencesForm, setShowPreferencesForm] = useState(false);
  const { t } = useLanguage();
  const strings = t.patientDashboard.mealPlanner;

  // Update preferences when external preferences change
  useEffect(() => {
    if (externalPreferences) {
      setDietaryPreferences(externalPreferences);
    }
  }, [externalPreferences]);

  // Load existing plan on mount
  useEffect(() => {
    async function loadData() {
      try {
        // Load active meal plan
        const planResult = await getActiveMealPlan();
        if (planResult.success && planResult.data) {
          setMealPlan(planResult.data);
        }
      } catch (err) {
        console.error("[MealPlanWizard] Error loading data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Generate new meal plan
  const handleGenerate = async () => {
    if (!latestDiagnosis) {
      setError("Please complete a TCM diagnosis first to generate a personalized meal plan.");
      return;
    }

    setGenerating(true);
    setError(null);

    const messages = [
      "🔍 Analyzing your TCM constitution...",
      "🌿 Selecting harmonizing ingredients...",
      "⚖️ Balancing Yin and Yang energies...",
      "🍲 Creating your personalized menu...",
      "✨ Adding therapeutic recipes...",
      "📋 Organizing your shopping list...",
    ];

    let messageIndex = 0;
    setLoadingMessage(messages[0]);

    const interval = setInterval(() => {
      messageIndex = (messageIndex + 1) % messages.length;
      setLoadingMessage(messages[messageIndex]);
    }, 2500);

    try {
      const result = await generateMealPlan({
        diagnosisReport: latestDiagnosis,
        sessionId: latestDiagnosis?.id || latestDiagnosis?.session_id,
        dietaryPreferences: dietaryPreferences || undefined,
      });

      clearInterval(interval);

      if (result.success) {
        setMealPlan(result.data);
        setError(null);
      } else {
        setError(result.error || "Failed to generate meal plan");
      }
    } catch (err: any) {
      clearInterval(interval);
      setError(err.message || "An unexpected error occurred");
    } finally {
      setGenerating(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-slate-600" />
          <p className="text-base text-slate-600 font-light">{t.common.loading}</p>
        </div>
      </div>
    );
  }

  // Show existing meal plan
  if (mealPlan && !generating) {
    return <WeeklyCalendarView mealPlan={mealPlan} onRefresh={() => setMealPlan(null)} />;
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
            onSaved={(prefs) => {
              setDietaryPreferences(prefs);
              setShowPreferencesForm(false);
            }}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  // Empty state - generate new plan
  return (
    <div className="space-y-10 animate-in fade-in-50 slide-in-from-bottom-2 duration-500">
      {/* Header Section - Matching QiDose Style */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-semibold text-slate-900 tracking-tight mb-2">
            {strings.title}
          </h1>
          <p className="text-lg text-slate-600 font-normal">
            {strings.subtitle}
          </p>
        </div>

        {mealPlan && (
          <div className="flex items-center gap-3 bg-white/80 backdrop-blur-xl p-3 rounded-2xl shadow-sm border border-slate-200/50">
            <div className="text-right">
              <p className="text-xs font-medium text-slate-500">
                Days Completed
              </p>
              <p className="text-lg font-semibold text-slate-900">
                {mealPlan.progress || 0}/7
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-slate-700" />
            </div>
          </div>
        )}
      </div>

      {generating ? (
        // Generating state - Matching QiDose Style
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
              <CardContent className="p-10">
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-slate-50 flex items-center justify-center">
                    <UtensilsCrossed className="w-10 h-10 text-slate-600 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-semibold text-slate-900 tracking-tight">
                      Creating Your Personalized Meal Plan
                    </h3>
                    <p className="text-base text-slate-600 font-light">{loadingMessage}</p>
                  </div>
                  <div className="w-64 h-1.5 mx-auto bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-slate-600 rounded-full"
                      initial={{ width: "0%" }}
                      animate={{ width: "70%" }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                    />
                  </div>
                  <p className="text-sm text-slate-500 font-light">
                    This usually takes 10-15 seconds...
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Matching QiDose Style */}
          <div className="space-y-6">
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
          </div>
        </div>
      ) : (
        // Initial state - Matching QiDose Grid Layout
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Action Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Ready to Generate Section */}
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
                          translateConstitution(
                            extractConstitutionType(
                              latestDiagnosis?.constitution?.name || latestDiagnosis?.constitution
                            ),
                            t
                          )
                        )
                      : "Complete a TCM diagnosis to get started"}
                  </p>
                </div>
              </div>

              {/* Generate Button Card */}
              <motion.button
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                disabled={!latestDiagnosis}
                onClick={handleGenerate}
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
                          {latestDiagnosis ? "Personalized Plan" : "Diagnosis Required"}
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
                        {latestDiagnosis ? "Start Generation" : "Complete Diagnosis First"}
                      </span>
                    </div>
                  </div>

                  {/* Decorative Element */}
                  <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-gradient-to-br from-slate-50 to-slate-100 rounded-full opacity-20 group-hover:opacity-30 transition-opacity duration-300" />
                </div>
              </motion.button>

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

          {/* Preferences & Info Sidebar - Matching QiDose Style */}
          <div className="space-y-6">
            {/* Weekly Progress Card - Similar to Cultivation Streak */}
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

            {/* Dietary Balance Indicator - Similar to Dan Tian Filling */}
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
                  {/* Subtle background glow */}
                  <motion.div
                    animate={{
                      scale: [1, 1.05, 1],
                      opacity: [0.2, 0.3, 0.2],
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-slate-100 rounded-full blur-2xl"
                  />
                  {/* SVG Progress ring */}
                  <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    {/* Background circle */}
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="rgb(241 245 249)"
                      strokeWidth="6"
                    />
                    {/* Progress circle */}
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
                  {/* Center content */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-3xl font-semibold text-slate-900">45%</p>
                      <p className="text-xs font-medium text-slate-500 mt-1">Balanced</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preferences Summary Card */}
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
                    onClick={() => setShowPreferencesForm(true)}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">
                      {strings.dietaryType}
                    </p>
                    <p className="text-slate-900 font-medium">
                      {dietaryPreferences?.dietary_type &&
                      dietaryPreferences.dietary_type !== "none"
                        ? DIETARY_TYPES.find((d) => d.id === dietaryPreferences.dietary_type)
                          ? (strings as any)[
                              DIETARY_TYPES.find((d) => d.id === dietaryPreferences.dietary_type)!
                                .key
                            ]
                          : dietaryPreferences.dietary_type
                        : strings.noRestrictions}
                    </p>
                  </div>

                  {dietaryPreferences?.allergies && dietaryPreferences.allergies.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-500 mb-1">
                        {strings.allergies}
                      </p>
                      <p className="text-slate-900 font-medium">
                        {dietaryPreferences.allergies
                          .map((id) => {
                            const allergy = ALLERGIES.find((a) => a.id === id);
                            return allergy ? (strings as any)[allergy.key] : id;
                          })
                          .join(", ")}
                      </p>
                    </div>
                  )}

                  {dietaryPreferences?.disliked_foods &&
                    dietaryPreferences.disliked_foods.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-slate-500 mb-1">
                          {strings.dislikedFoods}
                        </p>
                        <p className="text-slate-900 font-medium">
                          {dietaryPreferences.disliked_foods.join(", ")}
                        </p>
                      </div>
                    )}

                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1">
                      {strings.servingSize}
                    </p>
                    <p className="text-slate-900 font-medium">
                      {dietaryPreferences?.serving_size || 1}{" "}
                      {dietaryPreferences?.serving_size === 1 ? strings.person : strings.people}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* TCM Principles Card */}
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

            {/* Daily TCM Wisdom Card - Similar to Unlock Scrolls */}
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
                    <h5 className="font-semibold text-slate-900 text-sm">
                      Eat warm foods in winter
                    </h5>
                    <p className="text-xs text-slate-600 mt-1">
                      Warming foods like ginger and cinnamon help maintain body heat during cold
                      seasons.
                    </p>
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

            {/* Constitution Info Card */}
            {latestDiagnosis && (
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
                      extractConstitutionType(
                        latestDiagnosis?.constitution?.name || latestDiagnosis?.constitution
                      ),
                      t
                    )}
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Your meal plan is personalized based on your TCM constitution type.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Quick Stats Card */}
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
                    <span className="text-sm font-semibold text-slate-900">0</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Recipes Available</span>
                    <span className="text-sm font-semibold text-slate-900">28+</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600">Shopping Items</span>
                    <span className="text-sm font-semibold text-slate-900">—</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
