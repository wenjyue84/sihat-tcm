"use client";

import { Calendar, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLanguage } from "@/stores/useAppStore";

export type DateRange = "all" | "year" | "month";
export type SortField = "date" | "score" | "diagnosis";
export type SortDirection = "asc" | "desc";

interface TimelineFiltersProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  sortField: SortField;
  onSortFieldChange: (field: SortField) => void;
  sortDirection: SortDirection;
  onSortDirectionChange: (direction: SortDirection) => void;
}

export function TimelineFilters({
  dateRange,
  onDateRangeChange,
  sortField,
  onSortFieldChange,
  sortDirection,
  onSortDirectionChange,
}: TimelineFiltersProps) {
  const { t } = useLanguage();
  // Safe access to translation keys
  const journeyT = t?.patientDashboard_v1?.healthJourney || {};
  const filtersT = journeyT.filters || {
    all: "All",
    thisYear: "This Year",
    thisMonth: "This Month",
    sortBy: "Sort by",
    date: "Date",
    score: "Score",
    diagnosis: "Diagnosis",
    ascending: "Ascending",
    descending: "Descending"
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Date Range Toggle */}
      <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1 shadow-sm">
        <button
          onClick={() => onDateRangeChange("all")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${dateRange === "all"
            ? "bg-emerald-100 text-emerald-700 shadow-sm"
            : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
            }`}
        >
          {filtersT.all}
        </button>
        <button
          onClick={() => onDateRangeChange("year")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${dateRange === "year"
            ? "bg-emerald-100 text-emerald-700 shadow-sm"
            : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
            }`}
        >
          {filtersT.thisYear}
        </button>
        <button
          onClick={() => onDateRangeChange("month")}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${dateRange === "month"
            ? "bg-emerald-100 text-emerald-700 shadow-sm"
            : "text-slate-600 hover:text-slate-800 hover:bg-slate-50"
            }`}
        >
          {filtersT.thisMonth}
        </button>
      </div>

      {/* Sort Field */}
      <Select value={sortField} onValueChange={onSortFieldChange}>
        <SelectTrigger className="w-[140px] bg-white border-slate-200 shadow-sm h-9">
          <ArrowUpDown className="w-4 h-4 mr-2 text-slate-500" />
          <SelectValue placeholder={filtersT.sortBy} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="date">{filtersT.date}</SelectItem>
          <SelectItem value="score">{filtersT.score}</SelectItem>
          <SelectItem value="diagnosis">{filtersT.diagnosis}</SelectItem>
        </SelectContent>
      </Select>

      {/* Sort Direction */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onSortDirectionChange(sortDirection === "asc" ? "desc" : "asc")}
        className="h-9 bg-white border-slate-200 shadow-sm"
        title={sortDirection === "asc" ? filtersT.ascending : filtersT.descending}
      >
        {sortDirection === "asc" ? (
          <ArrowUp className="w-4 h-4 text-slate-600" />
        ) : (
          <ArrowDown className="w-4 h-4 text-slate-600" />
        )}
      </Button>
    </div>
  );
}


