/**
 * Service Layer Index
 *
 * Centralized API abstraction for Supabase operations.
 * This layer provides DRY, testable, and consistent database access.
 *
 * @example
 * // Server-side (Server Actions, API Routes)
 * import { createServerServices } from '@/lib/services';
 * const services = await createServerServices();
 * const session = await services.diagnosis.getById('session-id');
 *
 * @example
 * // Client-side (hooks, components)
 * import { createClientServices } from '@/lib/services';
 * const services = createClientServices();
 * const profiles = await services.profiles.list();
 */

// export { createServerServices } from "./factory.server"; // Commented out to prevent client bundle errors
export { createClientServices } from "./factory.client";

// Re-export individual services for direct access if needed
export { createDiagnosisService } from "./diagnosisService";
export { createProfilesService } from "./profilesService";
export { createPatientsService } from "./patientsService";
export { createInquiriesService } from "./inquiriesService";
export { createPractitionersService } from "./practitionersService";

// Export types
export type { DiagnosisService } from "./diagnosisService";
export type { ProfilesService } from "./profilesService";
export type { PatientsService } from "./patientsService";
export type { InquiriesService } from "./inquiriesService";
export type { PractitionersService } from "./practitionersService";
