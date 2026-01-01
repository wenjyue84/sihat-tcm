"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Calendar, Stethoscope, Filter, X } from "lucide-react";
import type { PatientFlag } from "@/types/database";

interface DashboardFiltersProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    dateFrom: string;
    setDateFrom: (date: string) => void;
    dateTo: string;
    setDateTo: (date: string) => void;
    symptomFilter: string;
    setSymptomFilter: (symptom: string) => void;
    flagFilter: PatientFlag | "All";
    setFlagFilter: (flag: PatientFlag | "All") => void;
    showFilters: boolean;
    setShowFilters: (show: boolean) => void;
    clearFilters: () => void;
    hasActiveFilters: boolean;
    symptomTags: string[];
}

export function DashboardFilters({
    searchQuery,
    setSearchQuery,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    symptomFilter,
    setSymptomFilter,
    showFilters,
    setShowFilters,
    clearFilters,
    hasActiveFilters,
    symptomTags,
}: DashboardFiltersProps) {
    return (
        <Card className="mb-6 bg-white/90 backdrop-blur">
            <CardContent className="p-3 md:p-4">
                {/* Main Search Bar */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                            placeholder="Search patients, symptoms..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-10 md:h-11 bg-white text-sm md:text-base"
                        />
                    </div>
                    <Button
                        variant={showFilters ? "default" : "outline"}
                        onClick={() => setShowFilters(!showFilters)}
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
                                    onChange={(e) => setDateFrom(e.target.value)}
                                    className="flex-1 h-9"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 shrink-0 ml-6 sm:ml-0">To:</span>
                                <Input
                                    type="date"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                    className="flex-1 h-9"
                                />
                            </div>
                        </div>

                        {/* Symptom Tags */}
                        <div>
                            <p className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                                <Stethoscope className="w-4 h-4" />
                                Quick Filter by Symptom:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {symptomTags.map((tag) => (
                                    <Button
                                        key={tag}
                                        variant={symptomFilter === tag ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setSymptomFilter(symptomFilter === tag ? "" : tag)}
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
                                    onClick={clearFilters}
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
