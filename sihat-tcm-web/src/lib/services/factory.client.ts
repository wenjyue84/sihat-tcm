"use client";

/**
 * Client-side Service Factory
 *
 * Creates a service bundle for use in React hooks and client components.
 * Uses the sync createClient from @/lib/supabase/client.
 *
 * @example
 * import { createClientServices } from '@/lib/services';
 *
 * export function MyComponent() {
 *   const [data, setData] = useState(null);
 *
 *   useEffect(() => {
 *     const services = createClientServices();
 *     services.practitioners.list().then(({ data }) => setData(data));
 *   }, []);
 * }
 */

import { createClient } from "@/lib/supabase/client";
import { createDiagnosisService, type DiagnosisService } from "./diagnosisService";
import { createProfilesService, type ProfilesService } from "./profilesService";
import { createPatientsService, type PatientsService } from "./patientsService";
import { createInquiriesService, type InquiriesService } from "./inquiriesService";
import { createPractitionersService, type PractitionersService } from "./practitionersService";

export interface ClientServices {
    diagnosis: DiagnosisService;
    profiles: ProfilesService;
    patients: PatientsService;
    inquiries: InquiriesService;
    practitioners: PractitionersService;
}

/**
 * Creates a bundle of all service instances for client-side use.
 * Call this inside hooks or components (not at module level for tree-shaking).
 */
export function createClientServices(): ClientServices {
    const supabase = createClient();

    return {
        diagnosis: createDiagnosisService(supabase),
        profiles: createProfilesService(supabase),
        patients: createPatientsService(supabase),
        inquiries: createInquiriesService(supabase),
        practitioners: createPractitionersService(supabase),
    };
}

/**
 * Singleton instance for simple cases where you want to reuse the client.
 * Note: For most React patterns, prefer calling createClientServices() in useEffect/useMemo.
 */
let _clientServices: ClientServices | null = null;

export function getClientServices(): ClientServices {
    if (!_clientServices) {
        _clientServices = createClientServices();
    }
    return _clientServices;
}
