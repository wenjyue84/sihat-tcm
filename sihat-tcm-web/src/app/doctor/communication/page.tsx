"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useAuth } from "@/stores/useAppStore";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquare, Send, RefreshCw, Bell, Volume2, VolumeX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import type { PatientFlag } from "@/types/database";

// Import new components
import {
  InboxFilters,
  ConversationItem,
  ChatHeader,
  MessageBubble,
  DiagnosisPreviewModal,
  DoctorNotesModal,
  EmptyState,
  PatientContextPanel,
} from "@/components/doctor/communication";
import type {
  FilterStatus,
  SortOption,
  ConversationItemData,
} from "@/components/doctor/communication";

interface Message {
  role: "user" | "doctor";
  content: string;
  timestamp: string;
  read?: boolean;
}

export default function DoctorCommunicationPage() {
  const { profile, loading } = useAuth();
  const router = useRouter();

  // Core state
  const [requests, setRequests] = useState<ConversationItemData[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [activeRequest, setActiveRequest] = useState<ConversationItemData | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter & search state
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date");

  // Modal state
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [currentNotes, setCurrentNotes] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Notifications
  const [notification, setNotification] = useState<{ title: string; message: string } | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Redirect non-doctors
  useEffect(() => {
    if (!loading && profile?.role !== "doctor") {
      router.push("/doctor");
    } else if (profile?.role === "doctor") {
      fetchRequests();
    }
  }, [profile, loading, router]);

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom();
  }, [activeRequest?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch requests from both tables
  const fetchRequests = async () => {
    try {
      setLoadingRequests(true);

      const [sessionsResult, inquiriesResult] = await Promise.all([
        supabase
          .from("diagnosis_sessions")
          .select("id, created_at, primary_diagnosis, full_report, symptoms, notes, user_id, flag")
          .or(
            'primary_diagnosis.eq.Request for Verification,symptoms.cs.{"Request for Verification"}'
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("inquiries")
          .select("*")
          .eq("symptoms", "Request for Verification")
          .order("created_at", { ascending: false }),
      ]);

      const { data: sessions, error: sessionError } = sessionsResult;
      const { data: inqData, error: inqError } = inquiriesResult;

      if (sessionError) console.warn("Error fetching diagnosis_sessions:", sessionError.message);
      if (inqError) console.warn("Error fetching inquiries:", inqError.message);

      // Fetch profile data for sessions
      const userIds = Array.from(new Set((sessions || []).map((s) => s.user_id).filter(Boolean)));
      const profilesMap = new Map();

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", userIds);
        (profiles || []).forEach((p) => profilesMap.set(p.id, p));
      }

      // Process Inquiries
      const inquiriesRequests: ConversationItemData[] = (inqData || []).map((req: any) => {
        const report = req.diagnosis_report || {};
        const profile = (Array.isArray(req.profiles) ? req.profiles[0] : req.profiles) || {};
        const messages = report.messages || [];

        return {
          id: req.id,
          created_at: req.created_at,
          status: report.status || "pending",
          messages: messages,
          patient_name: report.patient_profile?.name || profile.full_name || "Unknown Patient",
          patient_email: report.patient_profile?.email || profile.email,
          table: "inquiries" as const,
          flag: req.flag || null,
          unread_count: countUnreadMessages(messages),
          last_message_by: messages.length > 0 ? messages[messages.length - 1].role : undefined,
        };
      });

      // Process Diagnosis Sessions
      const sessionsRequests: ConversationItemData[] = (sessions || []).map((req: any) => {
        const report = req.full_report || {};
        const userProfile = (req.user_id ? profilesMap.get(req.user_id) : null) || {};
        const messages = report.messages || [];

        return {
          id: req.id,
          created_at: req.created_at,
          status: report.status || "pending",
          messages: messages,
          patient_name: report.patient_profile?.name || userProfile.full_name || "Unknown Patient",
          patient_email: report.patient_profile?.email || userProfile.email,
          table: "diagnosis_sessions" as const,
          flag: req.flag || null,
          unread_count: countUnreadMessages(messages),
          last_message_by: messages.length > 0 ? messages[messages.length - 1].role : undefined,
        };
      });

      // Combine and sort
      const allRequests = [...sessionsRequests, ...inquiriesRequests].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setRequests(allRequests);

      // Update active request if needed
      if (activeRequest) {
        const updatedActive = allRequests.find((r) => r.id === activeRequest.id);
        if (updatedActive) {
          setActiveRequest(updatedActive);
        }
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  // Count unread messages (messages from user that haven't been responded to)
  const countUnreadMessages = (messages: Message[]): number => {
    let count = 0;
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "user") count++;
      else break;
    }
    return count;
  };

  // Real-time subscription
  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel("doctor-inbox")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "diagnosis_sessions" },
        (payload) => {
          const newData = payload.new as any;
          const newMessages = newData.full_report?.messages || [];

          // Check if new message from patient
          if (newMessages.length > 0) {
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg.role === "user") {
              showNotification("New Patient Message", lastMsg.content);
            }
          }
          fetchRequests();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "inquiries" },
        (payload) => {
          const newData = payload.new as any;
          const newMessages = newData.diagnosis_report?.messages || [];

          if (newMessages.length > 0) {
            const lastMsg = newMessages[newMessages.length - 1];
            if (lastMsg.role === "user") {
              showNotification("New Patient Message", lastMsg.content);
            }
          }
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  // Show notification
  const showNotification = (title: string, message: string) => {
    setNotification({ title, message });

    // Play sound if enabled
    if (soundEnabled) {
      const audio = new Audio("/notification.mp3");
      audio.volume = 0.3;
      audio.play().catch(() => {
        /* ignore */
      });
    }

    // Browser notification
    if (Notification.permission === "granted") {
      new Notification(title, { body: message, icon: "/icon.png" });
    }

    setTimeout(() => setNotification(null), 5000);
  };

  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      Notification.requestPermission();
    }
  }, []);

  // Filter and sort requests
  const filteredRequests = useMemo(() => {
    let result = requests;

    // Apply status filter
    if (filter !== "all") {
      result = result.filter((r) => r.status === filter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.patient_name.toLowerCase().includes(query) ||
          r.patient_email?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (sortBy === "name") {
      result = [...result].sort((a, b) => a.patient_name.localeCompare(b.patient_name));
    } else if (sortBy === "status") {
      const statusOrder = { pending: 0, active: 1, closed: 2 };
      result = [...result].sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
    }
    // date sorting is default from fetch

    return result;
  }, [requests, filter, searchQuery, sortBy]);

  // Filter counts
  const filterCounts = useMemo(
    () => ({
      all: requests.length,
      pending: requests.filter((r) => r.status === "pending").length,
      active: requests.filter((r) => r.status === "active").length,
      closed: requests.filter((r) => r.status === "closed").length,
    }),
    [requests]
  );

  // Send message handler
  const handleSendMessage = async () => {
    if (!activeRequest || !replyMessage.trim()) return;

    try {
      setSending(true);
      const newMsg: Message = {
        role: "doctor",
        content: replyMessage,
        timestamp: new Date().toISOString(),
      };

      // Optimistic update
      const updatedMessages = [...activeRequest.messages, newMsg];
      const newStatus = activeRequest.status === "pending" ? "active" : activeRequest.status;

      const updatedReq = { ...activeRequest, messages: updatedMessages, status: newStatus as any };
      setActiveRequest(updatedReq);
      setRequests((prev) => prev.map((r) => (r.id === activeRequest.id ? updatedReq : r)));
      setReplyMessage("");

      // API call
      const response = await fetch("/api/doctor/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: activeRequest.id,
          message: newMsg.content,
          status: newStatus,
          targetTable: activeRequest.table || "diagnosis_sessions",
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      alert("Failed to send reply. Please try again.");
      fetchRequests();
    } finally {
      setSending(false);
    }
  };

  // Verify request handler
  const handleVerify = async () => {
    if (!activeRequest) return;

    try {
      setIsVerifying(true);

      const response = await fetch("/api/doctor/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: activeRequest.id,
          message: "✅ Your diagnosis has been verified by a licensed TCM practitioner.",
          status: "active",
          targetTable: activeRequest.table || "diagnosis_sessions",
        }),
      });

      if (!response.ok) throw new Error("Failed to verify");

      await fetchRequests();
    } catch (error) {
      console.error("Error verifying:", error);
      alert("Failed to verify request.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Close conversation handler
  const handleClose = async () => {
    if (!activeRequest) return;

    if (!confirm("Are you sure you want to close this conversation?")) return;

    try {
      const table = activeRequest.table || "diagnosis_sessions";
      const reportColumn = table === "inquiries" ? "diagnosis_report" : "full_report";

      const { data: current } = await supabase
        .from(table)
        .select(reportColumn)
        .eq("id", activeRequest.id)
        .single();

      const currentReport = (current as any)?.[reportColumn] || {};

      await supabase
        .from(table)
        .update({
          [reportColumn]: { ...currentReport, status: "closed" },
        })
        .eq("id", activeRequest.id);

      await fetchRequests();
    } catch (error) {
      console.error("Error closing:", error);
    }
  };

  // Flag change handler
  const handleFlagChange = async (flag: PatientFlag) => {
    if (!activeRequest) return;

    try {
      const table = activeRequest.table || "diagnosis_sessions";

      await supabase.from(table).update({ flag }).eq("id", activeRequest.id);

      // Optimistic update
      const updated = { ...activeRequest, flag };
      setActiveRequest(updated);
      setRequests((prev) => prev.map((r) => (r.id === activeRequest.id ? updated : r)));
    } catch (error) {
      console.error("Error updating flag:", error);
    }
  };

  // Save notes handler
  const handleSaveNotes = async (notes: string) => {
    if (!activeRequest) return;

    try {
      const table = activeRequest.table || "diagnosis_sessions";

      await supabase.from(table).update({ notes }).eq("id", activeRequest.id);

      setCurrentNotes(notes);
    } catch (error) {
      console.error("Error saving notes:", error);
      throw error;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
      </div>
    );
  }

  if (!profile || profile.role !== "doctor") return null;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row p-4 md:p-6 gap-6 overflow-hidden relative">
      {/* Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 right-4 z-50 bg-white border border-blue-100 shadow-xl rounded-xl p-4 w-80"
          >
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 p-2 rounded-full">
                <Bell className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-slate-800 text-sm">{notification.title}</h4>
                <p className="text-slate-600 text-xs line-clamp-2">{notification.message}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar - Inbox */}
      <div className="w-full md:w-[380px] flex flex-col min-h-0">
        <header className="mb-4 shrink-0 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-blue-600" />
              Patient Communication
            </h1>
            <p className="text-slate-500 text-sm">Review verification requests & chats</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="h-8 w-8 p-0"
              title={soundEnabled ? "Mute notifications" : "Unmute notifications"}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-gray-500" />
              ) : (
                <VolumeX className="w-4 h-4 text-gray-400" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchRequests()}
              className="h-8 w-8 p-0"
              disabled={loadingRequests}
            >
              <RefreshCw
                className={`w-4 h-4 text-gray-500 ${loadingRequests ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </header>

        <Card className="flex-1 flex flex-col bg-white/90 backdrop-blur min-h-0 shadow-sm border-blue-100">
          <CardHeader className="py-3 border-b bg-gradient-to-r from-blue-50/80 to-indigo-50/50">
            <InboxFilters
              filter={filter}
              onFilterChange={setFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
              counts={filterCounts}
            />
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-2 space-y-2">
            {loadingRequests ? (
              <div className="py-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                <p className="text-sm text-gray-400 mt-2">Loading conversations...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <EmptyState type="inbox" />
            ) : (
              filteredRequests.map((req) => (
                <ConversationItem
                  key={req.id}
                  conversation={req}
                  isActive={activeRequest?.id === req.id}
                  onClick={() => setActiveRequest(req)}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        <Card className="flex-1 flex flex-col bg-white shadow-md border-slate-200 min-h-0 overflow-hidden">
          {activeRequest ? (
            <>
              <ChatHeader
                conversation={activeRequest}
                onViewDiagnosis={() => setShowDiagnosisModal(true)}
                onAddNotes={() => {
                  setCurrentNotes(activeRequest.messages.length > 0 ? "" : "");
                  setShowNotesModal(true);
                }}
                onVerify={handleVerify}
                onClose={handleClose}
                onFlagChange={handleFlagChange}
                isVerifying={isVerifying}
              />
              <PatientContextPanel
                conversation={activeRequest}
                onViewFullReport={() => setShowDiagnosisModal(true)}
              />
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-3 bg-gradient-to-b from-slate-50/50 to-white">
                {/* Date divider */}
                <div className="flex justify-center">
                  <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                    {format(new Date(activeRequest.created_at), "MMMM d, yyyy")}
                  </span>
                </div>

                {activeRequest.messages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center py-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl mx-auto max-w-md mt-4 border border-blue-100"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MessageSquare className="w-6 h-6 text-blue-500" />
                    </div>
                    <h3 className="text-blue-900 font-semibold">New Verification Request</h3>
                    <p className="text-blue-700 text-sm mt-2 px-6">
                      This patient is requesting verification for their AI diagnosis. Reply to
                      approve and start a conversation.
                    </p>
                  </motion.div>
                ) : (
                  activeRequest.messages.map((msg, idx) => (
                    <MessageBubble
                      key={idx}
                      message={{
                        role: msg.role as "user" | "doctor",
                        content: msg.content,
                        timestamp: msg.timestamp,
                      }}
                      isDoctor={true}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </CardContent>
              <div className="p-4 border-t bg-white shrink-0">
                <div className="flex gap-3">
                  <Input
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Type your reply..."
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
                    disabled={sending}
                    className="bg-gray-50 border-gray-200 focus:bg-white"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={sending || !replyMessage.trim()}
                    className="bg-blue-600 hover:bg-blue-700 px-5"
                  >
                    {sending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <EmptyState type="chat" />
          )}
        </Card>
      </div>

      {/* Modals */}
      <DiagnosisPreviewModal
        isOpen={showDiagnosisModal}
        onClose={() => setShowDiagnosisModal(false)}
        conversation={activeRequest}
      />

      <DoctorNotesModal
        isOpen={showNotesModal}
        onClose={() => setShowNotesModal(false)}
        patientName={activeRequest?.patient_name || ""}
        currentNotes={currentNotes}
        onSave={handleSaveNotes}
      />
    </div>
  );
}
