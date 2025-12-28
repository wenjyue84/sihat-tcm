"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/stores/useAppStore";
import { Button } from "@/components/ui/button";
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
                            {items.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handleNavigation(item.href)}
                                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${isActive(item.href)
                                        ? "bg-blue-50 text-blue-700"
                                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-800"
                                        }`}
                                >
                                    {item.icon}
                                    {item.label}
                                </button>
                            ))}
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
            {/* Mobile Header Bar */}
            <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b border-slate-200 flex items-center px-4 z-40">
                <button
                    onClick={() => setMobileMenuOpen(true)}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                    aria-label="Open menu"
                >
                    <Menu className="w-6 h-6 text-slate-700" />
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
