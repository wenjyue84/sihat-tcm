/**
 * PatientContextPanel Component
 * Collapsible panel showing patient diagnosis context inline in chat
 */

"use client";

import { useState, useEffect } from "react";
import {
    ChevronDown, ChevronUp, Activity, Leaf, AlertCircle,
    Pill, MessageSquare, Eye, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import type { ConversationItemData } from "./ConversationItem";

interface PatientContextPanelProps {
    conversation: ConversationItemData;
    onViewFullReport: () => void;
}

interface ContextData {
    primary_diagnosis?: string;
    constitution?: string;
    overall_score?: number;
    symptoms?: string[];
    medicines?: string[];
    tongue_observation?: string;
    face_observation?: string;
    inquiry_summary?: string;
    age?: number;
    gender?: string;
}

export function PatientContextPanel({ conversation, onViewFullReport }: PatientContextPanelProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<ContextData | null>(null);

    useEffect(() => {
        fetchContextData();
    }, [conversation.id]);

    const fetchContextData = async () => {
        setLoading(true);
        try {
            const table = conversation.table || "diagnosis_sessions";
            const { data: record, error } = await supabase
                .from(table)
                .select("primary_diagnosis, constitution, overall_score, symptoms, medicines, tongue_analysis, face_analysis, inquiry_summary, full_report")
                .eq("id", conversation.id)
                .single();

            if (error) throw error;

            const report = record?.full_report || {};
            setData({
                primary_diagnosis: typeof report.diagnosis === 'string'
                    ? report.diagnosis
                    : report.diagnosis?.primary_pattern || record?.primary_diagnosis,
                constitution: typeof report.constitution === 'string'
                    ? report.constitution
                    : report.constitution?.type || record?.constitution,
                overall_score: record?.overall_score,
                symptoms: record?.symptoms || [],
                medicines: record?.medicines || report.input_data?.medicines || [],
                tongue_observation: record?.tongue_analysis?.observation,
                face_observation: record?.face_analysis?.observation,
                inquiry_summary: record?.inquiry_summary,
                age: report.patient_profile?.age || report.patient_summary?.age,
                gender: report.patient_profile?.gender || report.patient_summary?.gender,
            });
        } catch (err) {
            console.error("Error fetching context:", err);
        } finally {
            setLoading(false);
        }
    };

    // Don't render if no data or only inquiries table
    if (conversation.table === "inquiries" && !data?.primary_diagnosis) {
        return null;
    }

    return (
        <div className="border-b bg-gradient-to-r from-slate-50 via-blue-50/30 to-indigo-50/20">
            {/* Toggle Header */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-white/50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-slate-700">Patient Context</span>
                    {data?.overall_score && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${data.overall_score >= 70 ? 'bg-green-100 text-green-700' :
                                data.overall_score >= 40 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                            }`}>
                            Health Score: {data.overall_score}%
                        </span>
                    )}
                    {data?.age && (
                        <span className="text-xs text-gray-500">
                            {data.age}y{data.gender ? ` • ${data.gender}` : ''}
                        </span>
                    )}
                </div>
                <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                </motion.div>
            </button>

            {/* Expandable Content */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        {loading ? (
                            <div className="px-4 pb-4 text-center">
                                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                            </div>
                        ) : data ? (
                            <div className="px-4 pb-4">
                                {/* Main Info Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-3">
                                    {/* Primary Diagnosis */}
                                    {data.primary_diagnosis && data.primary_diagnosis !== "Request for Verification" && (
                                        <div className="bg-white rounded-lg p-2.5 border border-red-100 shadow-sm">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <Activity className="w-3 h-3 text-red-500" />
                                                <span className="text-[10px] font-semibold text-red-800 uppercase tracking-wide">Diagnosis</span>
                                            </div>
                                            <p className="text-xs font-medium text-red-700 line-clamp-2">{data.primary_diagnosis}</p>
                                        </div>
                                    )}

                                    {/* Constitution */}
                                    {data.constitution && (
                                        <div className="bg-white rounded-lg p-2.5 border border-green-100 shadow-sm">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <Leaf className="w-3 h-3 text-green-500" />
                                                <span className="text-[10px] font-semibold text-green-800 uppercase tracking-wide">Constitution</span>
                                            </div>
                                            <p className="text-xs font-medium text-green-700 line-clamp-2">{data.constitution}</p>
                                        </div>
                                    )}

                                    {/* Symptoms */}
                                    {data.symptoms && data.symptoms.length > 0 && (
                                        <div className="bg-white rounded-lg p-2.5 border border-amber-100 shadow-sm">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <AlertCircle className="w-3 h-3 text-amber-500" />
                                                <span className="text-[10px] font-semibold text-amber-800 uppercase tracking-wide">Symptoms</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {data.symptoms.filter(s => s !== "Request for Verification").slice(0, 3).map((s, i) => (
                                                    <span key={i} className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                                                        {s}
                                                    </span>
                                                ))}
                                                {data.symptoms.length > 3 && (
                                                    <span className="text-[10px] text-gray-400">+{data.symptoms.length - 3}</span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Medicines */}
                                    {data.medicines && data.medicines.length > 0 && (
                                        <div className="bg-white rounded-lg p-2.5 border border-emerald-100 shadow-sm">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <Pill className="w-3 h-3 text-emerald-500" />
                                                <span className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wide">Medicines</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {data.medicines.slice(0, 3).map((m, i) => (
                                                    <span key={i} className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded">
                                                        {m}
                                                    </span>
                                                ))}
                                                {data.medicines.length > 3 && (
                                                    <span className="text-[10px] text-gray-400">+{data.medicines.length - 3}</span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Tongue Observation */}
                                    {data.tongue_observation && (
                                        <div className="bg-white rounded-lg p-2.5 border border-purple-100 shadow-sm">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <span className="text-xs">👅</span>
                                                <span className="text-[10px] font-semibold text-purple-800 uppercase tracking-wide">Tongue</span>
                                            </div>
                                            <p className="text-[10px] text-purple-700 line-clamp-2">{data.tongue_observation}</p>
                                        </div>
                                    )}

                                    {/* Face Observation */}
                                    {data.face_observation && (
                                        <div className="bg-white rounded-lg p-2.5 border border-pink-100 shadow-sm">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <span className="text-xs">👤</span>
                                                <span className="text-[10px] font-semibold text-pink-800 uppercase tracking-wide">Face</span>
                                            </div>
                                            <p className="text-[10px] text-pink-700 line-clamp-2">{data.face_observation}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Inquiry Summary */}
                                {data.inquiry_summary && (
                                    <div className="bg-white rounded-lg p-2.5 border border-blue-100 shadow-sm mb-3">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <MessageSquare className="w-3 h-3 text-blue-500" />
                                            <span className="text-[10px] font-semibold text-blue-800 uppercase tracking-wide">Patient Notes</span>
                                        </div>
                                        <p className="text-[10px] text-blue-700 line-clamp-3">{data.inquiry_summary}</p>
                                    </div>
                                )}

                                {/* View Full Report Button */}
                                {conversation.table === "diagnosis_sessions" && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={onViewFullReport}
                                        className="w-full h-8 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                                    >
                                        <Eye className="w-3 h-3 mr-1.5" />
                                        View Full Diagnosis Report
                                        <ExternalLink className="w-3 h-3 ml-1.5" />
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="px-4 pb-4 text-center text-xs text-gray-400">
                                No diagnosis context available
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
