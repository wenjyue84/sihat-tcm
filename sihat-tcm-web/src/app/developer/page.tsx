"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/stores/useAppStore";
import { RefreshCw } from "lucide-react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import TestingDashboard from "@/components/developer/TestingDashboard";
import {
  DeveloperHeader,
  DeveloperSidebar,
  OverviewTab,
  ApiMonitorTab,
  DiagnosticsTab,
  LogsTab,
  SettingsTab,
  UpdatesTab,
} from "@/components/developer";
import { useCurrentTime } from "@/hooks/useCurrentTime";
import { useUpdates } from "@/hooks/useUpdates";
import { TEST_SUITES, API_GROUPS } from "./config";

export default function DeveloperDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const currentTime = useCurrentTime();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isRefreshing, handleRefresh } = useUpdates();

  useEffect(() => {
    if (!authLoading && (!profile || profile.role !== "developer")) {
      router.push("/login");
    }
  }, [profile, authLoading, router]);

  if (authLoading)
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-10 h-10 text-violet-500 animate-spin" />
          <p className="text-violet-200/50 font-mono text-sm animate-pulse">
            Initializing Debugger...
          </p>
        </div>
      </div>
    );

  if (!profile || profile.role !== "developer") return null;

  return (
    <div className="flex flex-col h-screen bg-[#0a0a0b] text-gray-300 font-sans selection:bg-violet-500/30 overflow-hidden">
      {/* Top Navigation Header */}
      <DeveloperHeader
        currentTime={currentTime}
        isMobileMenuOpen={isMobileMenuOpen}
        onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Main Layout */}
      <Tabs defaultValue="overview" className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <DeveloperSidebar
          isMobileMenuOpen={isMobileMenuOpen}
          onMobileMenuClose={() => setIsMobileMenuOpen(false)}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#0a0a0b] p-4 md:p-10">
          <TabsContent
            value="overview"
            className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-2 m-0 outline-none"
          >
            <OverviewTab
              currentTime={currentTime}
              isRefreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          </TabsContent>

          <TabsContent
            value="testing"
            className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-2 m-0 outline-none"
          >
            <TestingDashboard />
          </TabsContent>

          <TabsContent value="api" className="space-y-6 m-0 outline-none animate-in fade-in-50">
            <ApiMonitorTab initialGroups={API_GROUPS} />
          </TabsContent>

          <TabsContent
            value="diagnostics"
            className="space-y-6 m-0 outline-none animate-in fade-in-50"
          >
            <DiagnosticsTab testSuites={TEST_SUITES} />
          </TabsContent>

          <TabsContent
            value="logs"
            className="h-[calc(100vh-10rem)] m-0 outline-none animate-in fade-in-50"
          >
            <LogsTab />
          </TabsContent>

          <TabsContent
            value="settings"
            className="space-y-6 m-0 outline-none animate-in fade-in-50"
          >
            <SettingsTab />
          </TabsContent>

          <TabsContent value="updates" className="m-0 outline-none animate-in fade-in-50">
            <UpdatesTab />
          </TabsContent>
        </main>
      </Tabs>
    </div>
  );
}
