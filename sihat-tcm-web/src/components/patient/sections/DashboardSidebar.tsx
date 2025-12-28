"use client";

import {
  Activity,
  Grid3X3,
  User,
  UtensilsCrossed,
  Moon,
  Wind,
  Users,
  FileText,
  Settings,
  Heart,
  MessageSquare,
  Search,
  Pill,
  X,
} from "lucide-react";
import { ActiveSection } from "../hooks/usePatientDashboardState";

interface DashboardSidebarProps {
  activeSection: ActiveSection;
  onSectionChange: (section: ActiveSection) => void;
  isMobileMenuOpen: boolean;
  onMobileMenuClose: () => void;
  t: Record<string, unknown>; // Translation object
}

/**
 * Sidebar navigation component for patient dashboard
 * Extracted from UnifiedDashboard for better organization
 */
export function DashboardSidebar({
  activeSection,
  onSectionChange,
  isMobileMenuOpen,
  onMobileMenuClose,
  t,
}: DashboardSidebarProps) {
  const handleSectionClick = (section: ActiveSection) => {
    onSectionChange(section);
    onMobileMenuClose();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden animate-in fade-in duration-200"
          onClick={onMobileMenuClose}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 z-40 shadow-sm transition-transform duration-300 ease-in-out fixed inset-y-0 left-0 md:relative md:translate-x-0 h-full ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white">
              <Heart className="w-4 h-4" />
            </div>
            <span className="font-bold text-lg tracking-tight">
              Patient <span className="text-emerald-600">Portal</span>
            </span>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={onMobileMenuClose}
            className="md:hidden text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="space-y-6">
            {/* Group 1: Diagnosis Assessment */}
            <div>
              <div className="flex items-center gap-2 px-4 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Search className="w-3.5 h-3.5 text-blue-500" />
                {t.patientDashboard?.navigation?.groupAssessment || "Assessment"}
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => handleSectionClick("journey")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === "journey"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  {t.patientDashboard?.tabs?.healthJourney || "Health Journey"}
                </button>
                <button
                  onClick={() => handleSectionClick("five-elements")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === "five-elements"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                  {t.patientDashboard.tabs.fiveElements || "Circle of Health"}
                </button>
                <button
                  onClick={() => handleSectionClick("profile")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === "profile"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <User className="w-4 h-4" />
                  {t.patientDashboard.tabs.profile}
                </button>
              </div>
            </div>

            {/* Group 2: Treatment Plan */}
            <div>
              <div className="flex items-center gap-2 px-4 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Pill className="w-3.5 h-3.5 text-amber-500" />
                {t.patientDashboard?.navigation?.groupTreatment || "Treatment"}
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => handleSectionClick("meals")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === "meals"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  {t.patientDashboard.tabs.mealPlanner}
                </button>
                <button
                  onClick={() => handleSectionClick("snore")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === "snore"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  {t.patientDashboard.tabs.snoreAnalysis}
                </button>
                <button
                  onClick={() => handleSectionClick("qi-dose")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === "qi-dose"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Wind className="w-4 h-4" />
                  {t.patientDashboard.tabs.qiDose}
                </button>
                <button
                  onClick={() => handleSectionClick("vitality")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === "vitality"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  {t.patientDashboard.tabs.vitalityRhythm}
                </button>
              </div>
            </div>

            {/* Group 3: Community & Support */}
            <div>
              <div className="flex items-center gap-2 px-4 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 text-purple-500" />
                {t.patientDashboard?.navigation?.groupCommunity || "Community"}
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => handleSectionClick("family")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === "family"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  {t.familyManagement?.title || t.patientDashboard?.tabs?.family || "Family Care"}
                </button>
                <button
                  onClick={() => handleSectionClick("heart-companion")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === "heart-companion"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  {t.patientDashboard.tabs.heartCompanion || t.heartCompanion?.title || "Heart Companion"}
                </button>
                <button
                  onClick={() => handleSectionClick("communication")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === "communication"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Communication
                </button>
              </div>
            </div>

            {/* Group 4: Resources */}
            <div>
              <div className="flex items-center gap-2 px-4 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                {t.patientDashboard?.navigation?.groupResources || "Resources"}
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => handleSectionClick("documents")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === "documents"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  {t.patientDashboard.tabs.documents}
                </button>
                <button
                  onClick={() => handleSectionClick("settings")}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === "settings"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  {t.patientDashboard.tabs.settings}
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

