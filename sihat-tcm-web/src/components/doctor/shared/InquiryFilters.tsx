"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Calendar, Stethoscope, Filter, X } from "lucide-react";
import type { PatientFlag } from "@/types/database";
import { cn } from "@/lib/utils";

interface InquiryFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  dateFrom: string;
  setDateFrom: (date: string) => void;
  dateTo: string;
  setDateTo: (date: string) => void;
  symptomFilter: string;
  setSymptomFilter: (symptom: string) => void;
  flagFilter?: PatientFlag | "All";
  setFlagFilter?: (flag: PatientFlag | "All") => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  symptomTags?: string[];
  className?: string;
  sticky?: boolean;
}

export function InquiryFilters({
  searchQuery,
  setSearchQuery,
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  symptomFilter,
  setSymptomFilter,
  flagFilter,
  setFlagFilter,
  showFilters,
  setShowFilters,
  clearFilters,
  hasActiveFilters,
  symptomTags = [],
  className,
  sticky,
}: InquiryFiltersProps) {
  return (
    <Card
      className={cn(
        "mb-6 bg-white/90 backdrop-blur transition-all touch-manipulation",
        sticky && "sticky top-14 lg:top-0 z-10 shadow-sm",
        className
      )}
    >
      <CardContent className="p-3 sm:p-4">
        {/* Main Search Bar */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search patients, conditions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 sm:h-10 bg-white text-base sm:text-sm border-slate-200 focus:border-blue-300 ring-0 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <Button
            variant={showFilters ? "default" : "outline"}
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center gap-2 h-11 sm:h-10 w-full sm:w-auto shrink-0 active:scale-95 transition-transform"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            )}
          </Button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="space-y-4 pt-4 mt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-sm text-gray-600 shrink-0 min-w-[40px]">From:</span>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="flex-1 h-11 sm:h-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 shrink-0 min-w-[40px] ml-6 sm:ml-0">
                  To:
                </span>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="flex-1 h-11 sm:h-9"
                />
              </div>
            </div>

            {/* Flag Filter (Optional) - Horizontal scroll on mobile */}
            {flagFilter !== undefined && setFlagFilter && (
              <div className="space-y-2">
                <span className="text-sm font-medium text-gray-600 block">Urgency:</span>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap snap-x snap-mandatory scrollbar-hide">
                  {["All", "Critical", "High Priority", "Watch", "Normal"].map((f) => (
                    <Button
                      key={f}
                      variant={flagFilter === f ? "default" : "outline"}
                      size="sm"
                      onClick={() => setFlagFilter(f as any)}
                      className="h-10 sm:h-8 px-4 sm:px-3 text-sm sm:text-xs whitespace-nowrap snap-center shrink-0 sm:shrink active:scale-95 transition-transform"
                    >
                      {f}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Symptom Tags - Horizontal scroll on mobile */}
            {symptomTags.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4" />
                  Quick Filter by Condition:
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 sm:flex-wrap snap-x snap-mandatory scrollbar-hide">
                  {symptomTags.map((tag) => (
                    <Button
                      key={tag}
                      variant={symptomFilter === tag ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSymptomFilter(symptomFilter === tag ? "" : tag)}
                      className="h-10 sm:h-8 px-4 sm:px-3 text-sm sm:text-xs whitespace-nowrap snap-center shrink-0 sm:shrink active:scale-95 transition-transform"
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-10 sm:h-8 text-red-600 hover:text-red-700 hover:bg-red-50 active:scale-95 transition-transform"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear All Filters
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
