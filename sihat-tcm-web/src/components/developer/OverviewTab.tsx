import { useRouter } from "next/navigation";
import { Cpu, Database, Globe, Zap, Home, RefreshCw, Bug, ShieldCheck, Server } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface OverviewTabProps {
  currentTime: Date;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function OverviewTab({ currentTime, isRefreshing, onRefresh }: OverviewTabProps) {
  const router = useRouter();

  return (
    <div className="space-y-8 animate-in fade-in-50 slide-in-from-bottom-2">
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
                  <h4 className="font-bold text-blue-100 group-hover:text-blue-50">Flush Cache</h4>
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
              System is capturing all network traffic and AI chain-of-thought. Exception breakpoints
              are enabled.
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
              onClick={onRefresh}
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
    </div>
  );
}
