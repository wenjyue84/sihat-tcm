/**
 * Header Component for UnifiedDashboard
 * Extracted from UnifiedDashboard.tsx for better organization
 */

import { Button } from "@/components/ui/button";
import { Plus, ExternalLink, Menu } from "lucide-react";
import { useRouter } from "next/navigation";

interface UnifiedDashboardHeaderProps {
  sectionTitle: string;
  userName: string | undefined;
  userEmail: string | undefined;
  isDemoMode: boolean;
  onMobileMenuOpen: () => void;
  t: Record<string, unknown>;
}

export function UnifiedDashboardHeader({
  sectionTitle,
  userName,
  userEmail,
  isDemoMode,
  onMobileMenuOpen,
  t,
}: UnifiedDashboardHeaderProps) {
  const router = useRouter();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0">
      <div className="flex items-center gap-3">
        <button
          className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-md"
          onClick={onMobileMenuOpen}
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 line-clamp-1">{sectionTitle}</h1>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 hidden sm:flex">
            {(t.patientDashboard?.welcomeBack as string) || "Welcome back"}, {userName || userEmail || "Patient"}
            {isDemoMode && (
              <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[9px] font-black uppercase tracking-wider">
                Demo Mode
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          className="hidden md:flex gap-2"
          onClick={() => router.push("/")}
        >
          <Plus className="w-3.5 h-3.5" />
          {(t.patientDashboard?.newDiagnosis as string) || "New Diagnosis"}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="hidden md:flex gap-2"
          onClick={() => window.open("/", "_blank")}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          {(t.patientDashboard?.navigation?.home as string) || "Home"}
        </Button>
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white border border-emerald-200">
          <span className="text-xs font-bold">
            {(userName?.[0] || userEmail?.[0] || "P").toUpperCase()}
          </span>
        </div>
      </div>
    </header>
  );
}

