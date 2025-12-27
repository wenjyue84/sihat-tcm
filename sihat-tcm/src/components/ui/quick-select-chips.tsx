"use client";

import { cn } from "@/lib/utils";

interface QuickSelectChipsProps {
  options: number[];
  value: string;
  onChange: (value: string) => void;
  unit?: string;
  className?: string;
  /** If true, chips scroll horizontally on mobile instead of wrapping */
  horizontalScroll?: boolean;
}

export function QuickSelectChips({
  options,
  value,
  onChange,
  unit,
  className,
  horizontalScroll = false,
}: QuickSelectChipsProps) {
  const currentValue = parseFloat(value) || 0;

  return (
    <div
      className={cn(
        "flex gap-1.5",
        horizontalScroll
          ? "overflow-x-auto scrollbar-hide pb-1 -mb-1 snap-x snap-mandatory md:flex-wrap md:overflow-visible"
          : "flex-wrap",
        className
      )}
      style={
        horizontalScroll
          ? {
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }
          : undefined
      }
    >
      {options.map((option) => {
        const isSelected = currentValue === option;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option.toString())}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-full transition-all duration-150",
              "border shrink-0",
              horizontalScroll && "snap-start",
              isSelected
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-muted/30 text-muted-foreground border-border hover:bg-muted hover:border-primary/50 hover:text-foreground active:scale-95"
            )}
          >
            {option}
            {unit && <span className="ml-0.5 opacity-70">{unit}</span>}
          </button>
        );
      })}
    </div>
  );
}
