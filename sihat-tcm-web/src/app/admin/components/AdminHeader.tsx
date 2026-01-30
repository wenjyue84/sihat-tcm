"use client";

import { Button } from "@/components/ui/button";
import { ExternalLink, Menu } from "lucide-react";

interface AdminHeaderProps {
  activeTab: string;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const TAB_TITLES: Record<string, string> = {
  prompts: "System Prompts",
  config: "System Configuration",
  security: "Security Settings",
  users: "User Management",
  practitioners: "Practitioner Directory",
  blog: "Content Management",
  mobile: "Mobile App Deployment",
};

export function AdminHeader({ activeTab, setIsMobileMenuOpen }: AdminHeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0">
      <div className="flex items-center gap-3">
        <button
          className="md:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-md"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-800 line-clamp-1">
            {TAB_TITLES[activeTab] || "Admin Dashboard"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
            Sihat Medical Administration &bull; v2.4.0
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          className="hidden md:flex gap-2"
          onClick={() => window.open("/", "_blank")}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open App
        </Button>
        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
          <span className="text-xs font-bold">A</span>
        </div>
      </div>
    </header>
  );
}
