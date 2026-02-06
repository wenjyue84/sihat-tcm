import * as React from "react";
import { cn } from "@/lib/utils";

export interface TCMInputProps extends React.ComponentProps<"input"> {
  /**
   * Label text for the input
   */
  label?: string;
  /**
   * Helper text to display below input
   */
  helperText?: string;
  /**
   * Error message to display (sets aria-invalid and error styling)
   */
  error?: string;
  /**
   * Icon to display at the start of the input
   */
  startIcon?: React.ReactNode;
  /**
   * Icon to display at the end of the input
   */
  endIcon?: React.ReactNode;
}

/**
 * TCMInput - Form input component with Traditional Chinese Medicine themed styling
 *
 * Features:
 * - TCM-inspired focus states (jade green ring)
 * - Label with proper htmlFor association
 * - Error state support with visual feedback
 * - Helper text for additional context
 * - Start/end icon support
 * - Accessibility compliant (ARIA attributes)
 * - Apple-inspired spacing and touch targets (min 44px)
 *
 * @example
 * ```tsx
 * // Basic usage
 * <TCMInput
 *   label="Patient Name"
 *   placeholder="Enter name"
 * />
 *
 * // With error
 * <TCMInput
 *   label="Age"
 *   error="Age must be between 0 and 120"
 *   value={invalidAge}
 * />
 *
 * // With helper text and icon
 * <TCMInput
 *   label="Email"
 *   helperText="We'll never share your email"
 *   startIcon={<EmailIcon />}
 * />
 * ```
 */
const TCMInput = React.forwardRef<HTMLInputElement, TCMInputProps>(
  (
    {
      className,
      type = "text",
      label,
      helperText,
      error,
      startIcon,
      endIcon,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    // Generate unique ID - must be called unconditionally (React Hook rule)
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const helperTextId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;
    const hasError = Boolean(error);

    return (
      <div className="w-full space-y-1.5">
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              "block text-sm font-medium",
              hasError ? "text-destructive" : "text-foreground",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {label}
          </label>
        )}

        {/* Input container */}
        <div className="relative">
          {/* Start icon */}
          {startIcon && (
            <div
              className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground",
                disabled && "opacity-50"
              )}
              aria-hidden="true"
            >
              {startIcon}
            </div>
          )}

          {/* Input field */}
          <input
            ref={ref}
            type={type}
            id={inputId}
            data-slot="tcm-input"
            className={cn(
              "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 h-11 w-full min-w-0 rounded-[10px] border bg-input px-3 py-2 text-base shadow-depth-1 transition-apple-fast outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm min-h-[44px]",
              // Focus state with TCM jade green
              "focus-visible:border-[oklch(0.55_0.10_160)] focus-visible:ring-[oklch(0.55_0.10_160)]/10 focus-visible:ring-[3px] focus-visible:bg-background",
              // Error state
              hasError &&
                "border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
              // Default border
              !hasError && "border-input",
              // Icon padding adjustments
              startIcon && "pl-10",
              endIcon && "pr-10",
              className
            )}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : helperText ? helperTextId : undefined}
            {...props}
          />

          {/* End icon */}
          {endIcon && (
            <div
              className={cn(
                "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground",
                disabled && "opacity-50"
              )}
              aria-hidden="true"
            >
              {endIcon}
            </div>
          )}
        </div>

        {/* Helper text or error message */}
        {(helperText || error) && (
          <p
            id={hasError ? errorId : helperTextId}
            className={cn("text-sm", hasError ? "text-destructive" : "text-muted-foreground")}
            role={hasError ? "alert" : undefined}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

TCMInput.displayName = "TCMInput";

export { TCMInput };
