/**
 * Test Filters Component
 *
 * Filter controls for test list
 */

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X, Search } from "lucide-react";
import { TestStatus, TestCategory } from "../types";
import { TEST_CATEGORIES } from "../constants";

interface TestFiltersProps {
  statusFilter: TestStatus | "all";
  categoryFilter: TestCategory | "all";
  criticalOnly: boolean;
  searchQuery: string;
  onStatusFilterChange: (value: TestStatus | "all") => void;
  onCategoryFilterChange: (value: TestCategory | "all") => void;
  onCriticalOnlyChange: (checked: boolean) => void;
  onSearchQueryChange: (query: string) => void;
  onReset: () => void;
  filteredCount: number;
  totalCount: number;
}

export function TestFilters({
  statusFilter,
  categoryFilter,
  criticalOnly,
  searchQuery,
  onStatusFilterChange,
  onCategoryFilterChange,
  onCriticalOnlyChange,
  onSearchQueryChange,
  onReset,
  filteredCount,
  totalCount,
}: TestFiltersProps) {
  const hasActiveFilters =
    statusFilter !== "all" || categoryFilter !== "all" || criticalOnly || searchQuery.trim() !== "";

  return (
    <Card className="bg-slate-900/50 border-slate-800 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-slate-400" />
        <h2 className="text-lg font-semibold text-slate-200">Filters</h2>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="ml-auto h-7 text-xs text-slate-400 hover:text-slate-200"
          >
            <X className="w-3 h-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="lg:col-span-2">
          <Label htmlFor="search" className="text-xs text-slate-400 mb-2 block">
            Search Tests
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              id="search"
              type="text"
              placeholder="Search by name, description, or ID..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="pl-9 bg-slate-950 border-slate-700 text-slate-200 placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchQueryChange("")}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <Label htmlFor="status-filter" className="text-xs text-slate-400 mb-2 block">
            Status
          </Label>
          <Select
            value={statusFilter}
            onValueChange={(value) => onStatusFilterChange(value as TestStatus | "all")}
          >
            <SelectTrigger
              id="status-filter"
              className="bg-slate-950 border-slate-700 text-slate-200"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="passed">Passed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="running">Running</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category Filter */}
        <div>
          <Label htmlFor="category-filter" className="text-xs text-slate-400 mb-2 block">
            Category
          </Label>
          <Select
            value={categoryFilter}
            onValueChange={(value) => onCategoryFilterChange(value as TestCategory | "all")}
          >
            <SelectTrigger
              id="category-filter"
              className="bg-slate-950 border-slate-700 text-slate-200"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {TEST_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Critical Only Toggle */}
      <div className="mt-4 flex items-center gap-2">
        <input
          type="checkbox"
          id="critical-only"
          checked={criticalOnly}
          onChange={(e) => onCriticalOnlyChange(e.target.checked)}
          className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0"
        />
        <Label htmlFor="critical-only" className="text-sm text-slate-300 cursor-pointer">
          Critical tests only
        </Label>
      </div>

      {/* Filter Results Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <p className="text-xs text-slate-400">
            Showing <span className="font-semibold text-slate-300">{filteredCount}</span> of{" "}
            <span className="font-semibold text-slate-300">{totalCount}</span> tests
          </p>
        </div>
      )}
    </Card>
  );
}
