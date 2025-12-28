/**
 * Hook for managing UnifiedDashboard handlers
 * Extracted from UnifiedDashboard.tsx for better organization
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { seedPatientHistory, seedMedicalReports } from "@/lib/actions";

interface UseUnifiedDashboardHandlersReturn {
  loggingOut: boolean;
  seeding: boolean;
  seedingReports: boolean;
  handleLogout: () => Promise<void>;
  handleRestoreData: () => Promise<void>;
  handleRestoreMedicalReports: () => Promise<void>;
}

export function useUnifiedDashboardHandlers(
  signOut: () => Promise<void>
): UseUnifiedDashboardHandlersReturn {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedingReports, setSeedingReports] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await signOut();
      router.push("/");
    } catch (error) {
      setLoggingOut(false);
    }
  };

  const handleRestoreData = async () => {
    if (!confirm("This will add mocked data to your history. Proceed?")) return;
    try {
      setSeeding(true);
      const result = await seedPatientHistory();
      if (result.success) {
        alert("Mock data restored successfully!");
        window.location.reload();
      } else {
        if (
          result.error &&
          (result.error.includes("does not exist") ||
            result.error.includes('relation "public.diagnosis_sessions"'))
        ) {
          alert(
            'Database Error: The "diagnosis_sessions" table is missing. Please run "npx supabase db push" in your terminal to create the missing tables.'
          );
        } else {
          alert("Failed to restore mock data: " + result.error);
        }
      }
    } catch (error) {
      console.error("Error restoring mock data:", error);
      alert("An unexpected error occurred.");
    } finally {
      setSeeding(false);
    }
  };

  const handleRestoreMedicalReports = async () => {
    if (!confirm("This will add sample medical reports to your documents. Proceed?")) return;
    try {
      setSeedingReports(true);
      const result = await seedMedicalReports();
      if (result?.success) {
        alert("Sample medical reports added successfully!");
        window.location.reload();
      } else {
        if (
          result?.error &&
          (result.error.includes("does not exist") ||
            result.error.includes('relation "public.medical_reports"'))
        ) {
          alert(
            'Database Error: The "medical_reports" table is missing. Please run "npx supabase db push" in your terminal to create the missing tables.'
          );
        } else {
          alert("Failed to add sample reports: " + (result?.error || "Unknown error"));
        }
      }
    } catch (error) {
      console.error("Error adding sample reports:", error);
      alert("An unexpected error occurred.");
    } finally {
      setSeedingReports(false);
    }
  };

  return {
    loggingOut,
    seeding,
    seedingReports,
    handleLogout,
    handleRestoreData,
    handleRestoreMedicalReports,
  };
}

