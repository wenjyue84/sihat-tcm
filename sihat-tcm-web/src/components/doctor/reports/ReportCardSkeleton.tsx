"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface ReportCardSkeletonProps {
    count?: number;
}

/**
 * Single skeleton card for loading state
 */
function SkeletonCard() {
    return (
        <Card className="bg-white border-slate-200 animate-pulse">
            <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-200 rounded-full" />
                        <div className="space-y-2">
                            <div className="h-4 w-32 bg-slate-200 rounded" />
                            <div className="h-3 w-24 bg-slate-100 rounded" />
                        </div>
                    </div>
                    <div className="text-right space-y-1">
                        <div className="h-6 w-20 bg-slate-100 rounded" />
                        <div className="h-3 w-12 bg-slate-50 rounded ml-auto" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 space-y-3">
                    <div className="flex justify-between">
                        <div className="h-3 w-16 bg-slate-200 rounded" />
                        <div className="h-5 w-20 bg-slate-100 rounded" />
                    </div>
                    <div className="h-4 w-full bg-slate-200 rounded" />
                    <div className="h-8 w-full bg-slate-100 rounded" />
                </div>
            </CardContent>
        </Card>
    );
}

/**
 * Loading skeleton for report cards
 */
export function ReportCardSkeleton({ count = 3 }: ReportCardSkeletonProps) {
    return (
        <div className="grid gap-4">
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} />
            ))}
        </div>
    );
}

/**
 * Full page loading state with spinner
 */
export function ReportsLoadingState() {
    return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
                <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading reports...</p>
            </div>
        </div>
    );
}
