"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { extractConstitutionType } from "@/lib/tcm-utils";
import { useLanguage } from "@/stores/useAppStore";

interface ConstitutionCardProps {
  latestConstitution?: string | null;
  latestConstitutionData?: {
    primary_diagnosis?: string;
    recommendations?: {
      lifestyle?: string[];
      dietary_advice?: {
        foods_to_eat?: string[];
        foods_to_avoid?: string[];
      };
    };
    created_at?: string;
  };
}

// Five Elements color gradients based on TCM constitution types
const constitutionColors: Record<string, { from: string; to: string; accent: string }> = {
  // 湿热质 (Damp-Heat) - Red/Yellow (Fire + Earth)
  湿热质: { from: "from-red-500", to: "to-amber-500", accent: "text-red-700" },
  "Damp-Heat": { from: "from-red-500", to: "to-amber-500", accent: "text-red-700" },

  // 气虚质 (Qi Deficiency) - Pale yellow/White (weak Earth)
  气虚质: { from: "from-slate-300", to: "to-amber-200", accent: "text-slate-600" },
  "Qi Deficiency": { from: "from-slate-300", to: "to-amber-200", accent: "text-slate-600" },

  // 阳虚质 (Yang Deficiency) - Cool blue/Gray (lack of Fire)
  阳虚质: { from: "from-slate-400", to: "to-blue-300", accent: "text-slate-700" },
  "Yang Deficiency": { from: "from-slate-400", to: "to-blue-300", accent: "text-slate-700" },

  // 阴虚质 (Yin Deficiency) - Warm Red/Orange (excess Fire)
  阴虚质: { from: "from-orange-400", to: "to-rose-500", accent: "text-rose-700" },
  "Yin Deficiency": { from: "from-orange-400", to: "to-rose-500", accent: "text-rose-700" },

  // 痰湿质 (Phlegm-Dampness) - Earth tones
  痰湿质: { from: "from-amber-600", to: "to-yellow-700", accent: "text-amber-800" },
  "Phlegm-Dampness": { from: "from-amber-600", to: "to-yellow-700", accent: "text-amber-800" },

  // 血瘀质 (Blood Stasis) - Deep purple/Dark red
  血瘀质: { from: "from-purple-700", to: "to-rose-800", accent: "text-purple-900" },
  "Blood Stasis": { from: "from-purple-700", to: "to-rose-800", accent: "text-purple-900" },

  // 气郁质 (Qi Stagnation) - Green (Liver/Wood element)
  气郁质: { from: "from-teal-500", to: "to-emerald-600", accent: "text-emerald-800" },
  "Qi Stagnation": { from: "from-teal-500", to: "to-emerald-600", accent: "text-emerald-800" },

  // 特禀质 (Special Constitution) - Mixed/Vibrant
  特禀质: { from: "from-violet-500", to: "to-fuchsia-500", accent: "text-violet-700" },
  "Special Constitution": {
    from: "from-violet-500",
    to: "to-fuchsia-500",
    accent: "text-violet-700",
  },

  // 平和质 (Balanced Constitution) - Harmonious green/blue
  平和质: { from: "from-emerald-400", to: "to-cyan-500", accent: "text-emerald-700" },
  Balanced: { from: "from-emerald-400", to: "to-cyan-500", accent: "text-emerald-700" },
  General: { from: "from-emerald-400", to: "to-cyan-500", accent: "text-emerald-700" },
};

// Extract key characteristics from diagnosis
function extractKeyCharacteristics(
  constitutionData: ConstitutionCardProps["latestConstitutionData"]
): string[] {
  const characteristics: string[] = [];

  if (!constitutionData) return characteristics;

  // Try to extract from lifestyle recommendations
  if (
    constitutionData.recommendations?.lifestyle &&
    constitutionData.recommendations.lifestyle.length > 0
  ) {
    // Take first 2-3 items and simplify them
    characteristics.push(
      ...constitutionData.recommendations.lifestyle.slice(0, 3).map((item) => {
        // Simplify long recommendations to key phrases
        if (item.length > 40) {
          return item.substring(0, 37) + "...";
        }
        return item;
      })
    );
  }

  return characteristics;
}

