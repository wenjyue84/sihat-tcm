"use client";

import { InquiryCard } from "@/components/doctor/shared";
import { EmptyReportsState } from "./EmptyReportsState";
import type { Inquiry } from "@/lib/mock/doctorDashboard";

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
}: ReportsGridProps) {
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
                <InquiryCard key={inquiry.id} inquiry={inquiry} variant="report" />
            ))}
        </div>
    );
}
