"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface CheckboxOptionProps {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Optional children, e.g. for conditional input fields */
  children?: React.ReactNode;
}

/**
 * CheckboxOption - Reusable checkbox row with label and optional children
 *
 * Used inside CollapsibleOptionsSection to list report generation options
 */
export function CheckboxOption({ id, label, checked, onChange, children }: CheckboxOptionProps) {
  return (
    <div
      className={`space-y-3 p-2 rounded-lg hover:bg-slate-50 transition-colors ${children ? "" : "flex items-center space-x-3"}`}
    >
      <div className="flex items-center space-x-3">
        <Checkbox id={id} checked={checked} onCheckedChange={(c) => onChange(c as boolean)} />
        <Label
          htmlFor={id}
          className="text-sm font-medium text-slate-700 cursor-pointer flex-1 break-words"
        >
          {label}
        </Label>
      </div>
      {children && checked && <div className="mt-2 pl-7 w-full">{children}</div>}
    </div>
  );
}
