"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
    TrendingUp,
    TrendingDown,
    Calculator,
    BarChart3,
    ArrowRight,
    Clock,
    X,
} from "lucide-react";

interface ProgressModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    improvement: number;
    sessions: Array<{ score: number | null | undefined; date: string }>;
}

export function ProgressModal({
    open,
    onOpenChange,
    improvement,
    sessions,
}: ProgressModalProps) {
    const validSessions = sessions.filter((s) => s.score !== null && s.score !== undefined);
    const firstSession = validSessions[0];
    const lastSession = validSessions[validSessions.length - 1];

    const firstScore = firstSession?.score as number;
    const lastScore = lastSession?.score as number;

    // Calculate improvement percentage
    const percentChange = firstScore > 0 ? ((improvement / firstScore) * 100).toFixed(1) : 0;

    // Calculate trend over time
    const getProgressInterpretation = (change: number) => {
        if (change >= 15)
            return {
                label: "Significant Improvement",
                color: "text-emerald-600",
                icon: "🎉",
                description:
                    "Excellent progress! Your TCM treatments and lifestyle changes are working very well.",
            };
        if (change >= 5)
            return {
                label: "Good Progress",
                color: "text-teal-600",
                icon: "📈",
                description: "You're on the right track. Continue with your current treatment plan.",
            };
        if (change >= 0)
            return {
                label: "Stable",
                color: "text-amber-600",
                icon: "➡️",
                description:
                    "Your health is maintaining. Consider consulting your practitioner for optimization.",
            };
        if (change >= -5)
            return {
                label: "Slight Decline",
                color: "text-orange-600",
                icon: "⚠️",
                description: "Minor setback. Review recent lifestyle changes or stressors.",
            };
        return {
            label: "Needs Attention",
            color: "text-red-600",
            icon: "🔴",
            description: "Notable decline. Schedule a consultation to adjust your treatment.",
        };
    };

    const interpretation = getProgressInterpretation(improvement);

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                    <Dialog.Content className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-0 outline-none">
                        <div
                            className={`sticky top-0 ${improvement >= 0 ? "bg-gradient-to-r from-emerald-600 to-teal-600" : "bg-gradient-to-r from-red-500 to-orange-500"} text-white p-6 rounded-t-2xl`}
                        >
                            <Dialog.Title className="text-xl font-bold flex items-center gap-2">
                                {improvement >= 0 ? (
                                    <TrendingUp className="w-6 h-6" />
                                ) : (
                                    <TrendingDown className="w-6 h-6" />
                                )}
                                Progress Analysis
                            </Dialog.Title>
                            <Dialog.Description
                                className={`${improvement >= 0 ? "text-teal-100" : "text-red-100"} text-sm mt-1`}
                            >
                                Track your health trajectory over time
                            </Dialog.Description>
                            <Dialog.Close asChild>
                                <button className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </Dialog.Close>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Main Progress Display */}
                            <div
                                className={`text-center ${improvement >= 0 ? "bg-gradient-to-br from-emerald-50 to-teal-50" : "bg-gradient-to-br from-red-50 to-orange-50"} rounded-xl p-6 border ${improvement >= 0 ? "border-emerald-100" : "border-red-100"}`}
                            >
                                <div className="text-5xl mb-2">{interpretation.icon}</div>
                                <p
                                    className={`text-5xl font-bold ${improvement >= 0 ? "text-emerald-600" : "text-red-600"}`}
                                >
                                    {improvement > 0 ? "+" : ""}
                                    {improvement}
                                </p>
                                <p className="text-sm text-slate-600 mt-1">points</p>
                                <p className={`text-sm font-medium mt-2 ${interpretation.color}`}>
                                    {interpretation.label}
                                </p>
                            </div>

                            {/* Calculation Breakdown */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                                    <Calculator className="w-4 h-4 text-cyan-600" />
                                    How Progress is Calculated
                                </h4>
                                <div className="bg-white rounded-lg p-4 border border-slate-100">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="text-center flex-1">
                                            <p className="text-xs text-slate-500 mb-1">First Session</p>
                                            <p className="text-2xl font-bold text-slate-700">{firstScore}</p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {new Date(firstSession?.date).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-center gap-1">
                                            <ArrowRight
                                                className={`w-6 h-6 ${improvement >= 0 ? "text-emerald-500" : "text-red-500"}`}
                                            />
                                            <span
                                                className={`text-xs font-medium ${improvement >= 0 ? "text-emerald-600" : "text-red-600"}`}
                                            >
                                                {percentChange}%
                                            </span>
                                        </div>
                                        <div className="text-center flex-1">
                                            <p className="text-xs text-slate-500 mb-1">Latest Session</p>
                                            <p className="text-2xl font-bold text-slate-700">{lastScore}</p>
                                            <p className="text-xs text-slate-400 mt-1">
                                                {new Date(lastSession?.date).toLocaleDateString("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-100">
                                        <p className="font-mono text-sm text-center text-slate-600">
                                            Progress = Latest Score − First Score
                                        </p>
                                        <p
                                            className={`font-mono text-center font-bold mt-1 ${improvement >= 0 ? "text-emerald-600" : "text-red-600"}`}
                                        >
                                            = {lastScore} − {firstScore} = {improvement > 0 ? "+" : ""}
                                            {improvement}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Score Journey Visualization */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                                    <BarChart3 className="w-4 h-4 text-cyan-600" />
                                    Your Score Journey
                                </h4>
                                <div className="relative">
                                    {/* Simple bar chart */}
                                    <div className="flex items-end justify-between gap-1 h-32">
                                        {validSessions.map((session, idx) => {
                                            const score = session.score as number;
                                            const height = (score / 100) * 100;
                                            return (
                                                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                                                    <span className="text-xs text-slate-500">{score}</span>
                                                    <div
                                                        className={`w-full rounded-t transition-all ${score >= 75
                                                            ? "bg-emerald-500"
                                                            : score >= 50
                                                                ? "bg-teal-500"
                                                                : score >= 25
                                                                    ? "bg-amber-500"
                                                                    : "bg-red-500"
                                                            }`}
                                                        style={{ height: `${height}%` }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="flex justify-between mt-2 text-xs text-slate-400">
                                        <span>Oldest</span>
                                        <span>Latest</span>
                                    </div>
                                </div>
                            </div>

                            {/* Interpretation */}
                            <div
                                className={`rounded-xl p-4 border ${improvement >= 0 ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200" : "bg-gradient-to-br from-orange-50 to-red-50 border-orange-200"}`}
                            >
                                <h4
                                    className={`font-semibold mb-2 ${improvement >= 0 ? "text-emerald-800" : "text-orange-800"}`}
                                >
                                    📊 What This Means
                                </h4>
                                <p
                                    className={`text-sm leading-relaxed ${improvement >= 0 ? "text-emerald-700" : "text-orange-700"}`}
                                >
                                    {interpretation.description}
                                </p>
                            </div>

                            {/* TCM Context */}
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                                <h4 className="font-semibold text-amber-800 mb-2">🌿 TCM Perspective on Progress</h4>
                                <p className="text-sm text-amber-700 leading-relaxed">
                                    In Traditional Chinese Medicine, health improvement reflects the gradual{" "}
                                    <strong>restoration of balance</strong> between Yin and Yang, and the free flow of
                                    Qi and Blood. Progress may not always be linear—
                                    <strong> healing often occurs in cycles</strong> as the body adjusts. Temporary
                                    setbacks during treatment can sometimes indicate the body is actively working to
                                    expel pathogens or rebalance energy.
                                </p>
                            </div>

                            {/* Session Timeline */}
                            <div>
                                <h4 className="font-semibold text-slate-800 mb-3">Session Timeline</h4>
                                <div className="max-h-48 overflow-y-auto space-y-2">
                                    {validSessions
                                        .slice()
                                        .reverse()
                                        .map((session, idx) => {
                                            const prevSession = validSessions.slice().reverse()[idx + 1];
                                            const change = prevSession
                                                ? (session.score as number) - (prevSession.score as number)
                                                : 0;
                                            return (
                                                <div
                                                    key={idx}
                                                    className="flex items-center justify-between bg-white rounded-lg p-3 border border-slate-100"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-slate-400" />
                                                        <span className="text-sm text-slate-600">
                                                            {new Date(session.date).toLocaleDateString("en-US", {
                                                                month: "short",
                                                                day: "numeric",
                                                                year: "numeric",
                                                            })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-slate-800">{session.score}</span>
                                                        {prevSession && (
                                                            <span
                                                                className={`text-xs font-medium ${change > 0 ? "text-emerald-600" : change < 0 ? "text-red-600" : "text-slate-400"}`}
                                                            >
                                                                {change > 0 ? "+" : ""}
                                                                {change !== 0 ? change : "—"}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            </div>
                        </div>
                    </Dialog.Content>
                </div>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
