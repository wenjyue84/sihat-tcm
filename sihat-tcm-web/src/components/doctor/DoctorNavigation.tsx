"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/stores/useAppStore";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import {
    Stethoscope,
    LayoutDashboard,
    Users,
    FileText,
    Calendar,
    MessageSquare,
    BarChart3,
    Settings,
    LogOut,
    Loader2,
    AlertTriangle,
    Syringe,
    Menu,
    X,
    Bell,
} from "lucide-react";

interface NavItem {
    id: string;
    label: string;
    icon: React.ReactNode;
    href: string;
    section?: string;
}

const navItems: NavItem[] = [
    // Practice Section
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" />, href: "/doctor", section: "Practice" },
    { id: "critical", label: "Critical", icon: <AlertTriangle className="w-4 h-4" />, href: "/doctor/critical", section: "Practice" },
    { id: "patients", label: "Patients", icon: <Users className="w-4 h-4" />, href: "/doctor/patients", section: "Practice" },
    { id: "reports", label: "Reports", icon: <FileText className="w-4 h-4" />, href: "/doctor/reports", section: "Practice" },
    // Clinical Section  
    { id: "treatment", label: "Treatment", icon: <Syringe className="w-4 h-4" />, href: "/doctor/treatment", section: "Clinical" },
    { id: "schedule", label: "Schedule", icon: <Calendar className="w-4 h-4" />, href: "/doctor/schedule", section: "Clinical" },
    // Communication Section
    { id: "communication", label: "Communication", icon: <MessageSquare className="w-4 h-4" />, href: "/doctor/communication", section: "Communication" },
    // Analytics Section
    { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" />, href: "/doctor/analytics", section: "Analytics" },
    // Settings Section
    { id: "settings", label: "Settings", icon: <Settings className="w-4 h-4" />, href: "/doctor/settings", section: "Settings" },
];

export function DoctorNavigation() {
    const router = useRouter();
    const pathname = usePathname();
    const { signOut } = useAuth();
    const [loggingOut, setLoggingOut] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [notification, setNotification] = useState<{ title: string; message: string } | null>(null);
    const [newRequestCount, setNewRequestCount] = useState(0);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    // Close mobile menu on window resize to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setMobileMenuOpen(false);
            }
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Prevent body scroll when mobile menu is open
    useEffect(() => {
        if (mobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [mobileMenuOpen]);

    // Realtime Notifications for Doctor
    useEffect(() => {
        const channel = supabase
            .channel('doctor-global-notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'inquiries',
                    filter: 'symptoms=eq.Request for Verification'
                },
                (payload) => {
                    const newRequest = payload.new as any;
                    const patientName = newRequest.diagnosis_report?.patient_profile?.name || 'A Patient';

                    setNotification({
                        title: "New Verification Request",
                        message: `${patientName} has requested verification`
                    });
                    setNewRequestCount(prev => prev + 1);

                    // Auto dismiss toast
                    setTimeout(() => setNotification(null), 6000);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleLogout = async () => {
        try {
            setLoggingOut(true);
            await signOut();
            router.push("/");
        } catch (error) {
            console.error("Error logging out:", error);
            setLoggingOut(false);
        }
    };

    const isActive = (href: string) => {
        if (href === "/doctor") {
            return pathname === "/doctor";
        }
        return pathname.startsWith(href);
    };

    const handleNavigation = (href: string) => {
        router.push(href);
        setMobileMenuOpen(false);
        if (href === "/doctor/communication") {
            setNewRequestCount(0); // Reset count when viewing communication
        }
    };

    // Group items by section
    const sections = navItems.reduce((acc, item) => {
        const section = item.section || "Other";
        if (!acc[section]) {
            acc[section] = [];
        }
        acc[section].push(item);
        return acc;
    }, {} as Record<string, NavItem[]>);

    const NavigationContent = () => (
        <>
            {/* Logo */}
            <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                    <Stethoscope className="w-4 h-4" />
                </div>
                <span className="font-bold text-lg tracking-tight">
                    Doctor <span className="text-blue-600">Portal</span>
                </span>
                {/* Mobile close button */}
                <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="lg:hidden ml-auto p-2 rounded-lg hover:bg-slate-100 transition-colors"
                    aria-label="Close menu"
                >
                    <X className="w-5 h-5 text-slate-600" />
                </button>
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
                                const active = isActive(item.href);
                                return (
                                    <motion.button
                                        key={item.id}
                                        onClick={() => handleNavigation(item.href)}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors relative overflow-hidden ${active
                                            ? "bg-blue-50 text-blue-700 border-l-[3px] border-blue-500"
                                            : "text-slate-600 border-l-[3px] border-transparent"
                                            }`}
                                        whileHover={active ? {} : {
                                            scale: 1.02,
                                            backgroundColor: "rgba(248, 250, 252, 1)",
                                            transition: { type: "spring", stiffness: 400, damping: 25 }
                                        }}
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
                                        {item.id === "communication" && newRequestCount > 0 && (
                                            <motion.span
                                                className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.25rem] flex items-center justify-center"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ type: "spring", stiffness: 500, damping: 20 }}
                                            >
                                                {newRequestCount}
                                            </motion.span>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Logout Button */}
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
        </>
    );

    return (
        <>
            {/* Global Notification Toast */}
            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, right: 20 }}
                        animate={{ opacity: 1, y: 0, right: 20 }}
                        exit={{ opacity: 0, y: -20, right: 20 }}
                        className="fixed top-4 right-4 z-[60] bg-white border border-blue-100 shadow-xl rounded-xl p-4 w-80 cursor-pointer"
                        onClick={() => {
                            setNotification(null);
                            handleNavigation("/doctor/communication");
                        }}
                    >
                        <div className="flex items-start gap-3">
                            <div className="bg-blue-100 p-2 rounded-full mt-1">
                                <Bell className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="font-semibold text-slate-800 text-sm">{notification.title}</h4>
                                    <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>
                                </div>
                                <p className="text-slate-600 text-xs mt-1">{notification.message}</p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Mobile Header Bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 flex items-center px-4 z-40">
                <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="relative p-2 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors"
                    aria-label="Open menu"
                >
                    <Menu className="w-6 h-6 text-slate-700" />
                    {newRequestCount > 0 && (
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
                    <Button
                        size="icon"
                        className="h-9 w-9 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-sm"
                        onClick={() => router.push("/doctor/diagnose")}
                    >
                        <Stethoscope className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Slide-out Menu */}
            <aside
                className={`lg:hidden fixed top-0 left-0 h-full w-72 bg-white shadow-xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                <NavigationContent />
            </aside>

            {/* Desktop Sidebar (hidden on mobile) */}
            <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col shrink-0 z-20 shadow-sm h-screen">
                <NavigationContent />
            </aside>
        </>
    );
}
