/**
 * Mobile Bottom Navigation for Patient Dashboard
 * Provides quick access to 5 primary sections on mobile devices
 * Hidden on desktop (md:hidden)
 */

"use client";

import { motion } from "framer-motion";
import {
    Activity,
    User,
    UtensilsCrossed,
    Heart,
    Menu,
} from "lucide-react";
import type { DashboardSection } from "./dashboardTypes";

interface MobileBottomNavProps {
    activeSection: DashboardSection;
    onSectionChange: (section: DashboardSection) => void;
    onMoreClick: () => void;
}

interface NavItem {
    id: DashboardSection | "more";
    label: string;
    icon: React.ReactNode;
}

const navItems: NavItem[] = [
    { id: "journey", label: "Journey", icon: <Activity className="w-5 h-5" /> },
    { id: "profile", label: "Profile", icon: <User className="w-5 h-5" /> },
    { id: "meals", label: "Meals", icon: <UtensilsCrossed className="w-5 h-5" /> },
    { id: "heart-companion", label: "Heart", icon: <Heart className="w-5 h-5" /> },
    { id: "more", label: "More", icon: <Menu className="w-5 h-5" /> },
];

// Sections that are shown in bottom nav (for "More" active state logic)
const bottomNavSections: DashboardSection[] = ["journey", "profile", "meals", "heart-companion"];

export function MobileBottomNav({
    activeSection,
    onSectionChange,
    onMoreClick,
}: MobileBottomNavProps) {
    // If active section is not in bottom nav, show "More" as active
    const isMoreActive = !bottomNavSections.includes(activeSection);

    const handleItemClick = (item: NavItem) => {
        if (item.id === "more") {
            onMoreClick();
        } else {
            onSectionChange(item.id as DashboardSection);
        }
    };

    return (
        <nav
            className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-200 shadow-lg"
            role="navigation"
            aria-label="Main navigation"
        >
            {/* Safe area padding for notched devices */}
            <div className="flex items-center justify-around px-2 pb-safe">
                {navItems.map((item) => {
                    const isActive = item.id === "more"
                        ? isMoreActive
                        : activeSection === item.id;

                    return (
                        <motion.button
                            key={item.id}
                            onClick={() => handleItemClick(item)}
                            className={`flex flex-col items-center justify-center min-w-[64px] min-h-[56px] py-2 px-3 rounded-lg transition-colors ${isActive
                                    ? "text-emerald-600"
                                    : "text-slate-500"
                                }`}
                            whileTap={{ scale: 0.9 }}
                            aria-current={isActive ? "page" : undefined}
                            aria-label={item.label}
                        >
                            {/* Icon with active indicator */}
                            <div className="relative">
                                <motion.div
                                    animate={{
                                        scale: isActive ? 1.1 : 1,
                                        y: isActive ? -2 : 0,
                                    }}
                                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                >
                                    {item.icon}
                                </motion.div>
                                {/* Active dot indicator */}
                                {isActive && (
                                    <motion.div
                                        className="absolute -bottom-1 left-1/2 w-1 h-1 bg-emerald-500 rounded-full"
                                        initial={{ scale: 0, x: "-50%" }}
                                        animate={{ scale: 1, x: "-50%" }}
                                        transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                    />
                                )}
                            </div>
                            {/* Label */}
                            <span className={`text-[10px] mt-1 font-medium ${isActive ? "text-emerald-600" : "text-slate-400"
                                }`}>
                                {item.label}
                            </span>
                        </motion.button>
                    );
                })}
            </div>
        </nav>
    );
}
