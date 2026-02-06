/**
 * Hook for managing patient communication data and operations
 * Extracted from PatientCommunication.tsx to improve maintainability
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/stores/useAppStore";
import { supabase } from "@/lib/supabase/client";
import { createClientServices } from "@/lib/services";

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
  summary?: string;
  table?: "inquiries" | "diagnosis_sessions";
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

  const fetchRequests = useCallback(
    async (isInitial = false) => {
      if (!user) return;

      try {
        if (isInitial) setLoading(true);

        const [inquiriesResult, sessionsResult] = await Promise.all([
          supabase.from("inquiries").select("*").order("created_at", { ascending: false }),
          supabase
            .from("diagnosis_sessions")
            .select("id, created_at, primary_diagnosis, full_report, symptoms, notes")
            .order("created_at", { ascending: false }),
        ]);

        const { data: inquiriesData, error: inquiriesError } = inquiriesResult;
        const { data: sessionsData, error: sessionsError } = sessionsResult;

        if (inquiriesError) console.error("Error fetching inquiries:", inquiriesError);
        if (sessionsError) console.error("Error fetching sessions:", sessionsError);

        const parsedInquiries = (inquiriesData || []).map((req: any) => ({
          id: req.id,
          created_at: req.created_at,
          status: req.diagnosis_report?.status || "pending",
          messages: Array.isArray(req.diagnosis_report?.messages)
            ? req.diagnosis_report.messages
            : [],
          summary: req.symptoms || "General Inquiry",
          table: "inquiries" as const,
        }));

        // Filter sessions that have 'Request for Verification' or have active chats
        const parsedSessions = (sessionsData || [])
          .filter((s: any) => {
            // Check if it's a verification request OR has messages
            const isVerification =
              s.primary_diagnosis === "Request for Verification" ||
              (s.symptoms && s.symptoms.includes("Request for Verification"));
            const hasMessages = s.full_report?.messages && s.full_report.messages.length > 0;
            return isVerification || hasMessages;
          })
          .map((req: any) => ({
            id: req.id,
            created_at: req.created_at,
            status: req.full_report?.status || "pending",
            messages: Array.isArray(req.full_report?.messages) ? req.full_report.messages : [],
            summary: req.primary_diagnosis || "Diagnosis Session",
            table: "diagnosis_sessions" as const,
          }));

        const allRequests = [...parsedInquiries, ...parsedSessions].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setRequests(allRequests);

        // Stable update for activeRequest without adding it to dependencies
        setActiveRequest((current) => {
          if (!current && allRequests.length > 0) {
            return allRequests[0];
          }
          if (current) {
            const updated = allRequests.find((r) => r.id === current.id);
            return updated || current;
          }
          return null;
        });
      } catch (error) {
        console.error("Error fetching requests:", error);
      } finally {
        if (isInitial) setLoading(false);
      }
    },
    [user]
  );

  const createRequest = useCallback(async () => {
    if (!user) return;

    try {
      setSending(true);
      const { error } = await createClientServices().inquiries.create({
        user_id: user.id,
        message: "Request for Verification",
      });

      if (error) throw new Error(error.message);
      await fetchRequests();
    } catch (error) {
      console.error("Error creating request:", error);
      throw error;
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
        const targetTable = activeRequest.table || "inquiries";

        if (targetTable === "inquiries") {
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
        } else {
          // For diagnosis_sessions, we need to fetch the existing report first to preserve other fields?
          // Or we assume activeRequest.messages is up to date.
          // But 'full_report' might have other fields.
          // Better to perform a shallow merge of full_report if possible, but valid JSONB update is tricky without fetching.
          // However, activeRequest is keeping track of messages.
          // Let's rely on what we have or do a safer update.
          // If we only update 'messages' inside 'full_report', we might lose other data if we just overwrite 'full_report'.
          // PostgreSQL jsonb_set is better but complex via client.
          // Let's fetch first to be safe, or just update what we know.
          // Actually, for patient, just updating messages seems fine if we assume 'activeRequest' structure.
          // BUT wait, 'full_report' has 'summary', 'analysis', etc. We don't want to lose that!
          // We need to fetch current report first? Or use an RPC?
          // Let's fetch the current record first to be safe.

          const { data: currentData } = await supabase
            .from("diagnosis_sessions")
            .select("full_report")
            .eq("id", requestId)
            .single();

          const currentReport = currentData?.full_report || {};
          const newReport = {
            ...currentReport,
            messages: updatedMessages,
          };

          const { error } = await supabase
            .from("diagnosis_sessions")
            .update({
              full_report: newReport,
            })
            .eq("id", requestId);

          if (error) throw error;
        }

        // Optimistic update
        const updatedRequest = { ...activeRequest, messages: updatedMessages };
        setActiveRequest(updatedRequest);
        setRequests((prev) => prev.map((r) => (r.id === requestId ? updatedRequest : r)));
      } catch (error) {
        console.error("Error sending message:", error);
        throw error;
      } finally {
        setSending(false);
      }
    },
    [activeRequest]
  );

  // Fetch requests on mount and when user changes
  useEffect(() => {
    if (user) {
      fetchRequests(true);

      // Realtime subscription for doctor replies
      const channel = supabase
        .channel("patient-inquiries")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "inquiries",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            fetchRequests();
            const newData = payload.new as any;
            const newMessages = newData.diagnosis_report?.messages || [];
            if (newMessages.length > 0) {
              const lastMsg = newMessages[newMessages.length - 1];
              if (lastMsg.role === "doctor") {
                window.dispatchEvent(
                  new CustomEvent("doctor-reply", {
                    detail: { message: lastMsg.content, requestId: newData.id },
                  })
                );
              }
            }
          }
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "diagnosis_sessions",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            fetchRequests();
            const newData = payload.new as any;
            const newMessages = newData.full_report?.messages || [];
            if (newMessages.length > 0) {
              const lastMsg = newMessages[newMessages.length - 1];
              if (lastMsg.role === "doctor") {
                window.dispatchEvent(
                  new CustomEvent("doctor-reply", {
                    detail: { message: lastMsg.content, requestId: newData.id },
                  })
                );
              }
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
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
