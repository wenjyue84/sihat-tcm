"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Stethoscope } from "lucide-react";
import { format } from "date-fns";
import { FlagBadge } from "@/components/ui/FlagBadge";
import { PatientFlagUpdate } from "@/components/doctor/PatientFlagUpdate";
import type { PatientFlag } from "@/types/database";
import type { Inquiry, MockPatientProfile } from "@/lib/mock/doctorDashboard";
import { resolvePatientProfile } from "./utils";
import { InquiryReportDialog } from "./InquiryReportDialog";
import { cn } from "@/lib/utils";

interface InquiryCardProps {
    inquiry: Inquiry;
    onUpdateFlag?: (profileId: string, flag: PatientFlag) => void;
    variant?: 'dashboard' | 'report';
    className?: string;
}

export function InquiryCard({ inquiry, onUpdateFlag, variant = 'dashboard', className }: InquiryCardProps) {
    const dbProfile = Array.isArray(inquiry.profiles) ? inquiry.profiles[0] : inquiry.profiles;
    const patientProfile = resolvePatientProfile(inquiry);
    const diagnosis = inquiry.diagnosis_report;

    // Visual style adjustments based on variant
    const isDashboard = variant === 'dashboard';

    return (
        <Card className={cn(
            "transition-all duration-200 touch-manipulation",
            isDashboard ? "bg-white/90 backdrop-blur hover:shadow-lg active:scale-[0.99]" : "bg-white hover:shadow-md border-slate-200 active:scale-[0.995]",
            className
        )}>
            <CardHeader className="pb-3 px-4 sm:px-6">
                {/* Mobile: Stack vertically | Desktop: Side by side */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar - Larger touch target on mobile */}
                        <div className={cn(
                            "w-12 h-12 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-lg sm:text-base shrink-0",
                            isDashboard
                                ? "bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-md"
                                : "bg-slate-100 text-slate-600 border border-slate-200 shadow-sm"
                        )}>
                            {patientProfile?.full_name?.charAt(0) || "?"}
                        </div>
                        <div className="min-w-0 flex-1">
                            <CardTitle className={cn(
                                "flex flex-wrap items-center gap-2",
                                isDashboard ? "text-base sm:text-lg" : "text-base font-semibold text-slate-800"
                            )}>
                                <span className="truncate max-w-[180px] sm:max-w-none">
                                    {patientProfile?.full_name || "Anonymous Patient"}
                                </span>
                                {/* Flag badge with proper touch target */}
                                <span className="inline-flex min-h-[28px] items-center">
                                    {onUpdateFlag && dbProfile?.id ? (
                                        <PatientFlagUpdate
                                            currentFlag={(dbProfile as MockPatientProfile)?.flag || "Normal"}
                                            onUpdate={async (flag) => {
                                                onUpdateFlag(dbProfile.id, flag);
                                            }}
                                        />
                                    ) : (
                                        <FlagBadge flag={patientProfile?.flag} />
                                    )}
                                </span>
                            </CardTitle>
                            <CardDescription className="flex items-center gap-2 text-xs sm:text-sm mt-0.5">
                                <User className="w-3.5 h-3.5 sm:w-3 sm:h-3 text-slate-400" />
                                <span className="capitalize">{patientProfile?.gender || "Unknown"}</span>
                                <span className="text-slate-300">•</span>
                                <span>{patientProfile?.age ? `${patientProfile.age} years old` : "Age unknown"}</span>
                            </CardDescription>
                        </div>
                    </div>
                    {/* Date - Right aligned on desktop, below avatar on mobile */}
                    <div className="text-left sm:text-right ml-15 sm:ml-0 shrink-0">
                        <div className={cn(
                            "px-2.5 py-1.5 sm:px-2 sm:py-1 rounded-md inline-block",
                            isDashboard ? "bg-blue-50/80" : "bg-slate-50 border border-slate-100"
                        )}>
                            <p className="text-xs font-semibold text-gray-700">
                                {format(new Date(inquiry.created_at), "dd MMM yyyy")}
                            </p>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">
                            {format(new Date(inquiry.created_at), "h:mm a")}
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0 px-4 sm:px-6">
                <div className="space-y-4">
                    {/* Symptoms */}
                    <div>
                        <h4 className={cn(
                            "text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2",
                            isDashboard ? "text-gray-700" : "text-slate-500"
                        )}>
                            <Stethoscope className="w-3.5 h-3.5 text-blue-500" />
                            Symptoms
                        </h4>
                        <p className={cn(
                            "p-3 sm:p-3 rounded-lg text-sm leading-relaxed",
                            isDashboard ? "text-gray-600 bg-gradient-to-r from-blue-50 to-indigo-50" : "bg-slate-50 border border-slate-100 text-slate-700"
                        )}>
                            {inquiry.symptoms || "No symptoms recorded"}
                        </p>
                    </div>

                    {/* Diagnosis Summary */}
                    {diagnosis && (
                        <div className={cn(
                            "flex flex-col gap-3 p-3 sm:p-4 rounded-lg",
                            isDashboard ? "bg-gradient-to-r from-green-50 to-emerald-50" : "bg-green-50/30 border border-green-100"
                        )}>
                            <div className="flex-1 min-w-0">
                                <h4 className={cn(
                                    "text-xs font-bold uppercase tracking-wider mb-1.5",
                                    isDashboard ? "text-gray-700" : "text-green-600"
                                )}>
                                    TCM Diagnosis
                                </h4>
                                <p className="text-green-700 font-medium text-sm sm:text-base break-words leading-snug">
                                    {diagnosis.summary || "Analysis Complete"}
                                </p>
                                {diagnosis.tcmPattern && diagnosis.summary && (
                                    <p className="text-xs text-gray-500 mt-1.5 font-serif break-words">
                                        {diagnosis.tcmPattern}
                                    </p>
                                )}
                            </div>
                            {/* View Full Report Button - Mobile optimized height */}
                            <InquiryReportDialog
                                inquiry={inquiry}
                                patientProfile={patientProfile}
                                trigger={variant === 'report' ? (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full sm:w-auto text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200 h-11 sm:h-9 text-sm font-medium active:scale-95 transition-transform touch-manipulation"
                                    >
                                        View Full Report
                                    </Button>
                                ) : undefined}
                            />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
