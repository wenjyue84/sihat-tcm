"use client";

import { useState, useCallback } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperInputProps {
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  unit?: string;
  icon?: React.ReactNode;
  className?: string;
  id?: string;
  /** Called when the input receives focus */
  onFocus?: () => void;
  /** Called when the input loses focus */
  onBlur?: (value: string) => void;
  /** HTML pattern attribute for mobile keyboard optimization */
  pattern?: string;
  /** ARIA attributes for accessibility */
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
}

export function StepperInput({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  placeholder = "0",
  unit,
  icon,
  className,
  id,
  onFocus: onFocusProp,
  onBlur: onBlurProp,
  pattern,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedby,
}: StepperInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const numericValue = parseFloat(value) || 0;

  const handleIncrement = useCallback(() => {
    const newValue = Math.min(numericValue + step, max);
    onChange(newValue.toString());
  }, [numericValue, step, max, onChange]);

  const handleDecrement = useCallback(() => {
    const newValue = Math.max(numericValue - step, min);
    onChange(newValue.toString());
  }, [numericValue, step, min, onChange]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    // Allow empty string or valid numbers
    if (inputValue === "" || /^\d*\.?\d*$/.test(inputValue)) {
      onChange(inputValue);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Clamp value on blur
    if (value !== "") {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        const clamped = Math.min(Math.max(num, min), max);
        onChange(clamped.toString());
        onBlurProp?.(clamped.toString());
      } else {
        onBlurProp?.(value);
      }
    } else {
      onBlurProp?.(value);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocusProp?.();
  };

  return (
    <div
      className={cn(
        "flex items-center gap-1 p-1 rounded-xl border transition-all duration-200",
        isFocused
          ? "border-primary ring-2 ring-primary/20 bg-white dark:bg-stone-900"
          : "border-border bg-muted/20 hover:border-primary/50",
        className
      )}
    >
      {/* Decrement Button */}
      <button
        type="button"
        onClick={handleDecrement}
        disabled={numericValue <= min}
        className={cn(
          "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150",
          "bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700",
          "text-stone-600 dark:text-stone-300",
          "active:scale-95 active:bg-stone-300 dark:active:bg-stone-600",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
        )}
        aria-label="Decrease value"
      >
        <Minus className="w-4 h-4" />
      </button>

      {/* Input Field */}
      <div className="relative flex-1 min-w-0">
        {icon && (
          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-primary">{icon}</span>
        )}
        <input
          id={id}
          type="text"
          inputMode="numeric"
          pattern={pattern}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            "w-full h-9 bg-transparent text-center font-semibold text-lg",
            "text-foreground placeholder:text-muted-foreground/50",
            "focus:outline-none",
            icon ? "pl-7" : ""
          )}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedby}
        />
        {unit && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium">
            {unit}
          </span>
        )}
      </div>

      {/* Increment Button */}
      <button
        type="button"
        onClick={handleIncrement}
        disabled={numericValue >= max}
        className={cn(
          "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-150",
          "bg-primary/10 hover:bg-primary/20",
          "text-primary",
          "active:scale-95 active:bg-primary/30",
          "disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
        )}
        aria-label="Increase value"
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
