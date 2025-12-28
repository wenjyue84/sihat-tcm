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
import { TestSuite } from "@/hooks/useDiagnostics";
import { ApiGroup } from "@/hooks/useApiMonitor";

// Test suites configuration
const TEST_SUITES: TestSuite[] = [
  {
    id: "accessibility",
    name: "Accessibility Manager",
    description: "WCAG 2.1 AA compliance and accessibility features",
    testCommand: "npm test -- accessibilityManager.test.ts --run",
    category: "Core Features",
  },
  {
    id: "imageQuality",
    name: "Image Quality Validator",
    description: "Real-time image quality assessment",
    testCommand: "npm test -- imageQualityValidator.test.ts --run",
    category: "AI Features",
  },
  {
    id: "medicalSafety",
    name: "Medical Safety Validator",
    description: "Treatment recommendation safety validation",
    testCommand: "npm test -- medicalSafetyValidator.test.ts --run",
    category: "Safety Systems",
  },
  {
    id: "aiModelRouter",
    name: "AI Model Router",
    description: "Intelligent AI model selection and fallback",
    testCommand: "npm test -- aiModelRouter.test.ts --run",
    category: "AI Features",
  },
  {
    id: "platformOptimizer",
    name: "Platform Optimizer",
    description: "Cross-platform performance optimization",
    testCommand: "npm test -- platformOptimizer.test.ts --run",
    category: "Performance",
  },
  {
    id: "voiceCommandHandler",
    name: "Voice Command Handler",
    description: "Voice recognition and command processing",
    testCommand: "npm test -- voiceCommandHandler.test.ts --run",
    category: "Accessibility",
  },
  {
    id: "propertyTestFramework",
    name: "Property Test Framework",
    description: "Property-based testing framework validation",
    testCommand: "npm test -- propertyTestFramework.test.ts --run",
    category: "Testing Infrastructure",
  },
  {
    id: "correctnessProperties",
    name: "Correctness Properties",
    description: "System correctness properties validation",
    testCommand: "npm test -- correctnessProperties.test.ts --run",
    category: "Correctness Validation",
  },
  {
    id: "propertyTests",
    name: "All Property-Based Tests",
    description: "Complete property-based testing suite",
    testCommand: "npm run test:pbt",
    category: "Property-Based Testing",
  },
  {
    id: "unitTests",
    name: "Unit Test Suite",
    description: "All unit tests for core functionality",
    testCommand: "npm test -- --run",
    category: "Unit Testing",
  },
  {
    id: "integrationTests",
    name: "Integration Tests",
    description: "End-to-end integration testing",
    testCommand: "npm test -- --run --testPathPattern=integration",
    category: "Integration Testing",
  },
  {
    id: "performanceTests",
    name: "Performance Tests",
    description: "Performance benchmarking and optimization tests",
    testCommand: "npm test -- --run --testPathPattern=performance",
    category: "Performance Testing",
  },
];

// API groups configuration
const API_GROUPS: ApiGroup[] = [
  {
    title: "AI Diagnosis & Analysis",
    description: "Core AI processing for image and audio inputs",
    endpoints: [
      {
        path: "/api/analyze-image",
        method: "POST",
        type: "AI Analysis",
        status: 200,
        latency: "1.2s",
      },
      {
        path: "/api/analyze-audio",
        method: "POST",
        type: "AI Analysis",
        status: 200,
        latency: "0.8s",
      },
    ],
  },
  {
    title: "Consultation & Chat",
    description: "Real-time messaging and advisory services",
    endpoints: [
      { path: "/api/chat", method: "POST", type: "Conversation", status: 200, latency: "450ms" },
      {
        path: "/api/consult",
        method: "POST",
        type: "Core Consultation",
        status: 200,
        latency: "650ms",
      },
      {
        path: "/api/ask-dietary-advice",
        method: "POST",
        type: "AI Advice",
        status: 200,
        latency: "1.5s",
      },
    ],
  },
  {
    title: "Medical Tools & Reports",
    description: "Report generation, summarization and validation tools",
    endpoints: [
      {
        path: "/api/summarize-reports",
        method: "POST",
        type: "Processing",
        status: 200,
        latency: "1.1s",
      },
      {
        path: "/api/validate-medicine",
        method: "POST",
        type: "Safety Check",
        status: 200,
        latency: "300ms",
      },
      {
        path: "/api/generate-infographic",
        method: "POST",
        type: "Content Gen",
        status: 200,
        latency: "2.4s",
      },
    ],
  },
  {
    title: "Admin & System",
    description: "Internal system status and configuration endpoints",
    endpoints: [
      {
        path: "/api/admin/db-status",
        method: "GET",
        type: "System Monitor",
        status: 200,
        latency: "120ms",
      },
      {
        path: "/api/admin/settings",
        method: "GET",
        type: "Configuration",
        status: 200,
        latency: "85ms",
      },
    ],
  },
];

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
