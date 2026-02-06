"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { MOCK_INQUIRIES, SYMPTOM_TAGS, type Inquiry } from "@/lib/mock/doctorDashboard";
import type { PatientFlag } from "@/types/database";
import { isAfter, isBefore, parseISO, startOfDay, endOfDay } from "date-fns";

export interface DashboardFilters {
  searchQuery: string;
  dateFrom: string;
  dateTo: string;
  symptomFilter: string;
  flagFilter: PatientFlag | "All";
}

export interface DashboardStats {
  total: number;
  recent: number;
  uniquePatients: number;
}

interface UseDoctorDashboardReturn {
  // Data
  inquiries: Inquiry[];
  filteredInquiries: Inquiry[];
  isLoading: boolean;
  useMockData: boolean;
  stats: DashboardStats;

  // Filters
  filters: DashboardFilters;
  setSearchQuery: (query: string) => void;
  setDateFrom: (date: string) => void;
  setDateTo: (date: string) => void;
  setSymptomFilter: (symptom: string) => void;
  setFlagFilter: (flag: PatientFlag | "All") => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;

  // Actions
  setInquiries: React.Dispatch<React.SetStateAction<Inquiry[]>>;
  refetch: () => Promise<void>;

  // Constants
  symptomTags: string[];
}

