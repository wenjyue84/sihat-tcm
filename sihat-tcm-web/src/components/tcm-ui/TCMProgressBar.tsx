import * as React from "react";
import { cn } from "@/lib/utils";

export interface TCMProgressBarProps extends React.ComponentProps<"div"> {
  /**
   * Current step (0-indexed)
   */
  current: number;
  /**
   * Total number of steps
   */
  total: number;
  /**
   * Show percentage text
   * @default false
   */
  showPercentage?: boolean;
}

/**
 * TCMProgressBar - Step progress indicator with TCM color gradient
 *
 * Features:
 * - Gradient color progression: orange → cyan → green (TCM healing journey)
 * - Responsive design for mobile and desktop
 * - Optional percentage display
 * - Smooth transitions
 * - Accessibility support with ARIA attributes
 *
 * @example
 * ```tsx
 * // Simple usage
 * <TCMProgressBar current={2} total={7} />
 *
 * // With percentage
 * <TCMProgressBar current={4} total={7} showPercentage />
 * ```
 */
function TCMProgressBar({
  current,
  total,
  showPercentage = false,
  className,
  ...props
}: TCMProgressBarProps) {
  const percentage = Math.round(((current + 1) / total) * 100);

  // Gradient color based on progress
  // 0-33%: Orange (warning/start)
  // 34-66%: Cyan (trust/progress)
  // 67-100%: Green (healing/completion)
  const getGradientColor = (progress: number): string => {
    if (progress <= 33) {
      return "from-orange-400 to-orange-500";
    } else if (progress <= 66) {
      return "from-cyan-400 to-cyan-500";
    } else {
      return "from-green-400 to-green-500";
    }
  };

  return (
    <div className={cn("w-full space-y-2", className)} data-slot="tcm-progress-bar" {...props}>
      {/* Progress bar container */}
      <div
        className="relative h-2 w-full overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progress: ${percentage}%`}
      >
        {/* Animated progress fill */}
        <div
          className={cn(
            "h-full bg-gradient-to-r transition-all duration-500 ease-out",
            getGradientColor(percentage)
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Step indicators and percentage */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Step {current + 1} of {total}
        </span>
        {showPercentage && <span className="font-medium tabular-nums">{percentage}%</span>}
      </div>
    </div>
  );
}

export { TCMProgressBar };
