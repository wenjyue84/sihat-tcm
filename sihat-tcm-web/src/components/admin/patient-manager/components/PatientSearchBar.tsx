"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface PatientSearchBarProps {
  value: string;
  onChange: (query: string) => void;
}

export function PatientSearchBar({ value, onChange }: PatientSearchBarProps) {
  return (
    <div className="mb-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, gender, or medical history..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10"
        />
      </div>
    </div>
  );
}
