import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * TCM-themed Button Variants
 *
 * Implements Traditional Chinese Medicine color palette:
 * - primary: Healing jade green (--color-tcm-jade)
 * - secondary: Calm cyan for trust (--color-health-cyan)
 * - accent: Ginseng gold highlight (--color-tcm-gold)
 * - ghost: Transparent with hover state
 */
const tcmButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-sm font-medium transition-apple-fast disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-[3px] active:scale-[0.97] active:opacity-80 cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "bg-[oklch(0.55_0.10_160)] text-white hover:brightness-110 shadow-depth-1 focus-visible:ring-[oklch(0.55_0.10_160)]/20",
        secondary:
          "bg-[oklch(0.60_0.12_210)] text-white hover:brightness-110 shadow-depth-1 focus-visible:ring-[oklch(0.60_0.12_210)]/20",
        accent:
          "bg-[oklch(0.75_0.15_85)] text-foreground hover:brightness-105 shadow-depth-1 focus-visible:ring-[oklch(0.75_0.15_85)]/20",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 focus-visible:ring-ring/20",
      },
      size: {
        sm: "h-9 rounded-[10px] gap-1.5 px-3 min-h-[36px]",
        md: "h-11 px-4 py-2 min-h-[44px]",
        lg: "h-12 rounded-[10px] px-6 min-h-[48px]",
      },
      isLoading: {
        true: "opacity-70 cursor-not-allowed",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      isLoading: false,
    },
  }
);

export interface TCMButtonProps
  extends React.ComponentProps<"button">, VariantProps<typeof tcmButtonVariants> {
  asChild?: boolean;
}

/**
 * LoadingSpinner - Simple spinner for loading states
 */
function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn("animate-spin", className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/**
 * TCMButton - Button component with Traditional Chinese Medicine themed styling
 *
 * Features:
 * - TCM color variants (jade green, cyan, gold)
 * - Multiple sizes (sm, md, lg)
 * - Loading state with spinner
 * - Accessibility focused with proper ARIA attributes
 *
 * @example
 * ```tsx
 * <TCMButton variant="primary" size="lg">
 *   Start Diagnosis
 * </TCMButton>
 *
 * <TCMButton variant="accent" isLoading>
 *   Saving...
 * </TCMButton>
 * ```
 */
function TCMButton({
  className,
  variant,
  size,
  isLoading,
  asChild = false,
  children,
  disabled,
  ...props
}: TCMButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="tcm-button"
      className={cn(tcmButtonVariants({ variant, size, isLoading }), className)}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading && <LoadingSpinner />}
      {children}
    </Comp>
  );
}

export { TCMButton, tcmButtonVariants };
