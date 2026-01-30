/**
 * Daily Tips - Legacy Re-export
 *
 * @deprecated Import from '@/lib/domain/tcm' instead:
 * import { generateDailyTip, getCurrentSolarTerm } from '@/lib/domain/tcm';
 *
 * For data only, import from '@/data/tcm':
 * import { CONSTITUTION_DIET_TIPS, ORGAN_CLOCK } from '@/data/tcm';
 */

// Re-export utilities from new location
export * from "./domain/tcm/daily-tips";

// Re-export data for backward compatibility
export { CONSTITUTION_DIET_TIPS, GENERAL_TIPS, ORGAN_CLOCK, SIMPLE_SOLAR_TERMS } from "@/data/tcm/daily-tips-data";
