"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
    Clock,
    Star,
    Leaf,
    X,
} from "lucide-react";

interface JourneyDurationModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    duration: string;
    sessions: Array<{ score: number | null | undefined; date: string }>;
}

export function JourneyDurationModal({
    open,
    onOpenChange,
    duration,
    sessions,
}: JourneyDurationModalProps) {
    const validSessions = sessions.filter((s) => s.date);
    const sortedDates = validSessions.map((s) => new Date(s.date)).sort((a, b) => a.getTime() - b.getTime());
    const firstSession = sortedDates[0];
    const lastSession = sortedDates[sortedDates.length - 1];

    // Calculate days on journey
    const daysOnJourney = firstSession && lastSession
        ? Math.ceil((lastSession.getTime() - firstSession.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    const getJourneyMilestone = (days: number) => {
        if (days >= 365) return { title: "Year-Long Wellness Veteran", icon: "🎖️", message: "A full year of health dedication! Your body thanks you." };
        if (days >= 180) return { title: "Half-Year Health Hero", icon: "🌟", message: "Six months of consistent self-care. Remarkable commitment!" };
        if (days >= 90) return { title: "Quarterly Champion", icon: "⭐", message: "Three months of health focus. You're building lasting habits!" };
        if (days >= 30) return { title: "Monthly Milestone", icon: "🌱", message: "One month into your journey. Great foundation!" };
        return { title: "Fresh Start", icon: "✨", message: "Every journey begins with a single step. You've taken it!" };
    };

    const journeyMilestone = getJourneyMilestone(daysOnJourney);

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                    <Dialog.Content className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-0 outline-none">
                        <div className="sticky top-0 bg-gradient-to-r from-violet-600 to-purple-600 text-white p-6 rounded-t-2xl">
                            <Dialog.Title className="text-xl font-bold flex items-center gap-2">
                                <Clock className="w-6 h-6" />
                                Your Wellness Timeline
                            </Dialog.Title>
                            <Dialog.Description className="text-violet-100 text-sm mt-1">
                                Celebrating your commitment to lasting health
                            </Dialog.Description>
                            <Dialog.Close asChild>
                                <button className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </Dialog.Close>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Duration Display */}
                            <div className="text-center bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-6 border border-violet-100">
                                <div className="text-5xl mb-3">{journeyMilestone.icon}</div>
                                <p className="text-4xl font-bold text-violet-800 mb-1">{duration}</p>
                                <p className="text-sm text-violet-600 mb-3">on your health journey</p>
                                <div className="inline-block px-4 py-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-white font-semibold text-sm">
                                    {journeyMilestone.title}
                                </div>
                                <p className="text-sm text-violet-700 mt-3 italic">"{journeyMilestone.message}"</p>
                            </div>

                            {/* Journey Timeline */}
                            {firstSession && (
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                    <h4 className="font-semibold text-slate-800 mb-4">Your Journey So Far</h4>
                                    <div className="relative pl-4 border-l-2 border-violet-300 space-y-4">
                                        <div className="relative">
                                            <div className="absolute -left-[21px] w-4 h-4 bg-violet-500 rounded-full border-2 border-white" />
                                            <p className="text-sm font-medium text-slate-800">Journey Started</p>
                                            <p className="text-xs text-slate-500">
                                                {firstSession.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                                            </p>
                                        </div>
                                        {validSessions.length > 1 && (
                                            <div className="relative">
                                                <div className="absolute -left-[21px] w-4 h-4 bg-violet-400 rounded-full border-2 border-white" />
                                                <p className="text-sm font-medium text-slate-800">{validSessions.length - 2} Sessions In Between</p>
                                                <p className="text-xs text-slate-500">Continuous health monitoring</p>
                                            </div>
                                        )}
                                        <div className="relative">
                                            <div className="absolute -left-[21px] w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
                                            <p className="text-sm font-medium text-slate-800">Latest Session</p>
                                            <p className="text-xs text-slate-500">
                                                {lastSession?.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Positive Affirmations */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 text-center">
                                    <Star className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                                    <p className="text-sm font-medium text-emerald-800">Consistency</p>
                                    <p className="text-xs text-emerald-600 mt-1">Time is your ally in healing</p>
                                </div>
                                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 text-center">
                                    <Leaf className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                                    <p className="text-sm font-medium text-amber-800">Growth</p>
                                    <p className="text-xs text-amber-600 mt-1">Each day brings new balance</p>
                                </div>
                            </div>

                            {/* TCM Wisdom */}
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                                <p className="text-sm text-amber-800 leading-relaxed">
                                    🌿 <strong>TCM Perspective:</strong> Healing follows natural rhythms. Just as seasons change gradually, your body's return to balance is a journey, not a destination. The time you've invested shows wisdom and patience — qualities that TCM considers essential for true wellness.
                                </p>
                            </div>
                        </div>
                    </Dialog.Content>
                </div>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
