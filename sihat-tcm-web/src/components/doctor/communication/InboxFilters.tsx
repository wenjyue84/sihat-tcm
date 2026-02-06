/**
 * InboxFilters Component
 * Provides filter tabs, search bar, and sort options for the inbox
 */

"use client";

import { Search, Filter, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";

export type FilterStatus = "all" | "pending" | "active" | "closed";
export type SortOption = "date" | "name" | "status";

interface InboxFiltersProps {
  filter: FilterStatus;
  onFilterChange: (filter: FilterStatus) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  counts: {
    all: number;
    pending: number;
    active: number;
    closed: number;
  };
}

const filterTabs: { key: FilterStatus; label: string; color: string }[] = [
  { key: "all", label: "All", color: "bg-slate-100 text-slate-700" },
  { key: "pending", label: "Pending", color: "bg-amber-100 text-amber-700" },
  { key: "active", label: "Active", color: "bg-green-100 text-green-700" },
  { key: "closed", label: "Closed", color: "bg-gray-100 text-gray-500" },
];

export function InboxFilters({
  filter,
  onFilterChange,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  counts,
}: InboxFiltersProps) {
  return (
    <div className="space-y-3">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search patients..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-white/80 border-gray-200 focus:border-blue-300 text-sm"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-1 bg-gray-100/80 rounded-lg">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onFilterChange(tab.key)}
            className={`relative flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-all ${
              filter === tab.key ? "text-blue-700" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {filter === tab.key && (
              <motion.div
                layoutId="activeFilter"
                className="absolute inset-0 bg-white shadow-sm rounded-md"
                transition={{ type: "spring", duration: 0.3 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center gap-1">
              {tab.label}
              {counts[tab.key] > 0 && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] rounded-full ${
                    filter === tab.key ? "bg-blue-100 text-blue-600" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {counts[tab.key]}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Sort Dropdown */}
      <div className="flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 text-xs text-gray-500">
              <ArrowUpDown className="w-3 h-3 mr-1" />
              Sort: {sortBy === "date" ? "Date" : sortBy === "name" ? "Name" : "Status"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            <DropdownMenuItem onClick={() => onSortChange("date")}>By Date</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange("name")}>By Name</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSortChange("status")}>By Status</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
