"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  MessageSquare,
  Settings,
  LogOut,
  Stethoscope,
} from "lucide-react";

/**
 * Isolated Test Page for DoctorNavigation Hover Animations
 * Tests the new Framer Motion micro-interactions without auth dependencies
 */

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  section?: string;
}

const testNavItems: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <LayoutDashboard className="w-4 h-4" />,
    section: "Practice",
  },
  { id: "patients", label: "Patients", icon: <Users className="w-4 h-4" />, section: "Practice" },
  { id: "reports", label: "Reports", icon: <FileText className="w-4 h-4" />, section: "Practice" },
  {
    id: "schedule",
    label: "Schedule",
    icon: <Calendar className="w-4 h-4" />,
    section: "Clinical",
  },
  {
    id: "communication",
    label: "Communication",
    icon: <MessageSquare className="w-4 h-4" />,
    section: "Communication",
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings className="w-4 h-4" />,
    section: "Settings",
  },
];

export default function TestDoctorNavPage() {
  const [activeId, setActiveId] = useState("dashboard");
  const [notificationCount, setNotificationCount] = useState(0);

  // Group items by section
  const sections = testNavItems.reduce(
    (acc, item) => {
      const section = item.section || "Other";
      if (!acc[section]) {
        acc[section] = [];
      }
      acc[section].push(item);
      return acc;
    },
    {} as Record<string, NavItem[]>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Test Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen shadow-sm">
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
            <Stethoscope className="w-4 h-4" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            Doctor <span className="text-blue-600">Portal</span>
          </span>
        </div>

        {/* Navigation */}
        <div className="p-4 flex-1 overflow-y-auto">
          {Object.entries(sections).map(([sectionName, items]) => (
            <div key={sectionName} className="mb-4">
              <p className="px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                {sectionName}
              </p>
              <div className="space-y-1">
                {items.map((item) => {
                  const active = activeId === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => setActiveId(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors relative overflow-hidden ${
                        active
                          ? "bg-blue-50 text-blue-700 border-l-[3px] border-blue-500"
                          : "text-slate-600 border-l-[3px] border-transparent"
                      }`}
                      whileHover={
                        active
                          ? {}
                          : {
                              scale: 1.02,
                              backgroundColor: "rgba(248, 250, 252, 1)",
                              transition: { type: "spring", stiffness: 400, damping: 25 },
                            }
                      }
                      whileTap={{ scale: 0.98 }}
                    >
                      {/* Icon with independent hover color */}
                      <motion.span
                        className={active ? "text-blue-600" : "text-slate-500"}
                        whileHover={active ? {} : { color: "#3b82f6" }}
                        transition={{ duration: 0.15 }}
                      >
                        {item.icon}
                      </motion.span>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.id === "communication" && notificationCount > 0 && (
                        <motion.span
                          className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] flex items-center justify-center"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 20 }}
                        >
                          {notificationCount}
                        </motion.span>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-slate-100">
          <motion.button
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-600 rounded-lg"
            whileHover={{
              scale: 1.02,
              backgroundColor: "rgba(254, 242, 242, 1)",
              transition: { type: "spring", stiffness: 400, damping: 25 },
            }}
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </motion.button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-bold text-slate-800 mb-6">🧪 DoctorNavigation Hover Test</h1>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-6">
            <section>
              <h2 className="font-semibold text-slate-700 mb-3">✅ Verification Checklist</h2>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>Hover nav items → Smooth scale(1.02) + bg fade</span>
                </li>
                <li className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>Icon turns blue on hover (non-active items)</span>
                </li>
                <li className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>Active item has left blue border accent</span>
                </li>
                <li className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>Click/tap → scale(0.98) feedback</span>
                </li>
                <li className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span>Notification badge spring animation</span>
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-semibold text-slate-700 mb-3">🔔 Test Notification Badge</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setNotificationCount((prev) => prev + 1)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                >
                  Add Notification
                </button>
                <button
                  onClick={() => setNotificationCount(0)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-300"
                >
                  Clear
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Current count: {notificationCount} (Check "Communication" nav item)
              </p>
            </section>

            <section>
              <h2 className="font-semibold text-slate-700 mb-3">📱 Mobile Test</h2>
              <p className="text-sm text-slate-600">
                Toggle device toolbar (Ctrl+Shift+M) to test touch behavior. Tap items should show
                scale-down feedback without hover artifacts.
              </p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
