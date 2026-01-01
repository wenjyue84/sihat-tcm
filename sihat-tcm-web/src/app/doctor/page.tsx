"use client";

import { useAuth } from "@/stores/useAppStore";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { Loader2 } from "lucide-react";

import { useDoctorDashboard } from "@/components/doctor/hooks/useDoctorDashboard";
import { usePatientFlags } from "@/components/doctor/hooks/usePatientFlags";
import {
  DashboardDemoNotice,
  DashboardStatsCards,
  DashboardFilters,
  PatientCard,
  EmptyState,
} from "@/components/doctor/dashboard";

export default function DoctorDashboard() {
  const { loading: authLoading } = useAuth();

  const {
    // Data
    filteredInquiries,
    isLoading,
    useMockData,
    stats,

    // Filters
    filters,
    setSearchQuery,
    setDateFrom,
    setDateTo,
    setSymptomFilter,
    setFlagFilter,
    clearFilters,
    hasActiveFilters,
    showFilters,
    setShowFilters,

    // Actions
    setInquiries,

    // Constants
    symptomTags,
    inquiries,
  } = useDoctorDashboard();

  const { updateProfileFlag } = usePatientFlags({
    useMockData,
    setInquiries,
  });

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading patient records...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {/* Top Header */}
      <header className="h-14 md:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shrink-0">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">Patient History & Records Management</p>
        </div>
      </header>

      {/* Content Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-6xl mx-auto pb-24 md:pb-20">
          {/* Mock Data Notice */}
          <DashboardDemoNotice useMockData={useMockData} />

          {/* Stats Cards */}
          <DashboardStatsCards stats={stats} />

          {/* Search & Filter Section */}
          <DashboardFilters
            searchQuery={filters.searchQuery}
            setSearchQuery={setSearchQuery}
            dateFrom={filters.dateFrom}
            setDateFrom={setDateFrom}
            dateTo={filters.dateTo}
            setDateTo={setDateTo}
            symptomFilter={filters.symptomFilter}
            setSymptomFilter={setSymptomFilter}
            flagFilter={filters.flagFilter}
            setFlagFilter={setFlagFilter}
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            clearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
            symptomTags={symptomTags}
          />

          {/* Results Count */}
          <div className="mb-4 text-sm text-gray-600">
            Showing {filteredInquiries.length} of {inquiries.length} records
            {hasActiveFilters && " (filtered)"}
          </div>

          {/* Patient Records List */}
          <div className="grid gap-4">
            {filteredInquiries.map((inquiry) => (
              <PatientCard
                key={inquiry.id}
                inquiry={inquiry}
                onUpdateFlag={updateProfileFlag}
              />
            ))}

            {filteredInquiries.length === 0 && (
              <EmptyState
                hasActiveFilters={hasActiveFilters}
                clearFilters={clearFilters}
              />
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
