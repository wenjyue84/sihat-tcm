"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Loader2, Lock } from "lucide-react";
import { PractitionerManager } from "@/components/admin/PractitionerManager";
import { SecuritySettings } from "@/components/admin/SecuritySettings";
import { UserManager } from "@/components/admin/UserManager";
import { AdminAIChatbot } from "@/components/admin/AdminAIChatbot";

import { useAdminDashboard } from "./hooks/useAdminDashboard";
import {
  AdminSidebar,
  AdminHeader,
  PromptsTab,
  ConfigTab,
  BlogTab,
  MobileTab,
} from "./components";

function LoadingState() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-slate-400 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Loading Admin Console...</p>
      </div>
    </div>
  );
}

interface AccessDeniedProps {
  role?: string;
  onNavigateHome: () => void;
}

function AccessDenied({ role, onNavigateHome }: AccessDeniedProps) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-red-100 shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-red-700">Access Denied</CardTitle>
          <CardDescription>Administrative privileges required.</CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4 pt-4">
          <p className="text-sm text-slate-600">
            You are currently logged in as{" "}
            <span className="font-bold text-slate-900 capitalize">{role || "User"}</span>.
          </p>
          <Button onClick={onNavigateHome} className="w-full bg-slate-900 hover:bg-slate-800">
            Return Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminDashboard() {
  const {
    // State
    prompts,
    doctorLevel,
    loading,
    loggingOut,
    saving,
    saved,
    expandedPrompts,
    musicEnabled,
    musicUrl,
    musicVolume,
    isTestPlaying,
    activeTab,
    uploadingApk,
    isMobileMenuOpen,
    // Refs
    fileInputRef,
    // Auth
    profile,
    authLoading,
    // Setters
    setPrompts,
    setDoctorLevel,
    setMusicEnabled,
    setMusicUrl,
    setMusicVolume,
    setIsMobileMenuOpen,
    // Actions
    togglePrompt,
    setActiveTab,
    handleSavePrompt,
    handleTestMusic,
    handleSaveMusicConfig,
    handleSaveConfig,
    handleResetToDefault,
    handleLogout,
    handleApkUpload,
    router,
  } = useAdminDashboard();

  if (authLoading || loading) {
    return <LoadingState />;
  }

  if (!profile || profile.role !== "admin") {
    return <AccessDenied role={profile?.role} onNavigateHome={() => router.push("/")} />;
  }

  return (
    <ErrorBoundary
      showDetails={true}
      onError={(error) => console.error("Admin Dashboard Error:", error)}
    >
      <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar Navigation */}
        <AdminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          loggingOut={loggingOut}
          handleLogout={handleLogout}
        />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50">
          {/* Top Header */}
          <AdminHeader activeTab={activeTab} setIsMobileMenuOpen={setIsMobileMenuOpen} />

          {/* Content Container */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8">
            <div className="max-w-5xl mx-auto pb-20">
              {activeTab === "prompts" && (
                <PromptsTab
                  prompts={prompts}
                  setPrompts={setPrompts}
                  doctorLevel={doctorLevel}
                  setDoctorLevel={setDoctorLevel}
                  expandedPrompts={expandedPrompts}
                  togglePrompt={togglePrompt}
                  saving={saving}
                  saved={saved}
                  handleSaveConfig={handleSaveConfig}
                  handleSavePrompt={handleSavePrompt}
                  handleResetToDefault={handleResetToDefault}
                />
              )}

              {activeTab === "config" && (
                <ConfigTab
                  musicEnabled={musicEnabled}
                  setMusicEnabled={setMusicEnabled}
                  musicUrl={musicUrl}
                  setMusicUrl={setMusicUrl}
                  musicVolume={musicVolume}
                  setMusicVolume={setMusicVolume}
                  isTestPlaying={isTestPlaying}
                  handleTestMusic={handleTestMusic}
                  handleSaveMusicConfig={handleSaveMusicConfig}
                  saving={saving}
                />
              )}

              {activeTab === "security" && (
                <div className="animate-in fade-in-50 slide-in-from-bottom-2">
                  <SecuritySettings />
                </div>
              )}

              {activeTab === "users" && (
                <div className="animate-in fade-in-50 slide-in-from-bottom-2">
                  <UserManager />
                </div>
              )}

              {activeTab === "practitioners" && (
                <div className="animate-in fade-in-50 slide-in-from-bottom-2">
                  <PractitionerManager />
                </div>
              )}

              {activeTab === "blog" && <BlogTab />}

              {activeTab === "mobile" && (
                <MobileTab
                  uploadingApk={uploadingApk}
                  fileInputRef={fileInputRef}
                  handleApkUpload={handleApkUpload}
                />
              )}
            </div>
          </div>
        </main>

        {/* AI Assistant Floating Action Button */}
        <AdminAIChatbot />
      </div>
    </ErrorBoundary>
  );
}
