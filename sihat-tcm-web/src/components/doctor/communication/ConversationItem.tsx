/**
 * ConversationItem Component
 * Individual inbox item with status badges, unread indicator, and flag
 */

"use client";

import { format } from "date-fns";
import { AlertCircle, CheckCircle2, Clock, XCircle, Flag } from "lucide-react";
import { motion } from "framer-motion";
import type { PatientFlag } from "@/types/database";

export interface ConversationItemData {
    id: string;
    created_at: string;
    status: "pending" | "active" | "closed";
    messages: Array<{ role: string; content: string; timestamp: string }>;
    patient_name: string;
    patient_email?: string;
    table?: "inquiries" | "diagnosis_sessions";
    flag?: PatientFlag;
    unread_count?: number;
    last_message_by?: "user" | "doctor";
}

interface ConversationItemProps {
    conversation: ConversationItemData;
    isActive: boolean;
    onClick: () => void;
}

const statusConfig = {
    pending: {
        icon: Clock,
        label: "Pending",
        bg: "bg-amber-100",
        text: "text-amber-700",
        dot: "bg-amber-500",
    },
    active: {
        icon: CheckCircle2,
        label: "Active",
        bg: "bg-green-100",
        text: "text-green-700",
        dot: "bg-green-500",
    },
    closed: {
        icon: XCircle,
        label: "Closed",
        bg: "bg-gray-100",
        text: "text-gray-500",
        dot: "bg-gray-400",
    },
};

const flagColors: Record<string, string> = {
    Critical: "text-red-500",
    "High Priority": "text-orange-500",
    Watch: "text-yellow-500",
    Normal: "text-gray-300",
};

export function ConversationItem({
    conversation,
    isActive,
    onClick,
}: ConversationItemProps) {
    const status = statusConfig[conversation.status];
    const StatusIcon = status.icon;
    const lastMessage = conversation.messages[conversation.messages.length - 1];
    const hasUnread = (conversation.unread_count || 0) > 0;

    return (
        <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onClick}
            className={`relative p-3 rounded-lg cursor-pointer border transition-all ${isActive
                    ? "bg-blue-50 border-blue-200 shadow-sm"
                    : "bg-white hover:bg-gray-50 border-gray-100"
                }`}
        >
            {/* Unread indicator */}
            {hasUnread && (
                <div className="absolute top-2 right-2 flex items-center justify-center">
                    <span className="w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                        {conversation.unread_count}
                    </span>
                </div>
            )}

            <div className="flex items-start gap-3">
                {/* Avatar */}
                <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${isActive
                            ? "bg-blue-500 text-white"
                            : "bg-blue-100 text-blue-600"
                        }`}
                >
                    {conversation.patient_name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                    {/* Name & Time */}
                    <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm text-gray-800 truncate max-w-[120px]">
                                {conversation.patient_name}
                            </span>
                            {conversation.flag && conversation.flag !== "Normal" && (
                                <Flag
                                    className={`w-3 h-3 ${flagColors[conversation.flag] || "text-gray-300"}`}
                                    fill="currentColor"
                                />
                            )}
                        </div>
                        <span className="text-[10px] text-gray-400 shrink-0">
                            {format(new Date(conversation.created_at), "MMM d, HH:mm")}
                        </span>
                    </div>

                    {/* Last Message Preview */}
                    <p className="text-xs text-gray-500 truncate mb-2 pr-6">
                        {lastMessage ? (
                            <>
                                {lastMessage.role === "doctor" && (
                                    <span className="text-blue-500 font-medium">You: </span>
                                )}
                                {lastMessage.content}
                            </>
                        ) : (
                            <span className="italic">New request</span>
                        )}
                    </p>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                        <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${status.bg} ${status.text}`}
                        >
                            <StatusIcon className="w-2.5 h-2.5" />
                            {status.label}
                        </span>
                        <span className="text-[10px] text-gray-400">
                            {conversation.messages.length} messages
                        </span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
