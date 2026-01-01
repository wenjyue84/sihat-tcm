import { motion } from "framer-motion";
import { LayoutTemplate, FileText, Sparkles } from "lucide-react";

export type ViewMode = "modern" | "classic" | "summary";

interface ViewSwitcherProps {
    currentMode: ViewMode;
    onChange: (mode: ViewMode) => void;
}

export function ViewSwitcher({ currentMode, onChange }: ViewSwitcherProps) {
    const modes: { id: ViewMode; label: string; icon: React.ElementType }[] = [
        { id: "modern", label: "Modern", icon: Sparkles },
        { id: "classic", label: "Classic", icon: FileText },
        { id: "summary", label: "Brief", icon: LayoutTemplate },
    ];

    return (
        <div className="flex items-center justify-center mb-6">
            <div className="bg-stone-200/50 p-1 rounded-full backdrop-blur-sm border border-stone-200/50 inline-flex shadow-inner">
                {modes.map((mode) => {
                    const isActive = currentMode === mode.id;
                    const Icon = mode.icon;

                    return (
                        <button
                            key={mode.id}
                            onClick={() => onChange(mode.id)}
                            className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${isActive ? "text-slate-800 shadow-sm" : "text-stone-500 hover:text-stone-700 hover:bg-white/30"
                                }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="view-switch"
                                    className="absolute inset-0 bg-white rounded-full z-0"
                                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                />
                            )}
                            <span className="relative z-10 flex items-center gap-1.5">
                                <Icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{mode.label}</span>
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
