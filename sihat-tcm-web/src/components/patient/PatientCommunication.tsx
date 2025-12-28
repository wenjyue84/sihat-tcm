"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/stores/useAppStore";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageSquare, Send, User, Loader2, CheckCircle2 } from "lucide-react";
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
}

export function PatientCommunication() {
    const { user } = useAuth();
    const [requests, setRequests] = useState<VerificationRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeRequest, setActiveRequest] = useState<VerificationRequest | null>(null);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (user) {
            fetchRequests();
            // Optional: Set up realtime subscription here
        }
    }, [user]);

    const fetchRequests = async () => {
        try {
            const { data, error } = await supabase
                .from("inquiries")
                .select("*")
                .eq("symptoms", "Request for Verification")
                .order("created_at", { ascending: false });

            if (error) throw error;

            // Filter for current user's requests (in case RLS doesn't handle it or we need custom filtering)
            // Assuming inquiries are RLS protected to user, or linked via profiles.
            // Based on DoctorCriticalPage, inquiries has a profiles relation.
            // We rely on RLS or user_id matching if `inquiries` has user_id. 
            // The `inquiries` table usually has `user_id` or linked to `profiles`.
            // We will assume standard RLS for now.

            const parsedRequests = (data || []).map((req: any) => ({
                id: req.id,
                created_at: req.created_at,
                status: req.diagnosis_report?.status || "pending",
                messages: req.diagnosis_report?.messages || [],
            }));

            setRequests(parsedRequests);
            if (parsedRequests.length > 0) {
                setActiveRequest(parsedRequests[0]);
            }
        } catch (error) {
            console.error("Error fetching requests:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRequest = async () => {
        if (!user) return;
        try {
            setSending(true);
            // Create a new inquiry with specific markers
            const { error } = await supabase.from("inquiries").insert({
                symptoms: "Request for Verification", // Marker
                diagnosis_report: {
                    type: "verification_request",
                    status: "pending",
                    messages: [],
                    patient_profile: {
                        name: user.user_metadata?.full_name || user.email,
                        email: user.email
                    }
                },
                notes: "Automated verification request",
                // profiles relation usually handled by triggers or we need to ensure profile exists.
                // If inquiries has user_id, it is handled automatically if user is logged in.
            });

            if (error) throw error;
            await fetchRequests();
        } catch (error) {
            console.error("Error creating request:", error);
            alert("Failed to create request. Please try again.");
        } finally {
            setSending(false);
        }
    };

    const handleSendMessage = async () => {
        if (!activeRequest || !newMessage.trim()) return;

        try {
            setSending(true);
            const newMsg: Message = {
                role: "user",
                content: newMessage,
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
                    }
                })
                .eq("id", activeRequest.id);

            if (error) throw error;

            setNewMessage("");
            // Optimistic update
            setActiveRequest({ ...activeRequest, messages: updatedMessages });
            setRequests(prev => prev.map(r => r.id === activeRequest.id ? { ...r, messages: updatedMessages } : r));

        } catch (error) {
            console.error("Error sending message:", error);
            alert("Failed to send message.");
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center p-8">
                <Loader2 className="animate-spin h-8 w-8 text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col md:flex-row gap-4 p-4 md:p-6 max-h-[calc(100vh-4rem)]">
            {/* Sidebar List */}
            <div className="w-full md:w-1/3 flex flex-col gap-4">
                <Card className="flex-1 bg-white/80 backdrop-blur border-emerald-100 flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-lg text-emerald-800">Communication</CardTitle>
                        <CardDescription>Chat with your doctor</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-y-auto space-y-2">
                        {requests.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p>No active conversations.</p>
                            </div>
                        ) : (
                            requests.map(req => (
                                <div
                                    key={req.id}
                                    onClick={() => setActiveRequest(req)}
                                    className={`p-3 rounded-lg cursor-pointer border transition-colors ${activeRequest?.id === req.id
                                            ? 'bg-emerald-50 border-emerald-200'
                                            : 'bg-white hover:bg-gray-50 border-gray-100'
                                        }`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-semibold text-sm text-gray-700">Request #{req.id.slice(0, 4)}</span>
                                        <span className="text-xs text-gray-400">
                                            {format(new Date(req.created_at), 'MMM d')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${req.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {req.status === 'active' ? 'Active' : 'Pending'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </CardContent>
                    <div className="p-4 border-t">
                        {requests.length === 0 && (
                            <Button onClick={handleCreateRequest} disabled={sending} className="w-full bg-emerald-600 hover:bg-emerald-700">
                                {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageSquare className="w-4 h-4 mr-2" />}
                                Request Verification
                            </Button>
                        )}
                    </div>
                </Card>
            </div>

            {/* Chat Area */}
            <div className="w-full md:w-2/3">
                <Card className="h-full flex flex-col bg-white/90 backdrop-blur shadow-sm">
                    {activeRequest ? (
                        <>
                            <CardHeader className="border-b pb-3">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <CardTitle className="flex items-center gap-2">
                                            <User className="w-5 h-5 text-emerald-600" />
                                            Doctor
                                        </CardTitle>
                                        <CardDescription>
                                            {activeRequest.status === 'pending' ? 'Waiting for doctor response...' : 'Online'}
                                        </CardDescription>
                                    </div>
                                    {activeRequest.status === 'active' && (
                                        <span className="flex items-center text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                                            Chat Active
                                        </span>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
                                {/* Initial system message */}
                                <div className="flex justify-center">
                                    <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                                        Request created on {format(new Date(activeRequest.created_at), 'PPP p')}
                                    </span>
                                </div>

                                {activeRequest.messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-lg p-3 ${msg.role === 'user'
                                                ? 'bg-emerald-600 text-white rounded-br-none'
                                                : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                            }`}>
                                            <p className="text-sm">{msg.content}</p>
                                            <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-emerald-100' : 'text-gray-400'}`}>
                                                {format(new Date(msg.timestamp), 'h:mm a')}
                                            </p>
                                        </div>
                                    </div>
                                ))}

                                {activeRequest.status === 'pending' && activeRequest.messages.length === 0 && (
                                    <div className="text-center p-6 bg-yellow-50 rounded-lg border border-yellow-100 mx-auto max-w-sm mt-8">
                                        <Loader2 className="w-8 h-8 text-yellow-500 mx-auto mb-2 animate-spin" />
                                        <p className="text-yellow-800 font-medium">Verification Pending</p>
                                        <p className="text-yellow-600 text-sm mt-1">
                                            Your request has been sent to the doctor. You will be able to chat once they verify your request.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                            <div className="p-3 border-t bg-gray-50/50">
                                <div className="flex gap-2">
                                    <Input
                                        value={newMessage}
                                        onChange={e => setNewMessage(e.target.value)}
                                        placeholder={activeRequest.status === 'pending' ? "Waiting for response..." : "Type a message..."}
                                        disabled={activeRequest.status === 'pending' || sending}
                                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                        className="bg-white"
                                    />
                                    <Button
                                        onClick={handleSendMessage}
                                        disabled={activeRequest.status === 'pending' || sending || !newMessage.trim()}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        <Send className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                            <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                            <h3 className="text-lg font-medium text-gray-600">Select a conversation</h3>
                            <p>or start a new verification request</p>

                            <Button onClick={handleCreateRequest} disabled={sending} className="mt-6 bg-emerald-600 hover:bg-emerald-700">
                                {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <MessageSquare className="w-4 h-4 mr-2" />}
                                Request Verification
                            </Button>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
