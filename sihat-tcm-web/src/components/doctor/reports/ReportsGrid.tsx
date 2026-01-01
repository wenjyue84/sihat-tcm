"use client";

import { ReportCard } from "./ReportCard";
import { EmptyReportsState } from "./EmptyReportsState";
import type { Inquiry } from "@/lib/mock/doctorReports";

interface ReportsGridProps {
    inquiries: Inquiry[];
    hasActiveFilters: boolean;
    onClearFilters: () => void;
}

/**
 * Grid layout wrapper for report cards with empty state handling
 */
export function ReportsGrid({
    inquiries,
    hasActiveFilters,
    onClearFilters,
}: ReportsGridProps): JSX.Element {
    if (inquiries.length === 0) {
        return (
            <EmptyReportsState
                hasActiveFilters={hasActiveFilters}
                onClearFilters={onClearFilters}
            />
        );
    }

    return (
        <div className="grid gap-4">
            {inquiries.map((inquiry) => (
                <ReportCard key={inquiry.id} inquiry={inquiry} />
            ))}
        </div>
    );
}
