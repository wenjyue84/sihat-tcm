"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FlaskConical, Trash2 } from "lucide-react";

interface WizardHeaderProps {
    completionPercentage: number;
    onFillTestData: () => void;
    onClearData: () => void;
}

export function WizardHeader({
    completionPercentage,
    onFillTestData,
    onClearData,
}: WizardHeaderProps) {
    const router = useRouter();

    return (
        <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 px-3 md:px-4 py-2 md:py-3">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push("/doctor")}
                        className="gap-1 md:gap-2 px-2 md:px-3"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="hidden sm:inline">Back</span>
                    </Button>
                    <div className="h-6 w-px bg-slate-300 hidden sm:block" />
                    <h1 className="font-semibold text-slate-800 text-sm sm:text-base truncate max-w-[120px] sm:max-w-none">New Diagnosis</h1>
                </div>

                <div className="flex items-center gap-1 md:gap-2">
                    {/* Progress indicator */}
                    <div className="hidden md:flex items-center gap-2 mr-4">
                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-300"
                                style={{ width: `${completionPercentage}%` }}
                            />
                        </div>
                        <span className="text-xs text-slate-500">{completionPercentage}%</span>
                    </div>

                    {/* Mobile progress badge */}
                    <div className="md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-blue-50 text-blue-600 text-xs font-bold">
                        {completionPercentage}%
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onFillTestData}
                        className="gap-1 md:gap-2 px-2 md:px-3 h-9"
                    >
                        <FlaskConical className="w-4 h-4" />
                        <span className="hidden sm:inline">Test</span>
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClearData}
                        className="gap-1 md:gap-2 text-red-600 hover:text-red-700 px-2 md:px-3 h-9"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Clear</span>
                    </Button>
                </div>
            </div>
        </header>
    );
}
