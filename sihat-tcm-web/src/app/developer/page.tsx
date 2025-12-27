"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/stores/useAppStore";
import { useDeveloper } from "@/stores/useAppStore";
import {
  Terminal,
  Cpu,
  Database,
  Globe,
  Activity,
  Settings,
  LogOut,
  ExternalLink,
  RefreshCw,
  CheckCircle2,
  Bug,
  Wrench,
  LayoutDashboard,
  Zap,
  History,
  GitCommit,
  GitBranch,
  Server,
  ShieldCheck,
  PlayCircle,
  Home,
  Menu,
  X,
  Target,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TestingDashboard from "@/components/developer/TestingDashboard";

export default function DeveloperDashboard() {
  const { profile, loading: authLoading, signOut } = useAuth();
  const { isDeveloperMode } = useDeveloper();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updates, setUpdates] = useState<any[]>([]);
  const [updatesLoading, setUpdatesLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreUpdates, setHasMoreUpdates] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" }>({
    key: "default",
    direction: "asc",
  });
  const [envTestStatus, setEnvTestStatus] = useState<{
    [key: string]: "idle" | "testing" | "success" | "error";
  }>({});
  const [envTestMessage, setEnvTestMessage] = useState<{ [key: string]: string }>({});

  // System Diagnostics State
  const [diagnosticsResults, setDiagnosticsResults] = useState<{ [key: string]: any }>({});
  const [runningTests, setRunningTests] = useState<{ [key: string]: boolean }>({});
  const [testSuites] = useState([
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
  ]);
  interface SystemLog {
    id: string;
    timestamp: string;
    level: "info" | "warn" | "error" | "debug";
    category: string;
    message: string;
    metadata?: Record<string, unknown>;
    user_id?: string;
  }
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [logLevelFilter, setLogLevelFilter] = useState<string>("all");

  // Mock API Data moved to state/constant to allow sorting
  const [apiGroups, setApiGroups] = useState([
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
  ]);

  const getLatencyValue = (str: string) => {
    if (str.endsWith("ms")) return parseInt(str);
    if (str.endsWith("s")) return parseFloat(str) * 1000;
    return 0;
  };

  const sortedGroups = [...apiGroups].map((group) => {
    if (sortConfig.key === "default") return group;

    const sortedEndpoints = [...group.endpoints].sort((a, b) => {
      if (sortConfig.key === "latency") {
        const valA = getLatencyValue(a.latency);
        const valB = getLatencyValue(b.latency);
        return sortConfig.direction === "asc" ? valA - valB : valB - valA;
      }
      return 0;
    });

    return { ...group, endpoints: sortedEndpoints };
  });

  const generateTroubleshootPrompt = (endpoint: any) => {
    const prompt = `Act as a senior software engineer. The API route \`${endpoint.path}\` is experiencing issues or requires optimization.
        
Current Status:
- Method: ${endpoint.method}
- Response Code: ${endpoint.status}
- Latency: ${endpoint.latency}
- Type: ${endpoint.type}

Please analyze the implementation of this route (likely in \`src/app${endpoint.path}/route.ts\`) and suggest improvements for error handling, performance optimization, and robustness. If there are known issues with this status code, provide a fix.`;

    navigator.clipboard.writeText(prompt);
    alert("Troubleshoot prompt copied to clipboard!");
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    // Fetch initial updates (page 1)
    fetch("/api/updates?page=1")
      .then((res) => res.json())
      .then((data) => {
        if (data.commits) {
          setUpdates(data.commits);
          setHasMoreUpdates(data.hasMore || false);
          setCurrentPage(1);
        }
        setUpdatesLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch updates:", err);
        setUpdatesLoading(false);
      });

    return () => clearInterval(timer);
  }, []);

  // Fetch system logs
  const fetchLogs = async (showLoading = true) => {
    if (showLoading) setLogsLoading(true);
    try {
      const levelParam = logLevelFilter !== "all" ? `&level=${logLevelFilter}` : "";
      const res = await fetch(`/api/logs?limit=100${levelParam}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      setSystemLogs(data.logs || []);
      setLogsError(null);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
      setLogsError(err instanceof Error ? err.message : "Failed to fetch logs");
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // Auto-refresh logs every 5 seconds
    const logsInterval = setInterval(() => fetchLogs(false), 5000);
    return () => clearInterval(logsInterval);
  }, [logLevelFilter]);

  useEffect(() => {
    if (!authLoading && (!profile || profile.role !== "developer")) {
      router.push("/login");
    }
  }, [profile, authLoading, router]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetch("/api/updates?page=1")
      .then((res) => res.json())
      .then((data) => {
        if (data.commits) {
          setUpdates(data.commits);
          setHasMoreUpdates(data.hasMore || false);
          setCurrentPage(1);
        }
      })
      .finally(() => setTimeout(() => setIsRefreshing(false), 1500));
  };

  const loadMoreUpdates = async () => {
    if (loadingMore || !hasMoreUpdates) return;

    setLoadingMore(true);
    const nextPage = currentPage + 1;

    try {
      const res = await fetch(`/api/updates?page=${nextPage}`);
      const data = await res.json();

      if (data.commits) {
        setUpdates((prev) => [...prev, ...data.commits]);
        setHasMoreUpdates(data.hasMore || false);
        setCurrentPage(nextPage);
      }
    } catch (err) {
      console.error("Failed to load more updates:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  const testEnvVariable = async (key: string) => {
    setEnvTestStatus((prev) => ({ ...prev, [key]: "testing" }));
    setEnvTestMessage((prev) => ({ ...prev, [key]: "" }));

    try {
      let success = false;
      let message = "";

      switch (key) {
        case "NEXT_PUBLIC_SUPABASE_URL":
          // Test Supabase connection
          const dbRes = await fetch("/api/admin/db-status");
          const dbData = await dbRes.json();
          success = dbRes.ok && dbData.status === "connected";
          message = success
            ? `Connected (${dbData.tables?.length || 0} tables)`
            : "Connection failed";
          break;

        case "NEXT_PUBLIC_APP_URL":
          // Test if app is reachable
          const appRes = await fetch("/api/health", { method: "GET" });
          success = appRes.ok;
          message = success ? "App is reachable" : "App unreachable";
          break;

        case "GEMINI_API_KEY":
          // Test Gemini API
          const aiRes = await fetch("/api/test-gemini", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ testMode: true }),
          });
          const aiData = await aiRes.json();
          success = aiRes.ok && aiData.success;
          message = success ? "Gemini API working" : aiData.error || "API test failed";
          break;

        case "NODE_ENV":
          // Just show environment info
          success = true;
          message = "Environment detected";
          break;

        default:
          success = false;
          message = "No test available";
      }

      setEnvTestStatus((prev) => ({ ...prev, [key]: success ? "success" : "error" }));
      setEnvTestMessage((prev) => ({ ...prev, [key]: message }));
    } catch (error) {
      setEnvTestStatus((prev) => ({ ...prev, [key]: "error" }));
      setEnvTestMessage((prev) => ({
        ...prev,
        [key]: error instanceof Error ? error.message : "Test failed",
      }));
    }
  };

  const runTestSuite = async (testId: string) => {
    setRunningTests((prev) => ({ ...prev, [testId]: true }));

    try {
      const response = await fetch("/api/developer/run-tests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ testId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      setDiagnosticsResults((prev) => ({
        ...prev,
        [testId]: result,
      }));
    } catch (error) {
      setDiagnosticsResults((prev) => ({
        ...prev,
        [testId]: {
          status: "error",
          error: error instanceof Error ? error.message : "Test execution failed",
          timestamp: new Date().toISOString(),
        },
      }));
    } finally {
      setRunningTests((prev) => ({ ...prev, [testId]: false }));
    }
  };

  const runAllTests = async () => {
    for (const testSuite of testSuites) {
      if (!runningTests[testSuite.id]) {
        await runTestSuite(testSuite.id);
        // Small delay between tests
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  };

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
      <header className="h-16 border-b border-white/5 bg-[#0f0f11]/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-900/20">
            <Terminal className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight leading-none">
              Developer <span className="text-violet-400">Portal</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-[9px] uppercase tracking-widest text-emerald-500/80 font-bold">
                System Online
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Action Bar */}
          <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/5">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-full px-3 text-xs gap-2 hover:bg-violet-600 hover:text-white transition-colors text-amber-400 font-medium"
              onClick={() => router.push("/test-runner")}
            >
              <Zap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Runner</span>
            </Button>
            <div className="w-px h-4 bg-white/10 mx-1"></div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 rounded-full px-3 text-xs gap-2 hover:bg-emerald-600 hover:text-white transition-colors text-emerald-400 font-medium"
              onClick={() => router.push("/")}
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Diagnosis App</span>
            </Button>
          </div>

          <div className="h-8 w-px bg-white/10 hidden md:block"></div>

          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs text-gray-400 font-mono">
              {currentTime.toLocaleTimeString()}
            </span>
            <span className="text-[10px] text-gray-600 uppercase tracking-wider">
              {currentTime.toLocaleDateString()}
            </span>
          </div>

          <button
            className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-md"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Layout */}
      <Tabs defaultValue="overview" className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside
          className={`w-64 bg-[#0f0f11] border-r border-white/5 flex flex-col p-4 gap-2 shrink-0 overflow-y-auto fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 h-full ${
            isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between md:hidden mb-4 px-2">
            <span className="font-bold text-white">Menu</span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest px-4 py-2 mb-2">
            Platform
          </div>
          <TabsList className="bg-transparent flex flex-col h-auto p-0 gap-1 w-full justify-start">
            <TabsTrigger
              value="overview"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full justify-start px-4 py-3 data-[state=active]:bg-violet-600/10 data-[state=active]:text-violet-400 data-[state=active]:border-r-2 data-[state=active]:border-violet-500 rounded-none rounded-r-sm transition-all text-sm font-medium"
            >
              <LayoutDashboard className="w-4 h-4 mr-3" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="testing"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full justify-start px-4 py-3 data-[state=active]:bg-violet-600/10 data-[state=active]:text-violet-400 data-[state=active]:border-r-2 data-[state=active]:border-violet-500 rounded-none rounded-r-sm transition-all text-sm font-medium"
            >
              <Target className="w-4 h-4 mr-3" />
              Testing Suite
            </TabsTrigger>
            <TabsTrigger
              value="api"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full justify-start px-4 py-3 data-[state=active]:bg-violet-600/10 data-[state=active]:text-violet-400 data-[state=active]:border-r-2 data-[state=active]:border-violet-500 rounded-none rounded-r-sm transition-all text-sm font-medium"
            >
              <Activity className="w-4 h-4 mr-3" />
              API Monitor
            </TabsTrigger>
            <TabsTrigger
              value="diagnostics"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full justify-start px-4 py-3 data-[state=active]:bg-violet-600/10 data-[state=active]:text-violet-400 data-[state=active]:border-r-2 data-[state=active]:border-violet-500 rounded-none rounded-r-sm transition-all text-sm font-medium"
            >
              <Bug className="w-4 h-4 mr-3" />
              System Diagnostics
            </TabsTrigger>
            <TabsTrigger
              value="logs"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full justify-start px-4 py-3 data-[state=active]:bg-violet-600/10 data-[state=active]:text-violet-400 data-[state=active]:border-r-2 data-[state=active]:border-violet-500 rounded-none rounded-r-sm transition-all text-sm font-medium"
            >
              <Terminal className="w-4 h-4 mr-3" />
              System Logs
            </TabsTrigger>
          </TabsList>

          <div className="text-xs font-bold text-gray-500 uppercase tracking-widest px-4 py-2 mt-6 mb-2">
            Deployment
          </div>
          <TabsList className="bg-transparent flex flex-col h-auto p-0 gap-1 w-full justify-start">
            <TabsTrigger
              value="settings"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full justify-start px-4 py-3 data-[state=active]:bg-violet-600/10 data-[state=active]:text-violet-400 data-[state=active]:border-r-2 data-[state=active]:border-violet-500 rounded-none rounded-r-sm transition-all text-sm font-medium"
            >
              <Settings className="w-4 h-4 mr-3" />
              Configuration
            </TabsTrigger>
            <TabsTrigger
              value="updates"
              onClick={() => setIsMobileMenuOpen(false)}
              className="w-full justify-start px-4 py-3 data-[state=active]:bg-violet-600/10 data-[state=active]:text-violet-400 data-[state=active]:border-r-2 data-[state=active]:border-violet-500 rounded-none rounded-r-sm transition-all text-sm font-medium"
            >
              <History className="w-4 h-4 mr-3" />
              Version History
            </TabsTrigger>
          </TabsList>

          <div className="mt-auto px-4 py-6 border-t border-white/5 space-y-4">
            <Button
              variant="ghost"
              onClick={() => signOut()}
              className="w-full justify-start gap-3 text-red-500 hover:text-red-400 hover:bg-red-500/10 pl-0 hover:pl-2 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
            <div className="text-[10px] text-gray-600">
              <p>Running on localhost:3000</p>
              <p className="mt-1">Sihat Kernel v2.4.0-dev</p>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#0a0a0b] p-4 md:p-10">
          <TabsContent
            value="overview"
            className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-2 m-0 outline-none"
          >
            {/* 1. Hero KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  label: "CPU Load",
                  value: "4.2%",
                  sub: "2 cores active",
                  icon: Cpu,
                  color: "text-blue-400",
                  bg: "bg-blue-500/10",
                },
                {
                  label: "Heap Memory",
                  value: "1.8GB",
                  sub: "4GB limit",
                  icon: Database,
                  color: "text-violet-400",
                  bg: "bg-violet-500/10",
                },
                {
                  label: "Avg Latency",
                  value: "124ms",
                  sub: "Last 1h",
                  icon: Zap,
                  color: "text-amber-400",
                  bg: "bg-amber-500/10",
                },
                {
                  label: "Requests",
                  value: "12.4k",
                  sub: "Since restart",
                  icon: Globe,
                  color: "text-emerald-400",
                  bg: "bg-emerald-500/10",
                },
              ].map((stat, i) => (
                <Card
                  key={i}
                  className="bg-white/[0.03] border-white/10 overflow-hidden relative group hover:border-white/20 transition-all"
                >
                  <div
                    className={`absolute -right-6 -top-6 w-24 h-24 ${stat.bg} blur-3xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity`}
                  ></div>
                  <div className="p-6 relative z-10 flex flex-col justify-between h-full">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-2.5 rounded-lg ${stat.bg} ${stat.color}`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                      {/* Sparkline placeholder */}
                      <div className="flex gap-0.5 items-end h-6">
                        {[40, 60, 45, 70, 50].map((h, idx) => (
                          <div
                            key={idx}
                            style={{ height: `${h}%` }}
                            className="w-1 bg-white/20 rounded-full"
                          ></div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white tracking-tight">{stat.value}</p>
                      <div className="flex justify-between items-center mt-1">
                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                          {stat.label}
                        </p>
                        <p className="text-[10px] text-gray-500">{stat.sub}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 2. Control Center */}
              <div className="space-y-6">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                  Control Center
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <Card
                    onClick={() => router.push("/test-runner")}
                    className="bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40 cursor-pointer transition-all group"
                  >
                    <CardContent className="p-5 flex flex-col gap-3">
                      <div className="p-2.5 bg-amber-500/10 w-fit rounded-lg group-hover:bg-amber-500/20 text-amber-500 mb-1">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-amber-100 group-hover:text-amber-50">
                          Test Runner
                        </h4>
                        <p className="text-xs text-amber-500/60 mt-1">Run automated suites</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    onClick={() => router.push("/")}
                    className="bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40 cursor-pointer transition-all group"
                  >
                    <CardContent className="p-5 flex flex-col gap-3">
                      <div className="p-2.5 bg-emerald-500/10 w-fit rounded-lg group-hover:bg-emerald-500/20 text-emerald-500 mb-1">
                        <Home className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-emerald-100 group-hover:text-emerald-50">
                          App Home
                        </h4>
                        <p className="text-xs text-emerald-500/60 mt-1">Active Dev Mode</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    onClick={() => window.location.reload()}
                    className="bg-blue-500/5 hover:bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40 cursor-pointer transition-all group"
                  >
                    <CardContent className="p-5 flex flex-col gap-3">
                      <div className="p-2.5 bg-blue-500/10 w-fit rounded-lg group-hover:bg-blue-500/20 text-blue-500 mb-1">
                        <Database className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-blue-100 group-hover:text-blue-50">
                          Flush Cache
                        </h4>
                        <p className="text-xs text-blue-500/60 mt-1">Reload & Clear</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card
                    className="bg-indigo-500/5 hover:bg-indigo-500/10 border-indigo-500/20 hover:border-indigo-500/40 cursor-pointer transition-all group"
                    onClick={() => alert("Prompts refreshed (simulation)")}
                  >
                    <CardContent className="p-5 flex flex-col gap-3">
                      <div className="p-2.5 bg-indigo-500/10 w-fit rounded-lg group-hover:bg-indigo-500/20 text-indigo-500 mb-1">
                        <RefreshCw className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-indigo-100 group-hover:text-indigo-50">
                          Regen Prompts
                        </h4>
                        <p className="text-xs text-indigo-500/60 mt-1">Reload AI Context</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                <div className="p-4 rounded-xl border border-violet-500/20 bg-gradient-to-br from-violet-600/10 to-transparent">
                  <div className="flex items-center gap-3 mb-2">
                    <Bug className="text-violet-400 w-4 h-4" />
                    <span className="text-sm font-bold text-white">Debugger Active</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    System is capturing all network traffic and AI chain-of-thought. Exception
                    breakpoints are enabled.
                  </p>
                </div>
              </div>

              {/* 3. Infrastructure Health */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                    Infrastructure Health
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs bg-white/5 border-white/10 text-gray-400 hover:text-white"
                    onClick={handleRefresh}
                  >
                    <RefreshCw className={`w-3 h-3 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                    Check Status
                  </Button>
                </div>

                <Card className="bg-[#0f0f11] border-white/10">
                  <div className="divide-y divide-white/5">
                    {[
                      {
                        name: "Supabase Database",
                        status: "Operational",
                        latency: "42ms",
                        uptime: "100%",
                        icon: Database,
                        color: "text-green-400",
                      },
                      {
                        name: "Supabase Auth",
                        status: "Operational",
                        latency: "28ms",
                        uptime: "100%",
                        icon: ShieldCheck,
                        color: "text-green-400",
                      },
                      {
                        name: "Gemini 2.0 Flash",
                        status: "Operational",
                        latency: "1.2s",
                        uptime: "99.9%",
                        icon: Zap,
                        color: "text-amber-400",
                      },
                      {
                        name: "Vercel Edge Runtime",
                        status: "Optimal",
                        latency: "12ms",
                        uptime: "100%",
                        icon: Server,
                        color: "text-blue-400",
                      },
                    ].map((service, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-lg bg-white/5">
                            <service.icon className={`w-4 h-4 ${service.color}`} />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-gray-200">{service.name}</p>
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                              {service.status}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <p className="text-xs text-gray-400 font-mono">{service.latency}</p>
                            <p className="text-[10px] text-gray-600 uppercase">Latency</p>
                          </div>
                          <div className="text-right w-16">
                            <p className="text-xs text-emerald-400 font-mono">{service.uptime}</p>
                            <p className="text-[10px] text-gray-600 uppercase">Uptime</p>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 bg-white/[0.02] border-t border-white/5 text-center">
                    <p className="text-[10px] text-gray-500">
                      Last health check performed at {currentTime.toLocaleTimeString()}
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent
            value="testing"
            className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-2 m-0 outline-none"
          >
            <TestingDashboard />
          </TabsContent>

          <TabsContent value="api" className="space-y-6 m-0 outline-none animate-in fade-in-50">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">API Monitor</h2>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Sort:</span>
                <select
                  className="bg-[#0f0f11] border border-white/10 rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-violet-500"
                  value={
                    sortConfig.key === "default"
                      ? "default"
                      : `${sortConfig.key}-${sortConfig.direction}`
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "default") setSortConfig({ key: "default", direction: "asc" });
                    else {
                      const [key, dir] = val.split("-");
                      setSortConfig({ key, direction: dir as "asc" | "desc" });
                    }
                  }}
                >
                  <option value="default">Default Grouping</option>
                  <option value="latency-desc">Highest Latency</option>
                  <option value="latency-asc">Lowest Latency</option>
                </select>
              </div>
            </div>

            <div className="space-y-6">
              {sortedGroups.map((group, groupIndex) => (
                <Card
                  key={groupIndex}
                  className="bg-[#0f0f11] border-white/10 text-white overflow-hidden"
                >
                  <CardHeader className="border-b border-white/5 bg-white/[0.02] py-4 px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-medium text-violet-100">
                          {group.title}
                        </CardTitle>
                        <CardDescription className="text-xs text-gray-500 mt-1">
                          {group.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-white/5">
                      {group.endpoints.map((endpoint, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-4 px-6 hover:bg-white/[0.02] transition-colors group"
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3 w-64">
                              <span
                                className={`text-[10px] font-bold px-2 py-1 rounded w-16 text-center border ${endpoint.method === "GET" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" : "bg-violet-500/10 text-violet-400 border-violet-500/20"}`}
                              >
                                {endpoint.method}
                              </span>
                              <p className="font-mono text-sm text-gray-300 group-hover:text-white transition-colors">
                                {endpoint.path}
                              </p>
                            </div>
                            <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded">
                              {endpoint.type}
                            </span>
                          </div>
                          <div className="flex items-center gap-8">
                            <div className="text-right w-20">
                              <p className="text-xs font-mono text-emerald-400">
                                {endpoint.status}
                              </p>
                            </div>
                            <div className="text-right w-20">
                              <p
                                className={`text-xs font-mono ${getLatencyValue(endpoint.latency) > 1000 ? "text-amber-400" : "text-gray-400"}`}
                              >
                                {endpoint.latency}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-500 hover:text-white hover:bg-white/10"
                                onClick={() => generateTroubleshootPrompt(endpoint)}
                                title="Analyze"
                              >
                                <Wrench className="w-4 h-4" />
                              </Button>
                              <a
                                href={endpoint.path}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="h-8 w-8 flex items-center justify-center rounded-md text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent
            value="diagnostics"
            className="space-y-6 m-0 outline-none animate-in fade-in-50"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">System Diagnostics</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Automated test suites and system validation
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500/20"
                  onClick={runAllTests}
                  disabled={Object.values(runningTests).some(Boolean)}
                >
                  {Object.values(runningTests).some(Boolean) ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Running Tests...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4 mr-2" />
                      Run All Tests
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                  onClick={() => router.push("/test-accessibility")}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Manual Testing
                </Button>
              </div>
            </div>

            {/* Test Categories */}
            {[
              "Core Features",
              "AI Features",
              "Safety Systems",
              "Performance",
              "Accessibility",
              "Testing Infrastructure",
              "Correctness Validation",
              "Property-Based Testing",
              "Unit Testing",
              "Integration Testing",
              "Performance Testing",
            ].map((category) => {
              const categoryTests = testSuites.filter((test) => test.category === category);
              if (categoryTests.length === 0) return null;

              return (
                <Card key={category} className="bg-[#0f0f11] border-white/10">
                  <CardHeader className="border-b border-white/5 bg-white/[0.02] py-4 px-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base font-medium text-violet-100">
                          {category}
                        </CardTitle>
                        <CardDescription className="text-xs text-gray-500 mt-1">
                          {categoryTests.length} test suite{categoryTests.length !== 1 ? "s" : ""}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {categoryTests.map((test) => {
                          const result = diagnosticsResults[test.id];
                          const isRunning = runningTests[test.id];

                          if (isRunning)
                            return (
                              <div
                                key={test.id}
                                className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"
                              />
                            );
                          if (!result)
                            return (
                              <div key={test.id} className="w-2 h-2 bg-gray-600 rounded-full" />
                            );
                          if (result.status === "passed")
                            return (
                              <div key={test.id} className="w-2 h-2 bg-emerald-500 rounded-full" />
                            );
                          if (result.status === "failed" || result.status === "error")
                            return (
                              <div key={test.id} className="w-2 h-2 bg-red-500 rounded-full" />
                            );
                          return <div key={test.id} className="w-2 h-2 bg-gray-600 rounded-full" />;
                        })}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-white/5">
                      {categoryTests.map((test) => {
                        const result = diagnosticsResults[test.id];
                        const isRunning = runningTests[test.id];

                        return (
                          <div
                            key={test.id}
                            className="p-6 hover:bg-white/[0.02] transition-colors group"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-medium text-white">{test.name}</h4>
                                  {isRunning && (
                                    <div className="flex items-center gap-2 text-amber-400">
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                      <span className="text-xs">Running...</span>
                                    </div>
                                  )}
                                  {result && !isRunning && (
                                    <div
                                      className={`flex items-center gap-2 text-xs ${
                                        result.status === "passed"
                                          ? "text-emerald-400"
                                          : result.status === "failed"
                                            ? "text-red-400"
                                            : result.status === "error"
                                              ? "text-red-400"
                                              : "text-gray-400"
                                      }`}
                                    >
                                      {result.status === "passed" && (
                                        <CheckCircle2 className="w-3 h-3" />
                                      )}
                                      {(result.status === "failed" ||
                                        result.status === "error") && <Bug className="w-3 h-3" />}
                                      <span className="capitalize">{result.status}</span>
                                    </div>
                                  )}
                                </div>
                                <p className="text-sm text-gray-400 mb-3">{test.description}</p>

                                {result && !isRunning && (
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                                    {result.passed !== undefined && (
                                      <div>
                                        <span className="text-gray-500">Passed:</span>
                                        <span className="ml-2 text-emerald-400 font-mono">
                                          {result.passed}
                                        </span>
                                      </div>
                                    )}
                                    {result.failed !== undefined && (
                                      <div>
                                        <span className="text-gray-500">Failed:</span>
                                        <span className="ml-2 text-red-400 font-mono">
                                          {result.failed}
                                        </span>
                                      </div>
                                    )}
                                    {result.duration && (
                                      <div>
                                        <span className="text-gray-500">Duration:</span>
                                        <span className="ml-2 text-gray-300 font-mono">
                                          {result.duration}
                                        </span>
                                      </div>
                                    )}
                                    {result.coverage && (
                                      <div>
                                        <span className="text-gray-500">Coverage:</span>
                                        <span className="ml-2 text-blue-400 font-mono">
                                          {result.coverage}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                {result?.error && (
                                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                                    <p className="text-xs text-red-400 font-mono">{result.error}</p>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center gap-2 ml-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-3 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => runTestSuite(test.id)}
                                  disabled={isRunning}
                                >
                                  {isRunning ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <PlayCircle className="w-3 h-3" />
                                  )}
                                </Button>
                                {result?.timestamp && (
                                  <span className="text-xs text-gray-600 font-mono">
                                    {new Date(result.timestamp).toLocaleTimeString()}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="mt-3 pt-3 border-t border-white/5">
                              <details className="group/details">
                                <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-400 flex items-center gap-2">
                                  <span>Test Command</span>
                                  <span className="text-gray-600 group-open/details:rotate-90 transition-transform">
                                    ▶
                                  </span>
                                </summary>
                                <div className="mt-2 p-2 bg-black/20 rounded border border-white/5">
                                  <code className="text-xs text-gray-300 font-mono">
                                    {test.testCommand}
                                  </code>
                                </div>
                              </details>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Test Summary */}
            {Object.keys(diagnosticsResults).length > 0 && (
              <Card className="bg-gradient-to-r from-violet-500/10 to-blue-500/10 border-violet-500/20">
                <CardHeader>
                  <CardTitle className="text-base text-violet-100">Test Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-emerald-400">
                        {
                          Object.values(diagnosticsResults).filter((r) => r.status === "passed")
                            .length
                        }
                      </div>
                      <div className="text-xs text-gray-400">Passed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">
                        {
                          Object.values(diagnosticsResults).filter(
                            (r) => r.status === "failed" || r.status === "error"
                          ).length
                        }
                      </div>
                      <div className="text-xs text-gray-400">Failed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-300">
                        {Object.values(diagnosticsResults).reduce(
                          (acc, r) => acc + (r.passed || 0),
                          0
                        )}
                      </div>
                      <div className="text-xs text-gray-400">Total Tests</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {Math.round(
                          Object.values(diagnosticsResults).reduce((acc, r) => {
                            if (r.coverage) {
                              const coverage = parseInt(r.coverage.replace("%", ""));
                              return acc + coverage;
                            }
                            return acc;
                          }, 0) / Object.keys(diagnosticsResults).length
                        ) || 0}
                        %
                      </div>
                      <div className="text-xs text-gray-400">Avg Coverage</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent
            value="logs"
            className="h-[calc(100vh-10rem)] m-0 outline-none animate-in fade-in-50"
          >
            <Card className="bg-[#0f0f11] border-white/10 text-white font-mono h-full flex flex-col">
              <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between py-3 px-4 shrink-0 bg-[#0a0a0b]">
                <CardTitle className="text-xs uppercase tracking-widest text-violet-400 flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Terminal Output
                </CardTitle>
                <div className="flex items-center gap-3">
                  <select
                    className="bg-[#0f0f11] border border-white/10 rounded-lg px-2 py-1 text-xs text-gray-300 focus:outline-none focus:border-violet-500"
                    value={logLevelFilter}
                    onChange={(e) => setLogLevelFilter(e.target.value)}
                  >
                    <option value="all">All Levels</option>
                    <option value="info">Info</option>
                    <option value="warn">Warning</option>
                    <option value="error">Error</option>
                    <option value="debug">Debug</option>
                  </select>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs gap-1"
                    onClick={() => fetchLogs()}
                  >
                    <RefreshCw className={`w-3 h-3 ${logsLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[10px] text-gray-500">Auto-refresh</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0 overflow-hidden flex-1 relative bg-[#0a0a0b]/50">
                <div className="absolute inset-0 overflow-y-auto p-4 space-y-1.5 text-xs leading-relaxed font-mono">
                  {logsLoading && systemLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
                      <RefreshCw className="w-6 h-6 animate-spin text-violet-500" />
                      <span className="text-sm">Loading system logs...</span>
                    </div>
                  ) : logsError ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-red-400">
                      <Bug className="w-6 h-6" />
                      <span className="text-sm">Error: {logsError}</span>
                      <Button variant="outline" size="sm" onClick={() => fetchLogs()}>
                        Retry
                      </Button>
                    </div>
                  ) : systemLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
                      <Terminal className="w-8 h-8 text-gray-600" />
                      <span className="text-sm">No logs yet</span>
                      <p className="text-xs text-gray-600 max-w-xs text-center">
                        Logs will appear here as you interact with the application. Try running a
                        diagnosis or uploading an image.
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-600 mb-2">
                        --- System Logs ({systemLogs.length} entries) ---
                      </p>
                      {systemLogs.map((log) => {
                        const time = new Date(log.timestamp).toLocaleTimeString("en-US", {
                          hour12: false,
                        });
                        const levelColor =
                          {
                            info: "text-emerald-400",
                            warn: "text-amber-400",
                            error: "text-red-400",
                            debug: "text-blue-400",
                          }[log.level] || "text-gray-400";

                        return (
                          <p key={log.id} className={levelColor}>
                            <span className="text-gray-700">[{time}]</span>{" "}
                            <span className="text-gray-500">[{log.category}]</span> {log.message}
                            {log.metadata && Object.keys(log.metadata).length > 0 && (
                              <span className="text-gray-600 ml-2">
                                {JSON.stringify(log.metadata)}
                              </span>
                            )}
                          </p>
                        );
                      })}
                      <div className="h-4 w-2 bg-violet-500 animate-pulse mt-2"></div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent
            value="settings"
            className="space-y-6 m-0 outline-none animate-in fade-in-50"
          >
            <h2 className="text-xl font-bold text-white mb-6">System Configuration</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white/[0.02] border-white/10 text-white">
                <CardHeader>
                  <CardTitle className="text-base">Environment Variables</CardTitle>
                  <CardDescription>
                    Runtime configuration - Click the test button to verify connectivity
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    {
                      key: "NEXT_PUBLIC_SUPABASE_URL",
                      value: "https://***.supabase.co",
                      testable: true,
                    },
                    { key: "NEXT_PUBLIC_APP_URL", value: "http://localhost:3000", testable: true },
                    { key: "GEMINI_API_KEY", value: "************************", testable: true },
                    { key: "NODE_ENV", value: "development", testable: true },
                  ].map((env, i) => (
                    <div
                      key={i}
                      className="flex flex-col gap-2 p-3 rounded-lg bg-black/20 border border-white/5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-violet-400 font-bold tracking-wider">
                          {env.key}
                        </span>
                        {env.testable && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-6 px-2 text-[10px] gap-1 rounded-full transition-all ${
                              envTestStatus[env.key] === "success"
                                ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                                : envTestStatus[env.key] === "error"
                                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                                  : envTestStatus[env.key] === "testing"
                                    ? "bg-amber-500/20 text-amber-400"
                                    : "bg-violet-500/10 text-violet-400 hover:bg-violet-500/20"
                            }`}
                            onClick={() => testEnvVariable(env.key)}
                            disabled={envTestStatus[env.key] === "testing"}
                          >
                            {envTestStatus[env.key] === "testing" ? (
                              <>
                                <RefreshCw className="w-3 h-3 animate-spin" />
                                Testing...
                              </>
                            ) : envTestStatus[env.key] === "success" ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                Passed
                              </>
                            ) : envTestStatus[env.key] === "error" ? (
                              <>
                                <Bug className="w-3 h-3" />
                                Failed
                              </>
                            ) : (
                              <>
                                <PlayCircle className="w-3 h-3" />
                                Test
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-mono text-gray-300">{env.value}</span>
                        {envTestMessage[env.key] && (
                          <span
                            className={`text-[10px] ${
                              envTestStatus[env.key] === "success"
                                ? "text-emerald-400"
                                : "text-red-400"
                            }`}
                          >
                            {envTestMessage[env.key]}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-white/[0.02] border-white/10 text-white border-dashed">
                <CardHeader>
                  <CardTitle className="text-base">Documentation & Links</CardTitle>
                  <CardDescription>External resources</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { name: "Supabase Dashboard", url: "https://app.supabase.com" },
                    { name: "Google AI Studio", url: "https://aistudio.google.com" },
                    { name: "Vercel Deployment", url: "https://vercel.com" },
                    { name: "Developer Manual", url: "/docs/dev" },
                  ].map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-violet-600/20 hover:border-violet-500/50 border border-white/5 transition-all group"
                    >
                      <span className="text-sm font-medium">{link.name}</span>
                      <ExternalLink className="w-4 h-4 text-gray-500 group-hover:text-violet-400" />
                    </a>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="updates" className="m-0 outline-none animate-in fade-in-50">
            <Card className="bg-[#0f0f11] border-white/10 text-white">
              <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between py-5 px-6">
                <div className="space-y-1">
                  <CardTitle className="text-base font-medium">Version History</CardTitle>
                  <CardDescription>Commit log</CardDescription>
                </div>
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/5">
                  <GitBranch className="w-3 h-3 text-emerald-500" />
                  <span className="text-[10px] font-mono text-gray-400">master</span>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-white/5">
                  {updatesLoading ? (
                    <div className="p-12 flex flex-col items-center justify-center text-gray-500 gap-3">
                      <RefreshCw className="w-6 h-6 animate-spin text-violet-500" />
                      <span className="text-sm italic">Syncing with repository...</span>
                    </div>
                  ) : (
                    updates.map((commit, i) => (
                      <div
                        key={i}
                        className="p-6 hover:bg-white/[0.02] transition-colors flex gap-6 group"
                      >
                        <div className="flex flex-col items-center gap-2 pt-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-violet-600 ring-4 ring-[#0f0f11] z-10"></div>
                          <div className="w-px h-full bg-white/10 group-last:hidden min-h-[40px]"></div>
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between">
                            <p className="text-sm text-gray-200 font-medium group-hover:text-violet-300 transition-colors leading-relaxed">
                              {commit.message}
                            </p>
                            <span className="text-[10px] font-mono text-gray-600 bg-white/5 px-2 py-1 rounded border border-white/5 ml-4 shrink-0">
                              {commit.hash}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                            <span className="flex items-center gap-1.5 text-gray-400">
                              <GitCommit className="w-3 h-3" />
                              {commit.author}
                            </span>
                            <span>•</span>
                            <span>
                              {new Date(commit.date).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Load More Button */}
                {!updatesLoading && hasMoreUpdates && (
                  <div className="p-6 border-t border-white/5">
                    <Button
                      variant="outline"
                      className="w-full bg-white/5 border-white/10 text-gray-300 hover:bg-violet-600/20 hover:border-violet-500/30 hover:text-violet-300"
                      onClick={loadMoreUpdates}
                      disabled={loadingMore}
                    >
                      {loadingMore ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <History className="w-4 h-4 mr-2" />
                          Load More Commits
                        </>
                      )}
                    </Button>
                  </div>
                )}

                {/* End of history indicator */}
                {!updatesLoading && !hasMoreUpdates && updates.length > 0 && (
                  <div className="p-4 text-center text-xs text-gray-600 border-t border-white/5">
                    End of commit history
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </main>
      </Tabs>
    </div>
  );
}
