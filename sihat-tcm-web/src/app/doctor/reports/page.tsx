"use client";

import { useState } from "react";
import { useAuth } from "@/stores/useAppStore";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import {
    useDoctorReports,
    ReportsHeader,
    ReportsGrid,
    ReportsLoadingState,
} from "@/components/doctor/reports";
import { InquiryFilters } from "@/components/doctor/shared";
import { SYMPTOM_TAGS } from "@/lib/mock/doctorDashboard";

/**
 * Doctor Reports Page
 * Displays a searchable, filterable list of patient diagnosis reports
 */
export default function DoctorReportsPage() {
    const { loading: authLoading } = useAuth();
    const [showFilters, setShowFilters] = useState(true);

    const {
        filteredInquiries,
        isLoading,
        searchQuery,
        setSearchQuery,
        dateFrom,
        setDateFrom,
        dateTo,
        setDateTo,
        symptomFilter,
        setSymptomFilter,
        hasActiveFilters,
        clearFilters,
    } = useDoctorReports();

    if (authLoading || isLoading) {
        return <ReportsLoadingState />;
    }

    return (
        <ErrorBoundary>
            {/* Top Header */}
            <ReportsHeader />

            {/* Content Container */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="max-w-6xl mx-auto pb-24 md:pb-20">
                    {/* Search & Filter Section */}
                    <InquiryFilters
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        dateFrom={dateFrom}
                        setDateFrom={setDateFrom}
                        dateTo={dateTo}
                        setDateTo={setDateTo}
                        symptomFilter={symptomFilter}
                        setSymptomFilter={setSymptomFilter}
                        hasActiveFilters={hasActiveFilters}
                        clearFilters={clearFilters}
                        showFilters={showFilters}
                        setShowFilters={setShowFilters}
                        symptomTags={SYMPTOM_TAGS}
                    />

                    {/* Results Count */}
                    <div className="mb-4 text-sm text-gray-600 font-medium">
                        Found {filteredInquiries.length} records
                        {hasActiveFilters && " (filtered)"}
                    </div>

                    {/* Patient Records Grid */}
                    <ReportsGrid
                        inquiries={filteredInquiries}
                        hasActiveFilters={hasActiveFilters}
                        onClearFilters={clearFilters}
                    />
                </div>
            </div>
        </ErrorBoundary>
    );
}
