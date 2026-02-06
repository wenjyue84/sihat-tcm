"use client";

import { useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import type { PatientFlag } from "@/types/database";
import type { Inquiry } from "@/lib/mock/doctorDashboard";

interface UsePatientFlagsProps {
  useMockData: boolean;
  setInquiries: React.Dispatch<React.SetStateAction<Inquiry[]>>;
}

interface UsePatientFlagsReturn {
  updateProfileFlag: (profileId: string, flag: PatientFlag) => Promise<void>;
  updatePatientFlag: (patientId: string, flag: PatientFlag) => Promise<void>;
}

export function usePatientFlags({
  useMockData,
  setInquiries,
}: UsePatientFlagsProps): UsePatientFlagsReturn {
  const updateProfileFlag = useCallback(
    async (profileId: string, flag: PatientFlag) => {
      // If it's mock data (mock-ID or p1, p2, etc), just update local state
      if (useMockData || profileId.startsWith("p") || profileId.startsWith("mock")) {
        setInquiries((prev) =>
          prev.map((inq) => {
            const profiles = inq.profiles;
            if (Array.isArray(profiles)) {
              return {
                ...inq,
                profiles: profiles.map((p) => (p.id === profileId ? { ...p, flag } : p)),
              };
            } else {
              if (!profiles) return inq;
              return profiles.id === profileId ? { ...inq, profiles: { ...profiles, flag } } : inq;
            }
          })
        );
        return;
      }

      try {
        const { error } = await supabase.from("profiles").update({ flag }).eq("id", profileId);

        if (error) throw error;

        // Update local state
        setInquiries((prev) =>
          prev.map((inq) => {
            const profiles = inq.profiles;
            if (Array.isArray(profiles)) {
              return {
                ...inq,
                profiles: profiles.map((p) => (p.id === profileId ? { ...p, flag } : p)),
              };
            } else {
              // If profiles is null/undefined, don't update
              if (!profiles) return inq;
              return profiles.id === profileId ? { ...inq, profiles: { ...profiles, flag } } : inq;
            }
          })
        );
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("Error updating profile flag:", errorMessage);
      }
    },
    [useMockData, setInquiries]
  );

  const updatePatientFlag = useCallback(
    async (patientId: string, flag: PatientFlag) => {
      // If it's mock data, just update local state
      if (useMockData || patientId.startsWith("p") || patientId.startsWith("mock")) {
        setInquiries((prev) =>
          prev.map((inq) => {
            const patients = inq.patients;
            if (Array.isArray(patients)) {
              return {
                ...inq,
                patients: patients.map((p) => (p.id === patientId ? { ...p, flag } : p)),
              };
            } else {
              if (!patients) return inq;
              return patients.id === patientId ? { ...inq, patients: { ...patients, flag } } : inq;
            }
          })
        );
        return;
      }

      try {
        const { error } = await supabase.from("patients").update({ flag }).eq("id", patientId);

        if (error) throw error;

        // Update local state
        setInquiries((prev) =>
          prev.map((inq) => {
            const patients = inq.patients;
            if (Array.isArray(patients)) {
              return {
                ...inq,
                patients: patients.map((p) => (p.id === patientId ? { ...p, flag } : p)),
              };
            } else {
              if (!patients) return inq;
              return patients.id === patientId ? { ...inq, patients: { ...patients, flag } } : inq;
            }
          })
        );
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error("Error updating patient flag:", errorMessage);
      }
    },
    [useMockData, setInquiries]
  );

  return {
    updateProfileFlag,
    updatePatientFlag,
  };
}
