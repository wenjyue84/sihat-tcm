"use client";

import { Button } from "@/components/ui/button";
import {
  LogOut,
  Users,
  Settings,
  Shield,
  Key,
  UserCog,
  Music,
  NotebookPen,
  Smartphone,
  Loader2,
  X,
} from "lucide-react";

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  loggingOut: boolean;
  handleLogout: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SYSTEM_NAV_ITEMS: NavItem[] = [
  { id: "prompts", label: "AI Prompts", icon: Settings },
  { id: "config", label: "Configuration", icon: Music },
  { id: "security", label: "Security", icon: Key },
];

const MANAGEMENT_NAV_ITEMS: NavItem[] = [
  { id: "users", label: "User Management", icon: UserCog },
  { id: "practitioners", label: "Practitioners", icon: Users },
  { id: "blog", label: "CMS & Blog", icon: NotebookPen },
  { id: "mobile", label: "Mobile App", icon: Smartphone },
];

export function AdminSidebar({
  activeTab,
  setActiveTab,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  loggingOut,
  handleLogout,
}: AdminSidebarProps) {
  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const isActive = activeTab === item.id;

    return (
      <button
        key={item.id}
        onClick={() => handleNavClick(item.id)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
          isActive
            ? "bg-slate-100 text-slate-900"
            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        }`}
      >
        <Icon className="w-4 h-4" />
        {item.label}
      </button>
    );
  };

  return (
    <aside
      className={`w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 z-40 shadow-sm transition-transform duration-300 ease-in-out fixed inset-y-0 left-0 md:relative md:translate-x-0 h-full ${
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            Admin <span className="text-slate-500">Portal</span>
          </span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="md:hidden text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
        {/* System Section */}
        <div className="space-y-1">
          <p className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            System
          </p>
          {SYSTEM_NAV_ITEMS.map(renderNavItem)}
        </div>

        {/* Management Section */}
        <div className="mt-6 space-y-1">
          <p className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Management
          </p>
          {MANAGEMENT_NAV_ITEMS.map(renderNavItem)}
        </div>
      </div>

      {/* Footer - Logout */}
      <div className="p-4 border-t border-slate-100">
        <Button
          variant="ghost"
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          {loggingOut ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4" />
          )}
          Logout
        </Button>
      </div>
    </aside>
  );
}
