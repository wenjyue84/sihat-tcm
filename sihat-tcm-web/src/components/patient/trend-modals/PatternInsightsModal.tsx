"use client";

import { motion } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import {
    Activity,
    Info,
    X,
} from "lucide-react";

interface PatternInsightsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pattern: string;
    count: number;
    totalSessions: number;
}

export function PatternInsightsModal({
    open,
    onOpenChange,
    pattern,
    count,
    totalSessions,
}: PatternInsightsModalProps) {
    const percentage = Math.round((count / totalSessions) * 100);

    // Pattern-specific insights
    const getPatternInsights = (patternName: string) => {
        const lowerPattern = patternName.toLowerCase();

        if (lowerPattern.includes("improving") || lowerPattern.includes("stable")) {
            return {
                sentiment: "positive",
                icon: "🌟",
                message: "Your pattern shows stability and improvement. This is exactly what we want to see in TCM treatment!",
                tips: [
                    "Continue your current wellness practices",
                    "Maintain consistent sleep and meal schedules",
                    "Keep up with seasonal adjustments to diet",
                ],
            };
        }

        if (lowerPattern.includes("deficiency")) {
            return {
                sentiment: "supportive",
                icon: "💪",
                message: "Deficiency patterns are common and highly treatable with proper nourishment and rest.",
                tips: [
                    "Focus on warm, cooked foods to support digestion",
                    "Prioritize rest and gentle exercise",
                    "Consider herbal tonics recommended by your practitioner",
                ],
            };
        }

        if (lowerPattern.includes("stagnation")) {
            return {
                sentiment: "actionable",
                icon: "🌊",
                message: "Stagnation patterns respond well to movement and emotional expression.",
                tips: [
                    "Regular physical activity helps move Qi",
                    "Practice stress-reduction techniques",
                    "Ensure adequate water intake",
                ],
            };
        }

        return {
            sentiment: "informative",
            icon: "🌿",
            message: "Understanding your pattern is the first step to targeted wellness. Your TCM practitioner can provide personalized guidance.",
            tips: [
                "Discuss this pattern with your practitioner",
                "Keep tracking your symptoms and improvements",
                "Follow your personalized treatment plan",
            ],
        };
    };

    const insights = getPatternInsights(pattern);

    return (
        <Dialog.Root open={open} onOpenChange={onOpenChange}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                    <Dialog.Content className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-0 outline-none">
                        <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-t-2xl">
                            <Dialog.Title className="text-xl font-bold flex items-center gap-2">
                                <Activity className="w-6 h-6" />
                                Your Health Pattern
                            </Dialog.Title>
                            <Dialog.Description className="text-emerald-100 text-sm mt-1">
                                Understanding your most common diagnosis pattern
                            </Dialog.Description>
                            <Dialog.Close asChild>
                                <button className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                            </Dialog.Close>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Pattern Display */}
                            <div className="text-center bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
                                <div className="text-5xl mb-3">{insights.icon}</div>
                                <p className="text-lg font-bold text-emerald-800 mb-2">{pattern}</p>
                                <div className="flex items-center justify-center gap-2">
                                    <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                                        {count} occurrence{count !== 1 ? "s" : ""}
                                    </span>
                                    <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-medium">
                                        {percentage}% of sessions
                                    </span>
                                </div>
                            </div>

                            {/* Pattern Insight */}
                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                <h4 className="font-semibold text-blue-800 flex items-center gap-2 mb-2">
                                    <Info className="w-4 h-4" />
                                    What This Means
                                </h4>
                                <p className="text-sm text-blue-700 leading-relaxed">{insights.message}</p>
                            </div>

                            {/* Actionable Tips */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                <h4 className="font-semibold text-slate-800 mb-3">Wellness Tips for This Pattern</h4>
                                <div className="space-y-2">
                                    {insights.tips.map((tip, idx) => (
                                        <motion.div
                                            key={idx}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className="flex items-start gap-2"
                                        >
                                            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <span className="text-emerald-600 text-xs font-bold">{idx + 1}</span>
                                            </div>
                                            <p className="text-sm text-slate-700">{tip}</p>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>

                            {/* Positive Reinforcement */}
                            <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-200">
                                <h4 className="font-semibold text-violet-800 mb-2">✨ Remember</h4>
                                <p className="text-sm text-violet-700 leading-relaxed">
                                    Patterns in TCM are not permanent labels — they're snapshots of your current state. With proper care, diet, and lifestyle adjustments, patterns can shift toward greater balance. You're already on the right path by tracking your health!
                                </p>
                            </div>

                            {/* TCM Context */}
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                                <p className="text-sm text-amber-800 leading-relaxed">
                                    🌿 <strong>TCM Philosophy:</strong> Each pattern represents a unique combination of Yin, Yang, Qi, and Blood dynamics in your body. Recognizing your pattern allows for precisely targeted treatments that address root causes, not just symptoms.
                                </p>
                            </div>
                        </div>
                    </Dialog.Content>
                </div>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
