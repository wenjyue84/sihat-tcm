/**
 * Mobile Header Component for UnifiedDashboard
 * Provides navigation trigger on mobile devices (< md breakpoint)
 *
 * Features:
 * - Fixed top bar with hamburger menu
 * - Patient Portal branding
 * - Quick action button for new diagnosis
 * - 44px+ touch targets for accessibility
 * - Hidden on md+ screens (sidebar always visible)
 */

"use client";

import Link from "next/link";
import { Menu, Heart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UnifiedDashboardMobileHeaderProps {
  onMenuOpen: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: Record<string, any>;
}

export function UnifiedDashboardMobileHeader({ onMenuOpen, t }: UnifiedDashboardMobileHeaderProps) {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 flex items-center px-4 z-40 safe-area-inset-top">
      {/* Hamburger Menu Button - 44px+ touch target */}
      <button
        onClick={onMenuOpen}
        className="flex items-center justify-center w-11 h-11 -ml-2 rounded-lg hover:bg-slate-100 active:bg-slate-200 active:scale-95 transition-all"
        aria-label="Open menu"
      >
        <Menu className="w-6 h-6 text-slate-700" />
      </button>

      {/* Logo and Branding */}
      <div className="flex items-center gap-2 ml-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white">
          <Heart className="w-3.5 h-3.5" />
        </div>
        <span className="font-bold text-base tracking-tight text-slate-800">
          Patient <span className="text-emerald-600">Portal</span>
        </span>
      </div>

      {/* Quick Action - New Diagnosis */}
      <div className="ml-auto">
        <Link href="/">
          <Button
            size="sm"
            className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-full shadow-sm transition-all"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span className="text-xs font-medium">
              {((
                (t.patientDashboard as Record<string, unknown> | undefined)?.navigation as
                  | Record<string, unknown>
                  | undefined
              )?.newDiagnosis as string) || "New"}
            </span>
          </Button>
        </Link>
      </div>
    </header>
  );
}
