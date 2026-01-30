/**
 * Solar Terms - Legacy Re-export
 *
 * @deprecated Import from '@/lib/domain/tcm' instead:
 * import { getCurrentSolarTerm, getSolarTermsForYear } from '@/lib/domain/tcm';
 *
 * For data only, import from '@/data/tcm':
 * import { SOLAR_TERMS_DATA } from '@/data/tcm';
 */

// Re-export utilities from new location
export * from "./domain/tcm/solar-terms";

// Re-export data for backward compatibility
export { SOLAR_TERMS_DATA } from "@/data/tcm/solar-terms-data";
