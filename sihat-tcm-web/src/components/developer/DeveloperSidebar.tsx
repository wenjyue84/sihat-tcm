import { useRouter } from "next/navigation";
import { useAuth } from "@/stores/useAppStore";
import {
  LayoutDashboard,
  Target,
  Activity,
  Bug,
  Terminal,
  Settings,
  History,
  LogOut,
  X,
} from "lucide-react";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

interface DeveloperSidebarProps {
  isMobileMenuOpen: boolean;
  onMobileMenuClose: () => void;
}

export function DeveloperSidebar({ isMobileMenuOpen, onMobileMenuClose }: DeveloperSidebarProps) {
  const { signOut } = useAuth();
  const router = useRouter();

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden animate-in fade-in duration-200"
          onClick={onMobileMenuClose}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`w-64 bg-[#0f0f11] border-r border-white/5 flex flex-col p-4 gap-2 shrink-0 overflow-y-auto fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 h-full ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between md:hidden mb-4 px-2">
          <span className="font-bold text-white">Menu</span>
          <button onClick={onMobileMenuClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest px-4 py-2 mb-2">
          Platform
        </div>
        <TabsList className="bg-transparent flex flex-col h-auto p-0 gap-1 w-full justify-start">
          <TabsTrigger
            value="overview"
            onClick={onMobileMenuClose}
            className="w-full justify-start px-4 py-3 data-[state=active]:bg-violet-600/10 data-[state=active]:text-violet-400 data-[state=active]:border-r-2 data-[state=active]:border-violet-500 rounded-none rounded-r-sm transition-all text-sm font-medium"
          >
            <LayoutDashboard className="w-4 h-4 mr-3" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger
            value="testing"
            onClick={onMobileMenuClose}
            className="w-full justify-start px-4 py-3 data-[state=active]:bg-violet-600/10 data-[state=active]:text-violet-400 data-[state=active]:border-r-2 data-[state=active]:border-violet-500 rounded-none rounded-r-sm transition-all text-sm font-medium"
          >
            <Target className="w-4 h-4 mr-3" />
            Testing Suite
          </TabsTrigger>
          <TabsTrigger
            value="api"
            onClick={onMobileMenuClose}
            className="w-full justify-start px-4 py-3 data-[state=active]:bg-violet-600/10 data-[state=active]:text-violet-400 data-[state=active]:border-r-2 data-[state=active]:border-violet-500 rounded-none rounded-r-sm transition-all text-sm font-medium"
          >
            <Activity className="w-4 h-4 mr-3" />
            API Monitor
          </TabsTrigger>
          <TabsTrigger
            value="diagnostics"
            onClick={onMobileMenuClose}
            className="w-full justify-start px-4 py-3 data-[state=active]:bg-violet-600/10 data-[state=active]:text-violet-400 data-[state=active]:border-r-2 data-[state=active]:border-violet-500 rounded-none rounded-r-sm transition-all text-sm font-medium"
          >
            <Bug className="w-4 h-4 mr-3" />
            System Diagnostics
          </TabsTrigger>
          <TabsTrigger
            value="logs"
            onClick={onMobileMenuClose}
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
            onClick={onMobileMenuClose}
            className="w-full justify-start px-4 py-3 data-[state=active]:bg-violet-600/10 data-[state=active]:text-violet-400 data-[state=active]:border-r-2 data-[state=active]:border-violet-500 rounded-none rounded-r-sm transition-all text-sm font-medium"
          >
            <Settings className="w-4 h-4 mr-3" />
            Configuration
          </TabsTrigger>
          <TabsTrigger
            value="updates"
            onClick={onMobileMenuClose}
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
    </>
  );
}
