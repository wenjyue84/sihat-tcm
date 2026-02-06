/**
 * Server-side Service Factory
 *
 * Creates a service bundle for use in Server Components, Server Actions, and API Routes.
 * Uses the async createClient from @/lib/supabase/server.
 *
 * @example
 * import { createServerServices } from '@/lib/services';
 *
 * export async function myServerAction() {
 *   const services = await createServerServices();
 *   const { data, error } = await services.diagnosis.getById('session-id');
 *   if (error) throw new Error(error.message);
 *   return data;
 * }
 */

import { createClient } from "@/lib/supabase/server";
import { createDiagnosisService, type DiagnosisService } from "./diagnosisService";
import { createProfilesService, type ProfilesService } from "./profilesService";
import { createPatientsService, type PatientsService } from "./patientsService";
import { createInquiriesService, type InquiriesService } from "./inquiriesService";
import { createPractitionersService, type PractitionersService } from "./practitionersService";

export interface ServerServices {
  diagnosis: DiagnosisService;
  profiles: ProfilesService;
  patients: PatientsService;
  inquiries: InquiriesService;
  practitioners: PractitionersService;
}

/**
 * Creates a bundle of all service instances for server-side use.
 * Must be called inside an async function as it uses cookies.
 */
export async function createServerServices(): Promise<ServerServices> {
  const supabase = await createClient();

  return {
    diagnosis: createDiagnosisService(supabase),
    profiles: createProfilesService(supabase),
    patients: createPatientsService(supabase),
    inquiries: createInquiriesService(supabase),
    practitioners: createPractitionersService(supabase),
  };
}
