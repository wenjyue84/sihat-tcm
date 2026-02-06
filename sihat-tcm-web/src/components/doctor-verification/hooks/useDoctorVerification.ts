/**
 * useDoctorVerification Hook
 *
 * Manages state and logic for doctor verification requests:
 * - Fetches approved doctors from profiles table
 * - Handles creating verification requests in inquiries table
 * - Modal state management
 */

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/stores/useAppStore";
import type { DiagnosisReport } from "@/types/database";

export interface ApprovedDoctor {
  id: string;
  full_name: string;
  email?: string;
  specialty?: string;
  is_master?: boolean;
  // Enhanced fields for better UX
  avatar_url?: string;
  years_experience?: number;
  avg_response_time?: number; // in minutes
  qualification?: string;
}

interface PatientData {
  name?: string;
  email?: string;
  age?: number;
  gender?: string;
}

interface UseDoctorVerificationOptions {
  reportData?: DiagnosisReport;
  patientData?: PatientData;
}

interface UseDoctorVerificationResult {
  doctors: ApprovedDoctor[];
  selectedDoctor: ApprovedDoctor | null;
  loading: boolean;
  sending: boolean;
  step: "select" | "success" | "error";
  error: string | null;
  setSelectedDoctor: (doctor: ApprovedDoctor | null) => void;
  setStep: (step: "select" | "success" | "error") => void;
  sendVerificationRequest: () => Promise<boolean>;
  reset: () => void;
}

// Master Doctor is always the default with enhanced display data
const MASTER_DOCTOR: ApprovedDoctor = {
  id: "master",
  full_name: "Master Doctor",
  is_master: true,
  specialty: "General TCM",
  years_experience: 15,
  avg_response_time: 120, // 2 hours
  qualification: "Licensed TCM Practitioner",
};

export function useDoctorVerification({
  reportData,
  patientData,
}: UseDoctorVerificationOptions): UseDoctorVerificationResult {
  const router = useRouter();
  const { user } = useAuth();
  const [doctors, setDoctors] = useState<ApprovedDoctor[]>([MASTER_DOCTOR]);
  const [selectedDoctor, setSelectedDoctor] = useState<ApprovedDoctor | null>(MASTER_DOCTOR);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [step, setStep] = useState<"select" | "success" | "error">("select");
  const [error, setError] = useState<string | null>(null);

  // Fetch approved doctors on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);

        // Fetch approved doctors from profiles
        // First try with is_approved column
        const { data, error: fetchError } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .eq("role", "doctor")
          .eq("is_approved", true)
          .order("full_name");

        if (fetchError) {
          // Column might not exist yet, fetch all doctors
          console.warn("is_approved column may not exist, fetching all doctors");
          const { data: fallbackData } = await supabase
            .from("profiles")
            .select("id, full_name, email")
            .eq("role", "doctor")
            .order("full_name");

          if (fallbackData) {
            setDoctors([MASTER_DOCTOR, ...fallbackData.map((d) => ({ ...d, is_master: false }))]);
          }
        } else if (data) {
          // Filter out Master Doctor from the list (it's shown separately)
          const otherDoctors = data.filter((d) => !d.email?.includes("doctor@sihat.com"));
          setDoctors([MASTER_DOCTOR, ...otherDoctors.map((d) => ({ ...d, is_master: false }))]);
        }
      } catch (err) {
        console.error("Error fetching doctors:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const sendVerificationRequest = useCallback(async (): Promise<boolean> => {
    if (!selectedDoctor) {
      setError("Please select a doctor");
      return false;
    }

    if (!user) {
      router.push("/login");
      return false;
    }

    try {
      setSending(true);
      setError(null);

      // Find the actual doctor ID for Master Doctor
      let targetDoctorId = selectedDoctor.id;
      let targetDoctorName = selectedDoctor.full_name;

      if (selectedDoctor.is_master) {
        // Get Master Doctor's actual ID from profiles
        const { data: masterDoc } = await supabase
          .from("profiles")
          .select("id, full_name")
          .eq("role", "doctor")
          .ilike("email", "%doctor@sihat.com%")
          .single();

        if (masterDoc) {
          targetDoctorId = masterDoc.id;
          targetDoctorName = masterDoc.full_name || "Master Doctor";
        }
      }

      // Create verification request via API route (bypasses RLS)
      const response = await fetch("/api/verification-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user?.id || null,
          doctorId: targetDoctorId,
          doctorName: targetDoctorName,
          patientData: {
            name: patientData?.name || "Anonymous",
            email: patientData?.email || null,
          },
          reportData: {
            diagnosis: reportData?.diagnosis || null,
          },
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || "Failed to send verification request");
      }

      setStep("success");
      return true;
    } catch (err: any) {
      console.error("Error sending verification request:", err);
      setError(err.message || "Failed to send request");
      setStep("error");
      return false;
    } finally {
      setSending(false);
    }
  }, [selectedDoctor, user, patientData, reportData]);

  const reset = useCallback(() => {
    setSelectedDoctor(MASTER_DOCTOR);
    setStep("select");
    setError(null);
  }, []);

  return {
    doctors,
    selectedDoctor,
    loading,
    sending,
    step,
    error,
    setSelectedDoctor,
    setStep,
    sendVerificationRequest,
    reset,
  };
}
