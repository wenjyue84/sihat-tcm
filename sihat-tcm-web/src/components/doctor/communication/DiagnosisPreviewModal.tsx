/**
 * DiagnosisPreviewModal Component
 * Shows patient's AI diagnosis in a modal for quick reference
 */

"use client";

import { useState, useEffect } from "react";
import { X, Loader2, FileText, Activity, Leaf, AlertCircle, User, Camera, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import type { ConversationItemData } from "./ConversationItem";

interface DiagnosisPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    conversation: ConversationItemData | null;
}

interface DiagnosisData {
    primary_diagnosis?: string;
    constitution?: string;
    full_report?: {
        diagnosis?: { primary_pattern?: string; secondary_patterns?: string[] } | string;
        constitution?: { type?: string; description?: string } | string;
        analysis?: { summary?: string; key_findings?: any };
        recommendations?: {
            food?: string[];
            lifestyle?: string[];
            acupoints?: string[];
        };
    };
    tongue_analysis?: { observation?: string; image_url?: string };
    face_analysis?: { observation?: string; image_url?: string };
    inquiry_summary?: string;
    inquiry_chat_history?: Array<{ role: string; content: string }>;
}

export function DiagnosisPreviewModal({
    isOpen,
    onClose,
    conversation,
}: DiagnosisPreviewModalProps) {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<DiagnosisData | null>(null);

    useEffect(() => {
        if (isOpen && conversation) {
            fetchDiagnosisData();
        }
    }, [isOpen, conversation]);

    const fetchDiagnosisData = async () => {
        if (!conversation) return;
        setLoading(true);

        try {
            const table = conversation.table || "diagnosis_sessions";
            const { data: record, error } = await supabase
                .from(table)
                .select("*")
                .eq("id", conversation.id)
                .single();

            if (error) throw error;
            setData(record);
        } catch (err) {
            console.error("Error fetching diagnosis:", err);
        } finally {
            setLoading(false);
        }
    };

    const getDiagnosis = () => {
        if (!data) return null;
        const diag = data.full_report?.diagnosis || data.primary_diagnosis;
        if (typeof diag === "string") return diag;
        return diag?.primary_pattern || "N/A";
    };

    const getConstitution = () => {
        if (!data) return null;
        const const_ = data.full_report?.constitution || data.constitution;
        if (typeof const_ === "string") return const_;
        return const_?.type || "N/A";
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-white">
                                        Diagnosis Preview
                                    </h2>
                                    <p className="text-blue-100 text-sm">
                                        {conversation?.patient_name}
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClose}
                                className="text-white hover:bg-white/20 h-8 w-8 p-0"
                            >
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)]">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                                </div>
                            ) : data ? (
                                <div className="space-y-6">
                                    {/* Primary Diagnosis */}
                                    <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-4 border border-red-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Activity className="w-5 h-5 text-red-500" />
                                            <h3 className="font-semibold text-red-800">Primary Diagnosis</h3>
                                        </div>
                                        <p className="text-red-700 font-medium">{getDiagnosis()}</p>
                                    </div>

                                    {/* Constitution */}
                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Leaf className="w-5 h-5 text-green-500" />
                                            <h3 className="font-semibold text-green-800">Constitution</h3>
                                        </div>
                                        <p className="text-green-700 font-medium">{getConstitution()}</p>
                                    </div>

                                    {/* Analysis Summary */}
                                    {data.full_report?.analysis?.summary && (
                                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                            <h3 className="font-semibold text-gray-800 mb-2">Analysis Summary</h3>
                                            <p className="text-gray-600 text-sm leading-relaxed">
                                                {data.full_report.analysis.summary}
                                            </p>
                                        </div>
                                    )}

                                    {/* Visual Observations */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {data.tongue_analysis?.observation && (
                                            <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Camera className="w-4 h-4 text-purple-500" />
                                                    <h4 className="font-medium text-purple-800 text-sm">Tongue</h4>
                                                </div>
                                                <p className="text-purple-700 text-xs">
                                                    {data.tongue_analysis.observation}
                                                </p>
                                            </div>
                                        )}
                                        {data.face_analysis?.observation && (
                                            <div className="bg-pink-50 rounded-xl p-4 border border-pink-100">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <User className="w-4 h-4 text-pink-500" />
                                                    <h4 className="font-medium text-pink-800 text-sm">Face</h4>
                                                </div>
                                                <p className="text-pink-700 text-xs">
                                                    {data.face_analysis.observation}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Inquiry Summary */}
                                    {data.inquiry_summary && (
                                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                            <div className="flex items-center gap-2 mb-2">
                                                <MessageSquare className="w-4 h-4 text-blue-500" />
                                                <h4 className="font-medium text-blue-800 text-sm">Patient Inquiry</h4>
                                            </div>
                                            <p className="text-blue-700 text-xs">{data.inquiry_summary}</p>
                                        </div>
                                    )}

                                    {/* Recommendations Preview */}
                                    {data.full_report?.recommendations && (
                                        <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                                            <div className="flex items-center gap-2 mb-3">
                                                <AlertCircle className="w-4 h-4 text-amber-500" />
                                                <h4 className="font-medium text-amber-800 text-sm">Recommendations</h4>
                                            </div>
                                            <div className="space-y-2 text-xs">
                                                {data.full_report.recommendations.food?.slice(0, 3).map((item, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-amber-700">
                                                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                                                        {item}
                                                    </div>
                                                ))}
                                                {data.full_report.recommendations.lifestyle?.slice(0, 2).map((item, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-amber-700">
                                                        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                                                        {item}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-500">
                                    <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p>No diagnosis data available</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
