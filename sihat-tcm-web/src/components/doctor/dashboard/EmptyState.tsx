"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

interface EmptyStateProps {
  hasActiveFilters: boolean;
  clearFilters: () => void;
}

export function EmptyState({ hasActiveFilters, clearFilters }: EmptyStateProps) {
  return (
    <Card className="bg-white/80">
      <CardContent className="py-12 text-center">
        <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">No patient records found</p>
        {hasActiveFilters && (
          <Button variant="link" onClick={clearFilters} className="mt-2 text-blue-600">
            Clear filters to see all records
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
