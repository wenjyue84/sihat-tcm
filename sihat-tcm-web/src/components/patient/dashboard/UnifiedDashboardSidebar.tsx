/**
 * Sidebar Navigation Component for UnifiedDashboard
 * Extracted from UnifiedDashboard.tsx for better organization
 */

import { Button } from "@/components/ui/button";
import {
  Activity,
  Grid3X3,
  User,
  UtensilsCrossed,
  Moon,
  Wind,
  Heart,
  Users,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  Loader2,
  Search,
  Pill,
  Leaf,
  Menu,
  X,
} from "lucide-react";
import type { DashboardSection } from "./dashboardTypes";

interface UnifiedDashboardSidebarProps {
  activeSection: DashboardSection;
  onSectionChange: (section: DashboardSection) => void;
  onLogout: () => void;
  loggingOut: boolean;
  isMobileMenuOpen: boolean;
  onMobileMenuClose: () => void;
  showMeridianClock?: boolean;
  t: Record<string, unknown>;
}

export function UnifiedDashboardSidebar({
  activeSection,
  onSectionChange,
  onLogout,
  loggingOut,
  isMobileMenuOpen,
  onMobileMenuClose,
  showMeridianClock,
  t,
}: UnifiedDashboardSidebarProps) {
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
                {(t.patientDashboard?.navigation?.groupAssessment as string) || "Assessment"}
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    onSectionChange("journey");
                    onMobileMenuClose();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === "journey"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  {(t.patientDashboard?.tabs?.healthJourney as string) || "Health Journey"}
                </button>
                <button
                  onClick={() => {
                    onSectionChange("five-elements");
                    onMobileMenuClose();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === "five-elements"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                  {(t.patientDashboard?.tabs?.fiveElements as string) || "Circle of Health"}
                </button>
                <button
                  onClick={() => {
                    onSectionChange("profile");
                    onMobileMenuClose();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === "profile"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <User className="w-4 h-4" />
                  {(t.patientDashboard?.tabs?.profile as string) || "Profile"}
                </button>
              </div>
            </div>

            {/* Group 2: Treatment Plan */}
            <div>
              <div className="flex items-center gap-2 px-4 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Pill className="w-3.5 h-3.5 text-amber-500" />
                {(t.patientDashboard?.navigation?.groupTreatment as string) || "Treatment"}
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    onSectionChange("meals");
                    onMobileMenuClose();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === "meals"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  {(t.patientDashboard?.tabs?.mealPlanner as string) || "Meal Planner"}
                </button>
                <button
                  onClick={() => {
                    onSectionChange("snore");
                    onMobileMenuClose();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === "snore"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Moon className="w-4 h-4" />
                  {(t.patientDashboard?.tabs?.snoreAnalysis as string) || "Snore Analysis"}
                </button>
                <button
                  onClick={() => {
                    onSectionChange("qi-dose");
                    onMobileMenuClose();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === "qi-dose"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Wind className="w-4 h-4" />
                  {(t.patientDashboard?.tabs?.qiDose as string) || "Qi Dose"}
                </button>
              </div>
            </div>

            {/* Group 3: Care Hub */}
            <div>
              <div className="flex items-center gap-2 px-4 mb-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                <Leaf className="w-3.5 h-3.5 text-emerald-500" />
                {(t.patientDashboard?.navigation?.groupCultivation as string) || "Care Hub"}
              </div>

              <div className="space-y-1">
                {showMeridianClock && (
                  <button
                    onClick={() => {
                      onSectionChange("vitality");
                      onMobileMenuClose();
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      activeSection === "vitality"
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                    {(t.patientDashboard?.tabs?.vitalityRhythm as string) || "Vitality Rhythm"}
                  </button>
                )}
                <button
                  onClick={() => {
                    onSectionChange("heart-companion");
                    onMobileMenuClose();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === "heart-companion"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  {(t.patientDashboard?.tabs?.heartCompanion as string) ||
                    (t.heartCompanion?.title as string) ||
                    "Heart Companion"}
                </button>
                <button
                  onClick={() => {
                    onSectionChange("community");
                    onMobileMenuClose();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === "community"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Users className="w-4 h-4" />
                  {(t.patientDashboard?.tabs?.community as string) || "Community"}
                </button>
                <button
                  onClick={() => {
                    onSectionChange("family");
                    onMobileMenuClose();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === "family"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Heart className="w-4 h-4" />
                  {(t.patientDashboard?.tabs?.family as string) || "Family"}
                </button>
              </div>
            </div>

            {/* Group 4: Account */}
            <div>
              <div className="flex items-center gap-2 px-4 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <User className="w-3.5 h-3.5 text-slate-500" />
                {(t.patientDashboard?.navigation?.groupAccount as string) || "Account"}
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => {
                    onSectionChange("documents");
                    onMobileMenuClose();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === "documents"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  {(t.patientDashboard?.tabs?.documents as string) || "Documents"}
                </button>
                <button
                  onClick={() => {
                    onSectionChange("communication");
                    onMobileMenuClose();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === "communication"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  Communication
                </button>
                <button
                  onClick={() => {
                    onSectionChange("settings");
                    onMobileMenuClose();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === "settings"
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  {(t.patientDashboard?.tabs?.settings as string) || "Settings"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-100">
          <Button
            variant="ghost"
            onClick={onLogout}
            disabled={loggingOut}
            className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {loggingOut ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            {(t.patientDashboard?.navigation?.logout as string) || "Logout"}
          </Button>
        </div>
      </aside>
    </>
  );
}



