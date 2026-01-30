/**
 * ChatHeader Component
 * Displays patient info and action buttons (verify, notes, flag, close)
 */

"use client";

import { useState } from "react";
import {
    CheckCircle2,
    AlertCircle,
    Clock,
    XCircle,
    Flag,
    StickyNote,
    FileText,
    MoreVertical,
    Shield,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PatientFlag } from "@/types/database";
import type { ConversationItemData } from "./ConversationItem";

interface ChatHeaderProps {
    conversation: ConversationItemData;
    onViewDiagnosis: () => void;
    onAddNotes: () => void;
    onVerify: () => void;
    onClose: () => void;
    onFlagChange: (flag: PatientFlag) => void;
    isVerifying?: boolean;
}

const statusConfig = {
    pending: {
        icon: Clock,
        label: "Verification Pending",
        color: "text-amber-600",
        bg: "bg-amber-50",
    },
    active: {
        icon: CheckCircle2,
        label: "Verified & Active",
        color: "text-green-600",
        bg: "bg-green-50",
    },
    closed: {
        icon: XCircle,
        label: "Closed",
        color: "text-gray-500",
        bg: "bg-gray-50",
    },
};

const flagOptions: { key: PatientFlag; label: string; color: string }[] = [
    { key: "Critical", label: "Critical", color: "text-red-500" },
    { key: "High Priority", label: "High Priority", color: "text-orange-500" },
    { key: "Watch", label: "Watch", color: "text-yellow-500" },
    { key: "Normal", label: "Normal", color: "text-gray-400" },
];

export function ChatHeader({
    conversation,
    onViewDiagnosis,
    onAddNotes,
    onVerify,
    onClose,
    onFlagChange,
    isVerifying,
}: ChatHeaderProps) {
    const status = statusConfig[conversation.status];
    const StatusIcon = status.icon;
    const currentFlag = conversation.flag || "Normal";

    return (
        <div className="border-b bg-gradient-to-r from-slate-50 to-blue-50/30 px-4 py-3">
            <div className="flex items-center justify-between">
                {/* Left: Patient Info */}
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                        {conversation.patient_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">
                                {conversation.patient_name}
                            </h3>
                            {conversation.flag && conversation.flag !== "Normal" && (
                                <span
                                    className={`text-xs px-2 py-0.5 rounded-full ${conversation.flag === "Critical"
                                            ? "bg-red-100 text-red-700"
                                            : conversation.flag === "High Priority"
                                                ? "bg-orange-100 text-orange-700"
                                                : "bg-yellow-100 text-yellow-700"
                                        }`}
                                >
                                    {conversation.flag}
                                </span>
                            )}
                        </div>
                        <div className={`flex items-center gap-1 text-xs ${status.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status.label}
                            {conversation.patient_email && (
                                <span className="text-gray-400 ml-2">
                                    • {conversation.patient_email}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex items-center gap-2">
                    {/* View Diagnosis */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onViewDiagnosis}
                        className="text-xs h-8 border-blue-200 text-blue-600 hover:bg-blue-50"
                    >
                        <FileText className="w-3.5 h-3.5 mr-1" />
                        View Diagnosis
                    </Button>

                    {/* Verify Button (only for pending) */}
                    {conversation.status === "pending" && (
                        <Button
                            size="sm"
                            onClick={onVerify}
                            disabled={isVerifying}
                            className="text-xs h-8 bg-green-600 hover:bg-green-700 text-white"
                        >
                            <Shield className="w-3.5 h-3.5 mr-1" />
                            {isVerifying ? "Verifying..." : "Verify"}
                        </Button>
                    )}

                    {/* More Actions Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <MoreVertical className="w-4 h-4 text-gray-500" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={onAddNotes}>
                                <StickyNote className="w-4 h-4 mr-2 text-blue-500" />
                                Add Notes
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {/* Flag Options */}
                            <div className="px-2 py-1.5 text-xs font-medium text-gray-400">
                                Set Priority
                            </div>
                            {flagOptions.map((opt) => (
                                <DropdownMenuItem
                                    key={opt.key || "none"}
                                    onClick={() => onFlagChange(opt.key)}
                                    className={currentFlag === opt.key ? "bg-gray-100" : ""}
                                >
                                    <Flag className={`w-4 h-4 mr-2 ${opt.color}`} fill={currentFlag === opt.key ? "currentColor" : "none"} />
                                    {opt.label}
                                </DropdownMenuItem>
                            ))}

                            <DropdownMenuSeparator />

                            {conversation.status !== "closed" && (
                                <DropdownMenuItem onClick={onClose} className="text-red-600">
                                    <X className="w-4 h-4 mr-2" />
                                    Close Conversation
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
}