export function useDoctorDashboard(): UseDoctorDashboardReturn {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [useMockData, setUseMockData] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [symptomFilter, setSymptomFilter] = useState("");
  const [flagFilter, setFlagFilter] = useState<PatientFlag | "All">("All");
  const [showFilters, setShowFilters] = useState(false);

  const fetchInquiries = useCallback(async () => {
    try {
      console.log("Starting fetchInquiries...");
      setIsLoading(true);

      // 1. Fetch diagnosis sessions (raw, no joins to avoid relationship errors)
      const { data: sessions, error: sessionError } = await supabase
        .from("diagnosis_sessions")
        .select(
          `
            id,
            created_at,
            primary_diagnosis,
            full_report,
            symptoms,
            user_id,
            patient_id
        `
        )
        .order("created_at", { ascending: false })
        .limit(50);

      if (sessionError) throw sessionError;

      if (!sessions || sessions.length === 0) {
        console.log("No sessions found, using mock data");
        setUseMockData(true);
        setInquiries(MOCK_INQUIRIES);
        return;
      }

      // 2. Extract IDs for manual fetching
      const userIds = Array.from(new Set(sessions.map((s) => s.user_id).filter(Boolean)));
      const patientIds = Array.from(new Set(sessions.map((s) => s.patient_id).filter(Boolean)));

      // 3. Fetch Profiles (Handle missing flag column gracefully)
      const profilesMap = new Map();
      if (userIds.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from("profiles")
          .select("id, full_name, age, gender, flag")
          .in("id", userIds);

        if (profileError && profileError.code === "42703") {
          // Retry without flag if column missing
          console.warn("Flag column missing in profiles, fetching without it");
          const { data: retryProfiles } = await supabase
            .from("profiles")
            .select("id, full_name, age, gender")
            .in("id", userIds);
          (retryProfiles || []).forEach((p: Record<string, unknown>) => profilesMap.set(p.id, p));
        } else {
          (profiles || []).forEach((p: Record<string, unknown>) => profilesMap.set(p.id, p));
        }
      }

      // 4. Fetch Managed Patients
      const patientsMap = new Map();
      if (patientIds.length > 0) {
        const { data: patients, error: patientError } = await supabase
          .from("patients")
          .select("id, first_name, last_name, birth_date, gender, flag")
          .in("id", patientIds);

        if (patientError && patientError.code === "42703") {
          // Retry without flag if column missing
          const { data: retryPatients } = await supabase
            .from("patients")
            .select("id, first_name, last_name, birth_date, gender")
            .in("id", patientIds);
          (retryPatients || []).forEach((p: Record<string, unknown>) => patientsMap.set(p.id, p));
        } else {
          (patients || []).forEach((p: Record<string, unknown>) => patientsMap.set(p.id, p));
        }
      }

      // 5. Join and Transform Data
      console.log("Transforming and joining data...");
      const transformedData: Inquiry[] = sessions.map((session) => ({
        id: session.id,
        created_at: session.created_at,
        symptoms: Array.isArray(session.symptoms)
          ? session.symptoms.join(", ")
          : session.symptoms ||
            session.full_report?.analysis?.key_findings?.from_inquiry ||
            "No symptoms recorded",
        diagnosis_report: session.full_report,
        profiles: session.user_id ? profilesMap.get(session.user_id) : null,
        patients: session.patient_id ? patientsMap.get(session.patient_id) : null,
      }));

      console.log("Transformed data length:", transformedData.length);
      setUseMockData(false);
      setInquiries(transformedData);
    } catch (error: unknown) {
      // Handle different error types
      let errorDetails: Record<string, unknown> = {
        type: typeof error,
        isError: error instanceof Error,
        timestamp: new Date().toISOString(),
      };

      if (error && typeof error === "object") {
        const err = error as { message?: string; msg?: string; code?: string; stack?: string };
        errorDetails = {
          ...errorDetails,
          message: err.message || err.msg || "Unknown error",
          code: err.code || "UNKNOWN",
        };
        if (error instanceof Error) {
          errorDetails.stack = err.stack;
        }
      } else {
        errorDetails.rawError = String(error);
      }

      console.error("❌ Error fetching diagnosis sessions:", errorDetails);
      console.warn("⚠️ Falling back to mock data...");
      setUseMockData(true);
      setInquiries(MOCK_INQUIRIES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  // Filter logic
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inquiry) => {
      const profile = Array.isArray(inquiry.profiles) ? inquiry.profiles[0] : inquiry.profiles;
      const patient = Array.isArray(inquiry.patients) ? inquiry.patients[0] : inquiry.patients;
      // Prefer patient_profile from diagnosis_report if available (for doctor entered patients)
      const reportProfile = inquiry.diagnosis_report?.patient_profile;
      const patientName = (
        reportProfile?.name ||
        profile?.full_name ||
        patient?.full_name ||
        ""
      ).toLowerCase();

      const symptoms = inquiry.symptoms?.toLowerCase() || "";
      const diagnosisText = JSON.stringify(inquiry.diagnosis_report || {}).toLowerCase();
      const searchLower = searchQuery.toLowerCase();

      // Filter by Flag
      if (flagFilter !== "All") {
        const patientFlag = profile?.flag || patient?.flag;
        if (patientFlag !== flagFilter) return false;
      }

      // Keyword search (patient name, symptoms, diagnosis)
      if (searchQuery) {
        const matchesSearch =
          patientName.includes(searchLower) ||
          symptoms.includes(searchLower) ||
          diagnosisText.includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Date range filter
      if (dateFrom) {
        const fromDate = startOfDay(parseISO(dateFrom));
        const inquiryDate = parseISO(inquiry.created_at);
        if (isBefore(inquiryDate, fromDate)) return false;
      }

      if (dateTo) {
        const toDate = endOfDay(parseISO(dateTo));
        const inquiryDate = parseISO(inquiry.created_at);
        if (isAfter(inquiryDate, toDate)) return false;
      }

      // Symptom tag filter
      if (symptomFilter) {
        if (!symptoms.includes(symptomFilter.toLowerCase())) return false;
      }

      return true;
    });
  }, [inquiries, searchQuery, dateFrom, dateTo, symptomFilter, flagFilter]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setDateFrom("");
    setDateTo("");
    setSymptomFilter("");
    setFlagFilter("All");
  }, []);

  const hasActiveFilters = Boolean(
    searchQuery || dateFrom || dateTo || symptomFilter || flagFilter !== "All"
  );

  // Statistics
  const stats = useMemo((): DashboardStats => {
    const today = new Date();
    const last7Days = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentCount = inquiries.filter((i) => new Date(i.created_at) >= last7Days).length;
    const uniquePatients = new Set(
      inquiries.map((i) => {
        const p = Array.isArray(i.profiles) ? i.profiles[0] : i.profiles;
        const reportProfile = i.diagnosis_report?.patient_profile;
        return reportProfile?.name || p?.full_name;
      })
    ).size;

    return {
      total: inquiries.length,
      recent: recentCount,
      uniquePatients,
    };
  }, [inquiries]);

  return {
    // Data
    inquiries,
    filteredInquiries,
    isLoading,
    useMockData,
    stats,

    // Filters
    filters: {
      searchQuery,
      dateFrom,
      dateTo,
      symptomFilter,
      flagFilter,
    },
    setSearchQuery,
    setDateFrom,
    setDateTo,
    setSymptomFilter,
    setFlagFilter,
    clearFilters,
    hasActiveFilters,
    showFilters,
    setShowFilters,

    // Actions
    setInquiries,
    refetch: fetchInquiries,

    // Constants
    symptomTags: SYMPTOM_TAGS,
  };
}
