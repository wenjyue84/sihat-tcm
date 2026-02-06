"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { isAfter, isBefore, parseISO, startOfDay, endOfDay } from "date-fns";
import { MOCK_INQUIRIES, type Inquiry } from "@/lib/mock/doctorReports";

export interface DateFilter {
  from: string;
  to: string;
}

export interface UseDoctorReportsReturn {
  /** All fetched inquiries (raw data) */
  inquiries: Inquiry[];
  /** Filtered inquiries based on search and filters */
  filteredInquiries: Inquiry[];
  /** Loading state */
  isLoading: boolean;
  /** Whether mock data is being used */
  useMockData: boolean;
  /** Current search query */
  searchQuery: string;
  /** Set search query */
  setSearchQuery: (query: string) => void;
  /** Date range filter - from date */
  dateFrom: string;
  /** Set from date */
  setDateFrom: (date: string) => void;
  /** Date range filter - to date */
  dateTo: string;
  /** Set to date */
  setDateTo: (date: string) => void;
  /** Symptom tag filter */
  symptomFilter: string;
  /** Set symptom filter */
  setSymptomFilter: (symptom: string) => void;
  /** Whether any filters are active */
  hasActiveFilters: boolean;
  /** Clear all filters */
  clearFilters: () => void;
  /** Refetch inquiries from database */
  refetch: () => Promise<void>;
}

/**
 * Custom hook for managing doctor reports data and filtering
 * Handles data fetching from Supabase with fallback to mock data
 */
export function useDoctorReports(): UseDoctorReportsReturn {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [useMockData, setUseMockData] = useState(false);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [symptomFilter, setSymptomFilter] = useState("");

  const fetchInquiries = useCallback(async () => {
    try {
      setIsLoading(true);
      // Try diagnosis_sessions first
      const { data: sessions, error: sessionError } = await supabase
        .from("diagnosis_sessions")
        .select("id, created_at, primary_diagnosis, full_report, symptoms, user_id")
        .order("created_at", { ascending: false });

      let sessionInquiries: Inquiry[] = [];

      if (!sessionError && sessions && sessions.length > 0) {
        // Fetch profiles manually (avoid Supabase relationship joins)
        const userIds = Array.from(new Set(sessions.map((s) => s.user_id).filter(Boolean)));
        const profilesMap = new Map();

        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, full_name, age, gender")
            .in("id", userIds);
          (profiles || []).forEach((p) => profilesMap.set(p.id, p));
        }

        sessionInquiries = sessions.map((session) => ({
          id: session.id,
          created_at: session.created_at,
          symptoms: Array.isArray(session.symptoms)
            ? session.symptoms.join(", ")
            : session.symptoms || session.primary_diagnosis || "",
          diagnosis_report: session.full_report,
          profiles: session.user_id ? profilesMap.get(session.user_id) : null,
        }));

        setInquiries(sessionInquiries);
        setUseMockData(false);
        return;
      }

      // If diagnosis_sessions failed or returned empty, try inquiries table
      if (sessionError) {
        console.warn(
          "Error fetching from diagnosis_sessions, falling back to inquiries:",
          sessionError.message
        );
      }

      const { data: inqData, error: inqError } = await supabase
        .from("inquiries")
        .select(
          `
                    id,
                    created_at,
                    symptoms,
                    diagnosis_report,
                    profiles (
                        full_name,
                        age,
                        gender
                    )
                `
        )
        .order("created_at", { ascending: false });

      if (inqError) throw inqError;

      if (!inqData || inqData.length === 0) {
        setUseMockData(true);
        setInquiries(MOCK_INQUIRIES);
      } else {
        setInquiries(inqData as unknown as Inquiry[]);
        setUseMockData(false);
      }
    } catch (error) {
      console.error("Error fetching inquiries:", error);
      // On error, fallback to mock data
      setUseMockData(true);
      setInquiries(MOCK_INQUIRIES);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  // Memoized filtering logic
  const filteredInquiries = useMemo(() => {
    return inquiries.filter((inquiry) => {
      const profile = Array.isArray(inquiry.profiles) ? inquiry.profiles[0] : inquiry.profiles;
      // Prefer patient_profile from diagnosis_report if available (for doctor entered patients)
      const reportProfile = inquiry.diagnosis_report?.patient_profile;
      const patientName = (reportProfile?.name || profile?.full_name || "").toLowerCase();

      const symptoms = inquiry.symptoms?.toLowerCase() || "";
      const diagnosisText = JSON.stringify(inquiry.diagnosis_report || {}).toLowerCase();
      const searchLower = searchQuery.toLowerCase();

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
  }, [inquiries, searchQuery, dateFrom, dateTo, symptomFilter]);

  const clearFilters = useCallback(() => {
    setSearchQuery("");
    setDateFrom("");
    setDateTo("");
    setSymptomFilter("");
  }, []);

  const hasActiveFilters = Boolean(searchQuery || dateFrom || dateTo || symptomFilter);

  return {
    inquiries,
    filteredInquiries,
    isLoading,
    useMockData,
    searchQuery,
    setSearchQuery,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    symptomFilter,
    setSymptomFilter,
    hasActiveFilters,
    clearFilters,
    refetch: fetchInquiries,
  };
}
