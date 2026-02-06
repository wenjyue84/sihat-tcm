import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * TCM-themed Card Variants
 *
 * Implements Traditional Chinese Medicine color palette:
 * - default: Neutral background with subtle border
 * - jade: Healing jade green (--color-tcm-jade)
 * - earth: Earth element brown (--color-tcm-earth)
 * - gold: Ginseng gold accent (--color-tcm-gold)
 * - diagnostic: Healthcare cyan for diagnostic contexts (--color-health-cyan)
 */
const tcmCardVariants = cva(
  "rounded-[18px] border transition-apple-normal shadow-depth-2 hover:-translate-y-0.5 hover:shadow-depth-3",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground border-border hover:brightness-[1.02]",
        jade: "bg-[oklch(0.55_0.10_160)] text-white border-transparent hover:brightness-110",
        earth: "bg-[oklch(0.60_0.08_60)] text-white border-transparent hover:brightness-110",
        gold: "bg-[oklch(0.75_0.15_85)] text-foreground border-transparent hover:brightness-105",
        diagnostic: "bg-[oklch(0.60_0.12_210)] text-white border-transparent hover:brightness-110",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface TCMCardProps
  extends React.ComponentProps<"div">, VariantProps<typeof tcmCardVariants> {}

/**
 * TCMCard - Card component with Traditional Chinese Medicine themed styling
 *
 * @example
 * ```tsx
 * <TCMCard variant="jade">
 *   <div className="p-6">
 *     <h3>Pulse Analysis</h3>
 *     <p>Heart rate: 72 bpm</p>
 *   </div>
 * </TCMCard>
 * ```
 */
function TCMCard({ className, variant, ...props }: TCMCardProps) {
  return (
    <div data-slot="tcm-card" className={cn(tcmCardVariants({ variant }), className)} {...props} />
  );
}

export { TCMCard, tcmCardVariants };
