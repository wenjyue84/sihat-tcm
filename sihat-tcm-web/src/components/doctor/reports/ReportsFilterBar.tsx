"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Calendar, Stethoscope, X, Filter } from "lucide-react";
import { SYMPTOM_TAGS } from "@/lib/mock/doctorReports";

interface ReportsFilterBarProps {
    searchQuery: string;
    onSearchChange: (query: string) => void;
    dateFrom: string;
    onDateFromChange: (date: string) => void;
    dateTo: string;
    onDateToChange: (date: string) => void;
    symptomFilter: string;
    onSymptomFilterChange: (symptom: string) => void;
    hasActiveFilters: boolean;
    onClearFilters: () => void;
    showFilters: boolean;
    onToggleFilters: () => void;
}

/**
 * Search and filter bar component for the reports page
 * Includes keyword search, date range, and symptom tag filters
 */
export function ReportsFilterBar({
    searchQuery,
    onSearchChange,
    dateFrom,
    onDateFromChange,
    dateTo,
    onDateToChange,
    symptomFilter,
    onSymptomFilterChange,
    hasActiveFilters,
    onClearFilters,
    showFilters,
    onToggleFilters,
}: ReportsFilterBarProps): JSX.Element {
    return (
        <Card className="mb-6 bg-white/90 backdrop-blur sticky top-0 z-10 shadow-sm">
            <CardContent className="p-3 md:p-4">
                {/* Main Search Bar */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            placeholder="Search patients, conditions, symptoms..."
                            value={searchQuery}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-10 h-10 md:h-11 bg-white text-sm md:text-base border-slate-200 focus:border-blue-300 ring-0 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                    <Button
                        variant={showFilters ? "default" : "outline"}
                        onClick={onToggleFilters}
                        className="flex items-center justify-center gap-2 h-10 md:h-auto w-full sm:w-auto"
                    >
                        <Filter className="w-4 h-4" />
                        <span className="sm:inline">Filters</span>
                        {hasActiveFilters && (
                            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                    </Button>
                </div>

                {/* Expanded Filters */}
                {showFilters && (
                    <div className="space-y-4 pt-4 border-t">
                        {/* Date Range */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                                <span className="text-sm text-gray-600 shrink-0">From:</span>
                                <Input
                                    type="date"
                                    value={dateFrom}
                                    onChange={(e) => onDateFromChange(e.target.value)}
                                    className="flex-1 h-9"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 shrink-0 ml-6 sm:ml-0">To:</span>
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => onDateToChange(e.target.value)}
                                    className="flex-1 h-9"
                                />
                            </div>
                        </div>

                        {/* Symptom Tags */}
                        <div>
                            <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                                <Stethoscope className="w-4 h-4" />
                                Quick Filter by Condition:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {SYMPTOM_TAGS.map((tag) => (
                                    <Button
                                        key={tag}
                                        variant={symptomFilter === tag ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => onSymptomFilterChange(symptomFilter === tag ? "" : tag)}
                                        className="h-8"
                                    >
                                        {tag}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        {/* Clear Filters */}
                        {hasActiveFilters && (
                            <div className="pt-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onClearFilters}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