export function ConstitutionCard({
  latestConstitution,
  latestConstitutionData,
}: ConstitutionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();
  const { t } = useLanguage();

  const constitutionType = latestConstitution ? extractConstitutionType(latestConstitution) : null;
  const characteristics = extractKeyCharacteristics(latestConstitutionData);

  // Normalize type to match keys (remove " Constitution" suffix if present)
  const normalizedType = constitutionType?.replace(/ Constitution$/i, "").trim();

  // Get color scheme based on constitution type
  const colorScheme = normalizedType
    ? constitutionColors[normalizedType] || constitutionColors["General"]
    : constitutionColors["General"];

  // If no constitution data, show "Start Diagnosis" card
  if (!constitutionType || constitutionType === "General") {
    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6"
      >
        <Card className="relative overflow-hidden border-none shadow-xl">
          <div
            className={`absolute inset-0 bg-gradient-to-br ${colorScheme.from} ${colorScheme.to} opacity-90`}
          />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-24 -mb-24" />

          <div className="relative p-8 flex flex-col md:flex-row items-center justify-between gap-6 text-white">
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-bold uppercase tracking-wider opacity-90">
                  {t.patientDashboard.constitutionCard?.title || "My Constitution"}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black mb-3 tracking-tight">
                {t.patientDashboard.constitutionCard?.noDiagnosisTitle ||
                  "Discover Your TCM Constitution"}
              </h2>
              <p className="text-white/90 text-sm md:text-base max-w-2xl">
                {t.patientDashboard.constitutionCard?.noDiagnosisDesc ||
                  "Start your TCM diagnosis journey to understand your unique body constitution and receive personalized health recommendations."}
              </p>
            </div>
            <Button
              onClick={() => router.push("/")}
              size="lg"
              className="bg-white text-emerald-700 hover:bg-emerald-50 font-bold px-8 py-6 rounded-2xl h-auto shadow-xl border-none whitespace-nowrap"
            >
              {t.patientDashboard.constitutionCard?.startAssessment ||
                "Start Constitution Assessment"}
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Main constitution card with data
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-6"
    >
      <Card className="relative overflow-hidden border-none shadow-xl hover:shadow-2xl transition-shadow duration-300">
        {/* Gradient Background */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${colorScheme.from} ${colorScheme.to} opacity-90`}
        />

        {/* Animated Background Elements */}
        <motion.div
          className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -ml-24 -mb-24"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />

        <div className="relative p-6 md:p-8">
          {/* Main Card Content */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-white">
            {/* Left: Constitution Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider opacity-90">
                  {t.patientDashboard.constitutionCard?.title || "My Constitution"}
                </span>
              </div>

              <h2 className="text-3xl md:text-4xl font-black mb-4 tracking-tight">
                {constitutionType}
              </h2>

              {/* Key Characteristics */}
              {characteristics.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {characteristics.map((char, index) => (
                    <motion.span
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * index }}
                      className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-sm font-medium"
                    >
                      {char}
                    </motion.span>
                  ))}
                </div>
              )}

              {/* Learn More Button */}
              <Button
                variant="ghost"
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-white hover:bg-white/20 gap-2 -ml-3 mt-2"
              >
                {isExpanded
                  ? t.patientDashboard.constitutionCard?.hideDetails || "Hide Details"
                  : t.patientDashboard.constitutionCard?.learnMore || "Learn More"}
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>
            </div>

            {/* Right: Icon/Illustration */}
            <div className="hidden md:block">
              <motion.div
                className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center"
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Sparkles className="w-16 h-16 text-white" />
              </motion.div>
            </div>
          </div>

          {/* Expanded Details */}
          <AnimatePresence>
            {isExpanded && latestConstitutionData && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6 pt-6 border-t border-white/20 text-white"
              >
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Dietary Recommendations */}
                  {latestConstitutionData.recommendations?.dietary_advice && (
                    <div>
                      <h3 className="font-bold text-lg mb-3">
                        {t.patientDashboard.constitutionCard?.dietaryAdvice || "Dietary Advice"}
                      </h3>

                      {latestConstitutionData.recommendations.dietary_advice.foods_to_eat && (
                        <div className="mb-4">
                          <p className="text-sm font-semibold opacity-90 mb-2">
                            {t.patientDashboard.constitutionCard?.foodsToEat || "Foods to Eat"}
                          </p>
                          <ul className="text-sm space-y-1 opacity-80">
                            {latestConstitutionData.recommendations.dietary_advice.foods_to_eat
                              .slice(0, 4)
                              .map((food, index) => (
                                <li key={index}>• {food}</li>
                              ))}
                          </ul>
                        </div>
                      )}

                      {latestConstitutionData.recommendations.dietary_advice.foods_to_avoid && (
                        <div>
                          <p className="text-sm font-semibold opacity-90 mb-2">
                            {t.patientDashboard.constitutionCard?.foodsToAvoid || "Foods to Avoid"}
                          </p>
                          <ul className="text-sm space-y-1 opacity-80">
                            {latestConstitutionData.recommendations.dietary_advice.foods_to_avoid
                              .slice(0, 4)
                              .map((food, index) => (
                                <li key={index}>• {food}</li>
                              ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Lifestyle Recommendations */}
                  {latestConstitutionData.recommendations?.lifestyle && (
                    <div>
                      <h3 className="font-bold text-lg mb-3">
                        {t.patientDashboard.constitutionCard?.lifestyleAdvice ||
                          "Lifestyle Recommendations"}
                      </h3>
                      <ul className="text-sm space-y-2 opacity-90">
                        {latestConstitutionData.recommendations.lifestyle
                          .slice(0, 5)
                          .map((tip, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="mt-1">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* View Full Report Button */}
                {latestConstitutionData.created_at && (
                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm opacity-75">
                      {t.patientDashboard.constitutionCard?.lastAssessed || "Last assessed"}:{" "}
                      {new Date(latestConstitutionData.created_at).toLocaleDateString()}
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => router.push("/")}
                      className="bg-white/10 text-white border-white/30 hover:bg-white/20 backdrop-blur-md"
                    >
                      {t.patientDashboard.constitutionCard?.getNewAssessment ||
                        "Get New Assessment"}
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </motion.div>
  );
}
