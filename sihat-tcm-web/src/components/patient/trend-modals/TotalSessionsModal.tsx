"use client";

import { motion } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import {
    Heart,
    Shield,
    Sparkles,
    Calendar,
    Award,
    X,
} from "lucide-react";

interface TotalSessionsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    sessionCount: number;
    sessions: Array<{ score: number | null | undefined; date: string }>;
}

export function TotalSessionsModal({
    open,
    onOpenChange,
    sessionCount,
    sessions,
}: TotalSessionsModalProps) {
    const getMilestone = (count: number) => {
        if (count >= 20) return { title: "Health Champion", icon: "🏆", color: "from-amber-500 to-yellow-500" };
        if (count >= 10) return { title: "Wellness Warrior", icon: "⭐", color: "from-emerald-500 to-teal-500" };
        if (count >= 5) return { title: "Health Explorer", icon: "🌟", color: "from-blue-500 to-cyan-500" };
        if (count >= 3) return { title: "Wellness Seeker", icon: "🌱", color: "from-green-500 to-emerald-500" };
        return { title: "Getting Started", icon: "✨", color: "from-violet-500 to-purple-500" };
    };

    const milestone = getMilestone(sessionCount);
    const nextMilestone = sessionCount < 3 ? 3 : sessionCount < 5 ? 5 : sessionCount < 10 ? 10 : sessionCount < 20 ? 20 : null;
    const progress = nextMilestone ? (sessionCount / nextMilestone) * 100 : 100;

    // Calculate session frequency
    const validSessions = sessions.filter((s) => s.date);
    const sortedDates = validSessions.map((s) => new Date(s.date)).sort((a, b) => a.getTime() - b.getTime());

    let avgDaysBetween = 0;
    if (sortedDates.length >= 2) {
        const totalDays = (sortedDates[sortedDates.length - 1].getTime() - sortedDates[0].getTime()) / (1000 * 60 * 60 * 24);
        avgDaysBetween = Math.round(totalDays / (sortedDates.length - 1));
    }

    const insights = [
        {
            icon: <Heart className="w-5 h-5 text-rose-500" />,
            title: "Dedication to Health",
            description: `You've committed to ${sessionCount} health check-in${sessionCount !== 1 ? "s" : ""}. Each session is a step toward better understanding your body.`,
        },
        {
            icon: <Shield className="w-5 h-5 text-blue-500" />,
            title: "Proactive Wellness",
            description: "Regular TCM sessions help identify imbalances early, before they become major health concerns.",
        },
        {
            icon: <Sparkles className="w-5 h-5 text-amber-500" />,
            title: "Building Health Data",
            description: "Each session adds valuable data points, helping track patterns and improvements over time.",
        },
    ];

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                    <Dialog.Content className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-0 outline-none">
                        <div className={`sticky top-0 bg-gradient-to-r ${milestone.color} text-white p-6 rounded-t-2xl`}>
                            <Dialog.Title className="text-xl font-bold flex items-center gap-2">
                                <Award className="w-6 h-6" />
                                Your Health Journey Sessions
                            </Dialog.Title>
                            <Dialog.Description className="text-white/80 text-sm mt-1">
                                Every session is a commitment to your wellbeing
                            </Dialog.Description>
                            <Dialog.Close asChild>
                                <button className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </Dialog.Close>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Achievement Badge */}
                            <div className="text-center bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border border-slate-200">
                                <div className="text-6xl mb-3">{milestone.icon}</div>
                                <p className="text-5xl font-bold text-slate-800 mb-1">{sessionCount}</p>
                                <p className="text-sm text-slate-500 mb-3">Total Sessions</p>
                                <div className={`inline-block px-4 py-2 rounded-full bg-gradient-to-r ${milestone.color} text-white font-semibold text-sm`}>
                                    {milestone.title}
                                </div>
                            </div>

                            {/* Progress to Next Milestone */}
                            {nextMilestone && (
                                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-emerald-800">Progress to Next Milestone</span>
                                        <span className="text-sm text-emerald-600">{sessionCount}/{nextMilestone} sessions</span>
                                    </div>
                                    <div className="h-3 bg-emerald-200 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progress}%` }}
                                            transition={{ duration: 0.8, ease: "easeOut" }}
                                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                                        />
                                    </div>
                                    <p className="text-xs text-emerald-600 mt-2">
                                        🎯 Only {nextMilestone - sessionCount} more session{nextMilestone - sessionCount !== 1 ? "s" : ""} to unlock the next achievement!
                                    </p>
                                </div>
                            )}

                            {/* Session Frequency */}
                            {avgDaysBetween > 0 && (
                                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                    <h4 className="font-semibold text-blue-800 flex items-center gap-2 mb-2">
                                        <Calendar className="w-4 h-4" />
                                        Your Consistency
                                    </h4>
                                    <p className="text-sm text-blue-700">
                                        On average, you have a session every <strong>{avgDaysBetween} days</strong>.
                                        {avgDaysBetween <= 14
                                            ? " That's excellent commitment to your health!"
                                            : avgDaysBetween <= 30
                                                ? " Great job maintaining regular check-ins!"
                                                : " Consider more frequent sessions for optimal health tracking."}
                                    </p>
                                </div>
                            )}

                            {/* Positive Insights */}
                            <div className="space-y-3">
                                <h4 className="font-semibold text-slate-800">Why This Matters</h4>
                                {insights.map((insight, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="flex gap-3 bg-white rounded-lg p-3 border border-slate-100 shadow-sm"
                                    >
                                        <div className="p-2 bg-slate-50 rounded-lg h-fit">{insight.icon}</div>
                                        <div>
                                            <p className="font-medium text-slate-800 text-sm">{insight.title}</p>
                                            <p className="text-xs text-slate-600 mt-0.5">{insight.description}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Encouragement */}
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                                <p className="text-sm text-amber-800 leading-relaxed">
                                    🌿 <strong>TCM Wisdom:</strong> In Traditional Chinese Medicine, consistent health monitoring aligns with the principle of "治未病" (zhì wèi bìng) — treating disease before it arises. Your commitment to regular sessions embodies this ancient wisdom.
                                </p>
                            </div>
                        </div>
                    </Dialog.Content>
                </div>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
