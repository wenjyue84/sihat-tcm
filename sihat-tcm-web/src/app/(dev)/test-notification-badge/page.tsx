"use client";

import { useState } from "react";
import { Menu, Bell, Stethoscope, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Test Page: Doctor Navigation Notification Badge
 * 
 * This page isolates the notification badge component for testing:
 * - Mobile hamburger menu button with ping badge
 * - Simulated notification count
 * - Visual comparison: Before (bug) vs After (fix)
 */
export default function TestNotificationBadgePage() {
    const [notificationCount, setNotificationCount] = useState(3);
    const [showToast, setShowToast] = useState(false);

    return (
        <div className="min-h-screen bg-slate-100 p-4 md:p-8">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-slate-800">
                        🔔 Notification Badge Test
                    </h1>
                    <p className="text-slate-600 mt-2">
                        Testing the Doctor Navigation hamburger menu notification badge positioning
                    </p>
                </div>

                {/* Controls */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h2 className="font-semibold text-slate-700 mb-4">Test Controls</h2>
                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => setNotificationCount((n) => n + 1)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Add Notification (+)
                        </button>
                        <button
                            onClick={() => setNotificationCount(0)}
                            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                        >
                            Clear All
                        </button>
                        <button
                            onClick={() => setShowToast(true)}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                            Trigger Toast
                        </button>
                    </div>
                    <p className="mt-4 text-sm text-slate-500">
                        Current count: <span className="font-bold text-red-600">{notificationCount}</span>
                    </p>
                </div>

                {/* Comparison Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* BEFORE (Bug) */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-red-200">
                        <h3 className="font-semibold text-red-600 mb-4 flex items-center gap-2">
                            ❌ BEFORE (Bug)
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">
                            Missing <code className="bg-slate-100 px-1 rounded">relative</code> class, badge floats to header corner
                        </p>

                        {/* Simulated Mobile Header - BUGGY VERSION */}
                        <div className="relative h-14 bg-slate-50 border border-slate-200 flex items-center px-4 rounded-lg">
                            <button
                                className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                                aria-label="Open menu (buggy)"
                            >
                                <Menu className="w-6 h-6 text-slate-700" />
                                {notificationCount > 0 && (
                                    <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                    </span>
                                )}
                            </button>
                            <span className="ml-3 text-sm text-slate-400">Badge anchors to outer container ↗</span>
                        </div>
                    </div>

                    {/* AFTER (Fixed) */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border-2 border-green-200">
                        <h3 className="font-semibold text-green-600 mb-4 flex items-center gap-2">
                            ✅ AFTER (Fixed)
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">
                            Added <code className="bg-slate-100 px-1 rounded">relative</code> class, badge anchors to button
                        </p>

                        {/* Simulated Mobile Header - FIXED VERSION */}
                        <div className="relative h-14 bg-slate-50 border border-slate-200 flex items-center px-4 rounded-lg">
                            <button
                                className="relative p-2 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors"
                                aria-label="Open menu (fixed)"
                            >
                                <Menu className="w-6 h-6 text-slate-700" />
                                {notificationCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                    </span>
                                )}
                            </button>
                            <span className="ml-3 text-sm text-slate-400">Badge on button corner ✓</span>
                        </div>
                    </div>
                </div>

                {/* Live Preview Section */}
                <div className="bg-white rounded-xl p-6 shadow-sm">
                    <h3 className="font-semibold text-slate-700 mb-4">📱 Live Mobile Header Preview</h3>
                    <p className="text-xs text-slate-500 mb-4">
                        This matches the actual <code className="bg-slate-100 px-1 rounded">DoctorNavigation.tsx</code> implementation
                    </p>

                    {/* Full Mobile Header Simulation */}
                    <div className="lg:hidden bg-white border-b border-slate-200 flex items-center px-4 py-3 rounded-lg shadow-md">
                        <button
                            className="relative p-2 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors"
                            aria-label="Open menu"
                        >
                            <Menu className="w-6 h-6 text-slate-700" />
                            {notificationCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                                </span>
                            )}
                        </button>
                        <div className="flex items-center gap-2 ml-3">
                            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                                <Stethoscope className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-bold text-base tracking-tight">
                                Doctor <span className="text-blue-600">Portal</span>
                            </span>
                        </div>
                        <div className="ml-auto">
                            <button className="h-9 w-9 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-sm flex items-center justify-center">
                                <Stethoscope className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Desktop notice */}
                    <div className="hidden lg:block text-center py-8 text-slate-400">
                        <p>📱 Resize browser to mobile width (&lt; 1024px) to see live preview</p>
                    </div>
                </div>

                {/* Toast Notification Preview */}
                <AnimatePresence>
                    {showToast && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="fixed top-4 right-4 z-[60] bg-white border border-blue-100 shadow-xl rounded-xl p-4 w-80 cursor-pointer"
                            onClick={() => setShowToast(false)}
                        >
                            <div className="flex items-start gap-3">
                                <div className="bg-blue-100 p-2 rounded-full mt-1">
                                    <Bell className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-semibold text-slate-800 text-sm">New Verification Request</h4>
                                        <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>
                                    </div>
                                    <p className="text-slate-600 text-xs mt-1">A Patient has requested verification</p>
                                </div>
                                <button className="text-slate-400 hover:text-slate-600">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Verification Checklist */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                    <h3 className="font-semibold text-amber-800 mb-4">✅ Verification Checklist</h3>
                    <ul className="space-y-2 text-sm text-amber-900">
                        <li className="flex items-start gap-2">
                            <input type="checkbox" className="mt-1" />
                            <span>Badge appears at top-right corner of hamburger button (not header)</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <input type="checkbox" className="mt-1" />
                            <span>Ping animation is visible and pulsing</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <input type="checkbox" className="mt-1" />
                            <span>Badge disappears when count is 0</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <input type="checkbox" className="mt-1" />
                            <span>Mobile header layout is not disrupted</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <input type="checkbox" className="mt-1" />
                            <span>Touch target (hamburger button) is still easily tappable</span>
                        </li>
                    </ul>
                </div>

                {/* Link to actual doctor portal */}
                <div className="text-center">
                    <a
                        href="/doctor"
                        className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Go to Actual Doctor Portal →
                    </a>
                </div>
            </div>
        </div>
    );
}
