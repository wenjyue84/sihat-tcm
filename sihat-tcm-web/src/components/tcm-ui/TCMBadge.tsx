import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * TCM-themed Badge Variants
 *
 * Implements Traditional Chinese Medicine color palette for status indicators:
 * - success: Health green (--color-health-green)
 * - warning: Ginseng gold (--color-tcm-gold)
 * - info: Calm cyan (--color-health-cyan)
 * - neutral: Earth tones (--color-tcm-earth)
 */
const tcmBadgeVariants = cva(
  "inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        success: "border-transparent bg-[oklch(0.50_0.14_150)] text-white",
        warning: "border-transparent bg-[oklch(0.75_0.15_85)] text-foreground",
        info: "border-transparent bg-[oklch(0.60_0.12_210)] text-white",
        neutral: "border-transparent bg-[oklch(0.60_0.08_60)] text-white",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-1 text-sm",
        lg: "px-3 py-1.5 text-base",
      },
    },
    defaultVariants: {
      variant: "neutral",
      size: "md",
    },
  }
);

export interface TCMBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof tcmBadgeVariants> {}

/**
 * TCMBadge - Badge component for status and labels with TCM styling
 *
 * Features:
 * - TCM color variants (success, warning, info, neutral)
 * - Three size options (sm, md, lg)
 * - Pill-shaped design
 * - Accessible focus states
 *
 * @example
 * ```tsx
 * <TCMBadge variant="success">Completed</TCMBadge>
 * <TCMBadge variant="warning" size="lg">Pending Review</TCMBadge>
 * <TCMBadge variant="info" size="sm">New</TCMBadge>
 * ```
 */
function TCMBadge({ className, variant, size, ...props }: TCMBadgeProps) {
  return (
    <div
      data-slot="tcm-badge"
      className={cn(tcmBadgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { TCMBadge, tcmBadgeVariants };
