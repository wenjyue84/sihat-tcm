/**
 * UnifiedDashboard - Refactored Version
 * 
 * This file has been split into smaller, focused modules:
 * - dashboard/useUnifiedDashboardData.ts - Data fetching
 * - dashboard/useUnifiedDashboardReports.ts - Reports management
 * - dashboard/useUnifiedDashboardProfile.ts - Profile management
 * - dashboard/useUnifiedDashboardState.ts - State management
 * - dashboard/useUnifiedDashboardHandlers.ts - Event handlers
 * - dashboard/UnifiedDashboardSidebar.tsx - Sidebar component
 * - dashboard/UnifiedDashboardHeader.tsx - Header component
 * - dashboard/UnifiedDashboardContent.tsx - Content component
 * - dashboard/dashboardUtils.ts - Utility functions
 * - dashboard/dashboardTypes.ts - Type definitions
 */

"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";
import { useAuth } from "@/stores/useAppStore";
import { useLanguage } from "@/stores/useAppStore";
import { useLanguageSync } from "@/hooks/useLanguageSync";
import { DigitalTwin } from "./DigitalTwin";
import { useUnifiedDashboardData } from "./dashboard/useUnifiedDashboardData";
import { useUnifiedDashboardReports } from "./dashboard/useUnifiedDashboardReports";
import { useUnifiedDashboardProfile } from "./dashboard/useUnifiedDashboardProfile";
import { useUnifiedDashboardState } from "./dashboard/useUnifiedDashboardState";
import { useUnifiedDashboardHandlers } from "./dashboard/useUnifiedDashboardHandlers";
import { UnifiedDashboardSidebar } from "./dashboard/UnifiedDashboardSidebar";
import { UnifiedDashboardHeader } from "./dashboard/UnifiedDashboardHeader";
import { UnifiedDashboardMobileHeader } from "./dashboard/UnifiedDashboardMobileHeader";
import { UnifiedDashboardContent } from "./dashboard/UnifiedDashboardContent";
import { getSectionTitle } from "./dashboard/dashboardUtils";
import { MobileBottomNav } from "./dashboard/MobileBottomNav";

export function UnifiedDashboard() {
  const { user, profile, updatePreferences, signOut, refreshProfile } = useAuth();
  const { t } = useLanguage();

  // Sync language from profile on login
  useLanguageSync();

  // Data hooks
  const { sessions, loadingSessions } = useUnifiedDashboardData(user?.id);
  const reportsHook = useUnifiedDashboardReports(user?.id);
  const profileHook = useUnifiedDashboardProfile(user?.id, profile, refreshProfile);

  // State management
  const state = useUnifiedDashboardState({
    updatePreferences,
    profilePreferences: profile?.preferences,
  });

  // Handlers
  const handlers = useUnifiedDashboardHandlers(signOut);

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* Mobile Header - Fixed top bar for navigation on mobile */}
      <UnifiedDashboardMobileHeader
        onMenuOpen={() => state.setIsMobileMenuOpen(true)}
        t={t}
      />

      {/* Sidebar */}
      <UnifiedDashboardSidebar
        activeSection={state.activeSection}
        onSectionChange={state.setActiveSection}
        onLogout={handlers.handleLogout}
        loggingOut={handlers.loggingOut}
        isMobileMenuOpen={state.isMobileMenuOpen}
        onMobileMenuClose={() => state.setIsMobileMenuOpen(false)}
        showMeridianClock={profile?.preferences?.showMeridianClock as boolean | undefined}
        t={t}
      />

      {/* Main Content Area - pt-14 accounts for fixed mobile header */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50 pt-14 md:pt-0">
        {/* Header */}
        <UnifiedDashboardHeader
          sectionTitle={getSectionTitle(state.activeSection, t)}
          userName={profile?.full_name || undefined}
          userEmail={user?.email}
          isDemoMode={profile?.full_name === "Test Patient"}
          onMobileMenuOpen={() => state.setIsMobileMenuOpen(true)}
          t={t}
        />

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto pb-24 md:pb-20">
            <UnifiedDashboardContent
              activeSection={state.activeSection}
              sessions={sessions}
              loadingSessions={loadingSessions}
              reports={reportsHook.reports}
              loadingReports={reportsHook.loadingReports}
              uploadingReport={reportsHook.uploadingReport}
              selectedReport={reportsHook.selectedReport}
              profileData={profileHook.profileData}
              editingProfile={profileHook.editingProfile}
              fileInputRef={reportsHook.fileInputRef}
              onFileChange={reportsHook.handleFileChange}
              onDeleteReport={reportsHook.handleDeleteReport}
              onUpdateProfileField={profileHook.handleUpdateProfileField}
              onSetSelectedReport={reportsHook.setSelectedReport}
              onSetEditingProfile={profileHook.setEditingProfile}
              onRestoreMedicalReports={handlers.handleRestoreMedicalReports}
              seedingReports={handlers.seedingReports}
              profile={profile}
              userEmail={user?.email}
              t={t}
            />
          </div>
        </div>
      </main>

      {/* Digital Twin Enlarged Modal */}
      <div
        id="digital-twin-modal"
        className="hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            e.currentTarget.classList.add("hidden");
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative max-w-4xl w-full"
        >
          <button
            onClick={() => {
              const modal = document.getElementById("digital-twin-modal");
              if (modal) modal.classList.add("hidden");
            }}
            className="absolute -top-4 -right-4 z-10 bg-white rounded-full p-3 shadow-2xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-700" />
          </button>
          <div className="transform scale-110">
            <DigitalTwin sessions={sessions} loading={loadingSessions} />
          </div>
        </motion.div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav
        activeSection={state.activeSection}
        onSectionChange={state.setActiveSection}
        onMoreClick={() => state.setIsMobileMenuOpen(true)}
      />
    </div>
  );
}
