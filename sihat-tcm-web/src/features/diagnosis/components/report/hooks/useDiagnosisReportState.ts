/**
 * Hook for managing DiagnosisReport state
 * Extracted from DiagnosisReport.tsx to improve maintainability
 */

import { useState, useEffect } from "react";
import { createClientServices } from "@/lib/services";
import type { ViewMode } from "../ViewSwitcher";
import type { Message } from "../../ReportChatWindow";

interface UseDiagnosisReportStateOptions {
  saved?: boolean;
}

interface UseDiagnosisReportStateResult {
  // UI State
  viewMode: ViewMode;
  isChatOpen: boolean;
  isInfographicsOpen: boolean;
  isVerificationModalOpen: boolean;
  activeQuestion: string | null;
  isChatExpanded: boolean;
  mounted: boolean;
  chatMessages: Message[];
  isSaving: boolean;
  hasSaved: boolean;

  // Data
  doctors: any[];
  loadingDoctors: boolean;

  // Setters
  setViewMode: (mode: ViewMode) => void;
  setIsChatOpen: (open: boolean) => void;
  setIsInfographicsOpen: (open: boolean) => void;
  setIsVerificationModalOpen: (open: boolean) => void;
  setActiveQuestion: (question: string | null) => void;
  setIsChatExpanded: (expanded: boolean) => void;
  setChatMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setIsSaving: (saving: boolean) => void;
  setHasSaved: (saved: boolean) => void;
}

/**
 * Hook for managing diagnosis report state and data fetching
 */
export function useDiagnosisReportState(
  options: UseDiagnosisReportStateOptions = {}
): UseDiagnosisReportStateResult {
  const { saved = false } = options;

  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>("modern");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isInfographicsOpen, setIsInfographicsOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [activeQuestion, setActiveQuestion] = useState<string | null>(null);
  const [isChatExpanded, setIsChatExpanded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(saved);

  // Data
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  // Fetch doctors on mount
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const { data } = await createClientServices().practitioners.list();
        if (data) {
          setDoctors(
            data.map((d: any) => ({
              id: d.id,
              name: d.name,
              photo: d.photo,
              clinicName: d.clinic_name,
              specialties: d.specialties || [],
              address: d.address,
              phone: d.phone,
              experience: d.experience,
              wazeLink: d.waze_link,
              workingHours: d.working_hours,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching doctors:", error);
      } finally {
        setLoadingDoctors(false);
      }
    };
    fetchDoctors();
    setMounted(true);
  }, []);

  return {
    // State
    viewMode,
    isChatOpen,
    isInfographicsOpen,
    isVerificationModalOpen,
    activeQuestion,
    isChatExpanded,
    mounted,
    chatMessages,
    isSaving,
    hasSaved,
    doctors,
    loadingDoctors,

    // Setters
    setViewMode,
    setIsChatOpen,
    setIsInfographicsOpen,
    setIsVerificationModalOpen,
    setActiveQuestion,
    setIsChatExpanded,
    setChatMessages,
    setIsSaving,
    setHasSaved,
  };
}
