/**
 * Hook for managing medical reports in UnifiedDashboard
 * Extracted from UnifiedDashboard.tsx for better organization
 */

import { useState, useEffect, useRef } from "react";
import { getMedicalReports, saveMedicalReport, deleteMedicalReport } from "@/lib/actions";
import { supabase } from "@/lib/supabase/client";
import type { MedicalReport } from "@/types/database";

interface UseUnifiedDashboardReportsReturn {
  reports: MedicalReport[];
  loadingReports: boolean;
  uploadingReport: boolean;
  selectedReport: MedicalReport | null;
  setSelectedReport: (report: MedicalReport | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleDeleteReport: (reportId: string) => Promise<void>;
}

export function useUnifiedDashboardReports(
  userId: string | undefined
): UseUnifiedDashboardReportsReturn {
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load documents from Supabase
  useEffect(() => {
    async function loadReports() {
      if (!userId) return;
      try {
        setLoadingReports(true);
        const result = await getMedicalReports();
        if (result.success && result.data) {
          setReports(result.data);
        }
      } catch (err) {
        console.error("[UnifiedDashboard] Error loading reports:", err);
      } finally {
        setLoadingReports(false);
      }
    }

    loadReports();
  }, [userId]);

  // Handle document upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    try {
      setUploadingReport(true);

      // Optional: Upload to Supabase Storage
      let file_url = undefined;
      try {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("medical-reports")
          .upload(filePath, file);

        if (!uploadError) {
          const {
            data: { publicUrl },
          } = supabase.storage.from("medical-reports").getPublicUrl(filePath);
          file_url = publicUrl;
        } else {
          console.warn(
            "Storage upload failed (bucket might not exist), falling back to metadata only:",
            uploadError.message
          );
        }
      } catch (storageErr) {
        console.warn("Storage error, falling back to metadata only:", storageErr);
      }

      const newReport = {
        name: file.name,
        date: new Date().toISOString().split("T")[0],
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        type: file.type,
        file_url,
      };

      const result = await saveMedicalReport(newReport);

      if (result.success && result.data) {
        setReports([result.data, ...reports]);
      } else if (!result.success) {
        alert("Failed to save report: " + result.error);
      }
    } catch (error) {
      console.error("Error in handleFileChange:", error);
      alert("An error occurred while uploading the report.");
    } finally {
      setUploadingReport(false);
      e.target.value = "";
    }
  };

  // Handle document delete
  const handleDeleteReport = async (reportId: string) => {
    if (confirm("Are you sure you want to delete this report?")) {
      try {
        const result = await deleteMedicalReport(reportId);
        if (result.success) {
          setReports(reports.filter((r) => r.id !== reportId));
        } else {
          alert("Failed to delete report: " + result.error);
        }
      } catch (error) {
        console.error("Error deleting report:", error);
      }
    }
  };

  return {
    reports,
    loadingReports,
    uploadingReport,
    selectedReport,
    setSelectedReport,
    fileInputRef,
    handleFileChange,
    handleDeleteReport,
  };
}

