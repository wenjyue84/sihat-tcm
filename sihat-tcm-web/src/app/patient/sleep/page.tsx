"use client";

// Force dynamic rendering to fix NEXT_MISSING_LAMBDA error on Vercel
export const dynamic = "force-dynamic";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/stores/useAppStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Moon, Info, Lightbulb, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { SleepRecorder } from "@/components/patient/sleep/SleepRecorder";
import { SleepCultivationReminder } from "@/components/patient/sleep/SleepCultivationReminder";

export default function SleepPage() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/patient/sleep");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Minimal Header - Apple Style */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-black/5 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/patient")}
              className="text-slate-600 hover:bg-slate-100/50 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Back
            </Button>
            <div className="h-4 w-px bg-slate-200" />
            <div>
              <h1 className="text-[28px] font-medium tracking-tight text-slate-900 leading-[1.2]">
                Sleep Cultivation
              </h1>
              <p className="text-[13px] text-slate-500 mt-0.5 leading-[1.38]">
                AI-powered sleep sound analysis
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Generous Whitespace */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Main Recording Card - Apple Style */}
            <Card className="bg-white border-0 shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-[20px] overflow-hidden">
              <div className="p-10">
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full mb-4">
                    <Moon className="w-4 h-4 text-slate-600" />
                    <span className="text-[13px] font-medium text-slate-700">
                      Current Constitution: Yin Deficiency
                    </span>
                  </div>
                  <h2 className="text-[22px] font-medium text-slate-900 leading-[1.3] mb-2 tracking-tight">
                    Sleep Sound Analysis
                  </h2>
                  <p className="text-[15px] text-slate-600 leading-[1.47] max-w-lg">
                    Using advanced sound patterns to identify TCM disharmonies and sleep quality.
                  </p>
                </div>

                <SleepRecorder />
              </div>
            </Card>

            {/* Info Cards - Subtle, Refined */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-white border-0 shadow-[0_1px_2px_rgba(0,0,0,0.02)] rounded-[18px] p-6">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-[10px] bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Info className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[17px] font-medium text-slate-900 mb-2 leading-[1.47]">
                      TCM Listening Diagnosis
                    </h3>
                    <p className="text-[13px] text-slate-600 leading-[1.38]">
                      In Traditional Chinese Medicine, sleep sounds provide critical clues about the
                      balance of Qi in your organs. Snoring, teeth grinding, or talking in sleep can
                      indicate different disharmonies.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="bg-white border-0 shadow-[0_1px_2px_rgba(0,0,0,0.02)] rounded-[18px] p-6">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-[10px] bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[17px] font-medium text-slate-900 mb-2 leading-[1.47]">
                      Organ Clock
                    </h3>
                    <p className="text-[13px] text-slate-600 leading-[1.38]">
                      Waking up at specific times? 1am–3am: Liver (Detox). 3am–5am: Lungs (Breath).
                      Log your wake-up times to track this pattern.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </motion.div>

          {/* Right Column: Sidebar - Apple Style */}
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
            className="space-y-6"
          >
            {/* Sleep Cultivation Reminders */}
            <SleepCultivationReminder />

            {/* Tips Card */}
            <Card className="bg-white border-0 shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-[20px] overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-8 h-8 rounded-[10px] bg-amber-50 flex items-center justify-center">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                  </div>
                  <h3 className="text-[17px] font-medium text-slate-900 leading-[1.47]">
                    Tips for Better Recording
                  </h3>
                </div>
                <ul className="space-y-3.5">
                  {[
                    "Record in a quiet room",
                    "Place phone near your bed",
                    "Record for at least 30 minutes for best results",
                    "Ensure phone has enough battery",
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[11px] font-medium mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-[13px] text-slate-600 leading-[1.38] flex-1">
                        {tip}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>

            {/* TCM Education Card */}
            <Card className="bg-white border-0 shadow-[0_2px_8px_rgba(0,0,0,0.04)] rounded-[20px] overflow-hidden">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-[10px] bg-indigo-50 flex items-center justify-center">
                    <Info className="w-4 h-4 text-indigo-600" />
                  </div>
                  <h3 className="text-[17px] font-medium text-slate-900 leading-[1.47]">
                    TCM Listening Diagnosis
                  </h3>
                </div>
                <p className="text-[13px] text-slate-600 leading-[1.38]">
                  In Traditional Chinese Medicine (TCM), sleep sounds provide critical clues about
                  the balance of Qi in your organs. Snoring, teeth grinding, or talking in sleep can
                  indicate different disharmonies.
                </p>
              </div>
            </Card>

            {/* Recent Sessions - Empty State */}
            <Card className="bg-white border-0 shadow-[0_1px_2px_rgba(0,0,0,0.02)] rounded-[18px] p-6">
              <h3 className="text-[15px] font-medium text-slate-900 mb-4 leading-[1.47]">
                Recent Sessions
              </h3>
              <div className="text-center py-8">
                <p className="text-[13px] text-slate-500 leading-[1.38]">
                  No sleep sessions recorded yet.
                </p>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
