"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/stores/useAppStore";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquare, User, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";
import { format } from "date-fns";

interface Message {
    role: "user" | "doctor";
    content: string;
    timestamp: string;
}

interface VerificationRequest {
    id: string;
    created_at: string;
    status: "pending" | "active" | "closed";
    messages: Message[];
    patient_name: string;
    patient_email?: string;
}

export default function DoctorCommunicationPage() {
    const { profile, loading } = useAuth();
    const router = useRouter();
    const [requests, setRequests] = useState<VerificationRequest[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [activeRequest, setActiveRequest] = useState<VerificationRequest | null>(null);
    const [replyMessage, setReplyMessage] = useState("");
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!loading && profile?.role !== "doctor") {
            router.push("/doctor");
        } else if (profile?.role === "doctor") {
            fetchRequests();
        }
    }, [profile, loading, router]);

    useEffect(() => {
        scrollToBottom();
    }, [activeRequest?.messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const fetchRequests = async () => {
        try {
            setLoadingRequests(true);
            // Try fetching from diagnosis_sessions first
            // 1. Fetch from diagnosis_sessions (raw)
            const { data: sessions, error: sessionError } = await supabase
                .from("diagnosis_sessions")
                .select("id, created_at, primary_diagnosis, full_report, symptoms, notes, user_id")
                .or('primary_diagnosis.eq.Request for Verification,symptoms.cs.{"Request for Verification"}')
                .order("created_at", { ascending: false });

            if (sessionError) {
                console.warn("Error fetching requests from diagnosis_sessions, trying inquiries:", sessionError.message);
                const { data: inqData, error: inqError } = await supabase
                    .from("inquiries")
                    .select("*")
                    .eq("symptoms", "Request for Verification")
                    .order("created_at", { ascending: false });

                if (inqError) throw inqError;

                const parsedRequests = (inqData || []).map((req: any) => {
                    const report = req.diagnosis_report || {};
                    const profile = (Array.isArray(req.profiles) ? req.profiles[0] : req.profiles) || {};

                    return {
                        id: req.id,
                        created_at: req.created_at,
                        status: report.status || "pending",
                        messages: report.messages || [],
                        patient_name: report.patient_profile?.name || profile.full_name || "Unknown Patient",
                        patient_email: report.patient_profile?.email || profile.email,
                        table: 'inquiries' as const
                    };
                });
                setRequests(parsedRequests);
            } else {
                // 2. Fetch profiles manually
                const userIds = Array.from(new Set((sessions || []).map(s => s.user_id).filter(Boolean)));
                const profilesMap = new Map();

                if (userIds.length > 0) {
                    const { data: profiles } = await supabase
                        .from("profiles")
                        .select("id, full_name, email")
                        .in("id", userIds);
                    (profiles || []).forEach(p => profilesMap.set(p.id, p));
                }

                const parsedRequests = (sessions || []).map((req: any) => {
                    const report = req.full_report || {};
                    const profile = (req.user_id ? profilesMap.get(req.user_id) : null) || {};

                    return {
                        id: req.id,
                        created_at: req.created_at,
                        status: report.status || "pending",
                        messages: report.messages || [],
                        patient_name: report.patient_profile?.name || profile.full_name || "Unknown Patient",
                        patient_email: report.patient_profile?.email || profile.email,
                        table: 'diagnosis_sessions' as const
                    };
                });
                setRequests(parsedRequests);
            }

            if (activeRequest) {
                // Refresh active request in local state will happen via the requests update
            }
        } catch (error) {
            console.error("Error fetching requests:", error);
        } finally {
            setLoadingRequests(false);
        }
    };

    const handleSendMessage = async () => {
        if (!activeRequest || !replyMessage.trim()) return;

        try {
            setSending(true);
            const newMsg: Message = {
                role: "doctor",
                content: replyMessage,
                timestamp: new Date().toISOString(),
            };

            const updatedMessages = [...activeRequest.messages, newMsg];
            const newStatus = "active"; // Doctor reply activates the chat
            const commonData = {
                status: newStatus,
                messages: updatedMessages,
                type: "verification_request",
                patient_profile: {
                    name: activeRequest.patient_name,
                    email: activeRequest.patient_email
                }
            };

            // Find which table this record belongs to
            const targetTable = (activeRequest as any).table || 'diagnosis_sessions';

            if (targetTable === 'diagnosis_sessions') {
                const { error } = await supabase
                    .from("diagnosis_sessions")
                    .update({
                        full_report: commonData,
                        notes: `Chat active. Last msg: ${new Date().toISOString()}`
                    })
                    .eq("id", activeRequest.id);

                if (error) {
                    console.warn("Failed to update diagnosis_sessions, trying inquiries fallback...");
                    // Try inquiries fallback if it was misidentified
                    const { error: inqError } = await supabase
                        .from("inquiries")
                        .update({
                            diagnosis_report: commonData,
                            notes: `Chat active. Last msg: ${new Date().toISOString()}`
                        })
                        .eq("id", activeRequest.id);
                    if (inqError) throw inqError;
                }
            } else {
                const { error } = await supabase
                    .from("inquiries")
                    .update({
                        diagnosis_report: commonData,
                        notes: `Chat active. Last msg: ${new Date().toISOString()}`
                    })
                    .eq("id", activeRequest.id);
                if (error) throw error;
            }

            setReplyMessage("");
            // Update local state
            const updatedReq = { ...activeRequest, messages: updatedMessages, status: newStatus as any };
            setActiveRequest(updatedReq);
            setRequests(prev => prev.map(r => r.id === activeRequest.id ? updatedReq : r));

        } catch (error) {
            console.error("Error sending reply:", error);
            alert("Failed to send reply. Please ensure the database is up to date.");
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
            </div>
        );
    }

    if (!profile || profile.role !== "doctor") return null;

    return (
        <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row p-4 md:p-6 gap-6 overflow-hidden">
            {/* Sidebar List */}
            <div className="w-full md:w-1/3 flex flex-col min-h-0">
                <header className="mb-4 shrink-0">
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-blue-600" />
                        Patient Communication
                    </h1>
                    <p className="text-slate-500 text-sm">Review verification requests & chats</p>
                </header>

                <Card className="flex-1 flex flex-col bg-white/80 backdrop-blur min-h-0 shadow-sm border-blue-100">
                    <CardHeader className="py-3 border-b bg-blue-50/50">
                        <div className="flex justify-between items-center">
                            <CardTitle className="text-sm font-medium text-blue-900">Inbox</CardTitle>
                            <Button variant="ghost" size="sm" onClick={fetchRequests} className="h-6 w-6 p-0 rounded-full hover:bg-blue-100">
                                <Loader2 className={`w-3 h-3 ${loadingRequests ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto p-2 space-y-2">
                        {loadingRequests ? (
                            <div className="py-8 text-center text-gray-400">Loading...</div>
                        ) : requests.length === 0 ? (
                            <div className="py-12 text-center text-gray-500">
                                <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                <p className="text-sm">No requests found</p>
                            </div>
                        ) : (
                            requests.map(req => (
                                <div
                                    key={req.id}
                                    onClick={() => setActiveRequest(req)}
                                    className={`p-3 rounded-md cursor-pointer border transition-all ${activeRequest?.id === req.id
                                        ? 'bg-blue-50 border-blue-200 shadow-sm'
                                        : 'bg-white hover:bg-gray-50 border-gray-100'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-semibold text-sm text-gray-800 truncate pr-2">{req.patient_name}</span>
                                        <span className="text-[10px] text-gray-400 shrink-0 mt-0.5">
                                            {format(new Date(req.created_at), 'MMM d, HH:mm')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs text-gray-500 truncate max-w-[120px]">
                                            {req.messages.length > 0 ? req.messages[req.messages.length - 1].content : 'New Request'}
                                        </span>
                                        {req.status === 'pending' && (
                                            <span className="w-2 h-2 rounded-full bg-red-500" title="Pending"></span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Chat Area */}
            <div className="w-full md:w-2/3 flex flex-col min-h-0">
                <Card className="flex-1 flex flex-col bg-white shadow-md border-slate-200 min-h-0">
                    {activeRequest ? (
                        <>
                            <CardHeader className="py-3 border-b bg-slate-50 flex flex-row items-center justify-between shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
                                        {activeRequest.patient_name.charAt(0)}
                                    </div>
                                    <div>
                                        <CardTitle className="text-base text-gray-900">{activeRequest.patient_name}</CardTitle>
                                        <CardDescription className="text-xs flex items-center gap-1">
                                            {activeRequest.status === 'pending' ? (
                                                <span className="text-amber-600 flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> Verification Pending</span>
                                            ) : (
                                                <span className="text-green-600 flex items-center"><CheckCircle2 className="w-3 h-3 mr-1" /> Verified & Active</span>
                                            )}
                                        </CardDescription>
                                    </div>
                                </div>
                                <div>
                                    {/* Actions */}
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
                                {activeRequest.messages.length === 0 ? (
                                    <div className="text-center py-8 bg-blue-50 rounded-lg mx-auto max-w-md mt-4 border border-blue-100">
                                        <User className="w-10 h-10 text-blue-400 mx-auto mb-2" />
                                        <h3 className="text-blue-900 font-medium">New Verification Request</h3>
                                        <p className="text-blue-700 text-sm mt-1 px-4">
                                            This patient is requesting verification. Reply to this message to approve the request and start a conversation.
                                        </p>
                                    </div>
                                ) : (
                                    activeRequest.messages.map((msg, idx) => (
                                        <div key={idx} className={`flex ${msg.role === 'doctor' ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[75%] rounded-lg p-3 shadow-sm ${msg.role === 'doctor'
                                                ? 'bg-blue-600 text-white rounded-br-none'
                                                : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                                                }`}>
                                                <p className="text-sm">{msg.content}</p>
                                                <p className={`text-[10px] mt-1 text-right ${msg.role === 'doctor' ? 'text-blue-100' : 'text-gray-400'}`}>
                                                    {format(new Date(msg.timestamp), 'h:mm a')}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </CardContent>
                            <div className="p-3 border-t bg-white shrink-0">
                                <div className="flex gap-2">
                                    <Input
                                        value={replyMessage}
                                        onChange={e => setReplyMessage(e.target.value)}
                                        placeholder="Type your reply..."
                                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                        disabled={sending}
                                    />
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={sending || !replyMessage.trim()}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <MessageSquare className="w-16 h-16 mb-4 opacity-10" />
                            <p>Select a conversation to start chatting</p>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
