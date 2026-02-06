import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/stores/useAppStore";
import { MedicalReport } from "@/types/database";
import { getMedicalReports, saveMedicalReport, deleteMedicalReport } from "@/lib/actions";

/**
 * Custom hook for managing medical documents/reports
 * Extracted from UnifiedDashboard to improve maintainability
 */
export function useDocumentManagement() {
  const { user } = useAuth();

  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load documents from Supabase
  useEffect(() => {
    async function loadReports() {
      if (!user) return;
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
  }, [user]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploadingReport(true);
    try {
      // Convert File to SaveMedicalReportInput format
      const reportInput = {
        name: file.name,
        date: new Date().toISOString().split("T")[0],
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type || "application/pdf",
      };
      const result = await saveMedicalReport(reportInput);
      if (result.success && result.data) {
        setReports((prev) => [result.data!, ...prev]);
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        alert(result.error || "Failed to upload report");
      }
    } catch (error) {
      console.error("Error uploading report:", error);
      alert("An error occurred while uploading the report");
    } finally {
      setUploadingReport(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;

    try {
      const result = await deleteMedicalReport(reportId);
      if (result.success) {
        setReports((prev) => prev.filter((r) => r.id !== reportId));
        if (selectedReport?.id === reportId) {
          setSelectedReport(null);
        }
      } else {
        alert(result.error || "Failed to delete report");
      }
    } catch (error) {
      console.error("Error deleting report:", error);
      alert("An error occurred while deleting the report");
    }
  };

  return {
    reports,
    loadingReports,
    uploadingReport,
    selectedReport,
    fileInputRef,
    setReports,
    setSelectedReport,
    handleFileChange,
    handleDeleteReport,
  };
}
