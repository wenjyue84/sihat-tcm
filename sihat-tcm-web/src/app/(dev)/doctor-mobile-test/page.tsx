"use client";

/**
 * Doctor Dashboard Mobile Layout Test Page
 *
 * Isolated test page to verify responsive fixes for:
 * - DashboardStatsCards horizontal scroll
 * - InquiryFilters touch targets
 * - InquiryCard touch targets and layout
 *
 * Test with Chrome DevTools → Device Toolbar:
 * - iPhone 12 Pro (390px)
 * - iPad (768px)
 * - Desktop (1280px+)
 */

import { useState } from "react";
import { DashboardStatsCards } from "@/components/doctor/dashboard";
import { InquiryFilters, InquiryCard } from "@/components/doctor/shared";
import type { Inquiry } from "@/lib/mock/doctorDashboard";
import type { PatientFlag } from "@/types/database";

// Mock data for testing
const mockStats = {
  uniquePatients: 42,
  total: 156,
  recent: 12,
};

const mockInquiry: Inquiry = {
  id: "test-1",
  created_at: new Date().toISOString(),
  symptoms:
    "Patient reports persistent headaches, fatigue, and occasional dizziness. Symptoms worsen in the afternoon.",
  diagnosis_report: {
    summary: "Liver Qi Stagnation with Spleen Deficiency",
    tcmPattern: "肝郁脾虚 - Gan Yu Pi Xu",
    recommendations: ["Rest adequately", "Avoid cold foods"],
    tongueObservation: "Pale with teeth marks",
    pulseObservation: "Wiry and thin",
  },
  profiles: {
    id: "profile-1",
    full_name: "Sarah Chen",
    gender: "female",
    age: 34,
    flag: "Watch" as PatientFlag,
  },
};

const mockInquiryNullData: Inquiry = {
  id: "test-2",
  created_at: new Date().toISOString(),
  symptoms: "",
  diagnosis_report: null,
  profiles: null,
};

const symptomTags = ["Headache", "Fatigue", "Insomnia", "Digestive Issues", "Pain", "Anxiety"];

export default function DoctorMobileTestPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [symptomFilter, setSymptomFilter] = useState("");
  const [flagFilter, setFlagFilter] = useState<PatientFlag | "All">("All");
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = !!(
    searchQuery ||
    dateFrom ||
    dateTo ||
    symptomFilter ||
    flagFilter !== "All"
  );

  const clearFilters = () => {
    setSearchQuery("");
    setDateFrom("");
    setDateTo("");
    setSymptomFilter("");
    setFlagFilter("All");
  };

  return (
    <div className="min-h-screen bg-slate-50 pt-4 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Page Header */}
        <header className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            📱 Doctor Dashboard - Mobile Test
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Open DevTools → Device Toolbar to test responsive layouts
          </p>
        </header>

        {/* Test Section: Stats Cards */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs">
              1
            </span>
            Stats Cards (Horizontal Scroll on Mobile)
          </h2>
          <DashboardStatsCards stats={mockStats} />
          <p className="text-xs text-slate-400 mt-2">
            ✅ Should scroll horizontally on mobile with snap points
          </p>
        </section>

        {/* Test Section: Filters */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs">
              2
            </span>
            Filters (44px Touch Targets)
          </h2>
          <InquiryFilters
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            dateFrom={dateFrom}
            setDateFrom={setDateFrom}
            dateTo={dateTo}
            setDateTo={setDateTo}
            symptomFilter={symptomFilter}
            setSymptomFilter={setSymptomFilter}
            flagFilter={flagFilter}
            setFlagFilter={setFlagFilter}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            clearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
            symptomTags={symptomTags}
          />
          <p className="text-xs text-slate-400 mt-2">
            ✅ All buttons should be easy to tap with thumb (44px height on mobile)
          </p>
        </section>

        {/* Test Section: Inquiry Cards */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-xs">
              3
            </span>
            Inquiry Cards (Touch Targets + Layout)
          </h2>

          <div className="space-y-4">
            {/* Normal Card */}
            <div>
              <p className="text-xs text-slate-500 mb-2">With full data:</p>
              <InquiryCard
                inquiry={mockInquiry}
                variant="dashboard"
                onUpdateFlag={(id, flag) => console.log("Flag update:", id, flag)}
              />
            </div>

            {/* Card with report variant */}
            <div>
              <p className="text-xs text-slate-500 mb-2">
                Report variant (with View Full Report button):
              </p>
              <InquiryCard inquiry={mockInquiry} variant="report" />
            </div>

            {/* Edge case: null data */}
            <div>
              <p className="text-xs text-slate-500 mb-2">Edge case (null/missing data):</p>
              <InquiryCard inquiry={mockInquiryNullData} variant="dashboard" />
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-4">
            ✅ Avatar, flag badge, and buttons should have adequate touch targets
          </p>
        </section>

        {/* Verification Checklist */}
        <section className="bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">🔍 Verification Checklist</h2>
          <ul className="space-y-2 text-sm text-slate-600">
            <li className="flex items-start gap-2">
              <input type="checkbox" className="mt-1 accent-green-500" />
              <span>Stats cards scroll horizontally on mobile (390px)</span>
            </li>
            <li className="flex items-start gap-2">
              <input type="checkbox" className="mt-1 accent-green-500" />
              <span>Stats cards snap to center when scrolling</span>
            </li>
            <li className="flex items-start gap-2">
              <input type="checkbox" className="mt-1 accent-green-500" />
              <span>Filter button is 44px tall on mobile</span>
            </li>
            <li className="flex items-start gap-2">
              <input type="checkbox" className="mt-1 accent-green-500" />
              <span>Urgency/symptom buttons scroll horizontally</span>
            </li>
            <li className="flex items-start gap-2">
              <input type="checkbox" className="mt-1 accent-green-500" />
              <span>Buttons have visible tap feedback (active:scale-95)</span>
            </li>
            <li className="flex items-start gap-2">
              <input type="checkbox" className="mt-1 accent-green-500" />
              <span>InquiryCard header stacks on mobile</span>
            </li>
            <li className="flex items-start gap-2">
              <input type="checkbox" className="mt-1 accent-green-500" />
              <span>&quot;View Full Report&quot; button is 44px tall on mobile</span>
            </li>
            <li className="flex items-start gap-2">
              <input type="checkbox" className="mt-1 accent-green-500" />
              <span>Null data card shows graceful fallbacks</span>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
