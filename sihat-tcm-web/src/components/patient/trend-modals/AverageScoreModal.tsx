"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
    Calculator,
    BarChart3,
    Target,
    Clock,
    Info,
    X,
} from "lucide-react";

interface AverageScoreModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    averageScore: number;
    sessions: Array<{ score: number | null | undefined; date: string }>;
}

export function AverageScoreModal({
    open,
    onOpenChange,
    averageScore,
    sessions,
}: AverageScoreModalProps) {
    const validSessions = sessions.filter((s) => s.score !== null && s.score !== undefined);
    const scores = validSessions.map((s) => s.score as number);
    const total = scores.reduce((a, b) => a + b, 0);
    const min = Math.min(...scores);
    const max = Math.max(...scores);
    const variance =
        scores.length > 1
            ? scores.reduce((acc, val) => acc + Math.pow(val - averageScore, 2), 0) / scores.length
            : 0;
    const stdDev = Math.sqrt(variance);

    // Categorize scores
    const excellent = scores.filter((s) => s >= 80).length;
    const good = scores.filter((s) => s >= 60 && s < 80).length;
    const fair = scores.filter((s) => s >= 40 && s < 60).length;
    const needsWork = scores.filter((s) => s < 40).length;

    const getScoreInterpretation = (score: number) => {
        if (score >= 80)
            return {
                label: "Excellent",
                color: "text-emerald-600",
                bg: "bg-emerald-100",
                description: "Strong Qi flow, balanced constitution",
            };
        if (score >= 60)
            return {
                label: "Good",
                color: "text-teal-600",
                bg: "bg-teal-100",
                description: "Minor imbalances, generally healthy",
            };
        if (score >= 40)
            return {
                label: "Fair",
                color: "text-amber-600",
                bg: "bg-amber-100",
                description: "Notable imbalances requiring attention",
            };
        return {
            label: "Needs Improvement",
            color: "text-red-600",
            bg: "bg-red-100",
            description: "Significant imbalances, active treatment recommended",
        };
    };

    const interpretation = getScoreInterpretation(averageScore);

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                    <Dialog.Content className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-0 outline-none">
                        <div className="sticky top-0 bg-gradient-to-r from-teal-600 to-emerald-600 text-white p-6 rounded-t-2xl">
                            <Dialog.Title className="text-xl font-bold flex items-center gap-2">
                                <Calculator className="w-6 h-6" />
                                Average Score Breakdown
                            </Dialog.Title>
                            <Dialog.Description className="text-teal-100 text-sm mt-1">
                                Scientific methodology behind your health score calculation
                            </Dialog.Description>
                            <Dialog.Close asChild>
                                <button className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </Dialog.Close>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Main Score Display */}
                            <div className="text-center bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl p-6 border border-teal-100">
                                <p className="text-6xl font-bold text-teal-700">{averageScore}</p>
                                <p className={`text-sm font-medium mt-2 ${interpretation.color}`}>
                                    {interpretation.label}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">{interpretation.description}</p>
                            </div>

                            {/* Calculation Formula */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                                    <Target className="w-4 h-4 text-teal-600" />
                                    Calculation Method
                                </h4>
                                <div className="bg-white rounded-lg p-4 font-mono text-sm text-slate-700 border border-slate-100">
                                    <p className="mb-2">Average Score = Σ (Session Scores) ÷ n</p>
                                    <p className="text-teal-600">
                                        = ({scores.join(" + ")}) ÷ {scores.length}
                                    </p>
                                    <p className="text-emerald-600 font-bold mt-1">
                                        = {total} ÷ {scores.length} = {averageScore}
                                    </p>
                                </div>
                                <p className="text-xs text-slate-500 mt-3">
                                    The arithmetic mean is used to provide a balanced representation of your overall
                                    health trend, giving equal weight to each diagnosis session.
                                </p>
                            </div>

                            {/* Statistical Analysis */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <h4 className="font-semibold text-slate-800 flex items-center gap-2 mb-3">
                                    <BarChart3 className="w-4 h-4 text-teal-600" />
                                    Statistical Analysis
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white rounded-lg p-3 border border-slate-100 text-center">
                                        <p className="text-2xl font-bold text-slate-800">{min}</p>
                                        <p className="text-xs text-slate-500">Minimum Score</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 border border-slate-100 text-center">
                                        <p className="text-2xl font-bold text-slate-800">{max}</p>
                                        <p className="text-xs text-slate-500">Maximum Score</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 border border-slate-100 text-center">
                                        <p className="text-2xl font-bold text-slate-800">{max - min}</p>
                                        <p className="text-xs text-slate-500">Range</p>
                                    </div>
                                    <div className="bg-white rounded-lg p-3 border border-slate-100 text-center">
                                        <p className="text-2xl font-bold text-slate-800">±{stdDev.toFixed(1)}</p>
                                        <p className="text-xs text-slate-500">Std. Deviation</p>
                                    </div>
                                </div>
                            </div>

                            {/* Score Distribution */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <h4 className="font-semibold text-slate-800 mb-3">Score Distribution</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-24 text-xs text-emerald-600 font-medium">Excellent (80+)</div>
                                        <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-emerald-500 rounded-full transition-all"
                                                style={{ width: `${(excellent / scores.length) * 100}%` }}
                                            />
                                        </div>
                                        <div className="w-8 text-xs text-slate-600 text-right">{excellent}</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-24 text-xs text-teal-600 font-medium">Good (60-79)</div>
                                        <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-teal-500 rounded-full transition-all"
                                                style={{ width: `${(good / scores.length) * 100}%` }}
                                            />
                                        </div>
                                        <div className="w-8 text-xs text-slate-600 text-right">{good}</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-24 text-xs text-amber-600 font-medium">Fair (40-59)</div>
                                        <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-amber-500 rounded-full transition-all"
                                                style={{ width: `${(fair / scores.length) * 100}%` }}
                                            />
                                        </div>
                                        <div className="w-8 text-xs text-slate-600 text-right">{fair}</div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-24 text-xs text-red-600 font-medium">Needs Work (&lt;40)</div>
                                        <div className="flex-1 h-4 bg-slate-200 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-red-500 rounded-full transition-all"
                                                style={{ width: `${(needsWork / scores.length) * 100}%` }}
                                            />
                                        </div>
                                        <div className="w-8 text-xs text-slate-600 text-right">{needsWork}</div>
                                    </div>
                                </div>
                            </div>

                            {/* TCM Context */}
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                                <h4 className="font-semibold text-amber-800 mb-2">🌿 TCM Health Score Context</h4>
                                <p className="text-sm text-amber-700 leading-relaxed">
                                    Your health score is derived from TCM diagnostic indicators including{" "}
                                    <strong>tongue analysis</strong> (color, coating, shape),
                                    <strong> pulse assessment</strong> (rate, rhythm, depth), and{" "}
                                    <strong>symptom inquiry</strong> (physical and emotional symptoms). Each session
                                    evaluates the balance of Qi, Blood, Yin, and Yang in your body.
                                </p>
                            </div>

                            {/* Session List */}
                            <div>
                                <h4 className="font-semibold text-slate-800 mb-3">
                                    Contributing Sessions ({validSessions.length})
                                </h4>
                                <div className="max-h-48 overflow-y-auto space-y-2">
                                    {validSessions
                                        .slice()
                                        .reverse()
                                        .map((session, idx) => (
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
                                                <span
                                                    className={`font-semibold ${getScoreInterpretation(session.score as number).color}`}
                                                >
                                                    {session.score}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </Dialog.Content>
                </div>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
