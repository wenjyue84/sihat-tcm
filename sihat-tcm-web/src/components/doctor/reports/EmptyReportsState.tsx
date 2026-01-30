"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface EmptyReportsStateProps {
    hasActiveFilters: boolean;
    onClearFilters: () => void;
}

/**
 * Empty state component displayed when no reports match the current filters
 */
export function EmptyReportsState({
    hasActiveFilters,
    onClearFilters,
}: EmptyReportsStateProps) {
    return (
        <Card className="bg-slate-50 border-dashed border-2 border-slate-200 shadow-none">
            <CardContent className="py-12 text-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                    <Search className="w-6 h-6 text-slate-300" />
                </div>
                <h3 className="text-lg font-medium text-slate-700">No reports found</h3>
                <p className="text-slate-500 max-w-sm mx-auto mt-1">
                    Try adjusting your search filters or check back later for new patient inquiries.
                </p>
                {hasActiveFilters && (
                    <Button
                        variant="outline"
                        onClick={onClearFilters}
                        className="mt-4"
                    >
                        Clear Filters
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
