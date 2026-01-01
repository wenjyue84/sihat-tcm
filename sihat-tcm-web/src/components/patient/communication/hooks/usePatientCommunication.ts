/**
 * Hook for managing patient communication data and operations
 * Extracted from PatientCommunication.tsx to improve maintainability
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/stores/useAppStore";
import { supabase } from "@/lib/supabase/client";

export interface Message {
  role: "user" | "doctor";
  content: string;
  timestamp: string;
}

export interface VerificationRequest {
  id: string;
  created_at: string;
  status: "pending" | "active" | "closed";
  messages: Message[];
}

interface UsePatientCommunicationResult {
  requests: VerificationRequest[];
  activeRequest: VerificationRequest | null;
  loading: boolean;
  sending: boolean;
  setActiveRequest: (request: VerificationRequest | null) => void;
  fetchRequests: () => Promise<void>;
  createRequest: () => Promise<void>;
  sendMessage: (requestId: string, message: string) => Promise<void>;
}

/**
 * Hook for managing patient communication
 */
export function usePatientCommunication(): UsePatientCommunicationResult {
  const { user } = useAuth();
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRequest, setActiveRequest] = useState<VerificationRequest | null>(null);
  const [sending, setSending] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("inquiries")
        .select("*")
        .eq("symptoms", "Request for Verification")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const parsedRequests = (data || []).map((req: any) => ({
        id: req.id,
        created_at: req.created_at,
        status: req.diagnosis_report?.status || "pending",
        messages: req.diagnosis_report?.messages || [],
      }));

      setRequests(parsedRequests);
      if (parsedRequests.length > 0 && !activeRequest) {
        setActiveRequest(parsedRequests[0]);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  }, [user, activeRequest]);

  const createRequest = useCallback(async () => {
    if (!user) return;

    try {
      setSending(true);
      const { error } = await supabase.from("inquiries").insert({
        symptoms: "Request for Verification",
        diagnosis_report: {
          type: "verification_request",
          status: "pending",
          messages: [],
          patient_profile: {
            name: user.user_metadata?.full_name || user.email,
            email: user.email,
          },
        },
        notes: "Automated verification request",
      });

      if (error) throw error;
      await fetchRequests();
    } catch (error) {
      console.error("Error creating request:", error);
      throw error; // Let component handle error display
    } finally {
      setSending(false);
    }
  }, [user, fetchRequests]);

  const sendMessage = useCallback(
    async (requestId: string, message: string) => {
      if (!activeRequest || !message.trim()) return;

      try {
        setSending(true);
        const newMsg: Message = {
          role: "user",
          content: message,
          timestamp: new Date().toISOString(),
        };

        const updatedMessages = [...activeRequest.messages, newMsg];

        const { error } = await supabase
          .from("inquiries")
          .update({
            diagnosis_report: {
              type: "verification_request",
              status: activeRequest.status,
              messages: updatedMessages,
            },
          })
          .eq("id", requestId);

        if (error) throw error;

        // Optimistic update
        const updatedRequest = { ...activeRequest, messages: updatedMessages };
        setActiveRequest(updatedRequest);
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? updatedRequest : r))
        );
      } catch (error) {
        console.error("Error sending message:", error);
        throw error; // Let component handle error display
      } finally {
        setSending(false);
      }
    },
    [activeRequest]
  );

  // Fetch requests on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchRequests();
      // Optional: Set up realtime subscription here
    }
  }, [user, fetchRequests]);

  return {
    requests,
    activeRequest,
    loading,
    sending,
    setActiveRequest,
    fetchRequests,
    createRequest,
    sendMessage,
  };
}


